# Grow (Meshulam) payments server for זכרונימציה
# ---------------------------------------------------------------
# Implements the real Grow API flow per https://grow-il.readme.io:
#   1. Browser asks THIS server to create a payment  -> we call Grow's
#      createPaymentProcess (server-side only; browser calls are blocked by Grow)
#   2. We return Grow's payment-page URL; the site opens it for the customer
#   3. Grow calls our /api/grow-notify (notifyUrl) when the payment completes
#   4. We acknowledge with approveTransaction and mark the order as paid
#   5. The site polls /api/payment-status until paid, then uploads the photos
#
# Run:  pip install fastapi uvicorn requests
#       GROW_USER_ID=... GROW_PAGE_CODE=... uvicorn grow_server:app --port 8000
#
# Env vars:
#   GROW_USER_ID      your Grow userId            (required)
#   GROW_PAGE_CODE    your Grow pageCode          (required)
#   GROW_API_BASE     default sandbox; set https://secure.meshulam.co.il for production
#   PUBLIC_BASE_URL   this server's public https URL (required for notifyUrl; no localhost)
#   FRONTEND_ORIGIN   your site origin for CORS, e.g. https://www.zichronimatzia.co.il

import os
import json
import time
import requests
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

GROW_API_BASE = os.environ.get("GROW_API_BASE", "https://sandbox.meshulam.co.il")
GROW_USER_ID = os.environ.get("GROW_USER_ID", "")
GROW_PAGE_CODE = os.environ.get("GROW_PAGE_CODE", "")
PUBLIC_BASE_URL = os.environ.get("PUBLIC_BASE_URL", "")
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "*")

# SECURITY: prices live on the SERVER, never trusted from the browser.
# Keep in sync with src/config.js (packages + coupons). Override via env:
#   PACKAGES_JSON='{"small":{"price":99,"discount":0},...}'
#   COUPONS_JSON='{"WELCOME10":{"type":"percent","value":10},...}'
PACKAGES = json.loads(os.environ.get("PACKAGES_JSON", json.dumps({
    "small":  {"price": 99,  "discount": 10},
    "full":   {"price": 199, "discount": 40},
    "legacy": {"price": 299, "discount": 15},
})))
COUPONS = json.loads(os.environ.get("COUPONS_JSON", json.dumps({
    "WELCOME10": {"type": "percent", "value": 10},
    "FAMILY20":  {"type": "percent", "value": 20},
    "SAVE50":    {"type": "percent", "value": 50},
})))


def compute_price(package_key: str, coupon_code: str) -> int:
    """Authoritative price: bundle discount first, then the coupon on the sale price."""
    pkg = PACKAGES.get(package_key)
    if pkg is None:
        raise ValueError("unknown package")
    d = min(90, max(0, pkg.get("discount", 0)))
    price = round(pkg["price"] * (100 - d) / 100)
    coupon = COUPONS.get((coupon_code or "").strip().upper())
    if coupon:
        off = round(price * coupon["value"] / 100) if coupon["type"] == "percent" else coupon["value"]
        price = max(0, price - min(price, off))
    return price

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN] if FRONTEND_ORIGIN != "*" else ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory order store. Replace with a real DB when the video pipeline lands.
ORDERS: dict[str, dict] = {}


class CreatePaymentBody(BaseModel):
    order_id: str
    package_key: str
    coupon_code: str = ""
    full_name: str
    phone: str
    email: str = ""
    description: str = ""


@app.post("/api/create-payment")
def create_payment(body: CreatePaymentBody):
    """Create a Grow payment process and return the hosted payment page URL.
    The amount is computed HERE from the package + coupon — the browser cannot set it."""
    try:
        amount = compute_price(body.package_key, body.coupon_code)
    except ValueError:
        return {"ok": False, "error": "unknown package"}
    # Grow expects FormData (not JSON), per the docs
    payload = {
        "pageCode": GROW_PAGE_CODE,
        "userId": GROW_USER_ID,
        "sum": str(amount),
        "paymentNum": "1",
        "description": body.description or "הזמנת סרטון זכרונימציה",
        "pageField[fullName]": body.full_name,
        "pageField[phone]": body.phone,
        "pageField[email]": body.email,
        "cField1": body.order_id,  # echoed back in the server callback
        "notifyUrl": f"{PUBLIC_BASE_URL}/api/grow-notify",
        "successUrl": f"{PUBLIC_BASE_URL}/payment-success",
        "cancelUrl": f"{PUBLIC_BASE_URL}/payment-cancel",
    }
    r = requests.post(
        f"{GROW_API_BASE}/api/light/server/1.0/createPaymentProcess",
        data=payload,
        timeout=30,
    )
    r.raise_for_status()
    data = r.json()
    if data.get("status") != 1:
        return {"ok": False, "error": data.get("err", {})}

    d = data.get("data", {})
    ORDERS[body.order_id] = {
        "paid": False,
        "amount": amount,
        "process_id": d.get("processId"),
        "process_token": d.get("processToken"),
        "created": time.time(),
    }
    return {"ok": True, "payment_url": d.get("url"), "process_id": d.get("processId"), "amount": amount}


@app.post("/api/grow-notify")
async def grow_notify(request: Request):
    """Server-to-server callback from Grow (posted as form data, not JSON)."""
    form = dict(await request.form())
    order_id = form.get("cField1") or form.get("customFields[cField1]") or ""
    status = str(form.get("status", form.get("data[status]", "")))
    process_id = form.get("processId") or form.get("data[processId]")
    process_token = form.get("processToken") or form.get("data[processToken]")

    if order_id in ORDERS and status == "1":
        ORDERS[order_id]["paid"] = True
        ORDERS[order_id]["transaction"] = form

    # Acknowledge receipt, as required by the docs (transaction proceeds regardless)
    try:
        requests.post(
            f"{GROW_API_BASE}/api/light/server/1.0/approveTransaction",
            data={
                "pageCode": GROW_PAGE_CODE,
                "processId": process_id,
                "processToken": process_token,
            },
            timeout=30,
        )
    except requests.RequestException:
        pass  # ApproveTransaction failure does not cancel the transaction

    return {"ok": True}


@app.get("/api/payment-status")
def payment_status(order_id: str):
    """The site polls this until the Grow webhook marks the order paid."""
    order = ORDERS.get(order_id)
    return {"paid": bool(order and order["paid"])}


@app.get("/payment-success")
def payment_success():
    return {"message": "התשלום התקבל! אפשר לחזור לחלון ההזמנה — התמונות נשלחות."}


@app.get("/payment-cancel")
def payment_cancel():
    return {"message": "התשלום בוטל. אפשר לחזור לחלון ההזמנה ולנסות שוב."}

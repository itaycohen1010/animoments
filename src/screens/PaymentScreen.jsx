import React, { useState, useRef, useEffect } from 'react';
import { config, colors as C } from '../config.js';
import { pillBtn, ghostBtn, inputStyle } from '../styles.js';

// Screen 3 — payment. Modes (first configured one wins):
// 0. Make webhook (config.growMakeWebhook): site → Make → Grow createPaymentLink,
//    which sends the payment link to the customer by SMS/email; self-confirm to continue.
// 1. Grow API (config.growApiBase): create payment server-side, open Grow's page,
//    poll /api/payment-status until the webhook confirms — then auto-continue.
// 2. Grow hosted link (config.growLinks[pkg.key]): open fixed page, self-confirm.
// 3. Neither configured: demo card form.
export default function PaymentScreen({ pkg, photoCount, form, card, setCard, payError, setPayError, onConfirm, onBack, reportPaidPrice }) {
  const makeWebhook = (config.growMakeWebhook || '').trim();
  const growApiBase = (config.growApiBase || '').trim().replace(/\/$/, '');
  const growLink = (config.growLinks?.[pkg.key] || '').trim();
  const [growOpened, setGrowOpened] = useState(false);
  const [makeSending, setMakeSending] = useState(false);
  const [makeSent, setMakeSent] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState(null);

  // the coupon applies on the bundle's sale price (double discount with the bundle's own discount)
  const couponOff = coupon
    ? Math.min(pkg.price, coupon.type === 'percent' ? Math.round(pkg.price * coupon.value / 100) : coupon.value)
    : 0;
  const payPrice = pkg.price - couponOff;
  const basePrice = pkg.basePrice ?? pkg.price;
  const totalSaved = basePrice - payPrice;
  useEffect(() => { reportPaidPrice && reportPaidPrice(payPrice); }, [payPrice]);

  const sendMakeRequest = () => {
    setMakeSending(true); setPayError(null);
    // cors + form-encoded (a "simple" request, no preflight). Make replies with
    // {"url":"…"} from the Webhook-response module; we open that Grow payment page.
    fetch(makeWebhook, {
      method: 'POST',
      mode: 'cors',
      body: new URLSearchParams({
        order_id: (form.name.trim() || 'order').replace(/\s+/g, '-') + '-' + Date.now(),
        sum: String(payPrice),
        full_name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        package_name: pkg.name,
        photo_count: String(photoCount),
        description: `חבילת ${pkg.name} · ${photoCount} תמונות`
      })
    }).then(r => r.text()).then(text => {
      let url = '';
      try { url = (JSON.parse(text).url || '').trim(); } catch (e) { /* not json */ }
      setMakeSending(false); setMakeSent(true); setGrowOpened(true);
      if (url) window.open(url, '_blank', 'noopener');
    }).catch((err) => { console.warn('Make webhook error', err); setMakeSending(false); setPayError('לא הצלחנו לשלוח את דרישת התשלום — נסו שוב בעוד רגע'); });
  };

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) { setCouponError('נא להזין קוד קופון'); return; }
    const c = config.coupons?.[code];
    if (!c) { setCouponError('הקוד לא מוכר — בדקו את האיות ונסו שוב'); return; }
    setCoupon({ ...c, code }); setCouponError(null); setCouponInput('');
  };
  const [apiState, setApiState] = useState('idle'); // idle | creating | waiting | error
  const orderIdRef = useRef(Math.random().toString(36).slice(2) + Date.now().toString(36));
  const pollRef = useRef(null);

  useEffect(() => () => clearInterval(pollRef.current), []);

  const startGrowApiPayment = async () => {
    setApiState('creating'); setPayError(null);
    try {
      const res = await fetch(`${growApiBase}/api/create-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderIdRef.current,
          package_key: pkg.key,
          coupon_code: coupon?.code || '',
          full_name: form?.name?.trim() || '',
          phone: form?.phone?.trim() || '',
          email: form?.email?.trim() || '',
          description: `חבילת ${pkg.name} · ${photoCount} תמונות`
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.payment_url) throw new Error('create-payment failed');
      window.open(data.payment_url, '_blank', 'noopener');
      setApiState('waiting');
      clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const s = await fetch(`${growApiBase}/api/payment-status?order_id=${orderIdRef.current}`);
          const st = await s.json();
          if (st.paid) {
            clearInterval(pollRef.current);
            onConfirm();
          }
        } catch { /* keep polling */ }
      }, 3000);
    } catch (err) {
      console.warn('Grow create-payment error', err);
      setApiState('error');
      setPayError('לא הצלחנו להתחיל את התשלום — נסו שוב בעוד רגע');
    }
  };

  return (
    <div data-screen-label="Payment" style={{ maxWidth: 480, margin: '0 auto', padding: '40px 20px 60px', animation: 'rise-in .5s ease both', width: '100%', boxSizing: 'border-box' }}>
      <div className="card-pad" style={{ background: '#fff', borderRadius: 24, padding: '34px 30px', boxShadow: '0 14px 40px rgba(180,100,70,.16)' }}>
        <div style={{ fontSize: 30, marginBottom: 8 }}>💳</div>
        <h3 style={{ fontWeight: 900, fontSize: '1.4rem', margin: '0 0 4px' }}>תשלום מאובטח</h3>
        <p style={{ color: C.muted, margin: '0 0 18px', fontSize: '.93rem' }}>שלב אחרון — ואנחנו מתחילים לעבוד על הסרטון.</p>

        <div style={{ background: C.cream, borderRadius: 16, padding: '14px 18px', marginBottom: 8, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ color: C.body, fontWeight: 600, fontSize: '.95rem' }}>חבילת {pkg.name} · {photoCount} תמונות</span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            {basePrice !== payPrice && <span style={{ color: '#A78B74', fontSize: '1rem', textDecoration: 'line-through' }}>₪{basePrice}</span>}
            <span style={{ fontWeight: 900, fontSize: '1.5rem', color: C.accent }}>₪{payPrice}</span>
          </span>
        </div>

        {/* coupon code (one coupon; stacks with the bundle's own discount) */}
        {!coupon ? (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <input type="text" value={couponInput}
                onChange={(ev) => { setCouponInput(ev.target.value); setCouponError(null); }}
                onKeyDown={(ev) => { if (ev.key === 'Enter') applyCoupon(); }}
                placeholder="יש לכם קוד קופון?"
                style={{ flex: 1, minWidth: 0, direction: 'rtl', fontFamily: "'Heebo', sans-serif", fontSize: 15, padding: '11px 14px', border: `1.5px solid ${C.borderStrong}`, borderRadius: 14, background: '#FFFDFA', color: C.ink, outline: 'none' }} />
              <button onClick={applyCoupon}
                style={{ border: `1.5px solid ${C.accent}`, background: '#fff', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 800, fontSize: 14, color: C.accent, padding: '0 20px', borderRadius: 14, flexShrink: 0 }}>החלת קוד</button>
            </div>
            {couponError && <div style={{ color: C.accentDark, fontWeight: 700, fontSize: '.86rem', margin: '0 0 6px', paddingRight: 4 }}>{couponError}</div>}
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: '#EDF5EA', border: '1px solid #BFDCB4', borderRadius: 14, padding: '10px 14px', marginBottom: 6 }}>
            <span style={{ color: '#3E6B33', fontWeight: 700, fontSize: '.9rem' }}>🎟️ קוד {coupon.code} הופעל — סה״כ חסכתם ₪{totalSaved}</span>
            <button onClick={() => { setCoupon(null); setCouponError(null); }} aria-label="הסרת הקופון" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6B8A61', fontSize: 17, lineHeight: 1, padding: '2px 4px', flexShrink: 0 }}>×</button>
          </div>
        )}
        <div style={{ height: 8 }} />
        <div style={{ display: 'inline-block', background: C.badgeBg, border: `1px solid ${C.badgeBorder}`, color: C.badgeText, fontWeight: 700, fontSize: 12.5, padding: '4px 12px', borderRadius: 999, marginBottom: 18 }}>זוהי הדגמה — לא יתבצע חיוב אמיתי</div>

        {makeWebhook ? (
          <>
            <p style={{ color: C.body, fontSize: '.93rem', lineHeight: 1.7, margin: '0 0 16px' }}>נשלח אליכם קישור תשלום מאובטח של Grow ב-SMS ובמייל. לאחר התשלום חזרו לכאן ולחצו "שילמתי".</p>
            <button onClick={sendMakeRequest} disabled={makeSending}
              style={{ ...pillBtn, width: '100%', padding: '15px 20px', opacity: makeSending ? .7 : 1 }}>
              {makeSending ? 'שולחים דרישת תשלום…' : makeSent ? 'שליחה חוזרת של הקישור' : `שליחת דרישת תשלום ₪${payPrice}`}
            </button>
            {makeSent && (
              <div style={{ background: '#EDF5EA', border: '1px solid #BFDCB4', borderRadius: 14, padding: '12px 16px', marginTop: 12, color: '#3E6B33', fontWeight: 700, fontSize: '.9rem', textAlign: 'center' }}>📩 דרישת תשלום נשלחה אליכם ל-SMS ולמייל — השלימו את התשלום ב-Grow</div>
            )}
            <button onClick={() => { if (growOpened) onConfirm(); }} disabled={!growOpened}
              style={{
                border: growOpened ? 'none' : `1.5px solid ${C.borderStrong}`,
                cursor: growOpened ? 'pointer' : 'not-allowed',
                width: '100%', marginTop: 12, fontWeight: 800, fontSize: 16,
                color: growOpened ? '#fff' : '#B59C88',
                background: growOpened ? 'linear-gradient(135deg, #2A8A5B, #35A66E)' : '#F6EDE4',
                padding: '15px 20px', borderRadius: 999,
                boxShadow: growOpened ? '0 8px 20px rgba(42,138,91,.3)' : 'none',
                transition: 'all .2s ease'
              }}>שילמתי — שליחת התמונות</button>
            {payError && <div style={{ textAlign: 'center', color: C.accentDark, fontWeight: 700, fontSize: '.93rem', margin: '12px 0 0' }}>{payError}</div>}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, color: C.muted, fontSize: '.82rem' }}>🔒 תשלום מאובטח באמצעות Grow (משולם)</div>
          </>
        ) : growApiBase ? (
          <>
            <p style={{ color: C.body, fontSize: '.93rem', lineHeight: 1.7, margin: '0 0 16px' }}>התשלום מתבצע בדף מאובטח של Grow. השאירו את החלון הזה פתוח — התמונות יישלחו אוטומטית מיד לאחר התשלום.</p>
            <button onClick={startGrowApiPayment} disabled={apiState === 'creating' || apiState === 'waiting'}
              style={{ ...pillBtn, width: '100%', padding: '15px 20px', opacity: apiState === 'creating' ? .7 : 1 }}>
              {apiState === 'creating' ? 'פותחים דף תשלום…' : apiState === 'waiting' ? 'ממתינים לאישור התשלום…' : `מעבר לתשלום ₪${payPrice} ב-Grow`}
            </button>
            {apiState === 'waiting' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 14 }}>
                <div style={{ width: 18, height: 18, border: '3px solid #F5DFCC', borderTopColor: C.accent, borderRadius: '50%', animation: 'spin .9s linear infinite' }} />
                <span style={{ color: C.body, fontSize: '.9rem' }}>לאחר התשלום בדף שנפתח — המשך אוטומטי כאן</span>
              </div>
            )}
            {payError && <div style={{ textAlign: 'center', color: C.accentDark, fontWeight: 700, fontSize: '.93rem', margin: '12px 0 0' }}>{payError}</div>}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, color: C.muted, fontSize: '.82rem' }}>🔒 תשלום מאובטח באמצעות Grow (משולם)</div>
          </>
        ) : growLink ? (
          <>
            <p style={{ color: C.body, fontSize: '.93rem', lineHeight: 1.7, margin: '0 0 16px' }}>התשלום מתבצע בדף מאובטח של Grow. לאחר תשלום מוצלח נחזיר אתכם לכאן אוטומטית והתמונות יישלחו — אין צורך ללחוץ על דבר.</p>
            <button onClick={() => { window.open(growLink, 'growpay'); setGrowOpened(true); }}
              style={{ ...pillBtn, width: '100%', padding: '15px 20px' }}>מעבר לתשלום ₪{payPrice} ב-Grow</button>
            {growOpened && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 16 }}>
                  <div style={{ width: 18, height: 18, border: '3px solid #F0D9C4', borderTopColor: C.accent, borderRadius: '50%', animation: 'spin .9s linear infinite' }} />
                  <span style={{ color: C.body, fontSize: '.92rem', fontWeight: 700 }}>ממתינים לאישור התשלום מ-Grow…</span>
                </div>
                <div style={{ textAlign: 'center', color: C.muted, fontSize: '.82rem', marginTop: 8 }}>התמונות יישלחו אוטומטית ברגע שהתשלום יאושר. אל תסגרו את הדף.</div>
              </>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, color: C.muted, fontSize: '.82rem' }}>🔒 תשלום מאובטח באמצעות Grow (משולם)</div>
          </>
        ) : (
          <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '.92rem', marginBottom: 5 }}>שם בעל הכרטיס *</label>
            <input type="text" value={card.name} onChange={(e) => { setCard({ ...card, name: e.target.value }); setPayError(null); }} placeholder="כפי שמופיע על הכרטיס" style={inputStyle(!!payError && !card.name.trim())} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '.92rem', marginBottom: 5 }}>מספר כרטיס *</label>
            <input type="text" inputMode="numeric" value={card.num}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
                setCard({ ...card, num: (digits.match(/.{1,4}/g) || []).join(' ') }); setPayError(null);
              }} placeholder="0000 0000 0000 0000" style={inputStyle(!!payError && card.num.replace(/\D/g, '').length < 14)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '.92rem', marginBottom: 5 }}>תוקף *</label>
              <input type="text" inputMode="numeric" value={card.exp}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setCard({ ...card, exp: digits.length > 2 ? digits.slice(0, 2) + '/' + digits.slice(2) : digits }); setPayError(null);
                }} placeholder="MM/YY" style={inputStyle(!!payError && card.exp.replace(/\D/g, '').length < 4)} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '.92rem', marginBottom: 5 }}>CVV *</label>
              <input type="text" inputMode="numeric" value={card.cvv}
                onChange={(e) => { setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }); setPayError(null); }}
                placeholder="123" style={inputStyle(!!payError && card.cvv.length < 3)} />
            </div>
          </div>
        </div>

        {payError && <div style={{ textAlign: 'center', color: C.accentDark, fontWeight: 700, fontSize: '.93rem', margin: '12px 0 0' }}>{payError}</div>}

        <button onClick={onConfirm} style={{ ...pillBtn, width: '100%', marginTop: 20, padding: '15px 20px' }}>תשלום ₪{payPrice} ושליחת התמונות</button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, color: C.muted, fontSize: '.82rem' }}>🔒 התשלום יעבור בעתיד דרך סליקה מאובטחת (Grow)</div>
          </>
        )}
        <div style={{ marginTop: 18, textAlign: 'center' }}>
          <button onClick={onBack} style={{ ...ghostBtn, background: '#fff', padding: '11px 28px' }}>חזרה לתמונות</button>
        </div>
      </div>
    </div>
  );
}

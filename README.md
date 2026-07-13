# זכרונימציה — Photo-to-Video Ordering Site (React + Vite)

אתר הזמנות בעברית (RTL): העלאת תמונות → סידור → פרטים → תשלום (דמו) → העלאה ל-Cloudinary.

## הרצה מקומית

```bash
npm install
npm run dev
```

## בנייה לפרודקשן

```bash
npm run build
```

התוצאה בתיקיית `dist/` — קבצים סטטיים שאפשר להעלות לכל שרת.

## הגדרות עסקיות — הכול ב-`src/config.js`

- **Cloudinary**: מלאו `cloudName` + `uploadPreset` (חייב להיות Unsigned).
  כשהם ריקים — האתר רץ במצב דמו (בלי העלאה אמיתית).
- **חבילות ומחירים**: מערך `packages` (שם, מחיר, מקסימום תמונות).
- **דוגמאות בפילמסטריפ**: מערך `examples` (תמונה + כותרת).
- **מייל אישור ללקוח**: `emailEndpoint` — כתובת של API קטן בצד שרת
  שמקבל POST JSON ושולח מייל (למשל דרך Gmail עם App Password).
  ריק = לא נשלח מייל. דוגמת פונקציה קיימת ב-`../deploy/netlify/functions/send-email.js`.
- **ולידציה**: `requireFields: true` לפרודקשן (false לבדיקות).

## תשלומים — Grow (משולם)

שלוש רמות, לפי מה שמוגדר ב-`src/config.js`:

1. **API מלא (מומלץ)** — הרימו את `server/grow_server.py`:
   ```bash
   pip install fastapi uvicorn requests
   GROW_USER_ID=... GROW_PAGE_CODE=... PUBLIC_BASE_URL=https://api.your-domain.co.il \
     uvicorn grow_server:app --port 8000
   ```
   והגדירו `growApiBase` לכתובת השרת. התשלום נוצר בסכום אמיתי לכל הזמנה,
   ומאומת אוטומטית דרך ה-webhook של Grow לפני שליחת התמונות.
   ברירת המחדל היא sandbox — לפרודקשן הוסיפו `GROW_API_BASE=https://secure.meshulam.co.il`.
   הערה: `PUBLIC_BASE_URL` חייב להיות כתובת ציבורית (Grow לא שולח עדכונים ל-localhost).

2. **קישורי דף תשלום** — בלי שרת: צרו דף תשלום קבוע לכל חבילה בדשבורד של Grow
   והדביקו ב-`growLinks`. אין אימות אוטומטי — הלקוח מאשר בעצמו.

3. **כלום** — טופס כרטיס דמו (לבדיקות עיצוב).

## טקסטים משפטיים

`src/legal.js` — מדיניות פרטיות, הצהרת נגישות, תנאי שימוש (עדכון אחרון: 11.7.2026).

## מבנה

- `src/App.jsx` — state + לוגיקת הזרימה בלבד (ניווט, ולידציה, העלאה, מייל)
- `src/screens/` — כל מסך בקובץ נפרד:
  - `LandingScreen.jsx` — דף הבית (hero, מילון, פילמסטריפ, מחירים)
  - `DetailsScreen.jsx` — שלב 1: פרטי לקוח
  - `UploadScreen.jsx` — שלב 2: העלאת וסידור תמונות
  - `PaymentScreen.jsx` — שלב 3: תשלום (דמו)
  - `ResultScreen.jsx` — שלב 4: התקדמות/שגיאה/סיום
- `src/components/` — `Nav.jsx` (ניווט + פס התקדמות), `Footer.jsx` (קישורים משפטיים)
- `src/modals/` — כל מודאל בקובץ נפרד:
  - `Modal.jsx` — שלד משותף (רקע, כפתור ×, Esc)
  - `HowItWorksModal.jsx` — "איך זה עובד" (הדגמה מונפשת)
  - `TipsModal.jsx` — "דברים שחשוב לדעת"
  - `ConfirmChecklistModal.jsx` — צ'קליסט לפני תשלום
  - `BlessingModal.jsx` — ברכה אישית (עד 200 תווים)
  - `LegalModal.jsx` — מציג מסמך משפטי מ-legal.js
- `src/styles.js` — סגנונות כפתורים ושדות משותפים
- `src/config.js` — נתונים עסקיים + פלטת צבעים
- `src/legal.js` — מסמכים משפטיים
- `src/index.css` — אנימציות, ריספונסיביות למובייל, נגישות (focus rings)


## אבטחה — מה מכוסה ומה חשוב לדעת

**מכוסה:**
- מחיר התשלום מחושב **בשרת** (grow_server.py) לפי החבילה + הקופון — לקוח לא יכול לשלוח סכום מזויף. עדכנו את PACKAGES_JSON / COUPONS_JSON יחד עם config.js.
- אימות תשלום דרך ה-webhook של Grow (notifyUrl), לא דרך הדפדפן.
- React מסנן אוטומטית כל טקסט שהמשתמש מזין (XSS).
- פרטי כרטיס בטופס הדמו לא נשלחים לשום מקום — כשעוברים ל-Grow, הקלט נעשה בדף של Grow בלבד (PCI אצלם).

**חשוב לדעת (מגבלות של אתר ללא backend):**
- ה-preset הלא-חתום של Cloudinary מאפשר לכל מי שמכיר אותו להעלות קבצים לענן שלכם. מומלץ בהגדרות ה-preset: להגביל ל-images בלבד, גודל מקסימלי, ותיקיית יעד קבועה (video-orders).
- קובץ order-details.txt מכיל פרטי לקוח וזמין ב-URL ציבורי (אקראי אך עקרונית נגיש). לפרטיות מלאה: הגדירו את ה-preset כ-authenticated delivery, או העבירו את הפרטים דרך שרת.
- קודי הקופון גלויים בקוד הצד-לקוח (זה בסדר — הסכום האמיתי נקבע בשרת).
- בפרודקשן הגדירו FRONTEND_ORIGIN לדומיין שלכם (לא *).

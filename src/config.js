// ===================================================================
// כל הנתונים העסקיים במקום אחד — ערכו כאן בלבד
// ===================================================================

export const config = {
  brandName: 'זִכְרוֹנִימַצְיָה',

  // Social proof shown on the landing (editable).
  socialProof: {
    stat: '+300 סרטונים נוצרו',
    rating: '4.9',
    ratingCount: '87 ביקורות'
  },
  // WhatsApp-style customer testimonials (editable). Each = a short chat: bubbles
  // with side 'in' (customer, gray) or 'out' (us, green) and an optional time.
  testimonials: [
    { name: 'מיכל', msgs: [
      { side: 'out', text: 'קיבלת? 🙂', time: '2:31' },
      { side: 'in', text: 'יואו!!! מדהים 🥹🥹', time: '2:33' },
      { side: 'in', text: 'ממש התרגשתי לראות את זה! עם דמעות בעיניים', time: '2:33' },
      { side: 'in', text: 'מקסים מקסים מקסים!!!!', time: '2:33' }
    ] },
    { name: 'גילעד', msgs: [
      { side: 'in', text: 'ראה את הסרטון וגם התרגש ממה שזה חמוד', time: '7:40' },
      { side: 'out', text: 'וואו איזה כיף לשמוע ❤️', time: '8:37' }
    ] },
    { name: 'נועה', msgs: [
      { side: 'in', text: 'חשבתי שיהיה מסובך — לקח לי חמש דקות מהטלפון', time: '19:02' },
      { side: 'in', text: 'התוצאה ריגשה את כל המשפחה 🥹', time: '19:02' }
    ] }
  ],

  // Customer testimonial screenshots (WhatsApp images). Managed from the admin.
  // Each entry is an image URL (host on Cloudinary). Empty = falls back to bundled sample.
  testimonialImages: [
    'https://res.cloudinary.com/dmxkoz4jo/image/upload/v1785055675/WhatsApp_Image_2026-07-26_at_11.20.45_cmdezb.jpg',
    'https://res.cloudinary.com/dmxkoz4jo/image/upload/v1785055674/WhatsApp_Image_2026-07-26_at_11.46.03_m1bpt5.jpg',
    'https://res.cloudinary.com/dmxkoz4jo/image/upload/v1785055622/WhatsApp_Image_2026-07-26_at_11.01.13_vgqztx.jpg',
    'https://res.cloudinary.com/dmxkoz4jo/image/upload/v1785055611/e6301840-1836-45bd-8821-a364bbec5c84_o25oav.jpg'
  ],

  // Optional promo banner shown under the hero title (e.g. coupon announcement).
  // Leave empty ('') to hide it.
  announcement: '',

  // Optional promo/coupon popup shown once when the page opens. Empty ('') = no popup.
  promoPopup: '',
  promoTextSize: 24, // popup text size in px (adjust to taste)
  promoImage: '', // optional image URL shown in the popup instead of text

  // Hero showreel video (contained autoplay loop under the hero). Empty = hidden.
  heroVideo: '',
  heroPoster: '',

  // Cloudinary (unsigned upload). Leave empty for demo mode (no real upload).
  cloudinary: {
    cloudName: 'dmxkoz4jo',
    uploadPreset: 'videoOrders'  // must be UNSIGNED
  },

  // Firebase / Firestore — stores each completed order (see src/firebase.js for setup).
  // Paste your web-app config here. Leave projectId empty ('') to disable (orders just won't be saved).
  firebase: {
    apiKey: 'AIzaSyAKEuWRBWqV5p0MzzjUIcpkGfoIE7ttrdI',
    authDomain: 'animoment-35bea.firebaseapp.com',
    projectId: 'animoment-35bea',
    storageBucket: 'animoment-35bea.firebasestorage.app',
    messagingSenderId: '332052293635',
    appId: '1:332052293635:web:d34b5da68d9916dec2c636'
  },

  // Firebase App Check (reCAPTCHA v3) — blocks use of your Firebase project from
  // outside your own site. Paste the reCAPTCHA v3 SITE key here (see setup steps).
  // Leave '' to disable App Check.
  recaptchaSiteKey: '6Leq9FotAAAAAKVyY8DlL0hJ02ptZ1hVnZxewOJF',

  // Optional server endpoint that sends the confirmation email.
  // Leave empty to skip emails. (A static site cannot send email by itself —
  // point this at any small API you host: Express, Cloud Function, your Python backend, etc.
  // It receives POST JSON: {to_email, to_name, phone, package_name, package_price, photo_count, order_date})
  emailEndpoint: 'https://script.google.com/macros/s/AKfycbwxZ0xB2nU0wXOifEGKFR8g2agdR9uBnwVebMHYN152k6W4YLuUhfIl49fpg80IUrB8/exec',

  // Grow (משולם) — two integration modes:
  // 1. REAL API (recommended): run server/grow_server.py and set growApiBase to its URL
  //    (e.g. 'https://api.your-domain.co.il'). Payment is verified automatically via
  //    Grow's server callback before photos upload.
  // 2. Hosted payment-page links (no server): one fixed link per package from the
  //    Grow dashboard. No automatic verification — customer self-confirms.
  // growApiBase takes precedence when both are set. Both empty = demo card form.
  growApiBase: '',
  // Make (make.com) webhook that creates a Grow payment link and sends it to the
  // customer by SMS/email (per the Grow+Make guide). Highest precedence when set.
  growMakeWebhook: '',
  growLinks: {
    // Fixed Grow payment pages, one per package. To verify payment automatically,
    // set each page's "עמוד תודה → קישור לעמוד תודה באתר שלך" (thank-you return URL)
    // in the Grow dashboard to your site + ?paid=1, e.g.:
    //   https://animoment.co.il/?paid=1
    // After a successful charge Grow returns the customer here, the payment tab
    // signals the original tab, and the photos upload automatically.
    small: 'https://pay.grow.link/ODkyNTA~2844b6317cda0e9071e47fc4916ae680-MzY5MjczOA',
    full: 'https://pay.grow.link/ODkyNTA~8b612eff645c45af508907ff1006cab5-MzY5MzYyNw',
    legacy: 'https://pay.grow.link/ODkyNTA~e1af196c93592db1809d2a3d76bc6e7d-MzY5MzY0NQ'
  },

  // Coupon codes — code (uppercase) -> discount.
  // type 'percent' = % off the package price; type 'fixed' = ₪ off.
  coupons: {
    WELCOME10: { type: 'percent', value: 10 },
    FAMILY20: { type: 'percent', value: 20 },
    SAVE50: { type: 'percent', value: 50 }
  },

  // Validation on/off (set true for production!)
  requireFields: true,

  // Simulate upload failure (testing only)
  simulateFailure: false,

  packages: [
    { key: 'small',  name: 'רגע קטן',        price: 99,  discount: 0, maxPhotos: 8,
      features: ['עד 8 תמונות', 'מוזיקה מותאמת', 'מוכן תוך 48 שעות'] },
    { key: 'full',   name: 'הסיפור המלא',    price: 179, discount: 0, maxPhotos: 15, featured: true,
      features: ['עד 15 תמונות', 'מוזיקה מותאמת', 'מוכן תוך 48 שעות'] },
    { key: 'legacy', name: 'מזכרת לחיים', price: 319, discount: 0, maxPhotos: 30,
      features: ['עד 30 תמונות', 'מוזיקה מותאמת', 'מוכן תוך 48 שעות'] }
  ],

  defaultPackageKey: 'full',

  // Filmstrip examples (photo url + title + optional video). Clicking a tile opens a
  // lightbox that plays `video` if set; otherwise shows a "coming soon" placeholder.
  examples: [
    { img: 'https://img.youtube.com/vi/y428SjEcUfQ/hqdefault.jpg', title: 'מתן מלידה ועד היום👨🏻‍🍳', video: 'https://youtu.be/y428SjEcUfQ' },
    { img: 'https://img.youtube.com/vi/quPYuPS5gc0/hqdefault.jpg', title: 'יפתח בן שנתיים👶🏼', video: 'https://youtu.be/quPYuPS5gc0' },
    { img: 'https://img.youtube.com/vi/jpHmvEfhz0Q/hqdefault.jpg', title: 'אור ונדב כובשים את אתונה', video: 'https://youtu.be/jpHmvEfhz0Q' },
    { img: 'https://img.youtube.com/vi/w4SvOgTUvRw/hqdefault.jpg', title: 'באדי בת 4🐕', video: 'https://youtu.be/w4SvOgTUvRw' },
    { img: 'https://img.youtube.com/vi/fSS030bRRw8/hqdefault.jpg', title: 'פומבי החמוד שלנו❤️', video: 'https://youtu.be/fSS030bRRw8' },
    { img: 'https://img.youtube.com/vi/3mGPan8qRik/hqdefault.jpg', title: 'דרור וירון עושים את אמריקה 🇺🇸2026', video: 'https://youtu.be/3mGPan8qRik' }
  ],

  contactEmail: 'myanimoments@gmail.com',
  contactPhone: '055-274-5188',

  // Social links (footer). Empty string hides that icon.
  socialLinks: {
    facebook: 'https://www.facebook.com/share/1EnD91arte/?mibextid=wwXIfr',
    instagram: 'https://www.instagram.com/animoment.il?igsh=MW03OGFzZWZ3b3pmZQ==',
    whatsapp: 'https://wa.me/message/TB5H2KEWN6N4E1',
    youtube: 'https://youtube.com/channel/UCbTyD-2MgAvDgryDYWryE3A?si=px3Jg4At-NTm5wwY',
    tiktok: 'https://www.tiktok.com/@animoment.il'
  },

  // FAQ (landing accordion). Editable from the admin Settings tab.
  faq: [
    { q: 'איך עובד תהליך יצירת הסרטון?', a: 'אתם מעלים תמונות, מסדרים אותן לפי הסדר הרצוי ומשלימים את ההזמנה. לאחר מכן, הכלים המתקדמים שלנו יחברו אותן לסרטון אנימציה זורם הכולל סאונד מותאם.' },
    { q: 'תוך כמה זמן אקבל את הסרטון?', a: 'זמן האספקה הוא לרוב מספר שעות, ועד מקסימום 48 שעות. כל סרטון עובר עיבוד מורכב של בינה מלאכותית, כדי להבטיח את התוצאה האיכותית ביותר.' },
    { q: 'מה קורה לתמונות שאני מעלה?', a: 'הפרטיות שלכם מובטחת. התמונות שאתם מעלים משמשות אך ורק ליצירת הסרטון שלכם. אנחנו לא שומרים את התמונות במערכת ולא עושים בהן שום שימוש נוסף לאחר מסירת התוצר.' },
    { q: 'האם ניתן לקבל החזר כספי?', a: 'לא. מכיוון שכל סרטון מיוצר במיוחד ובהתאמה אישית מלאה עבורכם, ודורש משאבי מחשוב יקרים, לא ניתן לבטל הזמנה או לקבל החזר כספי לאחר תחילת העבודה. אנא ודאו שהתמונות והסדר שלהן מושלמים מבחינתכם לפני אישור התשלום.' },
    { q: 'האם התוצאה תמיד נראית מציאותית ב-100%?', a: 'טכנולוגיית הבינה המלאכותית שלנו מפיקה תוצאות מרהיבות, אך מטבעה ייתכנו תנועות אמנותיות בלתי צפויות או עיוותים קלים באנימציה. זהו למעשה הקסם והייחוד של יצירה ב-AI, שמבטיח שכל סרטון הוא יצירה חד-פעמית.' },
    { q: 'כמה תמונות כדאי להעלות?', a: 'המערכת מאפשרת העלאה של בין 8 ל-30 תמונות. מומלץ להעלות תמונות ברורות ומוארות. כל מעבר בין שתי תמונות ייצר קטע אנימציה של כ-5 שניות.' },
    { q: 'האם ניתן להוסיף שיר אמיתי ברקע?', a: 'לא. מטעמי זכויות יוצרים איננו יכולים לשלב שירים מסחריים או מוכרים בסרטונים. במקום זאת אנו בוחרים עבורכם פסקול איכותי ונטול זכויות, שמותאם לתחושה שבחרתם — כדי שהסרטון יישאר שלכם לחלוטין, לשיתוף ולשמירה ללא כל חשש משפטי.' }
  ]
};

// Apply each package's discount (percent): price becomes the sale price,
// basePrice keeps the original.
config.packages = config.packages.map((p) => {
  const d = Math.min(90, Math.max(0, p.discount || 0));
  return { ...p, basePrice: p.price, price: Math.round(p.price * (100 - d) / 100) };
});

// Design tokens (sunset-warmth palette)
export const colors = {
  cream: '#FAF0E6',
  card: '#FFFFFF',
  ink: '#3B2A20',
  muted: '#7A5C48',
  body: '#6E5240',
  accent: '#C4502E',
  accentSoft: '#D96A38',
  accentDark: '#A83E20',
  gold: '#E8A13C',
  soft: '#FBE4D7',
  border: '#F0D9C4',
  borderStrong: '#E4C4A8',
  filmDark: '#2E1F17',
  footerBg: '#F6E9DC',
  badgeBg: '#FDF3E3',
  badgeBorder: '#F0CFA0',
  badgeText: '#8A5A12',
  errorBg: '#FBE9E2'
};

// ===================================================================
// כל הנתונים העסקיים במקום אחד — ערכו כאן בלבד
// ===================================================================

export const config = {
  brandName: 'זִכְרוֹנִימַצְיָה',

  // Cloudinary (unsigned upload). Leave empty for demo mode (no real upload).
  cloudinary: {
    cloudName: 'dmxkoz4jo',
    uploadPreset: 'videoOrders'  // must be UNSIGNED
  },

  // Optional server endpoint that sends the confirmation email.
  // Leave empty to skip emails. (A static site cannot send email by itself —
  // point this at any small API you host: Express, Cloud Function, your Python backend, etc.
  // It receives POST JSON: {to_email, to_name, phone, package_name, package_price, photo_count, order_date})
  emailEndpoint: 'https://script.google.com/macros/s/AKfycbw94dq6pEWebD6fvrt_SDf7kKPx5xYe9zyONkHMiVeIajIR2v97HwqoRSK8Yjgg0zyREg/exec',

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
    //   https://glittery-hamster-8da1b1.netlify.app/?paid=1
    // After a successful charge Grow returns the customer here, the payment tab
    // signals the original tab, and the photos upload automatically.
    small: 'https://pay.grow.link/df2ca38c2edd70b1b6cbe46f22251557-MjI4Mzk0MA',
    full: 'https://pay.grow.link/df2ca38c2edd70b1b6cbe46f22251557-MjI4Mzk0MA',
    legacy: 'https://pay.grow.link/df2ca38c2edd70b1b6cbe46f22251557-MjI4Mzk0MA'
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
    { key: 'small',  name: 'רגע קטן',        price: 99,  discount: 10, maxPhotos: 8,
      features: ['עד 8 תמונות', 'מוזיקה מותאמת', 'מוכן תוך 48 שעות'] },
    { key: 'full',   name: 'הסיפור המלא',    price: 199, discount: 40, maxPhotos: 15, featured: true,
      features: ['עד 15 תמונות', 'מוזיקה מותאמת', 'מוכן תוך 48 שעות'] },
    { key: 'legacy', name: 'מורשת משפחתית', price: 299, discount: 15, maxPhotos: 30,
      features: ['עד 30 תמונות', 'מוזיקה מותאמת', 'מוכן תוך 48 שעות'] }
  ],

  defaultPackageKey: 'full',

  // Filmstrip examples (photo url + title + optional video). Clicking a tile opens a
  // lightbox that plays `video` if set; otherwise shows a "coming soon" placeholder.
  examples: [
    { img: 'https://picsum.photos/seed/noa-baby/440/280',    title: 'השנה הראשונה של נועה', video: '' },
    { img: 'https://picsum.photos/seed/saba-savta/440/280',  title: '40 שנה לסבא וסבתא', video: '' },
    { img: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',    title: 'הטיול המשפחתי לים', video: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ' },
    { img: 'https://picsum.photos/seed/birthday/440/280',    title: 'השנה הראשונה של נועה', video: '' },
    { img: 'https://picsum.photos/seed/family-home/440/280', title: '40 שנה לסבא וסבתא', video: '' },
    { img: 'https://picsum.photos/seed/picnic/440/280',      title: 'הטיול המשפחתי לים', video: '' }
  ],

  contactEmail: 'animoments@gmail.com'
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

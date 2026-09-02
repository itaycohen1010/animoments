// Meta (Facebook) Pixel — ad attribution & retargeting. Runs ALONGSIDE the
// Firestore analytics and Clarity, never replaces them. If no id is set
// (config.metaPixel.id empty) every function is a silent no-op.

import { config } from './config.js';

const ID = ((config.metaPixel || {}).id || '').trim();

let _ready = false;

export function initPixel() {
  if (_ready || !ID || typeof window === 'undefined') return;
  // Official Meta Pixel loader snippet.
  (function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = true; t.src = v;
    s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', ID);
  window.fbq('track', 'PageView');
  _ready = true;
}

// Standard Meta event (ViewContent / InitiateCheckout / Purchase …). Never throws.
export function pixelTrack(name, params) {
  try { if (_ready && window.fbq) window.fbq('track', name, params || {}); } catch (e) { /* silent */ }
}

// Advanced Matching — re-init the pixel with the customer's contact details so Meta
// can attribute the conversion to a real person (much better attribution and
// Lookalike audiences). Meta hashes these client-side before sending; we normalise
// first (lowercase e-mail, digits-only phone with the 972 country code) because
// unnormalised values simply fail to match.
export function pixelIdentify(info) {
  try {
    if (!_ready || !window.fbq || !info) return;
    const email = (info.email || '').trim().toLowerCase();
    let phone = (info.phone || '').replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '972' + phone.slice(1);
    const name = (info.name || '').trim().toLowerCase();
    const parts = name.split(/\s+/);
    const ud = {};
    if (email) ud.em = email;
    if (phone.length >= 11) ud.ph = phone;
    if (parts[0]) ud.fn = parts[0];
    if (parts.length > 1) ud.ln = parts[parts.length - 1];
    ud.country = 'il';
    if (!Object.keys(ud).length) return;
    window.fbq('init', ID, ud);
  } catch (e) { /* silent */ }
}

// Custom (non-standard) event.
export function pixelCustom(name, params) {
  try { if (_ready && window.fbq) window.fbq('trackCustom', name, params || {}); } catch (e) { /* silent */ }
}

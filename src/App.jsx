import React, { useState, useRef, useEffect, useCallback } from 'react';
import { config, colors as C } from './config.js';
import { legalDocs } from './legal.js';
import { saveOrder, getCustomerId, fetchSettings, startSession, trackStep, trackLead, saveLead, markLeadConverted, markConverted, markGalleryView, trackHeartbeat, trackClick, flushClicks, trackScroll } from './firebase.js';

import Nav from './components/Nav.jsx';
import { initClarity, clarityTag, clarityEvent } from './clarity.js';
import Footer from './components/Footer.jsx';

import LandingScreen from './screens/LandingScreen.jsx';
import DetailsScreen from './screens/DetailsScreen.jsx';
import UploadScreen from './screens/UploadScreen.jsx';
import PaymentScreen from './screens/PaymentScreen.jsx';
import ResultScreen from './screens/ResultScreen.jsx';
import LookupScreen from './screens/LookupScreen.jsx';
import GalleryScreen from './screens/GalleryScreen.jsx';

import LegalModal from './modals/LegalModal.jsx';
import HowItWorksModal from './modals/HowItWorksModal.jsx';
import TipsModal from './modals/TipsModal.jsx';
import ConfirmChecklistModal from './modals/ConfirmChecklistModal.jsx';
import { pillBtn } from './styles.js';

// ===================================================================
// App — state + flow logic; all UI lives in screens/ and modals/
// Flow: 0 landing → 1 details → 2 photos → 3 payment → 4 result
// ===================================================================
export default function App() {
  const defaultPkg = config.packages.find((p) => p.key === config.defaultPackageKey) || config.packages[1];

  const [step, setStep] = useState(0);
  const [prep, setPrep] = useState(null); // null | 'uploading' | 'failed' — pre-payment upload gate
  const [uploadErr, setUploadErr] = useState('');
  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNowTick(Date.now()), 1000); return () => clearInterval(t); }, []);
  const [pkgKey, setPkgKey] = useState(defaultPkg.key);
  const [photos, setPhotos] = useState([]);          // {id, url, file}
  const [dragIndex, setDragIndex] = useState(null);
  const [dzOver, setDzOver] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', agree: false });
  const [formError, setFormError] = useState(null);
  const [card, setCard] = useState({ name: '', num: '', exp: '', cvv: '' });
  const [mood, setMood] = useState('');
  const [payError, setPayError] = useState(null);
  const [result, setResult] = useState('processing'); // processing | failed | done
  const [uploadedCount, setUploadedCount] = useState(0);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);          // 'how' | 'tips' | 'confirm' | 'blessing' | 'privacy' | 'accessibility' | 'terms'
  const [howStep, setHowStep] = useState(1);
  const [lookup, setLookup] = useState(false); // 'הסרטון שלי' retrieval screen
  const lookupQueryRef = useRef('');
  const [gallery, setGallery] = useState(false); // 'גלריה' screen
  const [promoOpen, setPromoOpen] = useState(!!((config.promoPopup || '').trim() || (config.promoImage || '').trim()));
  const [settingsTick, setSettingsTick] = useState(0); // bumps after DB settings load to re-render
  const [settingsLoaded, setSettingsLoaded] = useState(false); // gate render until DB settings resolve (DB is source of truth)

  // Load business settings from the DB (settings/site) and apply over config.js defaults.
  // config.js stays as the instant fallback until this resolves.
  useEffect(() => {
    fetchSettings().then((s) => {
      if (s) {
        Object.assign(config, s);            // DB is the source of truth for content
        if (Array.isArray(s.packages)) {
          config.packages = s.packages.map((p) => {
            const d = Math.min(90, Math.max(0, p.discount || 0));
            return { ...p, basePrice: p.price, price: Math.round(p.price * (100 - d) / 100) };
          });
        }
        if (!config.packages.some((p) => p.key === pkgKey)) {
          setPkgKey((config.packages.find((p) => p.key === config.defaultPackageKey) || config.packages[1] || config.packages[0]).key);
        }
        setPromoOpen(!!((config.promoPopup || '').trim() || (config.promoImage || '').trim()));
      }
      setSettingsTick((t) => t + 1);
      setSettingsLoaded(true);
    }).catch(() => setSettingsLoaded(true));
  }, []); // eslint-disable-line

  // analytics: start a session on first load, and record every step change for the funnel
  useEffect(() => { initClarity(); startSession(); }, []);
  useEffect(() => {
    trackStep(step);
    const names = ['landing', 'upload', 'details', 'payment', 'result'];
    clarityTag('funnel_step', lookup ? 'lookup' : gallery ? 'gallery' : (names[step] || 'step-' + step));
  }, [step, lookup, gallery]);
  // scroll depth (landing only) — throttled, records the furthest % reached
  useEffect(() => {
    if (step !== 0 || lookup || gallery) return;
    let t = null;
    const onScroll = () => {
      if (t) return;
      t = setTimeout(() => {
        t = null;
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        if (max > 0) trackScroll((h.scrollTop / max) * 100);
      }, 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); if (t) clearTimeout(t); };
  }, [step, lookup, gallery]);
  // clicks + idle session: count every on-site click and stop tracking after 5 min
  // with no clicks (so time-on-site reflects real interaction, not tabs left open).
  useEffect(() => {
    let idleTimer = null;
    let active = true;
    const IDLE_MS = 5 * 60000;
    const onClick = (e) => {
      const el = e.target && e.target.closest && e.target.closest('a,button,[data-track]');
      if (!el) return; // only count meaningful clicks (buttons / links)
      if (el.getAttribute('data-open') === '1') return; // closing an open folder — don't count
      if (!active) { active = true; }
      const name = el.getAttribute('data-track') || el.getAttribute('aria-label') || (el.textContent || '').trim().slice(0, 30) || el.tagName.toLowerCase();
      trackClick(name);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { active = false; }, IDLE_MS);
    };
    document.addEventListener('click', onClick, true);
    idleTimer = setTimeout(() => { active = false; }, IDLE_MS);
    const onHide = () => { if (document.visibilityState === 'hidden') trackHeartbeat(); };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', trackHeartbeat);
    const flushTimer = setInterval(flushClicks, 20000);
    const onHideFlush = () => { if (document.visibilityState === 'hidden') flushClicks(); };
    document.addEventListener('visibilitychange', onHideFlush);
    window.addEventListener('pagehide', flushClicks);
    return () => { document.removeEventListener('click', onClick, true); clearTimeout(idleTimer); clearInterval(flushTimer); document.removeEventListener('visibilitychange', onHide); document.removeEventListener('visibilitychange', onHideFlush); window.removeEventListener('pagehide', trackHeartbeat); window.removeEventListener('pagehide', flushClicks); };
  }, []);

  const tipsShownRef = useRef(false);
  const fileInputRef = useRef(null);
  const toastTimer = useRef(null);
  const uploadFolderRef = useRef(null);
  const detailsUploadedRef = useRef(false);
  const orderIdRef = useRef(null);
  const paidPriceRef = useRef(null); // final price after coupon, reported by PaymentScreen

  // short order id, generated once per order (e.g. AM-150726-4F9K)
  const getOrderId = () => {
    if (!orderIdRef.current) {
      const d = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const date = pad(d.getDate()) + pad(d.getMonth() + 1) + String(d.getFullYear()).slice(2);
      let r = '';
      for (let i = 0; i < 4; i++) r += 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)];
      orderIdRef.current = 'AM-' + date + '-' + r;
    }
    return orderIdRef.current;
  };

  const pkg = config.packages.find((p) => p.key === pkgKey) || defaultPkg;
  const cloudinaryConfigured = !!(config.cloudinary.cloudName && config.cloudinary.uploadPreset);

  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  const showToast = useCallback((text) => {
    clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const openHow = (initialStep) => { setHowStep(initialStep); setModal('how'); };

  // ---------- photos ----------
  const addFiles = (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    // accept everything up to a hard cap of 40 — photos beyond the package limit
    // get a warning badge, and continuing stays blocked until the count fits
    const HARD_CAP = 40;
    const capRoom = HARD_CAP - photos.length;
    if (capRoom <= 0) {
      showToast(`אפשר להציג עד ${HARD_CAP} תמונות — הסירו תמונות כדי להוסיף חדשות`);
      setDzOver(false);
      return;
    }
    const capped = files.slice(0, capRoom);
    if (files.length > capRoom) {
      showToast(`נוספו ${capped.length} תמונות — אפשר להציג עד ${HARD_CAP} תמונות`);
    }
    setPhotos((prev) => [...prev, ...capped.map((f) => ({ id: Math.random().toString(36).slice(2), url: URL.createObjectURL(f), file: f }))]);
    setDzOver(false);
  };

  const reorder = (from, to) => {
    if (from == null || to == null || from === to) return;
    setPhotos((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr;
    });
    setDragIndex(to);
  };

  // touch drag (press-and-hold ~180ms); listeners live on document
  const touchDrag = useRef({ dragging: false, timer: null, start: null, index: null });
  useEffect(() => {
    const td = touchDrag.current;
    const onMove = (e) => {
      const t = e.touches && e.touches[0];
      if (!t) return;
      if (!td.dragging) {
        if (td.start && (Math.abs(t.clientX - td.start.x) > 10 || Math.abs(t.clientY - td.start.y) > 10)) {
          clearTimeout(td.timer); td.start = null;
        }
        return;
      }
      e.preventDefault();
      const el = document.elementFromPoint(t.clientX, t.clientY);
      const cardEl = el && el.closest && el.closest('[data-photo-idx]');
      if (cardEl) {
        const to = parseInt(cardEl.getAttribute('data-photo-idx'), 10);
        if (!isNaN(to) && to !== td.index) { reorder(td.index, to); td.index = to; }
      }
    };
    const onEnd = () => {
      clearTimeout(td.timer); td.start = null;
      if (td.dragging) { td.dragging = false; setDragIndex(null); }
    };
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);
    return () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
  }, [photos.length]);

  // ---------- validation ----------
  const validateDetails = () => {
    if (!config.requireFields) return null;
    const nameOk = form.name.trim().length > 0;
    const phoneDigits = (form.phone.match(/\d/g) || []).length;
    const phoneRaw = form.phone.trim();
    const phoneOk = /^0(5\d|[2-46-9])\d{7,8}$/.test(phoneRaw.replace(/[\s-]/g, '')) || (phoneRaw.startsWith('+') && phoneDigits >= 8 && phoneDigits <= 15);
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    if (nameOk && phoneOk && emailOk && form.agree) return null;
    if (nameOk && phoneOk && emailOk && !form.agree) return 'יש לאשר את תנאי השימוש ומדיניות הפרטיות';
    const missing = [];
    if (!nameOk) missing.push('שם');
    if (!phoneOk) missing.push('מספר טלפון תקין');
    if (!emailOk) missing.push('כתובת אימייל תקינה');
    if (missing.length === 1) return 'נא למלא ' + missing[0];
    return 'נא למלא ' + missing.slice(0, -1).join(', ') + ' ו' + missing[missing.length - 1];
  };

  // ---------- navigation ----------
  const startOrder = (key) => {
    if (key) setPkgKey(key);
    setStep(1); // photos first — tips no longer auto-open
  };

  // "מעבר לתשלום": upload the photos FIRST, blocking the payment page behind an
  // overlay, so a customer never pays before their files are safely in Cloudinary.
  const detailsToPhotos = async () => {
    const err = validateDetails();
    if (err) { setFormError(err); return; }
    trackLead({ name: form.name, phone: form.phone, email: form.email });
    saveLead({ orderId: getOrderId(), name: form.name, phone: form.phone, email: form.email, packageKey: pkg.key, price: paidPriceRef.current ?? pkg.price, photoCount: photos.length });
    savePendingOrder();
    setUploadedCount(0);
    setPrep('uploading');
    uploadPromiseRef.current = uploadPhotos();
    const ok = await uploadPromiseRef.current;
    uploadPromiseRef.current = null;
    if (!ok) { setPrep('failed'); return; }
    setPrep(null);
    setStep(3);
    window.scrollTo(0, 0);
  };

  const photosToPayment = () => {
    if (photos.length < 2) return;
    if (photos.length > pkg.maxPhotos) {
      showToast(`חבילת "${pkg.name}" מוגבלת ל-${pkg.maxPhotos} תמונות — הסירו ${photos.length - pkg.maxPhotos} תמונות או שדרגו חבילה`);
      return;
    }
    setModal(null); setStep(2); window.scrollTo(0, 0); // checklist is inline on upload; go straight to details
  };

  // ---------- email ----------
  const emailSentRef = useRef(false);
  const sendConfirmationEmail = () => {
    if (emailSentRef.current) return;          // send once per order, even across upload retries
    if (!config.emailEndpoint || !form.email.trim()) return;
    emailSentRef.current = true;
    fetch(config.emailEndpoint, {
      method: 'POST',
      mode: 'no-cors', // Apps Script rejects CORS preflight — must stay a "simple request"
      body: JSON.stringify({
        token: 'am_9f3k2xQ7pL5vR8wZ1tB6nH0',
        order_id: getOrderId(),
        to_email: form.email.trim(), to_name: form.name.trim(), phone: form.phone.trim(),
        package_name: pkg.name, package_price: paidPriceRef.current ?? pkg.price,
        music_mood: mood || '(לא נבחר)',
        photo_count: photos.length, order_date: new Date().toLocaleString('he-IL')
      })
    }).catch((err) => console.warn('confirmation email failed', err));
  };

  // ---------- firestore ----------
  const orderSavedRef = useRef(false);
  const orderFolder = () => {
    const name = (form.name.trim() || 'ללא-שם').replace(/\s+/g, '-');
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const stamp = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
    return uploadFolderRef.current || `video-orders/${getOrderId()}_${name}-${stamp}${mood ? '_' + mood.replace(/\s+/g, '-') : ''}`;
  };
  // Save the order the MOMENT payment starts, as "pending" — so the buyer's details
  // are never lost even if the Grow return signal fails to come back.
  const savePendingOrder = () => {
    saveOrder({
      orderId: getOrderId(), name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(),
      packageKey: pkg.key, price: paidPriceRef.current ?? pkg.price,
      photoCount: photos.length, mood, blessing: (form.blessing || ''), folder: orderFolder(), status: 'pending'
    });
  };
  const saveOrderOnce = () => {
    if (orderSavedRef.current) return;
    orderSavedRef.current = true;
    saveOrder({
      orderId: getOrderId(), name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(),
      packageKey: pkg.key, price: paidPriceRef.current ?? pkg.price,
      photoCount: photos.length, mood, blessing: (form.blessing || ''), folder: orderFolder(), status: 'paid'
    });
  };

  // ---------- upload (runs before the payment page opens) ----------
  const uploadPromiseRef = useRef(null);

  // Pure upload: photos → Cloudinary. No email, no DB, no screen change.
  // Resolves true on success, false on failure. Safe to call again to retry.
  const uploadPhotos = async () => {
    if (!cloudinaryConfigured) {
      // demo mode — simulate progress
      const total = photos.length;
      for (let i = 1; i <= total; i++) {
        await new Promise((r) => setTimeout(r, 420));
        if (config.simulateFailure && i >= Math.ceil(total / 2)) return false;
        setUploadedCount(i);
      }
      return true;
    }

    if (!uploadFolderRef.current) {
      const name = (form.name.trim() || 'ללא-שם').replace(/\s+/g, '-');
      const d = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const stamp = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
      uploadFolderRef.current = `video-orders/${getOrderId()}_${name}-${stamp}${mood ? '_' + mood.replace(/\s+/g, '-') : ''}`;
    }
    const folder = uploadFolderRef.current;
    const tag = folder.split('/')[1];
    const base = `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudinary.cloudName)}`;

    // Upload one photo with up to 3 attempts. public_id is fixed by index, so
    // running several in parallel can never scramble the order in the video.
    const uploadOne = async (p, i) => {
      if (p.uploaded) return;
      let res = null, lastErr = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const fd = new FormData();
          fd.append('file', p.file);
          fd.append('upload_preset', config.cloudinary.uploadPreset);
          fd.append('folder', folder);
          // this account uses Cloudinary's dynamic-folder mode, where `folder` alone
          // is ignored — asset_folder is what actually places the files.
          fd.append('asset_folder', folder);
          fd.append('tags', tag);
          fd.append('public_id', String(i + 1).padStart(3, '0')); // 001, 002 … sorts correctly
          // zero-padded so Cloudinary's A–Z sort matches the real order (001, 002 … 010)
          fd.append('context', `order=${i + 1}|from=${form.name.trim()}|phone=${form.phone.trim()}`);
          res = await fetch(`${base}/image/upload`, { method: 'POST', body: fd });
          if (res.ok) break;
          let msg = '';
          try { msg = (await res.clone().json())?.error?.message || ''; } catch (e2) { /* ignore */ }
          // preset has overwrite:false — a retry of a photo that actually landed
          // comes back as "already exists", which for us means success.
          if (/already exists/i.test(msg)) { p.uploaded = true; setUploadedCount((n) => n + 1); return; }
          lastErr = new Error(`${res.status}${msg ? ' · ' + msg : ''}`);
        } catch (e) { lastErr = e; }
        await new Promise((r) => setTimeout(r, 1200 * (attempt + 1))); // backoff before retry
      }
      if (!res || !res.ok) throw (lastErr || new Error('upload failed'));
      p.uploaded = true;
      setUploadedCount((n) => n + 1);
    };

    try {
      // batches of 3 — meaningfully faster than one-by-one, gentle on mobile
      // connections and on Cloudinary's rate limit.
      const BATCH = 5;
      setUploadedCount(photos.filter((p) => p.uploaded).length);
      for (let i = 0; i < photos.length; i += BATCH) {
        await Promise.all(photos.slice(i, i + BATCH).map((p, k) => uploadOne(p, i + k)));
      }
      return true;
    } catch (err) {
      console.warn('Cloudinary upload error', err);
      setUploadErr(String((err && err.message) || err));
      return false;
    }
  };

  // ---------- payment return: email + order only (photos already uploaded) ----------
  const startUpload = async () => {
    sendConfirmationEmail();
    saveOrderOnce();
    markConverted(orderIdRef.current);
    markLeadConverted(getOrderId());
    clarityEvent('purchase');
    setStep(4);
    setUploadedCount(photos.length);
    setResult('done');
  };

  const retryUpload = async () => {
    setPrep('uploading');
    uploadPromiseRef.current = uploadPhotos();
    const ok = await uploadPromiseRef.current;
    uploadPromiseRef.current = null;
    if (!ok) { setPrep('failed'); return; }
    setPrep(null);
    setStep(3);
    window.scrollTo(0, 0);
  };

  const confirmPayment = () => {
    const growApi = (config.growApiBase || '').trim();
    const growLink = (config.growLinks?.[pkg.key] || '').trim();
    if (growApi || growLink) { startUpload(); return; } // payment handled by Grow
    if (config.requireFields) {
      const ok = card.name.trim() && card.num.replace(/\D/g, '').length >= 14 && card.exp.replace(/\D/g, '').length === 4 && card.cvv.length >= 3;
      if (!ok) { setPayError('נא למלא את כל פרטי הכרטיס'); return; }
    }
    startUpload();
  };

  // Grow payment return: this tab may be Grow's thank-you redirect (?paid=1),
  // or the original tab receiving the "paid" signal from the payment tab.
  // localStorage is shared across same-origin tabs even when window.opener is lost.
  const startUploadRef = useRef(null);
  startUploadRef.current = startUpload;
  const stepRef = useRef(0);
  stepRef.current = step;
  const resultRef = useRef(result);
  resultRef.current = result;
  useEffect(() => {
    const goPaid = () => { if (stepRef.current === 3 && resultRef.current !== 'done') startUploadRef.current && startUploadRef.current(); };
    const params = new URLSearchParams(window.location.search);
    if (params.get('paid') === '1') {
      try { localStorage.setItem('zkm_grow_paid', String(Date.now())); } catch (e) {}
      if (window.opener && !window.opener.closed) { try { window.opener.postMessage({ grow: 'paid' }, '*'); } catch (e) {} }
      setTimeout(() => { try { window.close(); } catch (e) {} }, 400);
      return;
    }
    const onMsg = (e) => { if (e && e.data && e.data.grow === 'paid') goPaid(); };
    const onStorage = (e) => { if (e.key === 'zkm_grow_paid' && e.newValue) goPaid(); };
    window.addEventListener('message', onMsg);
    window.addEventListener('storage', onStorage);
    // Deep link to "הסרטון שלי" (from the video-ready email): ?lookup=1&order=AM-...
    if (params.get('lookup') === '1') { lookupQueryRef.current = params.get('order') || ''; setLookup(true); }
    return () => { window.removeEventListener('message', onMsg); window.removeEventListener('storage', onStorage); };
  }, []);

  const resetAll = () => {
    uploadPromiseRef.current = null;
    uploadFolderRef.current = null;
    detailsUploadedRef.current = false;
    orderIdRef.current = null;
    emailSentRef.current = false;
    orderSavedRef.current = false;
    setStep(0); setPhotos([]); setForm({ name: '', phone: '', email: '', agree: false, blessing: '' });
    setCard({ name: '', num: '', exp: '', cvv: '' });
    setMood('');
    setFormError(null); setPayError(null); setResult('processing'); setUploadedCount(0);
  };

  // ---------- journey bar ----------
  const journeyPct = [10, 35, 60, 82, 100][step];
  const journeyLabel = ['ברוכים הבאים', 'שלב 1 מתוך 4 — בחירת תמונות', 'שלב 2 מתוך 4 — פרטים', 'שלב 3 מתוך 4 — תשלום', 'שלב 4 מתוך 4 — סיום ✓'][step];

  // ===================================================================
  if (!settingsLoaded) {
    return (
      <div className="app-shell" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 44, height: 44, border: '4px solid #F0D9C4', borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }
  return (
    <div className="app-shell">
      <Nav step={step} journeyPct={journeyPct} journeyLabel={journeyLabel}
        onHome={() => { setLookup(false); setGallery(false); setStep(0); window.scrollTo(0, 0); }} onStart={() => { setLookup(false); setGallery(false); startOrder(); window.scrollTo(0, 0); }}
        onLookup={() => { setLookup(true); setGallery(false); setStep(0); }} lookup={lookup}
        onGallery={() => { setGallery(true); setLookup(false); setStep(0); markGalleryView(); }} gallery={gallery}
        onSection={(e, id) => { if (lookup || gallery) { e.preventDefault(); setLookup(false); setGallery(false); setStep(0); setTimeout(() => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 60); } }} />

      {(() => {
        const hasAnn = (config.announcement || '').trim();
        const dl = (config.promoDeadline || '').trim() ? new Date(config.promoDeadline).getTime() : 0;
        const rem = dl ? dl - nowTick : 0;
        const showTimer = !!(dl && rem > 0);
        if ((!hasAnn && !showTimer) || lookup || gallery) return null;
        let cd = '';
        if (showTimer) {
          const s = Math.floor(rem / 1000);
          const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
          const p = (n) => String(n).padStart(2, '0');
          cd = d > 0 ? `${d} ימים ${p(h)}:${p(m)}:${p(ss)}` : `${p(h)}:${p(m)}:${p(ss)}`;
        }
        return (
          <div style={{ background: config.announcementBg || '#17120F', color: config.announcementColor || '#fff', textAlign: 'center', fontWeight: 800, fontSize: 15, padding: '11px 20px', direction: 'rtl', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            {hasAnn && <span>{config.announcement}</span>}
            {showTimer && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.22)', borderRadius: 999, padding: '5px 16px', fontVariantNumeric: 'tabular-nums', letterSpacing: '.5px', fontWeight: 900, fontSize: 17, boxShadow: '0 0 0 1px rgba(255,255,255,.25) inset', animation: 'timer-pulse 1.6s ease-in-out infinite' }}><span style={{ display: 'inline-block', animation: 'clock-tick 1s steps(2) infinite' }}>⏳</span> {cd}</span>}
          </div>
        );
      })()}

      {gallery && <GalleryScreen onHome={() => { setGallery(false); window.scrollTo(0, 0); }} />}
      {lookup && <LookupScreen initialQuery={lookupQueryRef.current} onHome={() => { setLookup(false); window.scrollTo(0, 0); }} />}

      {!lookup && !gallery && step === 0 && <LandingScreen onStart={startOrder} onOpenHow={openHow} />}

      {step === 1 && (
        <UploadScreen pkg={pkg} pkgKey={pkgKey} setPkgKey={setPkgKey}
          photos={photos} setPhotos={setPhotos}
          dragIndex={dragIndex} setDragIndex={setDragIndex}
          dzOver={dzOver} setDzOver={setDzOver}
          addFiles={addFiles} reorder={reorder} touchDrag={touchDrag} fileInputRef={fileInputRef}
          mood={mood} setMood={setMood}
          showToast={showToast}
          onBack={() => setStep(0)} onContinue={photosToPayment}
          onOpenTips={() => setModal('tips')} onOpenChecklist={() => setModal('confirm')} onOpenHow={openHow} />
      )}

      {step === 2 && (
        <DetailsScreen pkg={pkg} form={form} reportPaidPrice={(v) => { paidPriceRef.current = v; }} setForm={setForm}
          formError={formError} setFormError={setFormError}
          onOpenLegal={(k) => setModal(k)}
          onBack={() => setStep(1)} onContinue={detailsToPhotos} onOpenHow={openHow} />
      )}

      {step === 3 && (
        <PaymentScreen pkg={pkg} photoCount={photos.length} form={form} reportPaidPrice={(v) => { paidPriceRef.current = v; }}
          card={card} setCard={setCard} payError={payError} setPayError={setPayError}
          onPaymentStart={savePendingOrder}
          onConfirm={confirmPayment} onBack={() => { setStep(2); setPayError(null); }} />
      )}

      {step === 4 && (
        <ResultScreen result={result} uploadedCount={uploadedCount} photos={photos}
          cloudinaryConfigured={cloudinaryConfigured} orderId={orderIdRef.current}
          onRetry={async () => {
            setResult('processing');
            const ok = await uploadPhotos();
            if (ok) setTimeout(() => setResult('done'), 400); else setResult('failed');
          }} onReset={resetAll} />
      )}

      <Footer onOpenLegal={(key) => setModal(key)} />

      {/* floating WhatsApp — landing + gallery only */}
      {((step === 0 && !lookup) || gallery) && (config.socialLinks && (config.socialLinks.whatsapp || '').trim()) && (
        <a href={config.socialLinks.whatsapp} target="_blank" rel="noopener" aria-label="פנו אלינו בוואטסאפ" data-track="וואטסאפ צף" className="wa-float"
          style={{ position: 'fixed', bottom: 22, left: 22, zIndex: 120, display: 'inline-flex', alignItems: 'center', gap: 10, height: 52, padding: '0 20px 0 14px', borderRadius: 999, background: '#fff', border: '1px solid #EADFD2', boxShadow: '0 8px 22px rgba(59,42,32,.16)', color: '#3B2A20', textDecoration: 'none', fontFamily: "'Heebo', sans-serif", fontWeight: 800, fontSize: 15 }}>
          <svg width="30" height="30" viewBox="0 0 24 24"><path fill="#25D366" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.9c0 1.76.46 3.45 1.34 4.95L2 22l5.3-1.38a9.9 9.9 0 0 0 4.74 1.2h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.13-2.9-7A9.82 9.82 0 0 0 12.04 2z"/><path fill="#fff" d="M16.69 14.02c-.25-.13-1.48-.73-1.71-.81-.23-.09-.4-.13-.56.12-.17.25-.65.81-.79.98-.15.16-.29.18-.54.06-.25-.13-1.06-.39-2.01-1.24-.74-.66-1.24-1.48-1.39-1.73-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.42h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.43 1.03 2.6c.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.48-.6 1.69-1.19.21-.58.21-1.08.14-1.19-.06-.11-.23-.17-.48-.29z"/></svg>
          <span>פנו אלינו</span>
        </a>
      )}

      {/* toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 26, left: '50%', transform: 'translateX(-50%)', background: C.ink, color: '#fff', fontSize: 14.5, fontWeight: 600, padding: '12px 24px', borderRadius: 999, boxShadow: '0 10px 30px rgba(59,42,32,.35)', zIndex: 100, animation: 'rise-in .3s ease both' }}>{toast}</div>
      )}

      {/* modals */}
      {promoOpen && ((config.promoPopup || '').trim() || (config.promoImage || '').trim()) && (
        <div onClick={() => { trackClick('סגירה'); setPromoOpen(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(59,42,32,.55)', backdropFilter: 'blur(5px)', zIndex: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="מבצע" style={{ position: 'relative', background: '#fff', borderRadius: 24, maxWidth: 420, width: '100%', padding: '36px 28px 28px', textAlign: 'center', boxShadow: '0 24px 60px rgba(59,42,32,.3)', direction: 'rtl' }}>
            <button onClick={() => { trackClick('סגירה'); setPromoOpen(false); }} aria-label="סגירה" style={{ position: 'absolute', top: 12, left: 12, border: 'none', background: 'none', cursor: 'pointer', width: 34, height: 34, borderRadius: '50%', fontSize: 22, color: '#6E5240', fontFamily: "'Heebo', sans-serif", lineHeight: 1, zIndex: 2, textShadow: '0 1px 4px rgba(255,255,255,.6)' }}>×</button>
            {(config.promoImage || '').trim()
              ? <img src={config.promoImage} alt="מבצע" style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 14, margin: '6px 0 2px' }} />
              : <p style={{ color: '#4A3529', fontSize: (config.promoTextSize || 24), fontWeight: 800, lineHeight: 1.5, margin: '8px 0 4px', whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{config.promoPopup}</p>}
          </div>
        </div>
      )}
      {modal === 'how' && <HowItWorksModal initialStep={howStep} onClose={() => setModal(null)} />}
      {modal === 'tips' && <TipsModal onClose={() => setModal(null)} />}
      {modal === 'confirm' && <ConfirmChecklistModal onConfirm={() => setModal(null)} onClose={() => setModal(null)} />}
      {modal === 'privacy' && <LegalModal doc={legalDocs.privacy} onClose={() => setModal(null)} />}
      {modal === 'accessibility' && <LegalModal doc={legalDocs.accessibility} onClose={() => setModal(null)} />}
      {modal === 'terms' && <LegalModal doc={legalDocs.terms} onClose={() => setModal(null)} />}

      {/* pre-payment upload gate — blocks the payment page until the photos are safe */}
      {prep && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(59,42,32,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, direction: 'rtl' }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: '38px 28px', maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(59,42,32,.35)' }}>
            {prep === 'uploading' ? (
              <>
                <div style={{ width: 46, height: 46, margin: '0 auto 18px', border: '4px solid #F0D9C4', borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <h2 style={{ fontWeight: 900, fontSize: '1.3rem', margin: '0 0 8px' }}>שומרים את התמונות שלכם…</h2>
                <p style={{ color: C.body, fontSize: '.98rem', lineHeight: 1.7, margin: '0 0 18px' }}>
                  {uploadedCount} מתוך {photos.length} — נמשיך לתשלום ברגע שכולן יישמרו. נא לא לסגור את החלון.
                </p>
                <div style={{ height: 10, background: C.cream, borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round((uploadedCount / Math.max(photos.length, 1)) * 100)}%`, background: C.accent, transition: 'width .3s ease' }} />
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 44, marginBottom: 12 }}>😕</div>
                <h2 style={{ fontWeight: 900, fontSize: '1.3rem', margin: '0 0 8px' }}>שמירת התמונות נקטעה</h2>
                <p style={{ color: C.body, fontSize: '.98rem', lineHeight: 1.7, margin: '0 0 20px' }}>
                  לא הצלחנו לשמור את כל התמונות, ולכן עוד לא עברנו לתשלום. אפשר לנסות שוב — תמונות שנשמרו לא יועלו פעמיים.
                </p>
                {uploadErr && (
                  <div style={{ background: C.errorBg, color: C.accentDark, fontSize: '.8rem', direction: 'ltr', textAlign: 'left', borderRadius: 12, padding: '10px 14px', margin: '0 0 16px', wordBreak: 'break-word' }}>{uploadErr}</div>
                )}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={retryUpload} style={{ ...pillBtn, padding: '12px 28px' }}>נסו שוב</button>
                  {(config.socialLinks?.whatsapp || '').trim() && (
                    <a href={`${(config.socialLinks.whatsapp || '').trim()}${(config.socialLinks.whatsapp || '').includes('?') ? '&' : '?'}text=${encodeURIComponent(`שלום, ניסיתי להזמין סרטון והעלאת התמונות נקטעה.\nמספר הזמנה: ${getOrderId()}\nשם: ${form.name.trim()}`)}`}
                      target="_blank" rel="noopener noreferrer" data-track="וואטסאפ - העלאה נקטעה"
                      style={{ ...pillBtn, padding: '12px 28px', background: '#25D366', boxShadow: '0 8px 22px rgba(37,211,102,.35)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 17 }}>💬</span>עזרו לי בוואטסאפ
                    </a>
                  )}
                  <button onClick={() => setPrep(null)} style={{ border: `1.5px solid ${C.borderStrong}`, background: '#fff', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 15, color: C.body, padding: '12px 24px', borderRadius: 999 }}>חזרה</button>
                </div>
                <p style={{ color: C.muted, fontSize: '.85rem', lineHeight: 1.7, margin: '14px 0 0' }}>
                  הפרטים שלכם כבר נשמרו אצלנו — נשמח לעזור ולהשלים את ההזמנה יחד.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

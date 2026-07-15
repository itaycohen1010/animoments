import React, { useState, useRef, useEffect, useCallback } from 'react';
import { config, colors as C } from './config.js';
import { legalDocs } from './legal.js';

import Nav from './components/Nav.jsx';
import Footer from './components/Footer.jsx';

import LandingScreen from './screens/LandingScreen.jsx';
import DetailsScreen from './screens/DetailsScreen.jsx';
import UploadScreen from './screens/UploadScreen.jsx';
import PaymentScreen from './screens/PaymentScreen.jsx';
import ResultScreen from './screens/ResultScreen.jsx';

import LegalModal from './modals/LegalModal.jsx';
import HowItWorksModal from './modals/HowItWorksModal.jsx';
import TipsModal from './modals/TipsModal.jsx';
import ConfirmChecklistModal from './modals/ConfirmChecklistModal.jsx';
import BlessingModal from './modals/BlessingModal.jsx';

// ===================================================================
// App — state + flow logic; all UI lives in screens/ and modals/
// Flow: 0 landing → 1 details → 2 photos → 3 payment → 4 result
// ===================================================================
export default function App() {
  const defaultPkg = config.packages.find((p) => p.key === config.defaultPackageKey) || config.packages[1];

  const [step, setStep] = useState(0);
  const [pkgKey, setPkgKey] = useState(defaultPkg.key);
  const [photos, setPhotos] = useState([]);          // {id, url, file}
  const [dragIndex, setDragIndex] = useState(null);
  const [dzOver, setDzOver] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [formError, setFormError] = useState(null);
  const [card, setCard] = useState({ name: '', num: '', exp: '', cvv: '' });
  const [blessing, setBlessing] = useState('');
  const [payError, setPayError] = useState(null);
  const [result, setResult] = useState('processing'); // processing | failed | done
  const [uploadedCount, setUploadedCount] = useState(0);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);          // 'how' | 'tips' | 'confirm' | 'blessing' | 'privacy' | 'accessibility' | 'terms'
  const [howStep, setHowStep] = useState(1);
  const [promoOpen, setPromoOpen] = useState(!!((config.promoPopup || '').trim() || (config.promoImage || '').trim()));

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
    const phoneOk = (form.phone.match(/\d/g) || []).length >= 9;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    if (nameOk && phoneOk && emailOk) return null;
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
    const openTips = !tipsShownRef.current;
    tipsShownRef.current = true;
    setStep(1); // photos first
    if (openTips) setModal('tips');
  };

  const detailsToPhotos = () => {
    const err = validateDetails();
    if (err) { setFormError(err); return; }
    setStep(3); // details → payment
  };

  const photosToPayment = () => {
    if (photos.length < 2) return;
    if (photos.length > pkg.maxPhotos) {
      showToast(`חבילת "${pkg.name}" מוגבלת ל-${pkg.maxPhotos} תמונות — הסירו ${photos.length - pkg.maxPhotos} תמונות או שדרגו חבילה`);
      return;
    }
    setModal('confirm'); // checklist → blessing → payment
  };

  // ---------- email ----------
  const sendConfirmationEmail = () => {
    if (!config.emailEndpoint || !form.email.trim()) return;
    fetch(config.emailEndpoint, {
      method: 'POST',
      mode: 'no-cors', // Apps Script rejects CORS preflight — must stay a "simple request"
      body: JSON.stringify({
        token: 'am_9f3k2xQ7pL5vR8wZ1tB6nH0',
        order_id: getOrderId(),
        to_email: form.email.trim(), to_name: form.name.trim(), phone: form.phone.trim(),
        package_name: pkg.name, package_price: paidPriceRef.current ?? pkg.price,
        photo_count: photos.length, order_date: new Date().toLocaleString('he-IL')
      })
    }).catch((err) => console.warn('confirmation email failed', err));
  };

  // ---------- upload (runs AFTER payment) ----------
  const startUpload = async () => {
    setStep(4); setResult('processing'); setUploadedCount(0);
    if (!cloudinaryConfigured) {
      // demo mode
      let i = 0;
      const total = photos.length;
      const t = setInterval(() => {
        i++;
        if (config.simulateFailure && i >= Math.ceil(total / 2)) { clearInterval(t); setResult('failed'); return; }
        if (i >= total) {
          clearInterval(t); setUploadedCount(total);
          setTimeout(() => { setResult('done'); sendConfirmationEmail(); }, 500);
          return;
        }
        setUploadedCount(i);
      }, 420);
      return;
    }

    if (!uploadFolderRef.current) {
      const name = (form.name.trim() || 'ללא-שם').replace(/\s+/g, '-');
      const d = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const stamp = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
      uploadFolderRef.current = `video-orders/${getOrderId()}_${name}-${stamp}`;
    }
    const folder = uploadFolderRef.current;
    const tag = folder.split('/')[1];
    const base = `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudinary.cloudName)}`;

    try {
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        if (p.uploaded) { setUploadedCount(i + 1); continue; }
        const fd = new FormData();
        fd.append('file', p.file);
        fd.append('upload_preset', config.cloudinary.uploadPreset);
        fd.append('folder', folder);
        fd.append('tags', tag);
        fd.append('public_id', String(i + 1)); // filename in Cloudinary = position in the video order
        fd.append('context', `order=${i + 1}|from=${form.name.trim()}|phone=${form.phone.trim()}`);
        const res = await fetch(`${base}/image/upload`, { method: 'POST', body: fd });
        if (!res.ok) throw new Error('upload failed: ' + res.status);
        p.uploaded = true;
        setUploadedCount(i + 1);
      }
      // (customer PII is NOT stored in Cloudinary — details are sent by email only)
      setTimeout(() => { setResult('done'); sendConfirmationEmail(); }, 400);
    } catch (err) {
      console.warn('Cloudinary upload error', err);
      setResult('failed');
    }
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
    return () => { window.removeEventListener('message', onMsg); window.removeEventListener('storage', onStorage); };
  }, []);

  const resetAll = () => {
    uploadFolderRef.current = null;
    detailsUploadedRef.current = false;
    orderIdRef.current = null;
    setStep(0); setPhotos([]); setForm({ name: '', phone: '', email: '' });
    setCard({ name: '', num: '', exp: '', cvv: '' });
    setBlessing('');
    setFormError(null); setPayError(null); setResult('processing'); setUploadedCount(0);
  };

  // ---------- journey bar ----------
  const journeyPct = [10, 35, 60, 82, 100][step];
  const journeyLabel = ['ברוכים הבאים', 'שלב 1 מתוך 4 — בחירת תמונות', 'שלב 2 מתוך 4 — פרטים', 'שלב 3 מתוך 4 — תשלום', 'שלב 4 מתוך 4 — סיום ✓'][step];

  // ===================================================================
  return (
    <div className="app-shell">
      <Nav step={step} journeyPct={journeyPct} journeyLabel={journeyLabel}
        onHome={() => setStep(0)} onStart={() => startOrder()} />

      {(config.announcement || '').trim() && (
        <div style={{ background: '#17120F', color: '#fff', textAlign: 'center', fontWeight: 800, fontSize: 15, padding: '11px 20px', direction: 'rtl' }}>{config.announcement}</div>
      )}

      {step === 0 && <LandingScreen onStart={startOrder} onOpenHow={openHow} />}

      {step === 1 && (
        <UploadScreen pkg={pkg} pkgKey={pkgKey} setPkgKey={setPkgKey}
          photos={photos} setPhotos={setPhotos}
          dragIndex={dragIndex} setDragIndex={setDragIndex}
          dzOver={dzOver} setDzOver={setDzOver}
          addFiles={addFiles} reorder={reorder} touchDrag={touchDrag} fileInputRef={fileInputRef}
          showToast={showToast}
          onBack={() => setStep(0)} onContinue={photosToPayment}
          onOpenTips={() => setModal('tips')} onOpenHow={openHow} />
      )}

      {step === 2 && (
        <DetailsScreen pkg={pkg} form={form} reportPaidPrice={(v) => { paidPriceRef.current = v; }} setForm={setForm}
          formError={formError} setFormError={setFormError}
          onBack={() => setStep(1)} onContinue={detailsToPhotos} onOpenHow={openHow} />
      )}

      {step === 3 && (
        <PaymentScreen pkg={pkg} photoCount={photos.length} form={form} reportPaidPrice={(v) => { paidPriceRef.current = v; }}
          card={card} setCard={setCard} payError={payError} setPayError={setPayError}
          onConfirm={confirmPayment} onBack={() => { setStep(2); setPayError(null); }} />
      )}

      {step === 4 && (
        <ResultScreen result={result} uploadedCount={uploadedCount} photos={photos}
          cloudinaryConfigured={cloudinaryConfigured} orderId={orderIdRef.current}
          onRetry={startUpload} onReset={resetAll} />
      )}

      <Footer onOpenLegal={(key) => setModal(key)} />

      {/* toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 26, left: '50%', transform: 'translateX(-50%)', background: C.ink, color: '#fff', fontSize: 14.5, fontWeight: 600, padding: '12px 24px', borderRadius: 999, boxShadow: '0 10px 30px rgba(59,42,32,.35)', zIndex: 100, animation: 'rise-in .3s ease both' }}>{toast}</div>
      )}

      {/* modals */}
      {promoOpen && ((config.promoPopup || '').trim() || (config.promoImage || '').trim()) && (
        <div onClick={() => setPromoOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(59,42,32,.55)', backdropFilter: 'blur(5px)', zIndex: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="מבצע" style={{ position: 'relative', background: '#fff', borderRadius: 24, maxWidth: 420, width: '100%', padding: '36px 28px 28px', textAlign: 'center', boxShadow: '0 24px 60px rgba(59,42,32,.3)', direction: 'rtl' }}>
            {(config.promoImage || '').trim()
              ? <img src={config.promoImage} alt="מבצע" style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 14, margin: '6px 0 2px' }} />
              : <p style={{ color: '#4A3529', fontSize: (config.promoTextSize || 24), fontWeight: 800, lineHeight: 1.5, margin: '8px 0 4px', whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{config.promoPopup}</p>}
          </div>
        </div>
      )}
      {modal === 'how' && <HowItWorksModal initialStep={howStep} onClose={() => setModal(null)} />}
      {modal === 'tips' && <TipsModal onClose={() => setModal(null)} />}
      {modal === 'confirm' && (
        <ConfirmChecklistModal onConfirm={() => setModal('blessing')} onClose={() => setModal(null)} />
      )}
      {modal === 'blessing' && (
        <BlessingModal blessing={blessing} setBlessing={setBlessing}
          onContinue={() => { setModal(null); setStep(2); setPayError(null); }}
          onSkip={() => { setBlessing(''); setModal(null); setStep(2); setPayError(null); }}
          onClose={() => setModal(null)} />
      )}
      {modal === 'privacy' && <LegalModal doc={legalDocs.privacy} onClose={() => setModal(null)} />}
      {modal === 'accessibility' && <LegalModal doc={legalDocs.accessibility} onClose={() => setModal(null)} />}
      {modal === 'terms' && <LegalModal doc={legalDocs.terms} onClose={() => setModal(null)} />}
    </div>
  );
}

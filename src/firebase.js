// ===================================================================
// Firebase / Firestore — stores each completed order.
//
// SETUP (one time):
// 1. Create a project at https://console.firebase.google.com
// 2. Build → Firestore Database → Create database (Production mode).
// 3. Project settings → General → "Your apps" → Web app → copy the config
//    object into config.firebase in src/config.js.
// 4. Firestore → Rules → paste the rules from the README section below → Publish.
//
// COLLECTIONS:
//   orders    — one doc per order (written by this site on completion)
//   products  — one doc per finished video (written later by you / your pipeline)
//
// The site only WRITES orders. It never reads them back (that's for your admin),
// so the security rules allow create-only from the browser.
// ===================================================================

import { config } from './config.js';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, deleteDoc, serverTimestamp, increment } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

let appCheckDone = false;
function activateAppCheck(a) {
  if (appCheckDone) return;
  appCheckDone = true;
  const key = (config.recaptchaSiteKey || '').trim();
  if (!key) return;
  try {
    initializeAppCheck(a, { provider: new ReCaptchaV3Provider(key), isTokenAutoRefreshEnabled: true });
  } catch (e) { console.warn('App Check init failed', e); }
}

let db = null;
let auth = null;

function app() {
  const c = config.firebase;
  if (!c || !c.projectId) return null;
  try { return initializeApp(c); } catch (e) { return initializeApp(c, 'zkm-' + Date.now()); }
}

function ready() {
  if (db) return true;
  const c = config.firebase;
  if (!c || !c.projectId) return false; // not configured → silently skip
  try {
    const a = app();
    activateAppCheck(a);
    db = getFirestore(a);
    auth = getAuth(a);
    return true;
  } catch (e) {
    console.warn('Firebase init failed', e);
    return false;
  }
}

// ---------- admin: upload an image to Cloudinary (unsigned), return its secure URL ----------
export async function uploadToStorage(file, folder) {
  const cloud = (config.cloudinary && config.cloudinary.cloudName || '').trim();
  const preset = (config.cloudinary && config.cloudinary.uploadPreset || '').trim();
  if (!cloud || !preset) throw new Error('Cloudinary not configured');
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', preset);
  if (folder) fd.append('folder', folder);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image/upload`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error('upload failed: ' + res.status);
  const data = await res.json();
  return data.secure_url;
}

// ---------- admin auth + data (used by the admin page only) ----------
export function adminAuth() { ready(); return auth; }

export function adminLogin(email, password) {
  if (!ready()) return Promise.reject(new Error('Firebase not configured'));
  // Session persistence: the admin is signed out when the browser is fully closed.
  return setPersistence(auth, browserSessionPersistence)
    .then(() => signInWithEmailAndPassword(auth, email, password));
}
export function adminLogout() { return auth ? signOut(auth) : Promise.resolve(); }
export function onAdminAuth(cb) { if (!ready()) { cb(null); return () => {}; } return onAuthStateChanged(auth, cb); }

// List recent orders (admin only — requires an authenticated admin per Firestore rules).
export async function listOrders(max = 200) {
  if (!ready()) return [];
  try {
    const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(max)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('listOrders failed', e);
    return [];
  }
}

// List all products (finished videos).
export async function listProducts(max = 500) {
  if (!ready()) return [];
  try {
    const snap = await getDocs(query(collection(db, 'products'), limit(max)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('listProducts failed', e);
    return [];
  }
}

// Attach / update a finished video for an order (writes a product doc keyed by orderId).
export async function saveProduct(order, videoUrl) {
  if (!ready()) throw new Error('Firebase not configured');
  await setDoc(doc(collection(db, 'products'), order.orderId), {
    orderId: order.orderId,
    customerId: order.customerId || '',
    videoUrl: (videoUrl || '').trim(),
    createdAt: serverTimestamp()
  }, { merge: true });
}

// ---------- gallery admin (auth-gated writes) ----------
export async function listGallery() {
  if (!ready()) return [];
  try {
    const snap = await getDocs(query(collection(db, 'gallery'), limit(500)));
    const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    arr.sort((a, b) => {
      const ao = a.order, bo = b.order;
      if (ao != null && bo != null) return ao - bo;
      if (ao != null) return -1;
      if (bo != null) return 1;
      return 0;
    });
    return arr;
  } catch (e) { console.warn('listGallery failed', e); return []; }
}
export async function saveGalleryItem(item) {
  if (!ready()) throw new Error('Firebase not configured');
  const id = item.id || ('g-' + Date.now() + Math.random().toString(36).slice(2, 6));
  const payload = {
    title: item.title || '', video: (item.video || '').trim(), img: (item.img || '').trim(),
    category: (item.category || '').trim(),
    createdAt: serverTimestamp()
  };
  if (item.order != null) payload.order = item.order;
  await setDoc(doc(collection(db, 'gallery'), id), payload, { merge: true });
  return id;
}
// Persist a new order for all gallery items.
export async function reorderGallery(ids) {
  if (!ready()) return;
  try {
    await Promise.all(ids.map((id, i) => setDoc(doc(collection(db, 'gallery'), id), { order: i }, { merge: true })));
  } catch (e) { console.warn('reorderGallery failed', e); }
}
export async function deleteGalleryItem(id) {
  if (!ready()) throw new Error('Firebase not configured');
  await deleteDoc(doc(collection(db, 'gallery'), id));
}

// Read the full settings/site doc (admin editor).
export async function getSettings() {
  if (!ready()) return null;
  try {
    const snap = await getDoc(doc(collection(db, 'settings'), 'site'));
    return snap.exists() ? snap.data() : {};
  } catch (e) { console.warn('getSettings failed', e); return null; }
}

// Save (merge) the settings/site doc (admin only — requires auth per rules).
export async function saveSettings(data) {
  if (!ready()) throw new Error('Firebase not configured');
  await setDoc(doc(collection(db, 'settings'), 'site'), data, { merge: true });
}

// Update an order's status (new | in_progress | done).
export async function setOrderStatus(orderId, status) {
  if (!ready()) throw new Error('Firebase not configured');
  await setDoc(doc(collection(db, 'orders'), orderId), { status }, { merge: true });
}

// Edit an order's contact details (admin fix for customer typos).
export async function updateOrderDetails(orderId, fields) {
  if (!ready()) throw new Error('Firebase not configured');
  await setDoc(doc(collection(db, 'orders'), orderId), fields, { merge: true });
}

// Stable per-browser customer id (so repeat orders from the same device link up).
export function getCustomerId() {
  try {
    let id = localStorage.getItem('zkm_customer_id');
    if (!id) {
      id = 'CU-' + Math.random().toString(36).slice(2, 8).toUpperCase() + Date.now().toString(36).toUpperCase();
      localStorage.setItem('zkm_customer_id', id);
    }
    return id;
  } catch (e) {
    return 'CU-UNKNOWN';
  }
}

// Read gallery videos from the separate `gallery` collection (grows over time).
export async function fetchGallery(max = 200) {
  if (!ready()) return [];
  try {
    const snap = await getDocs(query(collection(db, 'gallery'), limit(max)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('fetchGallery failed', e);
    return [];
  }
}

// Read business settings from settings/site (packages, announcement, promo, examples…).
// Returns the doc data object, or null if not configured / not present.
export async function fetchSettings() {
  if (!ready()) return null;
  try {
    const snap = await getDoc(doc(collection(db, 'settings'), 'site'));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn('fetchSettings failed', e);
    return null;
  }
}

// Find ALL finished videos for the returning customer's stored customerId (same browser).
export async function findProductsByCustomer() {
  if (!ready()) return [];
  try {
    const snap = await getDocs(query(collection(db, 'products'), where('customerId', '==', getCustomerId())));
    return snap.docs.map((d) => d.data()).filter((p) => p.videoUrl);
  } catch (e) {
    console.warn('findProductsByCustomer failed', e);
    return [];
  }
}

// Find finished videos by order number or customerId. Returns an array (may hold
// one item for an order-number match, or several for a customerId match).
export async function findProducts(input) {
  if (!ready()) return [];
  const val = (input || '').trim();
  if (!val) return [];
  try {
    // 1. treat input as the order id (products doc id == orderId)
    const byId = await getDoc(doc(collection(db, 'products'), val));
    if (byId.exists()) return [byId.data()];
    // 2. otherwise query by the orderId field
    const snap = await getDocs(query(collection(db, 'products'), where('orderId', '==', val)));
    if (!snap.empty) return snap.docs.map((d) => d.data());
    // 3. no product yet — check the public order-status mirror ("on the way")
    const st = await getDoc(doc(collection(db, 'orderStatus'), val));
    if (st.exists()) return [{ orderId: val, videoUrl: '' }];
    return [];
  } catch (e) {
    console.warn('findProducts failed', e);
    return [];
  }
}

// Save a custom-offer / price-quote request (people wanting multiple or special videos).
export async function saveQuote(q) {
  if (!ready()) throw new Error('Firebase not configured');
  const id = 'q-' + Date.now() + Math.random().toString(36).slice(2, 6);
  await setDoc(doc(collection(db, 'quotes'), id), {
    name: (q.name || '').slice(0, 80),
    phone: (q.phone || '').slice(0, 40),
    email: (q.email || '').slice(0, 120),
    message: (q.message || '').slice(0, 1000),
    status: 'new',
    createdAt: serverTimestamp()
  });
  return id;
}
// Save a lead the moment the customer submits full contact details (before payment).
// Keyed by orderId so it upgrades to converted:true if they pay.
export async function saveLead(lead) {
  if (!ready()) return;
  try {
    await setDoc(doc(collection(db, 'leads'), lead.orderId || ('l-' + Date.now())), {
      orderId: lead.orderId || '',
      customerId: getCustomerId(),
      name: (lead.name || '').slice(0, 80),
      phone: (lead.phone || '').slice(0, 40),
      email: (lead.email || '').slice(0, 120),
      packageId: lead.packageKey || '',
      price: lead.price ?? null,
      photoCount: lead.photoCount ?? null,
      folder: lead.folder || '',
      mood: lead.mood || '',
      device: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      referrer: (document.referrer || '').slice(0, 300),
      converted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (e) { console.warn('saveLead failed', e); }
}
export async function markLeadConverted(orderId) {
  if (!ready() || !orderId) return;
  try { await setDoc(doc(collection(db, 'leads'), orderId), { converted: true, convertedAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true }); } catch (e) { /* silent */ }
}

export async function listQuotes(max = 500) {
  if (!ready()) return [];
  try {
    const snap = await getDocs(query(collection(db, 'quotes'), orderBy('createdAt', 'desc'), limit(max)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) { console.warn('listQuotes failed', e); return []; }
}
export async function setQuoteSent(id, sent) {
  if (!ready()) throw new Error('Firebase not configured');
  await setDoc(doc(collection(db, 'quotes'), id), { sent: !!sent, status: sent ? 'sent' : 'new' }, { merge: true });
}

// A customer re-uploaded photos for an existing order.
// (Kept for future use — the simple upload page does not write to the DB.)
export async function saveReupload(r) {
  if (!ready() || !r || !r.orderId) return;
  try {
    await setDoc(doc(collection(db, 'orders'), r.orderId), {
      orderId: r.orderId,
      folder: r.folder || '',
      photoCount: r.photoCount ?? null,
      ...(r.mood ? { musicMood: r.mood } : {}),
      ...(r.name ? { name: r.name } : {}),
      ...(r.phone ? { phone: r.phone } : {}),
      reuploaded: true,
      reuploadedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (e) { console.warn('saveReupload failed', e); }
}

// Write one order document. Never throws — a DB hiccup must not break the flow.
export async function saveOrder(order) {
  if (!ready()) return;
  try {
    await setDoc(doc(collection(db, 'orders'), order.orderId), {
      orderId: order.orderId,
      customerId: getCustomerId(),
      name: order.name || '',
      phone: order.phone || '',
      email: order.email || '',
      packageId: order.packageKey || '',
      musicMood: order.mood || '',
      blessing: order.blessing || '',
      folder: order.folder || '',
      price: order.price ?? null,
      photoCount: order.photoCount ?? null,
      status: order.status || 'new',
      updatedAt: serverTimestamp(),
      ...(order.status === 'pending' ? { createdAt: serverTimestamp() } : { paidAt: serverTimestamp() })
    }, { merge: true });
    // public, PII-free status mirror so the lookup can show "on the way" before a video exists
    await setDoc(doc(collection(db, 'orderStatus'), order.orderId), { orderId: order.orderId, ready: false, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) {
    console.warn('saveOrder failed', e);
  }
}

// ---------- analytics / session tracking ----------
// One doc per browser tab-session in `sessions`. Updated in place as the visitor
// moves through the funnel, so the admin can see visits, drop-off, and abandoned
// leads (details filled but no payment). Never throws — analytics must not break UX.
let _sid = null;
let _maxStep = 0;
function sessionId() {
  if (_sid) return _sid;
  try {
    _sid = sessionStorage.getItem('zkm_sid');
    if (!_sid) { _sid = 'S-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); sessionStorage.setItem('zkm_sid', _sid); }
  } catch (e) { _sid = 'S-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  return _sid;
}
function sessionRef() { return doc(collection(db, 'sessions'), sessionId()); }

export async function startSession() {
  if (!ready()) return;
  try {
    let isNew = false;
    try { isNew = !sessionStorage.getItem('zkm_sid_started'); sessionStorage.setItem('zkm_sid_started', '1'); } catch (e) { isNew = true; }
    if (!isNew) return;
    await setDoc(sessionRef(), {
      sessionId: sessionId(),
      customerId: getCustomerId(),
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      maxStep: 0, lastStep: 0,
      referrer: (document.referrer || '').slice(0, 300),
      landingPath: (location.pathname + location.search).slice(0, 200),
      device: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      converted: false, reachedDetails: false
    }, { merge: true });
  } catch (e) { console.warn('startSession failed', e); }
}

export async function trackStep(step) {
  if (!ready()) return;
  try {
    _maxStep = Math.max(_maxStep, step);
    await setDoc(sessionRef(), { lastStep: step, maxStep: _maxStep, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) { /* silent */ }
}

// Called when the visitor fills their contact details (potential lead).
export async function trackLead(info) {
  if (!ready()) return;
  try {
    await setDoc(sessionRef(), {
      reachedDetails: true,
      name: (info.name || '').slice(0, 80),
      phone: (info.phone || '').slice(0, 40),
      email: (info.email || '').slice(0, 120),
      updatedAt: serverTimestamp()
    }, { merge: true });
    // NOTE: the standalone lead document is written by saveLead(), keyed by orderId.
    // Writing another one here (keyed by sessionId) produced a duplicate row per
    // customer in the admin — one with an order id, one without.
  } catch (e) { /* silent */ }
}

export async function markConverted(orderId) {
  if (!ready()) return;
  try {
    await setDoc(sessionRef(), { converted: true, orderId: orderId || '', convertedAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) { /* silent */ }
}

// Mark that a customer opened/downloaded their finished video (shown in admin Orders).
export async function markVideoOpened(orderId) {
  if (!ready() || !orderId) return;
  try { await setDoc(doc(collection(db, 'orders'), orderId), { videoOpened: true, videoOpenedAt: serverTimestamp() }, { merge: true }); } catch (e) { /* silent */ }
}

// Mark that this session viewed the gallery.
export async function markGalleryView() {
  if (!ready()) return;
  try { await setDoc(sessionRef(), { viewedGallery: true, updatedAt: serverTimestamp() }, { merge: true }); } catch (e) { /* silent */ }
}

// Heartbeat: record last-active time so we can measure time on site.
export async function trackHeartbeat() {
  if (!ready()) return;
  try { await setDoc(sessionRef(), { endedAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true }); } catch (e) { /* silent */ }
}

// Record the max scroll depth (0–100%) reached on the landing.
let _maxScroll = 0;
export async function trackScroll(pct) {
  if (!ready()) return;
  const v = Math.max(0, Math.min(100, Math.round(pct)));
  if (v <= _maxScroll) return;
  _maxScroll = v;
  try { await setDoc(sessionRef(), { scrollDepth: v, updatedAt: serverTimestamp() }, { merge: true }); } catch (e) { /* silent */ }
}

// Count on-site clicks. Batched in memory and flushed periodically (and on unload),
// so a burst of clicks costs one write instead of two writes per click.
let _clickBuf = {};
let _clickTotal = 0;
let _clickFlushing = false;
export function trackClick(name) {
  const key = (name || '').replace(/[.$\[\]/~*#\s]+/g, '_').slice(0, 40);
  if (!key) return; // only count named (meaningful) clicks
  const label = (name === '×' || name === 'x' || name === 'X' || name === 'סגירה') ? 'סגירה' : key;
  _clickBuf[label] = (_clickBuf[label] || 0) + 1;
  _clickTotal += 1;
}
export async function flushClicks() {
  if (!ready() || _clickTotal === 0 || _clickFlushing) return;
  _clickFlushing = true;
  const buf = _clickBuf; const total = _clickTotal;
  _clickBuf = {}; _clickTotal = 0;
  try {
    const bd = {};
    Object.keys(buf).forEach((k) => { bd[k] = increment(buf[k]); });
    await setDoc(sessionRef(), { clicks: increment(total), clickBreakdown: bd, endedAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) { /* silent */ } finally { _clickFlushing = false; }
}

// Admin: list recent sessions for the monitoring page.
export async function listSessions(max = 500) {
  if (!ready()) return [];
  try {
    const snap = await getDocs(query(collection(db, 'sessions'), orderBy('startedAt', 'desc'), limit(max)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) { console.warn('listSessions failed', e); return []; }
}

// Admin: standalone leads (preserved beyond session pruning).
export async function listLeads(max = 1000) {
  if (!ready()) return [];
  try {
    const snap = await getDocs(query(collection(db, 'leads'), orderBy('createdAt', 'desc'), limit(max)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) { console.warn('listLeads failed', e); return []; }
}

// Admin: read the daily-aggregate rollup docs (one per date, id = YYYY-MM-DD).
export async function listDailyStats(max = 120) {
  if (!ready()) return [];
  try {
    const snap = await getDocs(query(collection(db, 'dailyStats'), orderBy('date', 'desc'), limit(max)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) { console.warn('listDailyStats failed', e); return []; }
}

// Admin: roll up sessions older than `keepDays` into dailyStats docs, then delete them.
// Runs on admin load; safe to call repeatedly. Returns number of sessions pruned.
export async function rollupOldSessions(keepDays = 7) {
  if (!ready()) return 0;
  const cutoff = Date.now() - keepDays * 86400000;
  const toMs = (t) => (t && t.seconds ? t.seconds * 1000 : (t && t.toMillis ? t.toMillis() : 0));
  const dayKey = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  try {
    const snap = await getDocs(query(collection(db, 'sessions'), orderBy('startedAt', 'asc'), limit(500)));
    const old = snap.docs.filter((d) => { const t = toMs(d.data().startedAt); return t && t < cutoff; });
    if (!old.length) return 0;
    // group by date
    const byDate = {};
    old.forEach((docSnap) => {
      const s = docSnap.data(); const t = toMs(s.startedAt); const k = dayKey(t);
      if (!byDate[k]) byDate[k] = { date: k, visits: 0, started: 0, converted: 0, reachedDetails: 0, galleryViews: 0, totalClicks: 0, mobile: 0, desktop: 0, byHour: Array(24).fill(0), byDow: Array(7).fill(0), sources: {}, clickBreakdown: {}, stepReached: [0, 0, 0, 0, 0], onSiteMs: 0, onSiteCount: 0 };
      const a = byDate[k]; const d = new Date(t);
      a.visits++;
      if ((s.maxStep || 0) >= 1) a.started++;
      if (s.converted) a.converted++;
      if (s.reachedDetails) a.reachedDetails++;
      if (s.viewedGallery) a.galleryViews++;
      a.totalClicks += (s.clicks || 0);
      if (s.device === 'mobile') a.mobile++; else a.desktop++;
      a.byHour[d.getHours()]++; a.byDow[d.getDay()]++;
      for (let n = 0; n <= (s.converted ? 4 : (s.maxStep || 0)); n++) a.stepReached[n]++;
      const src = (() => { const r = s.referrer; if (!r) return 'ישיר'; try { const h = new URL(r).hostname.replace('www.', ''); if (/instagram/.test(h)) return 'אינסטגרם'; if (/tiktok/.test(h)) return 'טיקטוק'; if (/facebook|fb\./.test(h)) return 'פייסבוק'; if (/youtube|youtu\.be/.test(h)) return 'יוטיוב'; if (/google/.test(h)) return 'גוגל'; if (/animoment/.test(h)) return 'ישיר'; return h; } catch (e) { return 'אחר'; } })();
      a.sources[src] = (a.sources[src] || 0) + 1;
      const cb = s.clickBreakdown || {}; Object.keys(cb).forEach((kk) => { a.clickBreakdown[kk] = (a.clickBreakdown[kk] || 0) + (cb[kk] || 0); });
      const end = toMs(s.endedAt) || toMs(s.updatedAt); if (end && end > t) { a.onSiteMs += (end - t); a.onSiteCount++; }
    });
    // merge each date into its dailyStats doc (read-modify-write)
    for (const k of Object.keys(byDate)) {
      const ref = doc(collection(db, 'dailyStats'), k);
      const cur = (await getDoc(ref)).data() || {};
      const a = byDate[k];
      const addArr = (x = [], y = []) => x.map((v, i) => (v || 0) + (y[i] || 0));
      const addMap = (x = {}, y = {}) => { const o = { ...x }; Object.keys(y).forEach((kk) => { o[kk] = (o[kk] || 0) + y[kk]; }); return o; };
      await setDoc(ref, {
        date: k,
        visits: (cur.visits || 0) + a.visits,
        started: (cur.started || 0) + a.started,
        converted: (cur.converted || 0) + a.converted,
        reachedDetails: (cur.reachedDetails || 0) + a.reachedDetails,
        galleryViews: (cur.galleryViews || 0) + a.galleryViews,
        totalClicks: (cur.totalClicks || 0) + a.totalClicks,
        mobile: (cur.mobile || 0) + a.mobile,
        desktop: (cur.desktop || 0) + a.desktop,
        byHour: addArr(cur.byHour || Array(24).fill(0), a.byHour),
        byDow: addArr(cur.byDow || Array(7).fill(0), a.byDow),
        sources: addMap(cur.sources, a.sources),
        clickBreakdown: addMap(cur.clickBreakdown, a.clickBreakdown),
        stepReached: addArr(cur.stepReached || [0, 0, 0, 0, 0], a.stepReached),
        onSiteMs: (cur.onSiteMs || 0) + a.onSiteMs,
        onSiteCount: (cur.onSiteCount || 0) + a.onSiteCount
      }, { merge: true });
    }
    // delete the rolled-up sessions
    await Promise.all(old.map((d) => deleteDoc(doc(collection(db, 'sessions'), d.id))));
    return old.length;
  } catch (e) { console.warn('rollupOldSessions failed', e); return 0; }
}


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
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) { console.warn('listGallery failed', e); return []; }
}
export async function saveGalleryItem(item) {
  if (!ready()) throw new Error('Firebase not configured');
  const id = item.id || ('g-' + Date.now() + Math.random().toString(36).slice(2, 6));
  await setDoc(doc(collection(db, 'gallery'), id), {
    title: item.title || '', video: (item.video || '').trim(), img: (item.img || '').trim(),
    createdAt: serverTimestamp()
  }, { merge: true });
  return id;
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
    if (byId.exists() && byId.data().videoUrl) return [byId.data()];
    // 2. otherwise query by the orderId field
    const snap = await getDocs(query(collection(db, 'products'), where('orderId', '==', val)));
    if (!snap.empty) return snap.docs.map((d) => d.data()).filter((p) => p.videoUrl);
    return [];
  } catch (e) {
    console.warn('findProducts failed', e);
    return [];
  }
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
      status: 'new',
      createdAt: serverTimestamp()
    });
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
  } catch (e) { /* silent */ }
}

export async function markConverted(orderId) {
  if (!ready()) return;
  try {
    await setDoc(sessionRef(), { converted: true, orderId: orderId || '', convertedAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) { /* silent */ }
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

// Count an on-site click. Increments a total and (optionally) a per-name counter,
// and bumps endedAt so time-on-site reflects the last real interaction.
export async function trackClick(name) {
  if (!ready()) return;
  const key = (name || '').replace(/[.$\[\]/~*#\s]+/g, '_').slice(0, 40);
  if (!key) return; // only count named (meaningful) clicks
  // group all close buttons (×, x, aria "סגירה") under one label
  const label = (name === '×' || name === 'x' || name === 'X' || name === 'סגירה') ? 'סגירה' : key;
  try {
    await setDoc(sessionRef(), { clicks: increment(1), endedAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
    await setDoc(sessionRef(), { clickBreakdown: { [label]: increment(1) } }, { merge: true });
  } catch (e) { /* silent */ }
}

// Admin: list recent sessions for the monitoring page.
export async function listSessions(max = 500) {
  if (!ready()) return [];
  try {
    const snap = await getDocs(query(collection(db, 'sessions'), orderBy('startedAt', 'desc'), limit(max)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) { console.warn('listSessions failed', e); return []; }
}

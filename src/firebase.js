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
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

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
  return signInWithEmailAndPassword(auth, email, password);
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

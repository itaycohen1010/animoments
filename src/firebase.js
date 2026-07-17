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
import { getFirestore, collection, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

let db = null;

function ready() {
  if (db) return true;
  const c = config.firebase;
  if (!c || !c.projectId) return false; // not configured → silently skip
  try {
    db = getFirestore(initializeApp(c));
    return true;
  } catch (e) {
    console.warn('Firebase init failed', e);
    return false;
  }
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

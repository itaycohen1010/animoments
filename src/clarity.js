// Microsoft Clarity — free session recordings, heatmaps & user-path tracking.
// Runs ALONGSIDE the Firestore tracking, never replaces it. If no id is set
// (config.clarity.id empty) every function is a silent no-op.

import { config } from './config.js';

const CFG = config.clarity || {};
const ID = (CFG.id || '').trim();

let _ready = false;

export function initClarity() {
  if (_ready || !ID || typeof window === 'undefined') return;
  // Official Clarity loader snippet.
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', ID);
  _ready = true;
}

// Tag the current session/page with a custom label (e.g. funnel step). Safe no-op.
export function clarityTag(key, value) {
  try { if (_ready && window.clarity) window.clarity('set', key, String(value)); } catch (e) { /* silent */ }
}

// Fire a named custom event (e.g. 'purchase'). Safe no-op.
export function clarityEvent(name) {
  try { if (_ready && window.clarity) window.clarity('event', name); } catch (e) { /* silent */ }
}

// PostHog analytics — runs ALONGSIDE the Firestore tracking, never replaces it.
// Loads the official snippet lazily and exposes tiny safe wrappers. If no key is
// configured (config.posthog.key empty) every function is a silent no-op, so the
// site works identically with or without PostHog enabled.

import { config } from './config.js';

const CFG = config.posthog || {};
const KEY = (CFG.key || '').trim();
const UI_HOST = (CFG.host || 'https://eu.i.posthog.com').trim(); // real PostHog host (for dashboard links)
// First-party reverse proxy on our own domain (see vercel.json rewrites). Using a
// same-origin path defeats iOS Safari ITP / mobile content-blockers that silently
// drop requests to eu.i.posthog.com — the #1 reason mobile sessions go uncaptured.
// On localhost there is no proxy, so fall back to the direct host in dev.
const isLocal = typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const HOST = isLocal ? UI_HOST : '/ingest';

let _ready = false;

// opts: { app: 'site'|'admin', sessionRecording?: bool, autocapture?: bool }
export function initPosthog(opts) {
  opts = opts || {};
  if (_ready || !KEY || typeof window === 'undefined') return;
  const recording = opts.sessionRecording != null ? opts.sessionRecording : (CFG.sessionRecording !== false);
  const autocap = opts.autocapture != null ? opts.autocapture : (CFG.autocapture !== false);
  // Official PostHog loader snippet (array stub → async script).
  !(function (t, e) {
    var o, n, p, r;
    e.__SV || ((window.posthog = e), (e._i = []), (e.init = function (i, s, a) {
      function g(t, e) { var o = e.split('.'); 2 == o.length && ((t = t[o[0]]), (e = o[1])); t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; }
      ((p = t.createElement('script')).type = 'text/javascript'), (p.async = !0), (p.src = s.api_host + '/static/array.js'), (r = t.getElementsByTagName('script')[0]).parentNode.insertBefore(p, r);
      var u = e; for (void 0 !== a ? (u = e[a] = []) : (a = 'posthog'), u.people = u.people || [], u.toString = function (t) { var e = 'posthog'; return 'posthog' !== a && (e += '.' + a), t || (e += ' (stub)'), e; }, u.people.toString = function () { return u.toString(1) + '.people (stub)'; }, o = 'init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug'.split(' '), n = 0; n < o.length; n++) g(u, o[n]); e._i.push([i, s, a]); }), (e.__SV = 1));
  })(document, window.posthog || []);
  window.posthog.init(KEY, {
    api_host: HOST,
    ui_host: UI_HOST,
    person_profiles: 'identified_only',
    capture_pageview: false, // SPA: pageviews fired manually per step (see phPageview)
    capture_pageleave: autocap, // accurate time-on-page / bounce
    autocapture: autocap, // auto-capture clicks/inputs (off for admin)
    session_recording: recording ? {
      maskAllInputs: true,                 // never record any typed input values
      maskTextSelector: '.ph-no-capture',  // also mask text of PII-tagged elements
    } : undefined,
    disable_session_recording: !recording,
  });
  // tag every event from this bundle so site vs admin traffic stays separable
  try { window.posthog.register({ app: opts.app || 'site' }); } catch (e) { /* silent */ }
  _ready = true;
}

// Mirror a named event into PostHog. Never throws.
export function phCapture(name, props) {
  try { if (_ready && window.posthog) window.posthog.capture(name, props || {}); } catch (e) { /* silent */ }
}

export function phIdentify(id, props) {
  try { if (_ready && window.posthog && id) window.posthog.identify(String(id), props || {}); } catch (e) { /* silent */ }
}

// Virtual pageview for the SPA's step navigation (no real URL change), so PostHog
// Web Analytics and pageview funnels see each funnel step as its own "page".
export function phPageview(name) {
  try {
    if (_ready && window.posthog) {
      window.posthog.capture('$pageview', { $current_url: location.origin + '/' + (name || '') });
    }
  } catch (e) { /* silent */ }
}

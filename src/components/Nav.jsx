import React from 'react';
import { config, colors as C } from '../config.js';

// Sticky top nav: brand, anchor links (landing only), journey progress bar (steps 1-4).
export default function Nav({ step, journeyPct, journeyLabel, onHome, onStart, onLookup, lookup, onGallery, gallery, onSection }) {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(250,240,230,.88)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(196,80,46,.12)' }}>
      <div className="nav-row" style={{ maxWidth: 1080, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
        <button onClick={onHome} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: C.ink, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="nav-brand" style={{ fontWeight: 900, fontSize: 26, letterSpacing: '-0.01em' }}>{config.brandName}</span>
        </button>
        <div style={{ flex: 1 }} />
        {(step === 0 || lookup || gallery) && (
          <button className="nav-pill" onClick={onLookup} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 15, color: lookup ? C.accent : C.body, padding: '8px 14px', borderRadius: 999 }}>הסרטון שלי</button>
        )}
        {(step === 0 || lookup || gallery) && (
          <button className="nav-pill" onClick={onGallery} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 15, color: gallery ? C.accent : C.body, padding: '8px 14px', borderRadius: 999 }}>גלריה</button>
        )}
        {step === 0 && (
          <>
            <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: 15 }}>
              <a href="#how" onClick={(e) => onSection(e, 'how')} style={{ color: C.body, padding: '8px 14px', borderRadius: 999 }}>איך זה עובד</a>
              <a href="#pricing" onClick={(e) => onSection(e, 'pricing')} style={{ color: C.body, padding: '8px 14px', borderRadius: 999 }}>מחירים</a>
              <a href="#faq" onClick={(e) => onSection(e, 'faq')} style={{ color: C.body, padding: '8px 14px', borderRadius: 999 }}>שאלות ותשובות</a>
            </div>
            <button className="nav-cta" onClick={onStart} style={{ border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 15, color: '#fff', background: C.accent, padding: '10px 22px', borderRadius: 999, boxShadow: '0 6px 16px rgba(196,80,46,.28)', whiteSpace: 'nowrap' }}>מתחילים</button>
          </>
        )}
      </div>
      {step > 0 && (
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.muted, whiteSpace: 'nowrap' }}>{journeyLabel}</span>
          <div style={{ flex: 1, height: 8, background: '#F5DFCC', borderRadius: 999, position: 'relative' }}>
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${journeyPct}%`, borderRadius: 999, background: `linear-gradient(to left, ${C.accent}, ${C.gold})`, transition: 'width .5s ease' }} />
            <div style={{ position: 'absolute', right: `calc(${journeyPct}% - 9px)`, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, borderRadius: '50%', background: '#fff', border: `3px solid ${C.accent}`, boxShadow: '0 2px 6px rgba(59,42,32,.2)', transition: 'right .5s ease' }} />
          </div>
        </div>
      )}
    </div>
  );
}

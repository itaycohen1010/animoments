import React from 'react';
import { colors as C } from '../config.js';
import { pillBtn } from '../styles.js';

// Screen 4 — result: processing spinner with live counter / failure + retry / success.
export default function ResultScreen({ result, uploadedCount, photos, cloudinaryConfigured, onRetry, onReset }) {
  return (
    <div data-screen-label="Result" style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px 60px', animation: 'rise-in .5s ease both', width: '100%', boxSizing: 'border-box' }}>
      <div className="card-pad" style={{ background: '#fff', borderRadius: 24, padding: '40px 30px', boxShadow: '0 14px 40px rgba(180,100,70,.16)', textAlign: 'center' }}>
        {result === 'processing' && (
          <>
            <div style={{ width: 54, height: 54, border: '5px solid #F5DFCC', borderTopColor: C.accent, borderRadius: '50%', margin: '0 auto 22px', animation: 'spin .9s linear infinite' }} />
            <div style={{ fontWeight: 800, fontSize: '1.3rem', marginBottom: 8 }}>
              {uploadedCount === 0 ? 'שולחים את התמונות…' : `מעלים את התמונות… (${uploadedCount}/${photos.length})`}
            </div>
            <div style={{ color: C.body, fontSize: '.98rem' }}>זה לוקח כמה שניות — אל תסגרו את הדף</div>
          </>
        )}
        {result === 'failed' && (
          <>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🌧️</div>
            <div style={{ fontWeight: 800, fontSize: '1.3rem', marginBottom: 8 }}>משהו השתבש בשליחה</div>
            <div style={{ color: C.body, fontSize: '.98rem', lineHeight: 1.7, marginBottom: 24 }}>בדקו את חיבור האינטרנט ונסו שוב — התמונות והפרטים נשמרו.</div>
            <button onClick={onRetry} style={{ ...pillBtn, padding: '14px 34px' }}>נסו שוב</button>
          </>
        )}
        {result === 'done' && (
          <>
            <div style={{ fontSize: 52, marginBottom: 10 }}>🎉</div>
            <h1 style={{ fontWeight: 900, fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', margin: '0 0 10px' }}>התמונות התקבלו ✓</h1>
            <p style={{ color: C.body, fontSize: '1rem', lineHeight: 1.7, margin: '0 0 26px' }}>
              {cloudinaryConfigured
                ? 'קיבלנו את התמונות שלכם. ניצור איתכם קשר בטלפון שמסרתם תוך 48 שעות.'
                : 'אלו התמונות שבחרתם, לפי הסדר שקבעתם.'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 26 }}>
              {photos.map((p, i) => (
                <div key={p.id} style={{ position: 'relative', width: 86, height: 86, borderRadius: 14, overflow: 'hidden', boxShadow: '0 6px 16px rgba(59,42,32,.15)' }}>
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("${p.url}")`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  <span style={{ position: 'absolute', top: 4, right: 4, minWidth: 22, height: 22, borderRadius: 999, background: C.accent, color: '#fff', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{i + 1}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'inline-block', background: C.badgeBg, border: `1px solid ${C.badgeBorder}`, color: C.badgeText, fontWeight: 700, fontSize: 13.5, padding: '7px 16px', borderRadius: 999, marginBottom: 28 }}>הסרטון ישלח לכתובת המייל שהזנתם</div>
            <div><button onClick={onReset} style={{ ...pillBtn, padding: '14px 34px' }}>הזמנה חדשה</button></div>
          </>
        )}
      </div>
    </div>
  );
}

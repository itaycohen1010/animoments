import React, { useState, useEffect } from 'react';
import { colors as C } from '../config.js';
import { pillBtn, ghostBtn } from '../styles.js';
import { findProducts, findProductsByCustomer } from '../firebase.js';

// Force a video URL to download rather than preview. For Cloudinary, insert fl_attachment.
function downloadUrl(url) {
  if (!url) return url;
  if (url.includes('res.cloudinary.com') && url.includes('/upload/') && !url.includes('fl_attachment')) {
    return url.replace('/upload/', '/upload/fl_attachment/');
  }
  return url;
}

// "הסרטון שלי" — retrieve finished video(s). Auto-matches the returning customer by
// their stored customerId (same browser); otherwise they type their order number.
export default function LookupScreen({ onHome }) {
  const [value, setValue] = useState('');
  const [state, setState] = useState('idle'); // idle | searching | found | notfound
  const [products, setProducts] = useState([]);

  // On open, try to auto-find this browser's customer video(s) (no typing needed).
  useEffect(() => {
    let cancelled = false;
    setState('searching');
    findProductsByCustomer().then((list) => {
      if (cancelled) return;
      if (list.length) { setProducts(list); setState('found'); }
      else setState('idle');
    });
    return () => { cancelled = true; };
  }, []);

  const search = async () => {
    if (!value.trim()) return;
    setState('searching');
    const list = await findProducts(value);
    if (list.length) { setProducts(list); setState('found'); }
    else { setProducts([]); setState('notfound'); }
  };

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '48px 20px 70px', animation: 'rise-in .5s ease both', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '36px 30px', boxShadow: '0 14px 40px rgba(180,100,70,.16)', textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>🎬</div>
        <h2 style={{ fontWeight: 800, fontSize: '1.6rem', margin: '0 0 8px' }}>הסרטון שלי</h2>
        <p style={{ color: C.body, fontSize: '.98rem', lineHeight: 1.7, margin: '0 0 22px' }}>
          אם הזמנתם מהמכשיר הזה — הסרטון שלכם יופיע כאן אוטומטית. אחרת, הזינו את מספר ההזמנה שקיבלתם במייל.
        </p>

        <input
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); if (state !== 'idle') setState('idle'); }}
          onKeyDown={(e) => { if (e.key === 'Enter') search(); }}
          placeholder="מספר הזמנה"
          style={{ width: '100%', boxSizing: 'border-box', direction: 'rtl', textAlign: 'center', fontFamily: "'Heebo', sans-serif", fontSize: 16, padding: '13px 16px', border: `1.5px solid ${C.borderStrong}`, borderRadius: 14, background: '#FFFDFA', color: C.ink, outline: 'none', marginBottom: 14 }}
        />

        <button onClick={search} disabled={!value.trim() || state === 'searching'}
          style={{ ...pillBtn, width: '100%', padding: '14px 20px', opacity: (!value.trim() || state === 'searching') ? .6 : 1, cursor: (!value.trim() || state === 'searching') ? 'not-allowed' : 'pointer' }}>
          {state === 'searching' ? 'מחפשים…' : 'איתור הסרטון'}
        </button>

        {state === 'found' && products.length > 0 && (
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {products.length > 1 && <div style={{ fontWeight: 700, color: C.body, fontSize: '.9rem' }}>נמצאו {products.length} סרטונים:</div>}
            {products.map((p, i) => (
              <div key={i} style={{ background: '#EDF5EA', border: '1px solid #BFDCB4', borderRadius: 16, padding: '20px' }}>
                <div style={{ fontWeight: 800, color: '#3E6B33', fontSize: '1.05rem', marginBottom: 4 }}>הסרטון שלכם מוכן ✓</div>
                {p.orderId && <div style={{ color: C.muted, fontSize: '.85rem', marginBottom: 14 }}>מספר הזמנה: {p.orderId}</div>}
                <a href={downloadUrl(p.videoUrl)} download
                  style={{ display: 'inline-block', textDecoration: 'none', border: 'none', fontFamily: "'Heebo', sans-serif", fontWeight: 800, fontSize: 16, color: '#fff', background: `linear-gradient(135deg, ${C.accent}, ${C.accentSoft})`, padding: '13px 30px', borderRadius: 999, boxShadow: '0 8px 20px rgba(196,80,46,.3)' }}>
                  הורדת הסרטון ↓
                </a>
              </div>
            ))}
          </div>
        )}

        {state === 'notfound' && (
          <div style={{ marginTop: 20, color: C.accentDark, fontWeight: 700, fontSize: '.95rem', lineHeight: 1.7 }}>
            לא מצאנו סרטון מוכן עבור הפרטים שהזנתם.<br />
            <span style={{ color: C.body, fontWeight: 400, fontSize: '.9rem' }}>אם ההזמנה בוצעה לאחרונה, ייתכן שהסרטון עדיין בהכנה (עד 48 שעות). בדקו את הפרטים ונסו שוב, או פנו אלינו.</span>
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <button onClick={onHome} style={{ ...ghostBtn }}>חזרה לדף הבית</button>
        </div>
      </div>
    </div>
  );
}

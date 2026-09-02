import React, { useState } from 'react';
import { colors as C } from '../config.js';
import { pillBtn, ghostBtn, inputStyle } from '../styles.js';

const TO_MAX = 40, FROM_MAX = 40;

// Gift-card modal — opened from the details screen. Collects who the video is
// for and who it is from, so the order can be presented as a gift.
export default function GiftCardModal({ initial, onClose, onSave, onRemove }) {
  const [to, setTo] = useState(initial?.to || '');
  const [from, setFrom] = useState(initial?.from || '');
  const [err, setErr] = useState(false);
  const has = !!(initial?.to || initial?.from);

  const save = () => {
    if (!to.trim() || !from.trim()) { setErr(true); return; }
    onSave({ to: to.trim(), from: from.trim() });
    onClose();
  };

  const field = (label, val, setVal, ph, max) => (
    <div>
      <label style={{ display: 'block', fontWeight: 700, fontSize: '.95rem', marginBottom: 6 }}>{label}</label>
      <input value={val} onChange={(e) => { setVal(e.target.value.slice(0, max)); setErr(false); }} placeholder={ph}
        style={inputStyle(err && !val.trim())} />
    </div>
  );

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(59,42,32,.5)', backdropFilter: 'blur(4px)', zIndex: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="כרטיס ברכה"
        style={{ background: '#fff', borderRadius: 28, maxWidth: 440, width: '100%', padding: '30px 28px 26px', position: 'relative', boxShadow: '0 30px 80px rgba(59,42,32,.35)', animation: 'rise-in .35s ease both', direction: 'rtl' }}>
        <button onClick={onClose} aria-label="סגירה" style={{ position: 'absolute', top: 16, left: 16, border: 'none', background: C.footerBg, cursor: 'pointer', width: 34, height: 34, borderRadius: '50%', fontSize: 16, color: C.body }}>×</button>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 6 }}>🎁</div>
          <h3 style={{ fontWeight: 900, fontSize: '1.4rem', margin: '0 0 8px' }}>כרטיס ברכה</h3>
          <p style={{ color: C.body, fontSize: '.95rem', lineHeight: 1.7, margin: 0 }}>
            הסרטון יוצג כמתנה — עם כרטיס ברכה שפותח אותו.
          </p>
        </div>

        {/* live preview of the card */}
        <div style={{ background: C.cream, border: `1.5px dashed ${C.borderStrong}`, borderRadius: 18, padding: '18px 20px', marginBottom: 20, textAlign: 'center' }}>
          <div style={{ color: C.muted, fontSize: '.78rem', fontWeight: 700, letterSpacing: '.5px', marginBottom: 6 }}>תצוגה מקדימה</div>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: C.ink, lineHeight: 1.8 }}>
            אל: {to.trim() || <span style={{ color: C.muted, fontWeight: 400 }}>——</span>}
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: C.ink, lineHeight: 1.8 }}>
            מאת: {from.trim() || <span style={{ color: C.muted, fontWeight: 400 }}>——</span>}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {field('אל (למי המתנה) *', to, setTo, 'לדוגמה: סבתא רחל', TO_MAX)}
          {field('מאת (ממי המתנה) *', from, setFrom, 'לדוגמה: משפחת לוי', FROM_MAX)}
        </div>

        {err && <div style={{ textAlign: 'center', color: C.accentDark, fontWeight: 700, fontSize: '.92rem', marginTop: 14 }}>נא למלא את שני השדות</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 24, flexWrap: 'wrap' }}>
          {has
            ? <button onClick={() => { onRemove(); onClose(); }} style={{ ...ghostBtn, color: C.accentDark }}>הסרת הכרטיס</button>
            : <button onClick={onClose} style={ghostBtn}>ביטול</button>}
          <button onClick={save} style={pillBtn}>שמירה</button>
        </div>
      </div>
    </div>
  );
}

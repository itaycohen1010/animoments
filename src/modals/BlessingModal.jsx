import React from 'react';
import Modal from './Modal.jsx';
import { colors as C } from '../config.js';
import { pillBtn, smallGhostBtn } from '../styles.js';

export const BLESSING_MAX = 1000;

// Optional personal blessing for the video. onContinue / onSkip both advance to payment.
export default function BlessingModal({ blessing, setBlessing, onContinue, onSkip, onClose }) {
  return (
    <Modal onClose={onClose} label="ברכה אישית לסרטון" maxWidth={460}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>💌</div>
      <h3 style={{ fontWeight: 900, fontSize: '1.35rem', margin: '0 0 6px' }}>רוצים להוסיף ברכה אישית?</h3>
      <p style={{ color: C.body, fontSize: '.95rem', lineHeight: 1.8, margin: '0 0 16px' }}>הברכה תופיע בסוף הסרטון- כמה משפטים מהלב</p>
      <textarea value={blessing} onChange={(e) => setBlessing(e.target.value.slice(0, BLESSING_MAX))} rows={4}
        placeholder="לדוגמה: לסבתא רחל היקרה, שמונים שנות אהבה במשפחה אחת. אוהבים תמיד ❤️"
        style={{ width: '100%', boxSizing: 'border-box', direction: 'rtl', resize: 'none', border: `1.5px solid ${C.borderStrong}`, background: '#FFFDFA', borderRadius: 14, padding: '13px 16px', fontSize: 16, color: C.ink, outline: 'none', fontFamily: "'Heebo', sans-serif", lineHeight: 1.7 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '6px 0 18px' }}>
        <span style={{ fontSize: '.82rem', fontWeight: 700, color: blessing.length >= BLESSING_MAX ? C.accentDark : C.muted }}>{blessing.length}/{BLESSING_MAX}</span>
        <span style={{ color: C.muted, fontSize: '.82rem' }}>עד {BLESSING_MAX} תווים</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={onContinue} disabled={!blessing.trim()} style={{ ...pillBtn, width: '100%', cursor: blessing.trim() ? 'pointer' : 'not-allowed', background: blessing.trim() ? pillBtn.background : '#E4C4A8', boxShadow: blessing.trim() ? pillBtn.boxShadow : 'none', opacity: blessing.trim() ? 1 : .7 }}>המשך לתשלום</button>
        <button onClick={onSkip} style={{ ...smallGhostBtn, width: '100%', fontSize: 15, padding: '12px 20px' }}>דילוג — בלי ברכה</button>
      </div>
    </Modal>
  );
}

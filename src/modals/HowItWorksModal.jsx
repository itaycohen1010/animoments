import React, { useState } from 'react';
import Modal from './Modal.jsx';
import { colors as C } from '../config.js';
import { pillBtn } from '../styles.js';

// "How it works" demo modal — three animated steps; opens on the step
// relevant to the current screen via initialStep (1/2/3).
export default function HowItWorksModal({ initialStep = 1, onClose }) {
  const [step, setStep] = useState(initialStep);

  return (
    <Modal onClose={onClose} label="זה פשוט מאוד — שלושה צעדים" center>
      <h3 style={{ fontWeight: 900, fontSize: '1.5rem', margin: '6px 0 6px' }}>זה פשוט מאוד — שלושה צעדים</h3>
      <p style={{ color: C.muted, margin: '0 0 16px', fontSize: '.98rem' }}>ככה זה עובד:</p>
      <div style={{ display: 'inline-block', background: C.accent, color: '#fff', fontWeight: 700, fontSize: 14, padding: '6px 18px', borderRadius: 999, marginBottom: 18 }}>
        {['שלב 1 — בוחרים תמונות', 'שלב 2 — מסדרים לפי הסדר', 'שלב 3 — שולחים'][step - 1]}
      </div>
      <div style={{ background: C.cream, borderRadius: 20, height: 190, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 18, overflow: 'hidden' }}>
        {step === 1 && (
          <>
            <div style={{ width: 110, height: 82, border: `2.5px dashed ${C.accent}`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, background: '#fff', position: 'relative' }}>
              📷<span style={{ position: 'absolute', bottom: -22, fontSize: 30, animation: 'finger-bounce 1.1s ease-in-out infinite' }}>👆</span>
            </div>
            <div style={{ fontWeight: 700, color: C.body, fontSize: '.98rem', marginTop: 12 }}>בוחרים תמונות מהטלפון</div>
          </>
        )}
        {step === 2 && (
          <>
            <div style={{ display: 'flex', gap: 10, direction: 'rtl' }}>
              {[1, 2, 3].map((n) => (
                <div key={n} style={{ width: 62, height: 62, borderRadius: 12, background: `linear-gradient(135deg, #F5C98A, ${C.accentSoft})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18, boxShadow: '0 4px 12px rgba(59,42,32,.15)', animation: n === 2 ? 'photo-nudge 1.4s ease-in-out infinite' : 'none' }}>{n}</div>
              ))}
            </div>
            <div style={{ fontWeight: 700, color: C.body, fontSize: '.98rem' }}>מסדרים לפי הסדר שרוצים</div>
          </>
        )}
        {step === 3 && (
          <>
            <div style={{ fontSize: 52, animation: 'heart-pulse 1.2s ease-in-out infinite' }}>❤️</div>
            <div style={{ fontWeight: 700, color: C.body, fontSize: '.98rem' }}>שולחים — וזהו!</div>
          </>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
        {[[1, '📷', 'שלב 1 — בוחרים תמונות'], [2, '↔️', 'שלב 2 — מסדרים לפי הסדר'], [3, '✅', 'שלב 3 — שולחים']].map(([n, icon, label]) => (
          <button key={n} onClick={() => setStep(n)} aria-label={label}
            style={{ border: step === n ? `2px solid ${C.accent}` : `2px solid ${C.border}`, background: step === n ? C.soft : '#fff', cursor: 'pointer', width: 52, height: 52, borderRadius: 16, fontSize: 22 }}>{icon}</button>
        ))}
      </div>
      <button onClick={() => (step < 3 ? setStep(step + 1) : onClose())} style={{ ...pillBtn, width: '100%' }}>{step < 3 ? 'לשלב הבא' : 'הבנתי, בואו נתחיל'}</button>
      {step === 3 && (
        <button onClick={() => setStep(1)} style={{ border: `1.5px solid ${C.borderStrong}`, background: '#fff', cursor: 'pointer', width: '100%', marginTop: 10, fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 15, color: C.body, padding: '12px 20px', borderRadius: 999 }}>חזרה לשלב 1</button>
      )}
    </Modal>
  );
}

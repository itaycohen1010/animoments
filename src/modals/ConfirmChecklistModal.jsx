import React from 'react';
import Modal from './Modal.jsx';
import { colors as C } from '../config.js';
import { pillBtn, smallGhostBtn } from '../styles.js';

// Pre-payment checklist: makes the customer confirm they followed the tips.
// onConfirm advances the flow (to the blessing window).
export default function ConfirmChecklistModal({ onConfirm, onClose }) {
  return (
    <Modal onClose={onClose} label="בדיקה אחרונה לפני שממשיכים" maxWidth={460}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>🔎</div>
      <h3 style={{ fontWeight: 900, fontSize: '1.35rem', margin: '0 0 6px' }}>רגע — בדקתם הכול?</h3>
      <p style={{ color: C.body, fontSize: '.95rem', lineHeight: 1.8, margin: '0 0 16px' }}>לפני שממשיכים, ודאו שעברתם על "דברים שחשוב לדעת":</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
        {[
          ['📶', 'התמונות חדות, מוארות ובאיכות גבוהה'],
          ['↔️', 'הסדר שקבעתם הוא הסדר הסופי בסרטון'],
          ['🚫', 'אין תמונות פוגעניות או לא הולמות']
        ].map(([icon, text]) => (
          <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: C.cream, borderRadius: 14, padding: '10px 14px' }}>
            <span>{icon}</span><span style={{ color: C.body, fontSize: '.92rem' }}>{text}</span>
          </div>
        ))}
      </div>
      <div style={{ background: C.errorBg, border: `1.5px solid ${C.accent}`, borderRadius: 14, padding: '12px 16px', marginBottom: 20 }}>
        <span style={{ color: C.accentDark, fontWeight: 700, fontSize: '.92rem', lineHeight: 1.7 }}>שימו לב: לא נוכל לתקן או לבטל הזמנה על טעויות מסוג זה לאחר שליחת ההזמנה.</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={onConfirm} style={{ ...pillBtn, width: '100%' }}>בדקתי הכול — אפשר להמשיך</button>
        <button onClick={onClose} style={{ ...smallGhostBtn, width: '100%', fontSize: 15, padding: '12px 20px' }}>רגע, אני רוצה לבדוק שוב</button>
      </div>
    </Modal>
  );
}

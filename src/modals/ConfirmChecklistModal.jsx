import React from 'react';
import Modal from './Modal.jsx';
import { colors as C } from '../config.js';
import { pillBtn, smallGhostBtn } from '../styles.js';

// Optional info checklist, opened from a button on the upload screen. onConfirm just closes.
export default function ConfirmChecklistModal({ onConfirm, onClose }) {
  return (
    <Modal onClose={onClose} label="כמה דברים לבדוק" maxWidth={460}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
      <h3 style={{ fontWeight: 900, fontSize: '1.35rem', margin: '0 0 6px' }}>כמה דברים קטנים לבדוק 💛</h3>
      <p style={{ color: C.body, fontSize: '.95rem', lineHeight: 1.8, margin: '0 0 16px' }}>הסרטון מופק לפי מה שנשלח, אז כדאי לוודא שהכול מוכן:</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {[
          ['📶', 'התמונות חדות ובאיכות טובה'],
          ['↔️', 'הסדר שקבעתם הוא הסדר שיופיע בסרטון'],
          ['💛', 'התמונות מתאימות לשיתוף']
        ].map(([icon, text]) => (
          <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: C.cream, borderRadius: 14, padding: '10px 14px' }}>
            <span>{icon}</span><span style={{ color: C.body, fontSize: '.92rem' }}>{text}</span>
          </div>
        ))}
      </div>
      <button onClick={onConfirm} style={{ ...pillBtn, width: '100%' }}>הבנתי, תודה</button>
    </Modal>
  );
}

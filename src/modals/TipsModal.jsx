import React from 'react';
import Modal from './Modal.jsx';
import { colors as C } from '../config.js';
import { pillBtn } from '../styles.js';

const TIPS = [
  ['📶', 'תמונות באיכות גבוהה', 'עדיף תמונות מקוריות מהטלפון ולא צילומי מסך — כך התוצאה תהיה חדה וברורה.'],
  ['↔️', 'הסדר קובע את הסיפור', 'סדרו את התמונות לפי ציר זמן או לפי הרגש שרוצים להעביר — זה הסדר שיופיע בסרטון.'],
  ['🖼️', 'גיוון בתמונות', 'שילוב של תמונות קרובות ורחוקות, לבד ובקבוצה, יוצר סרטון מגוון ומעניין יותר.'],
  ['🔍', 'בדקו טשטוש ותאורה', 'תמונות מטושטשות או חשוכות מדי קשה לשפר — עדיף לבחור תמונות ברורות ומוארות היטב.'],
  ['🚫', 'תמונות מתאימות בלבד', 'נא לא להעלות תמונות פוגעניות, אלימות או לא הולמות — התמונות לא יוכלו להיכנס לסרטון.']
];

// "דברים שחשוב לדעת" — upload tips; auto-opens on first visit to the upload screen.
export default function TipsModal({ onClose }) {
  return (
    <Modal onClose={onClose} label="דברים שחשוב לדעת" maxWidth={420}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>💡</div>
      <h3 style={{ fontWeight: 900, fontSize: '1.25rem', margin: '0 0 4px' }}>דברים שחשוב לדעת</h3>
      <p style={{ color: C.muted, margin: '0 0 16px', fontSize: '.9rem' }}>כמה טיפים שיעזרו לסרטון לצאת הכי טוב שאפשר:</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {TIPS.map(([icon, title, text]) => (
          <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 19 }}>{icon}</span>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 2, fontSize: '.95rem' }}>{title}</div>
              <div style={{ color: C.body, fontSize: '.86rem', lineHeight: 1.55 }}>{text}</div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onClose} style={{ ...pillBtn, width: '100%', marginTop: 18, fontSize: 15, padding: '12px 20px' }}>הבנתי, תודה</button>
    </Modal>
  );
}

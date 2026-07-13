import React from 'react';
import Modal from './Modal.jsx';
import { colors as C } from '../config.js';
import { pillBtn } from '../styles.js';

// Renders one legal document (privacy / accessibility / terms) from legal.js.
export default function LegalModal({ doc, onClose }) {
  return (
    <Modal onClose={onClose} label={doc.title} maxWidth={620} scroll>
      <h3 style={{ fontWeight: 900, fontSize: '1.4rem', margin: '0 0 4px' }}>{doc.title}</h3>
      <p style={{ color: C.body, fontSize: '.95rem', lineHeight: 1.8, margin: '0 0 20px', whiteSpace: 'pre-line' }}>{doc.intro}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {doc.sections.map((s) => (
          <div key={s.title}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: C.accent, marginBottom: 6 }}>{s.title}</div>
            <p style={{ color: C.body, fontSize: '.93rem', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>{s.body}</p>
          </div>
        ))}
      </div>
      <div style={{ height: 1, background: C.border, margin: '22px 0 14px' }} />
      <p style={{ color: C.muted, fontSize: '.85rem', margin: 0 }}>{doc.updated}</p>
      <button onClick={onClose} style={{ ...pillBtn, width: '100%', marginTop: 22 }}>סגירה</button>
    </Modal>
  );
}

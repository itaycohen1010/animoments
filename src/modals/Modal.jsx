import React, { useEffect } from 'react';
import { colors as C } from '../config.js';

// Base modal shell: backdrop, dialog card, close (×) button, Esc-to-close.
export default function Modal({ onClose, label, children, maxWidth = 460, scroll = false, center = false }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(59,42,32,.5)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={label}
        style={{ background: '#fff', borderRadius: 28, maxWidth, width: '100%', padding: '30px 28px 26px', position: 'relative', boxShadow: '0 30px 80px rgba(59,42,32,.35)', animation: 'rise-in .35s ease both', textAlign: center ? 'center' : 'right', direction: 'rtl', ...(scroll ? { maxHeight: '82vh', overflowY: 'auto' } : {}) }}>
        <button onClick={onClose} aria-label="סגירה" style={{ position: 'absolute', top: 16, left: 16, border: 'none', background: C.footerBg, cursor: 'pointer', width: 34, height: 34, borderRadius: '50%', fontSize: 16, color: C.body }}>×</button>
        {children}
      </div>
    </div>
  );
}

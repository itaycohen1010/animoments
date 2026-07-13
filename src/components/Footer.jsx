import React from 'react';
import { colors as C } from '../config.js';

// Bottom footer with the three legal links. onOpenLegal('privacy'|'accessibility'|'terms').
export default function Footer({ onOpenLegal }) {
  return (
    <div className="app-footer" style={{ textAlign: 'center', padding: '26px 24px', color: C.muted, fontSize: 13, background: C.footerBg, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[['privacy', 'מדיניות פרטיות'], ['accessibility', 'הצהרת נגישות'], ['terms', 'תנאי שימוש']].map(([key, label], i) => (
          <React.Fragment key={key}>
            {i > 0 && <span>·</span>}
            <button onClick={() => onOpenLegal(key)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: C.muted, textDecoration: 'underline', textUnderlineOffset: 3, padding: 0 }}>{label}</button>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

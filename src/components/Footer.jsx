import React from 'react';
import { colors as C } from '../config.js';

// Bottom footer with the three legal links. onOpenLegal('privacy'|'accessibility'|'terms').
export default function Footer({ onOpenLegal }) {
  return (
    <div className="app-footer" style={{ textAlign: 'center', padding: '26px 24px', color: C.muted, fontSize: 13, background: C.footerBg, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center' }}>
        <a href="https://www.facebook.com/share/1EnD91arte/?mibextid=wwXIfr" target="_blank" rel="noopener" aria-label="פייסבוק" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: '#1877F2', boxShadow: '0 3px 10px rgba(180,100,70,.18)', color: '#fff' }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H17V3.6c-.3-.04-1.3-.13-2.5-.13-2.47 0-4.16 1.5-4.16 4.27v2.16H7.6V13h2.74v8h3.16z"/></svg>
        </a>
        <a href="https://www.instagram.com/animoment.il?igsh=MW03OGFzZWZ3b3pmZQ==" target="_blank" rel="noopener" aria-label="אינסטגרם" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(45deg,#F58529,#DD2A7B,#8134AF,#515BD4)', boxShadow: '0 3px 10px rgba(180,100,70,.18)', color: '#fff' }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg>
        </a>
        <a href="https://wa.me/message/TB5H2KEWN6N4E1" target="_blank" rel="noopener" aria-label="וואטסאפ" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: '#25D366', boxShadow: '0 3px 10px rgba(180,100,70,.18)', color: '#fff' }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.9c0 1.76.46 3.45 1.34 4.95L2 22l5.3-1.38a9.9 9.9 0 0 0 4.74 1.2h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.13-2.9-7A9.82 9.82 0 0 0 12.04 2zm0 1.8c2.16 0 4.2.84 5.72 2.37a8.05 8.05 0 0 1 2.37 5.73c0 4.47-3.63 8.1-8.1 8.1a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.06.8.82-2.99-.2-.31a8.05 8.05 0 0 1-1.24-4.29c0-4.47 3.64-8.1 8.12-8.1zm4.65 10.22c-.25-.13-1.48-.73-1.71-.81-.23-.09-.4-.13-.56.12-.17.25-.65.81-.79.98-.15.16-.29.18-.54.06-.25-.13-1.06-.39-2.01-1.24-.74-.66-1.24-1.48-1.39-1.73-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.42-.14-.01-.31-.01-.48-.01-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.43 1.03 2.6c.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.48-.6 1.69-1.19.21-.58.21-1.08.14-1.19-.06-.11-.23-.17-.48-.29z"/></svg>
        </a>
        <a href="https://youtube.com/channel/UCbTyD-2MgAvDgryDYWryE3A?si=px3Jg4At-NTm5wwY" target="_blank" rel="noopener" aria-label="יוטיוב" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: '#FF0000', boxShadow: '0 3px 10px rgba(180,100,70,.18)', color: '#fff' }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.5a3 3 0 0 0-2.1-2.1C19.5 3.9 12 3.9 12 3.9s-7.5 0-9.4.5A3 3 0 0 0 .5 6.5C0 8.4 0 12 0 12s0 3.6.5 5.5a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.5.5-5.5s0-3.6-.5-5.5zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z"/></svg>
        </a>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[['privacy', 'מדיניות פרטיות'], ['accessibility', 'הצהרת נגישות'], ['terms', 'תנאי שימוש']].map(([key, label], i) => (
          <React.Fragment key={key}>
            {i > 0 && <span>·</span>}
            <button onClick={() => onOpenLegal(key)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: C.muted, textDecoration: 'underline', textUnderlineOffset: 3, padding: 0 }}>{label}</button>
          </React.Fragment>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.muted, fontWeight: 700, fontSize: 12.5 }}>
        <span>מיוצר בישראל</span>
        <svg width="20" height="14" viewBox="0 0 32 22" aria-hidden="true" style={{ borderRadius: 2, boxShadow: '0 0 0 1px rgba(0,0,0,.06)' }}><rect width="32" height="22" fill="#fff"/><rect width="32" height="3.4" y="2.2" fill="#0038B8"/><rect width="32" height="3.4" y="16.4" fill="#0038B8"/><g fill="none" stroke="#0038B8" strokeWidth="1.1"><path d="M16 7.2l3.4 5.9h-6.8z"/><path d="M16 14.8l-3.4-5.9h6.8z"/></g></svg>
      </div>
    </div>
  );
}

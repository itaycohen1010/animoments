// Shared UI style tokens for buttons etc.
import { colors as C } from './config.js';

export const pillBtn = {
  border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 16, color: '#fff',
  background: `linear-gradient(135deg, ${C.accent}, ${C.accentSoft})`,
  padding: '14px 30px', borderRadius: 999, boxShadow: '0 8px 20px rgba(196,80,46,.3)',
  transition: 'transform .15s ease'
};

export const ghostBtn = {
  border: `1.5px solid ${C.borderStrong}`, background: 'none', cursor: 'pointer',
  fontWeight: 700, fontSize: 15, color: C.body, padding: '13px 30px', borderRadius: 999
};

export const smallGhostBtn = {
  border: `1.5px solid ${C.borderStrong}`, background: '#fff', cursor: 'pointer',
  fontWeight: 700, fontSize: 14, color: C.body, padding: '9px 18px', borderRadius: 999, whiteSpace: 'nowrap'
};

export const inputStyle = (invalid) => ({
  width: '100%', boxSizing: 'border-box', direction: 'rtl',
  border: invalid ? `2px solid ${C.accent}` : `1.5px solid ${C.borderStrong}`,
  background: invalid ? C.errorBg : '#FFFDFA',
  borderRadius: 14, padding: '13px 16px', fontSize: 16, color: C.ink, outline: 'none'
});

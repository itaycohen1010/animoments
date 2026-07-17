import React from 'react';
import { colors as C } from '../config.js';
import { pillBtn, ghostBtn, smallGhostBtn, inputStyle } from '../styles.js';

// Screen 1 — customer details (name / phone / email). First step of the order flow.
export default function DetailsScreen({ pkg, form, setForm, formError, setFormError, onBack, onContinue, onOpenHow }) {
  const nameInvalid = !!formError && form.name.trim().length === 0;
  const phoneRaw = form.phone.trim();
  const phoneDigits = (form.phone.match(/\d/g) || []).length;
  const phoneOk = /^0(5\d|[2-46-9])\d{7,8}$/.test(phoneRaw.replace(/[\s-]/g, '')) || (phoneRaw.startsWith('+') && phoneDigits >= 8 && phoneDigits <= 15);
  const phoneInvalid = !!formError && !phoneOk;
  const emailInvalid = !!formError && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const email2Invalid = !!formError && ((form.email2 || '').trim() !== form.email.trim() || !(form.email2 || '').trim());

  const field = (label, key, type, placeholder, invalid, noPaste) => (
    <div>
      <label style={{ display: 'block', fontWeight: 700, fontSize: '.95rem', marginBottom: 6 }}>{label}</label>
      <input type={type} value={form[key] || ''} onChange={(e) => { setForm({ ...form, [key]: e.target.value }); setFormError(null); }} onPaste={noPaste ? (e) => e.preventDefault() : undefined} placeholder={placeholder} style={inputStyle(invalid)} />
    </div>
  );

  return (
    <div data-screen-label="Details" style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px 60px', animation: 'rise-in .5s ease both', width: '100%', boxSizing: 'border-box' }}>
      <div className="card-pad" style={{ background: '#fff', borderRadius: 24, padding: '34px 30px', boxShadow: '0 14px 40px rgba(180,100,70,.16)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.6rem', margin: '0 0 6px' }}>רק עוד כמה פרטים</h2>
            <p style={{ color: C.body, fontSize: '.98rem', lineHeight: 1.7, margin: '0 0 20px' }}>פרטים ליצירת קשר — ומיד עוברים לתשלום וסיום ההזמנה.</p>
          </div>
          <button onClick={() => onOpenHow(1)} style={{ ...smallGhostBtn, fontSize: 13, padding: '8px 14px' }}>איך זה עובד? 👀</button>
        </div>

        <div style={{ background: C.cream, borderRadius: 18, padding: '18px 20px', marginBottom: 20, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ color: C.body, fontWeight: 600 }}>חבילת {pkg.name}</span>
          <span style={{ fontWeight: 900, fontSize: '1.9rem', color: C.accent }}>₪{pkg.price}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 8 }}>
          {field('השם שלכם *', 'name', 'text', 'לדוגמה: רותי לוי', nameInvalid)}
          {field('מספר טלפון *', 'phone', 'tel', '050-1234567 או ‎+1 555 123 4567', phoneInvalid)}
          {field('כתובת אימייל *', 'email', 'email', 'ruti@gmail.com', emailInvalid)}
          {field('אימות כתובת אימייל *', 'email2', 'email', 'הקלידו שוב את האימייל', email2Invalid, true)}
        </div>
        {formError && <div style={{ textAlign: 'center', color: C.accentDark, fontWeight: 700, fontSize: '.95rem', margin: '10px 0 0' }}>{formError}</div>}

        <div className="actions-row" style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 26, flexWrap: 'wrap' }}>
          <button onClick={onBack} style={ghostBtn}>חזרה</button>
          <button onClick={onContinue} style={pillBtn}>המשך לתשלום</button>
        </div>
      </div>
    </div>
  );
}

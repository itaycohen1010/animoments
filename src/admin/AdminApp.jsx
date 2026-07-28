import React, { useState, useEffect } from 'react';
import { config } from '../config.js';
import { adminLogin, adminLogout, onAdminAuth, listOrders, listProducts, saveProduct, setOrderStatus, getSettings, saveSettings, listGallery, saveGalleryItem, deleteGalleryItem, reorderGallery, listSessions, listDailyStats, listLeads, rollupOldSessions, listQuotes, setQuoteSent, uploadToStorage } from '../firebase.js';

const C = config.colors || {};
const ACCENT = '#C4502E', INK = '#3B2A20', BODY = '#6E5240', CARD = '#fff', BG = '#FAF0E6', BORDER = '#F0D9C4';

const STATUS = { new: 'חדש', in_progress: 'בעבודה', done: 'הושלם' };

function Login({ onDone }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try { await adminLogin(email, password); onDone(); }
    catch (e) { setErr('התחברות נכשלה — בדקו אימייל וסיסמה.'); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG, direction: 'rtl' }}>
      <form onSubmit={submit} style={{ background: CARD, borderRadius: 24, padding: '36px 30px', width: 360, maxWidth: '90vw', boxShadow: '0 14px 40px rgba(180,100,70,.16)', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🔒</div>
        <h1 style={{ fontWeight: 800, fontSize: '1.4rem', margin: '0 0 6px', color: INK }}>ניהול הזמנות</h1>
        <p style={{ color: BODY, fontSize: '.9rem', margin: '0 0 22px' }}>כניסה למנהלים בלבד</p>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="אימייל" required
          style={{ width: '100%', boxSizing: 'border-box', direction: 'ltr', textAlign: 'center', fontFamily: "'Heebo', sans-serif", fontSize: 15, padding: '12px 14px', border: `1.5px solid ${BORDER}`, borderRadius: 12, marginBottom: 10, outline: 'none' }} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="סיסמה" required
          style={{ width: '100%', boxSizing: 'border-box', direction: 'ltr', textAlign: 'center', fontFamily: "'Heebo', sans-serif", fontSize: 15, padding: '12px 14px', border: `1.5px solid ${BORDER}`, borderRadius: 12, marginBottom: 14, outline: 'none' }} />
        {err && <div style={{ color: ACCENT, fontWeight: 700, fontSize: '.85rem', marginBottom: 12 }}>{err}</div>}
        <button type="submit" disabled={busy}
          style={{ width: '100%', border: 'none', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 800, fontSize: 16, color: '#fff', background: `linear-gradient(135deg, ${ACCENT}, #D96A38)`, padding: '13px', borderRadius: 999, opacity: busy ? .6 : 1 }}>
          {busy ? 'מתחברים…' : 'כניסה'}
        </button>
      </form>
    </div>
  );
}

function OrderRow({ order, product, onSaved }) {
  const [url, setUrl] = useState(product?.videoUrl || '');
  const [status, setStatus] = useState(order.status || 'new');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setBusy(true); setSaved(false);
    try {
      await saveProduct({ orderId: order.orderId, customerId: order.customerId }, url);
      if (status !== order.status) await setOrderStatus(order.orderId, status);
      setSaved(true); onSaved && onSaved();
    } catch (e) { alert('שמירה נכשלה: ' + e.message); }
    finally { setBusy(false); }
  };

  const cell = { padding: '10px 12px', fontSize: 13, color: INK, verticalAlign: 'top', borderBottom: `1px solid ${BORDER}` };
  return (
    <tr>
      <td style={{ ...cell, fontWeight: 700, whiteSpace: 'nowrap' }}>{order.orderId}</td>
      <td style={cell}>{order.name || '—'}</td>
      <td style={{ ...cell, direction: 'ltr' }}>{order.phone || '—'}<br />{order.email || ''}</td>
      <td style={{ ...cell, whiteSpace: 'nowrap' }}>{order.packageId || '—'}</td>
      <td style={cell}>{order.musicMood || '—'}</td>
      <td style={{ ...cell, maxWidth: 180 }}>{order.blessing || ''}</td>
      <td style={cell}>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ fontFamily: "'Heebo', sans-serif", fontSize: 13, padding: '5px 8px', borderRadius: 8, border: `1px solid ${BORDER}` }}>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </td>
      <td style={cell}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input value={url} onChange={(e) => { setUrl(e.target.value); setSaved(false); }} placeholder="קישור וידאו (Cloudinary)"
            style={{ width: 200, direction: 'ltr', fontFamily: "'Heebo', sans-serif", fontSize: 12, padding: '7px 9px', border: `1px solid ${BORDER}`, borderRadius: 8, outline: 'none' }} />
          <button onClick={save} disabled={busy}
            style={{ border: 'none', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 800, fontSize: 12, color: '#fff', background: saved ? '#3E8E41' : ACCENT, padding: '7px 12px', borderRadius: 8, whiteSpace: 'nowrap' }}>
            {busy ? '…' : saved ? '✓' : 'שמירה'}
          </button>
        </div>
      </td>
    </tr>
  );
}

function SettingsEditor() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { getSettings().then((s) => setData(s || {})); }, []);

  const set = (k, v) => { setData((d) => ({ ...d, [k]: v })); setSaved(false); };
  const setPkg = (i, k, v) => setData((d) => { const p = [...(d.packages || [])]; p[i] = { ...p[i], [k]: v }; return { ...d, packages: p }; });
  const setEx = (i, k, v) => setData((d) => { const e = [...(d.examples || [])]; e[i] = { ...e[i], [k]: v }; return { ...d, examples: e }; });
  const addEx = () => setData((d) => ({ ...d, examples: [...(d.examples || []), { title: '', img: '', video: '' }] }));
  const delEx = (i) => setData((d) => ({ ...d, examples: (d.examples || []).filter((_, j) => j !== i) }));
  const setFaq = (i, k, v) => setData((d) => { const f = [...(d.faq || [])]; f[i] = { ...f[i], [k]: v }; return { ...d, faq: f }; });
  const addFaq = () => setData((d) => ({ ...d, faq: [...(d.faq || []), { q: '', a: '' }] }));
  const delFaq = (i) => setData((d) => ({ ...d, faq: (d.faq || []).filter((_, j) => j !== i) }));
  const setSocial = (k, v) => setData((d) => ({ ...d, socialLinks: { ...(d.socialLinks || {}), [k]: v } }));
  const setTesti = (i, v) => setData((d) => { const t = [...(d.testimonialImages || [])]; t[i] = v; return { ...d, testimonialImages: t }; });
  const addTesti = () => setData((d) => ({ ...d, testimonialImages: [...(d.testimonialImages || []), ''] }));
  const delTesti = (i) => setData((d) => ({ ...d, testimonialImages: (d.testimonialImages || []).filter((_, j) => j !== i) }));
  const move = (key, from, to) => setData((d) => { const arr = [...(d[key] || [])]; if (to < 0 || to >= arr.length) return d; const [it] = arr.splice(from, 1); arr.splice(to, 0, it); return { ...d, [key]: arr }; });
  const dragProps = (key, i) => ({
    draggable: true,
    onDragStart: (e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(i)); },
    onDragOver: (e) => e.preventDefault(),
    onDrop: (e) => { e.preventDefault(); const from = Number(e.dataTransfer.getData('text/plain')); if (!isNaN(from) && from !== i) move(key, from, i); }
  });
  const handle = <span title="גררו לשינוי סדר" style={{ cursor: 'grab', color: '#B79B85', fontSize: 18, userSelect: 'none', flexShrink: 0 }}>⠿</span>;
  const [uploadingTesti, setUploadingTesti] = useState(false);
  const uploadTesti = async (file) => {
    if (!file) return;
    setUploadingTesti(true);
    try { const url = await uploadToStorage(file, 'testimonials'); setData((d) => ({ ...d, testimonialImages: [...(d.testimonialImages || []), url] })); }
    catch (e) { alert('העלאה נכשלה: ' + e.message); }
    setUploadingTesti(false);
  };

  const save = async () => {
    setBusy(true); setSaved(false);
    try { await saveSettings(data); setSaved(true); }
    catch (e) { alert('שמירה נכשלה: ' + e.message); }
    finally { setBusy(false); }
  };

  if (data === null) return <div style={{ color: BODY, padding: 40, textAlign: 'center' }}>טוען…</div>;

  const label = { display: 'block', fontWeight: 700, fontSize: 13, color: BODY, margin: '0 0 6px' };
  const inp = { width: '100%', boxSizing: 'border-box', direction: 'rtl', fontFamily: "'Heebo', sans-serif", fontSize: 14, padding: '10px 12px', border: `1.5px solid ${BORDER}`, borderRadius: 10, outline: 'none' };
  const ltrInp = { ...inp, direction: 'ltr' };
  const box = { background: CARD, borderRadius: 16, padding: '22px 20px', boxShadow: '0 14px 40px rgba(180,100,70,.12)', marginBottom: 18 };
  const num = { ...inp, width: 90 };

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div style={box}>
        <h3 style={{ margin: '0 0 16px', color: INK, fontSize: '1.1rem' }}>באנר ומבצע</h3>
        <div style={{ marginBottom: 14 }}><span style={label}>באנר עליון (ריק = מוסתר)</span><input style={inp} value={data.announcement || ''} onChange={(e) => set('announcement', e.target.value)} /></div>
        <div style={{ display: 'flex', gap: 20, marginBottom: 14, flexWrap: 'wrap' }}>
          <div><span style={label}>צבע רקע הבאנר</span><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 260 }}>{['#17120F', '#2E1F17', '#C4502E', '#A83E20', '#D96A38', '#E8A13C', '#F2B45C', '#3E6B33', '#6E5240', '#B04A2C', '#8A5A12', '#FBE4D7', '#FAF0E6', '#ffffff'].map((c) => (<button key={c} onClick={() => set('announcementBg', c)} title={c} style={{ width: 30, height: 30, borderRadius: 8, background: c, cursor: 'pointer', border: (data.announcementBg || '#17120F') === c ? '3px solid #C4502E' : '2px solid #E4C4A8' }} />))}</div></div>
          <div><span style={label}>צבע הטקסט</span><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 260 }}>{['#ffffff', '#17120F', '#3B2A20', '#FBE4D7', '#E8A13C', '#F2B45C', '#C4502E', '#6E5240'].map((c) => (<button key={c} onClick={() => set('announcementColor', c)} title={c} style={{ width: 30, height: 30, borderRadius: 8, background: c, cursor: 'pointer', border: (data.announcementColor || '#ffffff') === c ? '3px solid #C4502E' : '2px solid #E4C4A8' }} />))}</div></div>
        </div>
        <div style={{ display: 'flex', gap: 20, marginBottom: 14, flexWrap: 'wrap' }}>
          <div><span style={label}>רקע מותאם (HEX)</span><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 30, height: 30, borderRadius: 8, border: '2px solid #E4C4A8', background: data.announcementBg || '#17120F', flexShrink: 0 }} /><input style={{ ...ltrInp, width: 110 }} value={data.announcementBg || ''} onChange={(e) => set('announcementBg', e.target.value)} placeholder="#17120F" /></div></div>
          <div><span style={label}>צבע טקסט מותאם (HEX)</span><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 30, height: 30, borderRadius: 8, border: '2px solid #E4C4A8', background: data.announcementColor || '#ffffff', flexShrink: 0 }} /><input style={{ ...ltrInp, width: 110 }} value={data.announcementColor || ''} onChange={(e) => set('announcementColor', e.target.value)} placeholder="#ffffff" /></div></div>
        </div>
        <div style={{ marginBottom: 14 }}><span style={label}>טיימר ספירה לאחור (תאריך ושעת סיום — ריק = ללא)</span><input type="datetime-local" style={{ ...inp, direction: 'ltr', maxWidth: 260 }} value={data.promoDeadline || ''} onChange={(e) => set('promoDeadline', e.target.value)} /><div style={{ fontSize: 12, color: BODY, marginTop: 4 }}>יוצג בבאנר העליון עם ספירה חיה. נעלם אוטומטית כשמסתיים.</div></div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, cursor: 'pointer' }}><input type="checkbox" checked={!!data.promoTimerOnCards} onChange={(e) => set('promoTimerOnCards', e.target.checked)} style={{ width: 18, height: 18, accentColor: ACCENT }} /><span style={{ fontSize: 14, color: INK, fontWeight: 700 }}>הצגת הטיימר גם מעל כרטיסי המחיר</span></label>
        <div style={{ marginBottom: 14 }}><span style={label}>תווית מבצע ליד טיימר המחירים (טקסט חופשי, אופציונלי)</span><input style={inp} value={data.promoCardLabel || ''} onChange={(e) => set('promoCardLabel', e.target.value)} placeholder="למשל: 🔥 מבצע השקה" /></div>
        <div style={{ display: 'flex', gap: 20, marginBottom: 14, flexWrap: 'wrap' }}>
          <div><span style={label}>צבע רקע טיימר המחירים</span><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 30, height: 30, borderRadius: 8, border: '2px solid #E4C4A8', background: data.promoCardBg || '#C4502E', flexShrink: 0 }} /><input style={{ ...ltrInp, width: 110 }} value={data.promoCardBg || ''} onChange={(e) => set('promoCardBg', e.target.value)} placeholder="#C4502E" /></div></div>
          <div><span style={label}>צבע טקסט טיימר המחירים</span><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 30, height: 30, borderRadius: 8, border: '2px solid #E4C4A8', background: data.promoCardColor || '#ffffff', flexShrink: 0 }} /><input style={{ ...ltrInp, width: 110 }} value={data.promoCardColor || ''} onChange={(e) => set('promoCardColor', e.target.value)} placeholder="#ffffff" /></div></div>
        </div>
        {(data.promoDeadline || '').trim() && data.promoTimerOnCards && (
          <div style={{ textAlign: 'center', marginBottom: 4 }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: data.promoCardBg || '#C4502E', color: data.promoCardColor || '#fff', borderRadius: 999, padding: '11px 26px', fontWeight: 900, fontSize: 19 }}>{(data.promoCardLabel || '').trim() && <span>{data.promoCardLabel}</span>}<span>⏳ 00:00:00</span></span></div>
        )}
        {((data.announcement || '').trim() || (data.promoDeadline || '').trim()) && (
          <div style={{ background: data.announcementBg || '#17120F', color: data.announcementColor || '#fff', textAlign: 'center', fontWeight: 800, fontSize: 15, padding: '11px 20px', direction: 'rtl', borderRadius: 10, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            {(data.announcement || '').trim() && <span>{data.announcement}</span>}
            {(data.promoDeadline || '').trim() && (() => { const rem = new Date(data.promoDeadline).getTime() - Date.now(); if (rem <= 0) return <span style={{ opacity: .6, fontSize: 13 }}>(הטיימר הסתיים)</span>; const s = Math.floor(rem / 1000), d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60); const p = (n) => String(n).padStart(2, '0'); return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.22)', borderRadius: 999, padding: '5px 16px', fontWeight: 900, fontSize: 16 }}>⏳ {d > 0 ? `${d} ימים ${p(h)}:${p(m)}` : `${p(h)}:${p(m)}`}</span>; })()}
          </div>
        )}
        <div style={{ marginBottom: 14 }}><span style={label}>תמונת פופאפ מבצע (URL, ריק = ללא)</span><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>{(data.promoImage || '').trim() && <img src={data.promoImage} alt="" style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 8, border: `1px solid ${BORDER}`, flexShrink: 0 }} />}<input style={ltrInp} value={data.promoImage || ''} onChange={(e) => set('promoImage', e.target.value)} /></div></div>
        <div><span style={label}>טקסט פופאפ מבצע (אם אין תמונה)</span><textarea style={{ ...inp, minHeight: 60 }} value={data.promoPopup || ''} onChange={(e) => set('promoPopup', e.target.value)} /></div>
      </div>

      <div style={box}>
        <h3 style={{ margin: '0 0 16px', color: INK, fontSize: '1.1rem' }}>וידאו ותמונות ראשי (Hero)</h3>
        <div style={{ marginBottom: 14 }}><span style={label}>קישור וידאו ראשי (MP4)</span><input style={ltrInp} value={data.heroVideo || ''} onChange={(e) => set('heroVideo', e.target.value)} placeholder="https://res.cloudinary.com/…/hero.mp4" /></div>
        <div style={{ marginBottom: 14 }}><span style={label}>תמונת פוסטר (מוצגת עד שהוידאו נטען)</span><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>{(data.heroPoster || '').trim() && <img src={data.heroPoster} alt="" style={{ width: 72, height: 40, objectFit: 'cover', borderRadius: 6, border: `1px solid ${BORDER}`, flexShrink: 0 }} />}<input style={ltrInp} value={data.heroPoster || ''} onChange={(e) => set('heroPoster', e.target.value)} placeholder="https://…/hero.jpg" /></div></div>
        <span style={label}>4 תמונות ליד הטלפון</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {((data.heroPhotos || [])[i] || '').trim() && <img src={(data.heroPhotos || [])[i]} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, border: `1px solid ${BORDER}`, flexShrink: 0 }} />}
              <input style={{ ...ltrInp, flex: 1 }} value={(data.heroPhotos || [])[i] || ''} onChange={(e) => setData((d) => { const a = [...(d.heroPhotos || ['', '', '', ''])]; while (a.length < 4) a.push(''); a[i] = e.target.value; return { ...d, heroPhotos: a }; })} placeholder={`תמונה ${i + 1} (URL)`} />
            </div>
          ))}
        </div>
      </div>

      <div style={box}>
        <h3 style={{ margin: '0 0 16px', color: INK, fontSize: '1.1rem' }}>חבילות</h3>
        {(data.packages || []).map((p, i) => (
          <div key={i} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 10 }}>
              <div><span style={label}>שם</span><input style={{ ...inp, width: 160 }} value={p.name || ''} onChange={(e) => setPkg(i, 'name', e.target.value)} /></div>
              <div><span style={label}>מחיר ₪</span><input type="number" style={num} value={p.price ?? ''} onChange={(e) => setPkg(i, 'price', Number(e.target.value))} /></div>
              <div><span style={label}>הנחה %</span><input type="number" style={num} value={p.discount ?? 0} onChange={(e) => setPkg(i, 'discount', Number(e.target.value))} /></div>
              <div><span style={label}>מקס׳ תמונות</span><input type="number" style={num} value={p.maxPhotos ?? ''} onChange={(e) => setPkg(i, 'maxPhotos', Number(e.target.value))} /></div>
              <div style={{ fontSize: 12, color: BODY, paddingBottom: 10 }}>key: {p.key}</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: BODY, paddingBottom: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!p.featured} onChange={(e) => setData((d) => ({ ...d, packages: (d.packages || []).map((x, j) => ({ ...x, featured: j === i ? e.target.checked : (e.target.checked ? false : x.featured) })) }))} style={{ width: 18, height: 18, accentColor: ACCENT }} />
                הכי אהובה ❤️
              </label>
            </div>
            <span style={label}>שורות תיאור (שורה לכל שורת תכונה)</span>
            <textarea style={{ ...inp, minHeight: 72 }} value={(p.features || []).join('\n')} onChange={(e) => setPkg(i, 'features', e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))} />
            <div style={{ marginTop: 10, background: '#fff', border: p.featured ? `2px solid ${ACCENT}` : `1.5px solid ${BORDER}`, borderRadius: 14, padding: '14px 16px', maxWidth: 240 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: INK }}>{p.name || '—'}</span>
                {p.featured && <span style={{ fontSize: 11, fontWeight: 800, color: '#5C3A10', background: 'linear-gradient(135deg,#E8A13C,#F2B45C)', borderRadius: 999, padding: '2px 8px' }}>הכי אהובה ❤️</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '8px 0 6px' }}>
                <span style={{ fontWeight: 900, fontSize: '1.6rem', color: ACCENT }}>₪{Math.round((p.price || 0) * (100 - (p.discount || 0)) / 100)}</span>
                {p.discount ? <span style={{ color: '#A78B74', fontWeight: 700, fontSize: '.95rem', textDecoration: 'line-through' }}>₪{p.price}</span> : null}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: BODY, fontSize: '.85rem' }}>
                {(p.features || []).map((f, j) => <span key={j}>✓ {f}</span>)}
              </div>
            </div>
          </div>
        ))}
        <div style={{ fontSize: 12, color: BODY }}>מחיר = מחיר מלא; המחיר באתר מחושב לאחר ההנחה.</div>
      </div>

      <div style={box}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: INK, fontSize: '1.1rem' }}>סרטוני דוגמה (סרט נע)</h3>
          <div style={{ flex: 1 }} />
          <button onClick={addEx} style={{ border: `1.5px solid ${ACCENT}`, background: '#fff', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 13, color: ACCENT, padding: '6px 14px', borderRadius: 999 }}>+ הוספה</button>
        </div>
        {(data.examples || []).map((ex, i) => (
          <div key={i} {...dragProps('examples', i)} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', paddingBottom: 12, marginBottom: 12, borderBottom: `1px solid ${BORDER}` }}>
            {handle}
            {(ex.img || '').trim() && <img src={ex.img} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, border: `1px solid ${BORDER}`, flexShrink: 0 }} />}
            <div><span style={label}>כותרת</span><input style={{ ...inp, width: 180 }} value={ex.title || ''} onChange={(e) => setEx(i, 'title', e.target.value)} /></div>
            <div style={{ flex: 1, minWidth: 200 }}><span style={label}>קישור וידאו</span><input style={ltrInp} value={ex.video || ''} onChange={(e) => setEx(i, 'video', e.target.value)} /></div>
            <div style={{ flex: 1, minWidth: 200 }}><span style={label}>תמונה (URL)</span><input style={ltrInp} value={ex.img || ''} onChange={(e) => setEx(i, 'img', e.target.value)} /></div>
            <button onClick={() => delEx(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: ACCENT, fontSize: 20, paddingBottom: 8 }}>×</button>
          </div>
        ))}
      </div>

      <div style={box}>
        <h3 style={{ margin: '0 0 16px', color: INK, fontSize: '1.1rem' }}>הוכחה חברתית</h3>
        <div style={{ marginBottom: 12 }}><span style={label}>טקסט "סרטונים נוצרו" (מתחת לסרט הנע)</span><input style={inp} value={(data.socialProof || {}).stat || ''} onChange={(e) => setData((d) => ({ ...d, socialProof: { ...(d.socialProof || {}), stat: e.target.value } }))} placeholder="+300 סרטונים נוצרו" /></div>
      </div>

      <div style={box}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: INK, fontSize: '1.1rem' }}>המלצות (תמונות וואטסאפ)</h3>
          <div style={{ flex: 1 }} />
          <label style={{ border: `1.5px solid ${ACCENT}`, background: ACCENT, cursor: uploadingTesti ? 'wait' : 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 13, color: '#fff', padding: '6px 14px', borderRadius: 999 }}>
            {uploadingTesti ? 'מעלה…' : '⬆ העלאת תמונה'}
            <input type="file" accept="image/*" onChange={(e) => { uploadTesti(e.target.files[0]); e.target.value = ''; }} style={{ display: 'none' }} />
          </label>
          <button onClick={addTesti} style={{ border: `1.5px solid ${ACCENT}`, background: '#fff', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 13, color: ACCENT, padding: '6px 14px', borderRadius: 999 }}>+ כתובת</button>
        </div>
        {(data.testimonialImages || []).length === 0 && <div style={{ color: BODY, fontSize: 13, marginBottom: 10 }}>אין תמונות — יוצג צילום ברירת המחדל. הוסיפו כתובת תמונה (Cloudinary).</div>}
        {(data.testimonialImages || []).map((url, i) => (
          <div key={i} {...dragProps('testimonialImages', i)} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
            {handle}
            {(url || '').trim() && <img src={url} alt="" style={{ width: 40, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />}
            <input style={{ ...ltrInp, flex: 1 }} placeholder="https://res.cloudinary.com/…/screenshot.jpg" value={url} onChange={(e) => setTesti(i, e.target.value)} />
            <button onClick={() => delTesti(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: ACCENT, fontSize: 20 }}>×</button>
          </div>
        ))}
      </div>

      <div style={box}>
        <h3 style={{ margin: '0 0 16px', color: INK, fontSize: '1.1rem' }}>קישורים לרשתות (ריק = מוסתר)</h3>
        {[['facebook', 'פייסבוק'], ['instagram', 'אינסטגרם'], ['whatsapp', 'וואטסאפ'], ['youtube', 'יוטיוב'], ['tiktok', 'טיקטוק']].map(([k, lbl]) => (
          <div key={k} style={{ marginBottom: 12 }}><span style={label}>{lbl}</span><input style={ltrInp} value={(data.socialLinks || {})[k] || ''} onChange={(e) => setSocial(k, e.target.value)} /></div>
        ))}
      </div>

      <div style={box}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: INK, fontSize: '1.1rem' }}>שאלות ותשובות (FAQ)</h3>
          <div style={{ flex: 1 }} />
          <button onClick={addFaq} style={{ border: `1.5px solid ${ACCENT}`, background: '#fff', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 13, color: ACCENT, padding: '6px 14px', borderRadius: 999 }}>+ הוספה</button>
        </div>
        {(data.faq || []).map((f, i) => (
          <div key={i} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <input style={{ ...inp, flex: 1, fontWeight: 700 }} placeholder="שאלה" value={f.q || ''} onChange={(e) => setFaq(i, 'q', e.target.value)} />
              <button onClick={() => delFaq(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: ACCENT, fontSize: 20 }}>×</button>
            </div>
            <textarea style={{ ...inp, minHeight: 60, width: '100%' }} placeholder="תשובה" value={f.a || ''} onChange={(e) => setFaq(i, 'a', e.target.value)} />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', bottom: 0, background: BG, padding: '12px 0' }}>
        <button onClick={save} disabled={busy}
          style={{ border: 'none', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 800, fontSize: 16, color: '#fff', background: saved ? '#3E8E41' : `linear-gradient(135deg, ${ACCENT}, #D96A38)`, padding: '13px 40px', borderRadius: 999, opacity: busy ? .6 : 1 }}>
          {busy ? 'שומר…' : saved ? 'נשמר ✓' : 'שמירת הגדרות'}
        </button>
        <span style={{ fontSize: 12, color: BODY }}>השינויים יופיעו באתר מיד (טעינת דף מחדש).</span>
      </div>
    </div>
  );
}

function GalleryEditor() {
  const [items, setItems] = useState(null);
  const [draft, setDraft] = useState({ title: '', video: '', img: '', category: '' });
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editDraft, setEditDraft] = useState({ title: '', video: '', img: '', category: '' });

  const load = () => listGallery().then(setItems);
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!draft.title.trim() && !draft.video.trim()) return;
    setBusy(true);
    try { await saveGalleryItem(draft); setDraft({ title: '', video: '', img: '', category: '' }); await load(); }
    catch (e) { alert('שמירה נכשלה: ' + e.message); }
    finally { setBusy(false); }
  };
  const del = async (id) => {
    if (!confirm('למחוק את הסרטון מהגלריה?')) return;
    try { await deleteGalleryItem(id); await load(); } catch (e) { alert('מחיקה נכשלה: ' + e.message); }
  };
  const startEdit = (g) => { setEditId(g.id); setEditDraft({ title: g.title || '', video: g.video || '', img: g.img || '', category: g.category || '' }); };
  const dragGallery = (from, to) => { if (to < 0 || to >= items.length || from === to) return; const arr = [...items]; const [it] = arr.splice(from, 1); arr.splice(to, 0, it); setItems(arr); reorderGallery(arr.map((x) => x.id)); };
  const gDrag = (i) => ({ draggable: true, onDragStart: (e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(i)); }, onDragOver: (e) => e.preventDefault(), onDrop: (e) => { e.preventDefault(); const f = Number(e.dataTransfer.getData('text/plain')); if (!isNaN(f)) dragGallery(f, i); } });
  const cancelEdit = () => { setEditId(null); };
  const saveEdit = async (id) => {
    setBusy(true);
    try { await saveGalleryItem({ id, ...editDraft }); setEditId(null); await load(); }
    catch (e) { alert('שמירה נכשלה: ' + e.message); }
    finally { setBusy(false); }
  };

  const label = { display: 'block', fontWeight: 700, fontSize: 13, color: BODY, margin: '0 0 6px' };
  const inp = { width: '100%', boxSizing: 'border-box', fontFamily: "'Heebo', sans-serif", fontSize: 14, padding: '10px 12px', border: `1.5px solid ${BORDER}`, borderRadius: 10, outline: 'none' };
  const box = { background: CARD, borderRadius: 16, padding: '22px 20px', boxShadow: '0 14px 40px rgba(180,100,70,.12)', marginBottom: 18 };

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div style={box}>
        <h3 style={{ margin: '0 0 16px', color: INK, fontSize: '1.1rem' }}>הוספת סרטון לגלריה</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ width: 200 }}><span style={label}>כותרת</span><input style={{ ...inp, direction: 'rtl' }} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
          <div style={{ flex: 1, minWidth: 220 }}><span style={label}>קישור וידאו</span><input style={{ ...inp, direction: 'ltr' }} value={draft.video} onChange={(e) => setDraft({ ...draft, video: e.target.value })} /></div>
          <div style={{ flex: 1, minWidth: 200 }}><span style={label}>תמונה (URL, אופציונלי)</span><input style={{ ...inp, direction: 'ltr' }} value={draft.img} onChange={(e) => setDraft({ ...draft, img: e.target.value })} /></div>
          <div style={{ width: 160 }}><span style={label}>קטגוריה</span><input style={{ ...inp, direction: 'rtl' }} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} placeholder="למשל: חתונות" /></div>
          <button onClick={add} disabled={busy} style={{ border: 'none', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 800, fontSize: 14, color: '#fff', background: ACCENT, padding: '10px 20px', borderRadius: 999, opacity: busy ? .6 : 1 }}>הוספה</button>
        </div>
        <div style={{ fontSize: 12, color: BODY, marginTop: 10 }}>אם לא הוזנה תמונה, נשתמש בתמונה הממוזערת של יוטיוב אוטומטית.</div>
      </div>

      <div style={box}>
        <h3 style={{ margin: '0 0 16px', color: INK, fontSize: '1.1rem' }}>סרטונים בגלריה</h3>
        {items === null ? <div style={{ color: BODY }}>טוען…</div>
          : items.length === 0 ? <div style={{ color: BODY }}>אין סרטונים עדיין.</div>
          : items.map((g) => (
            <div key={g.id} {...gDrag(items.indexOf(g))} style={{ display: 'flex', gap: 12, alignItems: 'center', paddingBottom: 12, marginBottom: 12, borderBottom: `1px solid ${BORDER}` }}>
              {editId !== g.id && <span title="גררו לשינוי סדר" style={{ cursor: 'grab', color: '#B79B85', fontSize: 18, userSelect: 'none', flexShrink: 0 }}>⠿</span>}
              {editId === g.id ? (
                <>
                  <div style={{ width: 180 }}><input style={{ ...inp, direction: 'rtl' }} value={editDraft.title} onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })} placeholder="כותרת" /></div>
                  <div style={{ flex: 1, minWidth: 180 }}><input style={{ ...inp, direction: 'ltr' }} value={editDraft.video} onChange={(e) => setEditDraft({ ...editDraft, video: e.target.value })} placeholder="קישור וידאו" /></div>
                  <div style={{ flex: 1, minWidth: 160 }}><input style={{ ...inp, direction: 'ltr' }} value={editDraft.img} onChange={(e) => setEditDraft({ ...editDraft, img: e.target.value })} placeholder="תמונה (URL)" /></div>
                  <div style={{ width: 130 }}><input style={{ ...inp, direction: 'rtl' }} value={editDraft.category} onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value })} placeholder="קטגוריה" /></div>
                  <button onClick={() => saveEdit(g.id)} disabled={busy} style={{ border: 'none', background: ACCENT, cursor: 'pointer', color: '#fff', fontFamily: "'Heebo', sans-serif", fontWeight: 800, fontSize: 13, padding: '8px 16px', borderRadius: 999, opacity: busy ? .6 : 1 }}>שמירה</button>
                  <button onClick={cancelEdit} style={{ border: `1px solid ${BORDER}`, background: '#fff', cursor: 'pointer', color: BODY, fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 13, padding: '8px 14px', borderRadius: 999 }}>ביטול</button>
                </>
              ) : (
                <>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: INK, fontSize: 14 }}>{g.title || '(ללא כותרת)'}{g.category ? <span style={{ marginRight: 8, fontSize: 11, fontWeight: 700, color: ACCENT, background: '#FBE4D7', borderRadius: 999, padding: '2px 8px' }}>{g.category}</span> : null}</div>
                    <div style={{ direction: 'ltr', color: BODY, fontSize: 12, wordBreak: 'break-all' }}>{g.video}</div>
                  </div>
                  <button onClick={() => startEdit(g)} style={{ border: `1px solid ${BORDER}`, background: '#fff', cursor: 'pointer', color: INK, fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 13, padding: '6px 14px', borderRadius: 999 }}>עריכה</button>
                  <button onClick={() => del(g.id)} style={{ border: `1px solid ${ACCENT}`, background: '#fff', cursor: 'pointer', color: ACCENT, fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 13, padding: '6px 14px', borderRadius: 999 }}>מחיקה</button>
                </>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

function QuotesPanel() {
  const [items, setItems] = useState(null);
  useEffect(() => { listQuotes(500).then(setItems); }, []);
  const toMs = (t) => (t && t.seconds ? t.seconds * 1000 : 0);
  const toggleSent = async (q) => {
    const v = !q.sent;
    setItems((arr) => arr.map((x) => x.id === q.id ? { ...x, sent: v } : x));
    try { await setQuoteSent(q.id, v); } catch (e) { setItems((arr) => arr.map((x) => x.id === q.id ? { ...x, sent: !v } : x)); }
  };
  const card = { background: CARD, borderRadius: 16, padding: '18px 20px', boxShadow: '0 14px 40px rgba(180,100,70,.12)', marginBottom: 12, textAlign: 'right' };
  if (items === null) return <div style={{ color: BODY, padding: 40, textAlign: 'center' }}>טוען…</div>;
  if (!items.length) return <div style={{ color: BODY, padding: 40, textAlign: 'center' }}>אין בקשות להצעת מחיר עדיין.</div>;
  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      {items.map((q) => (
        <div key={q.id} style={{ ...card, opacity: q.sent ? .7 : 1, border: q.sent ? '1.5px solid #BFDCB4' : `1.5px solid ${BORDER}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 6, alignItems: 'center' }}>
            <span style={{ fontWeight: 800, color: INK, fontSize: 16 }}>{q.name || '(ללא שם)'}{q.sent && <span style={{ marginRight: 8, fontSize: 11, fontWeight: 700, color: '#3E6B33', background: '#EDF5EA', borderRadius: 999, padding: '2px 10px' }}>נשלחה הצעה ✓</span>}</span>
            <span style={{ color: BODY, fontSize: 12 }}>{toMs(q.createdAt) ? new Date(toMs(q.createdAt)).toLocaleString('he-IL') : ''}</span>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', color: BODY, fontSize: 14, marginBottom: q.message ? 8 : 10 }}>
            <a href={`tel:${q.phone}`} dir="ltr" style={{ color: ACCENT, fontWeight: 700 }}>{q.phone}</a>
            {q.email && <a href={`mailto:${q.email}`} dir="ltr" style={{ color: ACCENT }}>{q.email}</a>}
          </div>
          {q.message && <div style={{ color: INK, fontSize: 14, lineHeight: 1.6, background: '#FAF0E6', borderRadius: 12, padding: '10px 14px', marginBottom: 10 }}>{q.message}</div>}
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: INK, fontWeight: 700 }}>
            <input type="checkbox" checked={!!q.sent} onChange={() => toggleSent(q)} style={{ width: 18, height: 18, accentColor: ACCENT }} />
            נשלחה הצעת מחיר
          </label>
        </div>
      ))}
    </div>
  );
}

function QuotesPanelPlaceholder() { return null; }

function MonitoringPanel() {
  const [sessions, setSessions] = useState(null);
  const [dailyDocs, setDailyDocs] = useState([]);
  const [leadDocs, setLeadDocs] = useState([]);
  const [days, setDays] = useState('today');
  const [tab, setTab] = useState('funnel'); // funnel | leads
  const [clickCatSel, setClickCatSel] = useState('הכול');

  const load = async () => {
    setSessions(null);
    try { await rollupOldSessions(7); } catch (e) { /* ignore */ }
    const [ss, dd, ld] = await Promise.all([listSessions(1000), listDailyStats(120), listLeads(1000)]);
    setDailyDocs(dd); setLeadDocs(ld); setSessions(ss);
  };
  useEffect(() => { load(); }, []);

  const stepLabels = ['כניסה לאתר', 'בחירת תמונות', 'מילוי פרטים', 'תשלום', 'סיום ✓'];
  const cutoff = days === 'today' ? new Date().setHours(0, 0, 0, 0) : Date.now() - days * 86400000;
  const toMs = (t) => (t && t.seconds ? t.seconds * 1000 : (t && t.toMillis ? t.toMillis() : 0));
  const rows = (sessions || []).filter((s) => { const t = toMs(s.startedAt); return !t || t >= cutoff; });

  // older data comes pre-aggregated from dailyStats docs — fold it in
  const dayTs = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d).getTime(); };
  const dDocs = (dailyDocs || []).filter((x) => x.date && dayTs(x.date) >= new Date(cutoff).setHours(0, 0, 0, 0) && dayTs(x.date) < new Date().setHours(0, 0, 0, 0) - 6 * 86400000 + 86400000);
  const DA = { visits: 0, started: 0, converted: 0, reachedDetails: 0, galleryViews: 0, totalClicks: 0, mobile: 0, desktop: 0, byHour: Array(24).fill(0), byDow: Array(7).fill(0), sources: {}, clickBreakdown: {}, stepReached: [0, 0, 0, 0, 0], onSiteMs: 0, onSiteCount: 0 };
  const dailyByDate = {};
  dDocs.forEach((x) => {
    DA.visits += x.visits || 0; DA.started += x.started || 0; DA.converted += x.converted || 0;
    DA.reachedDetails += x.reachedDetails || 0; DA.galleryViews += x.galleryViews || 0; DA.totalClicks += x.totalClicks || 0;
    DA.mobile += x.mobile || 0; DA.desktop += x.desktop || 0;
    (x.byHour || []).forEach((v, i) => DA.byHour[i] += v || 0);
    (x.byDow || []).forEach((v, i) => DA.byDow[i] += v || 0);
    Object.entries(x.sources || {}).forEach(([k, v]) => DA.sources[k] = (DA.sources[k] || 0) + v);
    Object.entries(x.clickBreakdown || {}).forEach(([k, v]) => DA.clickBreakdown[k] = (DA.clickBreakdown[k] || 0) + v);
    (x.stepReached || []).forEach((v, i) => DA.stepReached[i] += v || 0);
    DA.onSiteMs += x.onSiteMs || 0; DA.onSiteCount += x.onSiteCount || 0;
    dailyByDate[x.date] = { v: (x.visits || 0), o: (x.converted || 0) };
  });

  const total = rows.length + DA.visits;
  const reached = (n) => rows.filter((s) => (s.maxStep || 0) >= n).length + (DA.stepReached[n] || 0);
  const converted = rows.filter((s) => s.converted).length + DA.converted;
  const convRate = total ? Math.round((converted / total) * 100) : 0;

  // drop-off = where each session's furthest step landed
  const leftAt = {};
  rows.forEach((s) => { const m = s.converted ? 4 : (s.maxStep || 0); leftAt[m] = (leftAt[m] || 0) + 1; });
  for (let n = 0; n < 5; n++) { const dropped = (DA.stepReached[n] || 0) - (DA.stepReached[n + 1] || 0); if (dropped > 0) leftAt[n] = (leftAt[n] || 0) + dropped; }

  // abandoned leads: standalone leads collection is the source of truth (survives pruning);
  // fall back to recent sessions for any not yet mirrored there.
  const leadCutoff = days === 'today' ? new Date().setHours(0, 0, 0, 0) : cutoff;
  const leadMap = {};
  (leadDocs || []).forEach((l) => { const t = toMs(l.createdAt); if (!l.converted && (!t || t >= leadCutoff)) leadMap[l.id] = { id: l.id, name: l.name, phone: l.phone, email: l.email, device: l.device, maxStep: 2, startedAt: l.createdAt }; });
  rows.forEach((s) => { if (s.reachedDetails && !s.converted && !leadMap[s.id]) leadMap[s.id] = s; });
  const leads = Object.values(leadMap);

  // visits by hour of day (0–23)
  const byHour = Array(24).fill(0);
  rows.forEach((s) => { const t = toMs(s.startedAt); if (t) byHour[new Date(t).getHours()]++; });
  DA.byHour.forEach((v, i) => byHour[i] += v);
  const hourMax = Math.max(1, ...byHour);
  // device split
  const mobileCount = rows.filter((s) => s.device === 'mobile').length + DA.mobile;
  const desktopCount = total - mobileCount;

  // today
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();
  const todayVisits = rows.filter((s) => toMs(s.startedAt) >= todayMs).length;
  const todayOrders = rows.filter((s) => s.converted && toMs(s.convertedAt || s.startedAt) >= todayMs).length;

  // daily trend (within window)
  const dayKey = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const dayMap = { ...dailyByDate };
  rows.forEach((s) => { const t = toMs(s.startedAt); if (!t) return; const k = dayKey(t); if (!dayMap[k]) dayMap[k] = { v: 0, o: 0 }; dayMap[k].v++; if (s.converted) dayMap[k].o++; });
  const dailyDays = Math.min(days === 'today' ? 1 : days, 30);
  const daily = [];
  for (let i = dailyDays - 1; i >= 0; i--) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i); const k = dayKey(d.getTime()); daily.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, ...(dayMap[k] || { v: 0, o: 0 }) }); }
  const dailyMax = Math.max(1, ...daily.map((x) => x.v));

  // day of week (0=Sun)
  const dowNames = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  const byDow = Array(7).fill(0);
  rows.forEach((s) => { const t = toMs(s.startedAt); if (t) byDow[new Date(t).getDay()]++; });
  DA.byDow.forEach((v, i) => byDow[i] += v);
  const dowMax = Math.max(1, ...byDow);

  // traffic sources (from referrer)
  const sourceOf = (ref) => {
    if (!ref) return 'ישיר';
    try { const h = new URL(ref).hostname.replace('www.', ''); if (/instagram/.test(h)) return 'אינסטגרם'; if (/tiktok/.test(h)) return 'טיקטוק'; if (/facebook|fb\./.test(h)) return 'פייסבוק'; if (/youtube|youtu\.be/.test(h)) return 'יוטיוב'; if (/google/.test(h)) return 'גוגל'; if (/animoment/.test(h)) return 'ישיר'; return h; } catch (e) { return 'אחר'; }
  };
  const srcMap = { ...DA.sources };
  rows.forEach((s) => { const k = sourceOf(s.referrer); srcMap[k] = (srcMap[k] || 0) + 1; });
  const sources = Object.entries(srcMap).sort((a, b) => b[1] - a[1]);

  // avg time to complete (converted sessions)
  const durations = rows.filter((s) => s.converted && toMs(s.convertedAt) && toMs(s.startedAt)).map((s) => toMs(s.convertedAt) - toMs(s.startedAt));
  const avgMin = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 60000) : 0;

  // avg time on site (endedAt/updatedAt − startedAt across all sessions)
  const onSite = rows.map((s) => { const end = toMs(s.endedAt) || toMs(s.updatedAt); const st = toMs(s.startedAt); return (end && st && end > st) ? end - st : 0; }).filter((d) => d > 0);
  const onSiteSum = onSite.reduce((a, b) => a + b, 0) + DA.onSiteMs;
  const onSiteCnt = onSite.length + DA.onSiteCount;
  const avgOnSiteSec = onSiteCnt ? Math.round(onSiteSum / onSiteCnt / 1000) : 0;
  const fmtDur = (sec) => sec >= 60 ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')} דק׳` : `${sec} שנ׳`;
  // gallery visits
  const galleryVisits = rows.filter((s) => s.viewedGallery).length + DA.galleryViews;
  // avg scroll depth on the landing
  const scrolls = rows.map((s) => s.scrollDepth || 0).filter((v) => v > 0);
  const avgScroll = scrolls.length ? Math.round(scrolls.reduce((a, b) => a + b, 0) / scrolls.length) : 0;
  const reachedPricing = rows.filter((s) => (s.scrollDepth || 0) >= 60).length;
  // total on-site clicks + avg per session
  const totalClicks = rows.reduce((a, s) => a + (s.clicks || 0), 0) + DA.totalClicks;
  const avgClicks = total ? (totalClicks / total).toFixed(1) : 0;

  // where users clicked — aggregate the per-element breakdown across sessions.
  // click counts live either in a nested `clickBreakdown` object or as literal
  // dotted keys ("clickBreakdown.<name>"), so handle both.
  const clickMap = { ...DA.clickBreakdown };
  rows.forEach((s) => {
    if (s.clickBreakdown && typeof s.clickBreakdown === 'object') {
      Object.entries(s.clickBreakdown).forEach(([k, v]) => { clickMap[k] = (clickMap[k] || 0) + (v || 0); });
    }
    Object.keys(s).forEach((k) => { if (k.indexOf('clickBreakdown.') === 0) { const name = k.slice('clickBreakdown.'.length); clickMap[name] = (clickMap[name] || 0) + (s[k] || 0); } });
  });
  const clickRows = Object.entries(clickMap).sort((a, b) => b[1] - a[1]).slice(0, 25);
  const clickMax = Math.max(1, ...clickRows.map((c) => c[1]));

  // categorize clicks by area
  const clickCat = (raw) => {
    const n = (raw || '').replace(/_/g, ' ');
    if (/^▶|▶/.test(n)) return 'גלריה';
    if (/חבילה|מחיר|בחירת חבילה/.test(n)) return 'מחירים';
    if (/גלריה/.test(n)) return 'גלריה';
    if (/הירו|וידאו|סרטון מרגש|צפייה|הורדת/.test(n)) return 'הסרטון שלי';
    if (/איך זה עובד|הדגמה|דברים לבדוק|דברים שחשוב/.test(n)) return 'איך זה עובד';
    if (/לקוח|המלצה|תגובת/.test(n)) return 'לקוחות מספרים';
    if (/\?|שאלה|שאלות|תנאי|פרטיות|נגישות|האם|כמה תמונות|החזר/.test(n)) return 'שאלות ותשובות';
    if (/וואטסאפ|פנו|פייסבוק|אינסטגרם|טיקטוק|יוטיוב/.test(n)) return 'רשתות ויצירת קשר';
    if (/המשך לפרטים|בחירת תמונות|גררו|בחירה מהמכשיר|הסרה/.test(n)) return 'מסך העלאת תמונות';
    if (/ברכה|דילוג/.test(n)) return 'מסך ברכה';
    if (/המשך לתשלום|פרטים|שם|טלפון|אימייל/.test(n)) return 'מסך פרטים';
    if (/תשלום|שילמתי|Grow|אישור ושליחת|קופון|החלת קוד/.test(n)) return 'מסך תשלום';
    if (/הזמנה חדשה|סיום/.test(n)) return 'מסך סיום';
    if (/צרו סרטון|מתחילים|העלאת תמונות/.test(n)) return 'הזמנה (CTA)';
    if (/סגירה/.test(n)) return 'סגירת פופאפ';
    return 'אחר';
  };
  const catMap = {};
  Object.entries(clickMap).forEach(([name, c]) => { const k = clickCat(name); catMap[k] = (catMap[k] || 0) + c; });
  const clickCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  // weekday × hour heatmap (7 × 24)
  const heat = Array.from({ length: 7 }, () => Array(24).fill(0));
  rows.forEach((s) => { const t = toMs(s.startedAt); if (t) { const d = new Date(t); heat[d.getDay()][d.getHours()]++; } });
  const heatMax = Math.max(1, ...heat.flat());

  // donut helper — returns conic-gradient + legend data
  const PALETTE = ['#C4502E', '#E8A13C', '#3E6B33', '#6E5240', '#D96A38', '#B04A2C', '#8A5A12', '#A83E20'];
  const donut = (entries) => {
    const sum = entries.reduce((a, [, v]) => a + v, 0) || 1;
    let acc = 0;
    const stops = entries.map(([, v], i) => { const from = acc / sum * 360; acc += v; const to = acc / sum * 360; return `${PALETTE[i % PALETTE.length]} ${from}deg ${to}deg`; });
    return { bg: `conic-gradient(${stops.join(',')})`, sum };
  };
  const deviceEntries = [['נייד', mobileCount], ['מחשב', desktopCount]].filter((e) => e[1] > 0);

  const exportLeadsCsv = () => {
    const head = ['שם', 'טלפון', 'אימייל', 'הגיע עד', 'מכשיר', 'מקור', 'תאריך'];
    const lines = leads.map((s) => [s.name || '', s.phone || '', s.email || '', stepLabels[s.maxStep || 0], s.device === 'mobile' ? 'נייד' : 'מחשב', sourceOf(s.referrer), toMs(s.startedAt) ? new Date(toMs(s.startedAt)).toLocaleString('he-IL') : ''].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(','));
    const csv = '\uFEFF' + [head.join(','), ...lines].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `leads-${dayKey(Date.now())}.csv`; a.click();
  };

  const card = { background: CARD, borderRadius: 16, padding: '18px 20px', boxShadow: '0 14px 40px rgba(180,100,70,.12)' };
  const statNum = { fontSize: '2rem', fontWeight: 900, color: ACCENT };
  const statLbl = { fontSize: 13, color: BODY, fontWeight: 700 };
  const th = { padding: '10px 12px', fontSize: 12, color: BODY, textAlign: 'right', fontWeight: 800, borderBottom: `2px solid ${BORDER}`, whiteSpace: 'nowrap' };
  const td = { padding: '10px 12px', fontSize: 13, color: INK, borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' };

  if (sessions === null) return <div style={{ color: BODY, padding: 40, textAlign: 'center' }}>טוען…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <select value={days} onChange={(e) => setDays(e.target.value === 'today' ? 'today' : Number(e.target.value))} style={{ fontFamily: "'Heebo', sans-serif", fontSize: 14, padding: '8px 12px', borderRadius: 10, border: `1px solid ${BORDER}` }}>
          <option value="today">היום</option>
          <option value={1}>24 שעות</option>
          <option value={7}>7 ימים</option>
          <option value={30}>30 יום</option>
          <option value={3650}>הכול</option>
        </select>
        <button onClick={load} style={{ border: `1.5px solid ${ACCENT}`, background: '#fff', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 14, color: ACCENT, padding: '8px 16px', borderRadius: 999 }}>רענון</button>
      </div>

      {/* summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
        <div style={card}><div style={statNum}>{total}</div><div style={statLbl}>כניסות לאתר</div></div>
        <div style={card}><div style={statNum}>{reached(1)}</div><div style={statLbl}>התחילו הזמנה</div></div>
        <div style={card}><div style={statNum}>{leads.length}</div><div style={statLbl}>השאירו פרטים ולא שילמו</div></div>
        <div style={card}><div style={statNum}>{converted}</div><div style={statLbl}>הזמנות שהושלמו</div></div>
        <div style={card}><div style={statNum}>{convRate}%</div><div style={statLbl}>אחוז המרה</div></div>
        <div style={card}><div style={statNum}>{todayVisits}</div><div style={statLbl}>כניסות היום</div></div>
        <div style={card}><div style={statNum}>{todayOrders}</div><div style={statLbl}>הזמנות היום</div></div>
        <div style={card}><div style={statNum}>{avgMin}′</div><div style={statLbl}>זמן ממוצע להזמנה</div></div>
        <div style={card}><div style={statNum}>{fmtDur(avgOnSiteSec)}</div><div style={statLbl}>זמן שהייה ממוצע באתר</div></div>
        <div style={card}><div style={statNum}>{galleryVisits}</div><div style={statLbl}>צפו בגלריה</div></div>
        <div style={card}><div style={statNum}>{avgScroll}%</div><div style={statLbl}>גלילה ממוצעת בדף הבית</div></div>
        <div style={card}><div style={statNum}>{reachedPricing}</div><div style={statLbl}>הגיעו לאזור המחירים</div></div>
        <div style={card}><div style={statNum}>{totalClicks}</div><div style={statLbl}>קליקים באתר (ממוצע {avgClicks})</div></div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, background: '#F3E7D8', borderRadius: 20, padding: 4 }}>
        <button onClick={() => setTab('funnel')} style={{ border: 'none', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 14, color: tab === 'funnel' ? '#fff' : BODY, background: tab === 'funnel' ? ACCENT : 'transparent', padding: '7px 18px', borderRadius: 999 }}>משפך המרה</button>
        <button onClick={() => setTab('leads')} style={{ border: 'none', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 14, color: tab === 'leads' ? '#fff' : BODY, background: tab === 'leads' ? ACCENT : 'transparent', padding: '7px 18px', borderRadius: 999 }}>לידים ({leads.length})</button>
        <button onClick={() => setTab('hours')} style={{ border: 'none', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 14, color: tab === 'hours' ? '#fff' : BODY, background: tab === 'hours' ? ACCENT : 'transparent', padding: '7px 18px', borderRadius: 999 }}>שעות ומכשירים</button>
        <button onClick={() => setTab('trends')} style={{ border: 'none', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 14, color: tab === 'trends' ? '#fff' : BODY, background: tab === 'trends' ? ACCENT : 'transparent', padding: '7px 18px', borderRadius: 999 }}>מגמות ומקורות</button>
        <button onClick={() => setTab('clicks')} style={{ border: 'none', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 14, color: tab === 'clicks' ? '#fff' : BODY, background: tab === 'clicks' ? ACCENT : 'transparent', padding: '7px 18px', borderRadius: 999 }}>איפה לוחצים</button>
      </div>

      {tab === 'funnel' ? (
        <div style={card}>
          <div style={{ fontWeight: 800, color: INK, marginBottom: 16 }}>משפך — היכן המבקרים עוזבים</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1, 2, 3, 4].map((n) => {
              const dropped = n === 4 ? converted : (leftAt[n] || 0);
              const pct = total ? Math.round((dropped / total) * 100) : 0;
              return (
                <div key={n}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: INK, fontWeight: 700 }}>{n + 1}. {stepLabels[n]}</span>
                    <span style={{ color: BODY }}>{n === 4 ? `הושלמו: ${dropped}` : `עזבו כאן: ${dropped}`} ({pct}%)</span>
                  </div>
                  <div style={{ height: 12, background: '#F3E7D8', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct + '%', background: `linear-gradient(90deg, ${ACCENT}, #D96A38)`, borderRadius: 999 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : tab === 'leads' ? (
        <div style={{ ...card, overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button onClick={exportLeadsCsv} disabled={!leads.length} style={{ border: `1.5px solid ${ACCENT}`, background: '#fff', cursor: leads.length ? 'pointer' : 'not-allowed', opacity: leads.length ? 1 : .5, fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 13, color: ACCENT, padding: '7px 14px', borderRadius: 999 }}>ייצוא ל-CSV</button>
          </div>
          {leads.length === 0 ? (
            <div style={{ color: BODY, padding: 40, textAlign: 'center' }}>אין לידים נטושים בטווח הזמן שנבחר.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead><tr>
                <th style={th}>שם</th><th style={th}>טלפון</th><th style={th}>אימייל</th><th style={th}>הגיע עד</th><th style={th}>מכשיר</th><th style={th}>תאריך</th>
              </tr></thead>
              <tbody>
                {leads.map((s) => (
                  <tr key={s.id}>
                    <td style={td}>{s.name || '—'}</td>
                    <td style={td} dir="ltr">{s.phone || '—'}</td>
                    <td style={td} dir="ltr">{s.email || '—'}</td>
                    <td style={td}>{stepLabels[s.maxStep || 0]}</td>
                    <td style={td}>{s.device === 'mobile' ? 'נייד' : 'מחשב'}</td>
                    <td style={td}>{toMs(s.startedAt) ? new Date(toMs(s.startedAt)).toLocaleString('he-IL') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : tab === 'hours' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={card}>
            <div style={{ fontWeight: 800, color: INK, marginBottom: 16 }}>כניסות לפי שעה ביום</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 160 }}>
              {byHour.map((v, h) => (
                <div key={h} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 10, color: BODY }}>{v || ''}</div>
                  <div title={`${h}:00 — ${v} כניסות`} style={{ width: '100%', height: Math.round((v / hourMax) * 120) + 'px', minHeight: v ? 3 : 0, background: `linear-gradient(180deg, ${ACCENT}, #D96A38)`, borderRadius: '4px 4px 0 0' }} />
                  <div style={{ fontSize: 9, color: BODY }}>{h}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', fontSize: 12, color: BODY, marginTop: 8 }}>שעה ביום (0–23)</div>
          </div>
          <div style={card}>
            <div style={{ fontWeight: 800, color: INK, marginBottom: 16 }}>סוג מכשיר</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ width: 130, height: 130, borderRadius: '50%', background: deviceEntries.length ? donut(deviceEntries).bg : '#F3E7D8', flexShrink: 0, position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 22, borderRadius: '50%', background: CARD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: INK, fontSize: 20 }}>{total}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[['נייד', mobileCount], ['מחשב', desktopCount]].map(([lbl, c], i) => (
                  <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                    <span style={{ width: 14, height: 14, borderRadius: 4, background: PALETTE[i], flexShrink: 0 }} />
                    <span style={{ color: INK, fontWeight: 700 }}>{lbl}</span>
                    <span style={{ color: BODY }}>{c} ({total ? Math.round((c / total) * 100) : 0}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={card}>
            <div style={{ fontWeight: 800, color: INK, marginBottom: 16 }}>מפת חום — יום בשבוע × שעה</div>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: 560 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '28px repeat(24, 1fr)', gap: 2, alignItems: 'center' }}>
                  <div />
                  {Array.from({ length: 24 }, (_, h) => <div key={h} style={{ fontSize: 8, color: BODY, textAlign: 'center' }}>{h % 3 === 0 ? h : ''}</div>)}
                  {heat.map((rowH, d) => (
                    <React.Fragment key={d}>
                      <div style={{ fontSize: 11, color: BODY, fontWeight: 700, textAlign: 'center' }}>{dowNames[d]}</div>
                      {rowH.map((v, h) => (
                        <div key={h} title={`${dowNames[d]} ${h}:00 — ${v}`} style={{ aspectRatio: '1', borderRadius: 3, background: v ? `rgba(196,80,46,${0.15 + 0.85 * (v / heatMax)})` : '#F3E7D8' }} />
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'center', fontSize: 12, color: BODY, marginTop: 10 }}>צבע כהה יותר = יותר כניסות</div>
          </div>
        </div>
      ) : tab === 'trends' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={card}>
            <div style={{ fontWeight: 800, color: INK, marginBottom: 16 }}>כניסות לפי יום</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 160 }}>
              {daily.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 10, color: BODY }}>{d.v || ''}</div>
                  <div title={`${d.label}: ${d.v} כניסות, ${d.o} הזמנות`} style={{ width: '100%', height: Math.round((d.v / dailyMax) * 120) + 'px', minHeight: d.v ? 3 : 0, background: `linear-gradient(180deg, ${ACCENT}, #D96A38)`, borderRadius: '4px 4px 0 0', position: 'relative' }}>
                    {d.o > 0 && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: Math.round((d.o / dailyMax) * 120) + 'px', background: '#3E6B33', borderRadius: '0 0 4px 4px' }} />}
                  </div>
                  <div style={{ fontSize: 8, color: BODY, transform: 'rotate(-45deg)', whiteSpace: 'nowrap', height: 14 }}>{d.label}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', fontSize: 12, color: BODY, marginTop: 10 }}><span style={{ color: ACCENT }}>■</span> כניסות &nbsp; <span style={{ color: '#3E6B33' }}>■</span> הזמנות</div>
          </div>
          <div style={card}>
            <div style={{ fontWeight: 800, color: INK, marginBottom: 16 }}>מקורות תנועה</div>
            {sources.length === 0 ? <div style={{ color: BODY }}>אין נתונים.</div> : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ width: 130, height: 130, borderRadius: '50%', background: donut(sources).bg, flexShrink: 0, position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 22, borderRadius: '50%', background: CARD }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sources.map(([name, c], i) => (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                      <span style={{ width: 14, height: 14, borderRadius: 4, background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                      <span style={{ color: INK, fontWeight: 700 }}>{name}</span>
                      <span style={{ color: BODY }}>{c} ({total ? Math.round((c / total) * 100) : 0}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={card}>
            <div style={{ fontWeight: 800, color: INK, marginBottom: 16 }}>כניסות לפי יום בשבוע</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 130 }}>
              {byDow.map((v, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 11, color: BODY }}>{v || ''}</div>
                  <div style={{ width: '100%', height: Math.round((v / dowMax) * 90) + 'px', minHeight: v ? 3 : 0, background: `linear-gradient(180deg, ${ACCENT}, #D96A38)`, borderRadius: '4px 4px 0 0' }} />
                  <div style={{ fontSize: 12, color: BODY, fontWeight: 700 }}>{dowNames[i]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={card}>
          <div style={{ fontWeight: 800, color: INK, marginBottom: 4 }}>איפה לוחצים באתר</div>
          <div style={{ color: BODY, fontSize: 13, marginBottom: 16 }}>הכפתורים והקישורים הכי נלחצים ({totalClicks} קליקים בסך הכול)</div>
          {clickCats.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontWeight: 700, color: INK, fontSize: 13, marginBottom: 10 }}>לפי אזור בעמוד</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {clickCats.map(([name, c], i) => {
                  const tot = clickCats.reduce((a, [, v]) => a + v, 0) || 1;
                  const pct = Math.round((c / tot) * 100);
                  return (
                    <div key={name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span style={{ color: INK, fontWeight: 700 }}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: PALETTE[i % PALETTE.length], marginLeft: 6 }} />{name}</span>
                        <span style={{ color: BODY }}>{c} ({pct}%)</span>
                      </div>
                      <div style={{ height: 10, background: '#F3E7D8', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: pct + '%', background: PALETTE[i % PALETTE.length], borderRadius: 999 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {clickRows.length === 0 ? (
            <div style={{ color: BODY, padding: 30, textAlign: 'center' }}>אין נתוני קליקים בטווח הזמן שנבחר.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, background: '#F3E7D8', borderRadius: 20, padding: 4 }}>
                {['הכול', ...clickCats.map(([n]) => n)].map((cn) => (
                  <button key={cn} onClick={() => setClickCatSel(cn)} style={{ border: 'none', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 13, color: clickCatSel === cn ? '#fff' : BODY, background: clickCatSel === cn ? ACCENT : 'transparent', padding: '6px 14px', borderRadius: 999 }}>{cn}</button>
                ))}
              </div>
              {(clickCatSel === 'הכול' ? clickCats.map(([n]) => n) : [clickCatSel]).map((catName, ci) => {
                const inCat = clickRows.filter(([n]) => clickCat(n) === catName);
                if (!inCat.length) return null;
                const color = PALETTE[(clickCats.findIndex(([n]) => n === catName)) % PALETTE.length];
                return (
                  <div key={catName}>
                    <div style={{ fontWeight: 800, color: INK, fontSize: 13, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />{catName}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 16 }}>
                      {inCat.map(([name, c]) => {
                        const pct = Math.round((c / clickMax) * 100);
                        return (
                          <div key={name}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                              <span style={{ color: INK, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '75%' }}>{name}</span>
                              <span style={{ color: BODY }}>{c}</span>
                            </div>
                            <div style={{ height: 12, background: '#F3E7D8', borderRadius: 999, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 999 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const [tab, setTab] = useState('orders'); // orders | settings
  const [orders, setOrders] = useState(null);
  const [productsById, setProductsById] = useState({});
  const [filter, setFilter] = useState('all');

  const load = async () => {
    const [o, p] = await Promise.all([listOrders(), listProducts()]);
    const map = {}; p.forEach((x) => { map[x.orderId] = x; });
    setProductsById(map); setOrders(o);
  };
  useEffect(() => { load(); }, []);

  const th = { padding: '10px 12px', fontSize: 12, color: BODY, textAlign: 'right', fontWeight: 800, borderBottom: `2px solid ${BORDER}`, whiteSpace: 'nowrap' };
  const shown = (orders || []).filter((o) => filter === 'all' || (o.status || 'new') === filter);

  return (
    <div style={{ minHeight: '100vh', background: BG, direction: 'rtl', padding: '20px 12px 60px', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <h1 style={{ fontWeight: 800, fontSize: '1.5rem', color: INK, margin: 0 }}>ניהול</h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, background: '#F3E7D8', borderRadius: 20, padding: 4 }}>
            <button onClick={() => setTab('orders')} style={{ border: 'none', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 14, color: tab === 'orders' ? '#fff' : BODY, background: tab === 'orders' ? ACCENT : 'transparent', padding: '7px 18px', borderRadius: 999 }}>הזמנות</button>
            <button onClick={() => setTab('settings')} style={{ border: 'none', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 14, color: tab === 'settings' ? '#fff' : BODY, background: tab === 'settings' ? ACCENT : 'transparent', padding: '7px 18px', borderRadius: 999 }}>הגדרות האתר</button>
            <button onClick={() => setTab('gallery')} style={{ border: 'none', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 14, color: tab === 'gallery' ? '#fff' : BODY, background: tab === 'gallery' ? ACCENT : 'transparent', padding: '7px 18px', borderRadius: 999 }}>גלריה</button>
            <button onClick={() => setTab('monitoring')} style={{ border: 'none', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 14, color: tab === 'monitoring' ? '#fff' : BODY, background: tab === 'monitoring' ? ACCENT : 'transparent', padding: '7px 18px', borderRadius: 999 }}>מעקב</button>
            <button onClick={() => setTab('quotes')} style={{ border: 'none', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 14, color: tab === 'quotes' ? '#fff' : BODY, background: tab === 'quotes' ? ACCENT : 'transparent', padding: '7px 18px', borderRadius: 999 }}>הצעות מחיר</button>
          </div>
          <div style={{ flex: 1 }} />
          {tab === 'orders' && <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ fontFamily: "'Heebo', sans-serif", fontSize: 14, padding: '8px 12px', borderRadius: 10, border: `1px solid ${BORDER}` }}>
            <option value="all">הכול</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>}
          {tab === 'orders' && <button onClick={load} style={{ border: `1.5px solid ${ACCENT}`, background: '#fff', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 14, color: ACCENT, padding: '8px 16px', borderRadius: 999 }}>רענון</button>}
          <button onClick={() => adminLogout()} style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 14, color: BODY }}>יציאה</button>
        </div>

        {tab === 'settings' ? <SettingsEditor /> : tab === 'gallery' ? <GalleryEditor /> : tab === 'monitoring' ? <MonitoringPanel /> : tab === 'quotes' ? <QuotesPanel /> : (
          orders === null ? (
            <div style={{ color: BODY, padding: 40, textAlign: 'center' }}>טוען…</div>
          ) : shown.length === 0 ? (
            <div style={{ color: BODY, padding: 40, textAlign: 'center' }}>אין הזמנות להצגה.</div>
          ) : (
            <div style={{ background: CARD, borderRadius: 16, overflow: 'auto', boxShadow: '0 14px 40px rgba(180,100,70,.12)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                <thead>
                  <tr>
                    <th style={th}>מספר הזמנה</th><th style={th}>שם</th><th style={th}>קשר</th>
                    <th style={th}>חבילה</th><th style={th}>מוזיקה</th><th style={th}>ברכה</th>
                    <th style={th}>סטטוס</th><th style={th}>וידאו סופי</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((o) => <OrderRow key={o.id} order={o} product={productsById[o.orderId]} onSaved={load} />)}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default function AdminApp() {
  const [user, setUser] = useState(undefined); // undefined = loading, null = logged out

  useEffect(() => onAdminAuth(setUser), []);

  if (!config.firebase || !config.firebase.projectId) {
    return <div style={{ padding: 40, textAlign: 'center', fontFamily: "'Heebo', sans-serif", direction: 'rtl' }}>Firebase לא מוגדר ב-config.js.</div>;
  }
  if (user === undefined) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG, color: BODY }}>טוען…</div>;
  if (!user) return <Login onDone={() => {}} />;
  return <Dashboard />;
}

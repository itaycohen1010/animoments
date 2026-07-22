import React, { useState, useEffect } from 'react';
import { config } from '../config.js';
import { adminLogin, adminLogout, onAdminAuth, listOrders, listProducts, saveProduct, setOrderStatus, getSettings, saveSettings, listGallery, saveGalleryItem, deleteGalleryItem, listSessions } from '../firebase.js';

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
        <div style={{ marginBottom: 14 }}><span style={label}>תמונת פופאפ מבצע (URL, ריק = ללא)</span><input style={ltrInp} value={data.promoImage || ''} onChange={(e) => set('promoImage', e.target.value)} /></div>
        <div><span style={label}>טקסט פופאפ מבצע (אם אין תמונה)</span><textarea style={{ ...inp, minHeight: 60 }} value={data.promoPopup || ''} onChange={(e) => set('promoPopup', e.target.value)} /></div>
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
            </div>
            <span style={label}>שורות תיאור (שורה לכל שורת תכונה)</span>
            <textarea style={{ ...inp, minHeight: 72 }} value={(p.features || []).join('\n')} onChange={(e) => setPkg(i, 'features', e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))} />
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
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', paddingBottom: 12, marginBottom: 12, borderBottom: `1px solid ${BORDER}` }}>
            <div><span style={label}>כותרת</span><input style={{ ...inp, width: 180 }} value={ex.title || ''} onChange={(e) => setEx(i, 'title', e.target.value)} /></div>
            <div style={{ flex: 1, minWidth: 200 }}><span style={label}>קישור וידאו</span><input style={ltrInp} value={ex.video || ''} onChange={(e) => setEx(i, 'video', e.target.value)} /></div>
            <div style={{ flex: 1, minWidth: 200 }}><span style={label}>תמונה (URL)</span><input style={ltrInp} value={ex.img || ''} onChange={(e) => setEx(i, 'img', e.target.value)} /></div>
            <button onClick={() => delEx(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: ACCENT, fontSize: 20, paddingBottom: 8 }}>×</button>
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
  const [draft, setDraft] = useState({ title: '', video: '', img: '' });
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editDraft, setEditDraft] = useState({ title: '', video: '', img: '' });

  const load = () => listGallery().then(setItems);
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!draft.title.trim() && !draft.video.trim()) return;
    setBusy(true);
    try { await saveGalleryItem(draft); setDraft({ title: '', video: '', img: '' }); await load(); }
    catch (e) { alert('שמירה נכשלה: ' + e.message); }
    finally { setBusy(false); }
  };
  const del = async (id) => {
    if (!confirm('למחוק את הסרטון מהגלריה?')) return;
    try { await deleteGalleryItem(id); await load(); } catch (e) { alert('מחיקה נכשלה: ' + e.message); }
  };
  const startEdit = (g) => { setEditId(g.id); setEditDraft({ title: g.title || '', video: g.video || '', img: g.img || '' }); };
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
          <button onClick={add} disabled={busy} style={{ border: 'none', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 800, fontSize: 14, color: '#fff', background: ACCENT, padding: '10px 20px', borderRadius: 999, opacity: busy ? .6 : 1 }}>הוספה</button>
        </div>
        <div style={{ fontSize: 12, color: BODY, marginTop: 10 }}>אם לא הוזנה תמונה, נשתמש בתמונה הממוזערת של יוטיוב אוטומטית.</div>
      </div>

      <div style={box}>
        <h3 style={{ margin: '0 0 16px', color: INK, fontSize: '1.1rem' }}>סרטונים בגלריה</h3>
        {items === null ? <div style={{ color: BODY }}>טוען…</div>
          : items.length === 0 ? <div style={{ color: BODY }}>אין סרטונים עדיין.</div>
          : items.map((g) => (
            <div key={g.id} style={{ display: 'flex', gap: 12, alignItems: 'center', paddingBottom: 12, marginBottom: 12, borderBottom: `1px solid ${BORDER}` }}>
              {editId === g.id ? (
                <>
                  <div style={{ width: 180 }}><input style={{ ...inp, direction: 'rtl' }} value={editDraft.title} onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })} placeholder="כותרת" /></div>
                  <div style={{ flex: 1, minWidth: 180 }}><input style={{ ...inp, direction: 'ltr' }} value={editDraft.video} onChange={(e) => setEditDraft({ ...editDraft, video: e.target.value })} placeholder="קישור וידאו" /></div>
                  <div style={{ flex: 1, minWidth: 160 }}><input style={{ ...inp, direction: 'ltr' }} value={editDraft.img} onChange={(e) => setEditDraft({ ...editDraft, img: e.target.value })} placeholder="תמונה (URL)" /></div>
                  <button onClick={() => saveEdit(g.id)} disabled={busy} style={{ border: 'none', background: ACCENT, cursor: 'pointer', color: '#fff', fontFamily: "'Heebo', sans-serif", fontWeight: 800, fontSize: 13, padding: '8px 16px', borderRadius: 999, opacity: busy ? .6 : 1 }}>שמירה</button>
                  <button onClick={cancelEdit} style={{ border: `1px solid ${BORDER}`, background: '#fff', cursor: 'pointer', color: BODY, fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 13, padding: '8px 14px', borderRadius: 999 }}>ביטול</button>
                </>
              ) : (
                <>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: INK, fontSize: 14 }}>{g.title || '(ללא כותרת)'}</div>
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

function MonitoringPanel() {
  const [sessions, setSessions] = useState(null);
  const [days, setDays] = useState(7);
  const [tab, setTab] = useState('funnel'); // funnel | leads

  const load = () => { setSessions(null); listSessions(1000).then(setSessions); };
  useEffect(() => { load(); }, []);

  const stepLabels = ['כניסה לאתר', 'בחירת תמונות', 'מילוי פרטים', 'תשלום', 'סיום ✓'];
  const cutoff = Date.now() - days * 86400000;
  const toMs = (t) => (t && t.seconds ? t.seconds * 1000 : (t && t.toMillis ? t.toMillis() : 0));
  const rows = (sessions || []).filter((s) => { const t = toMs(s.startedAt); return !t || t >= cutoff; });

  const total = rows.length;
  const reached = (n) => rows.filter((s) => (s.maxStep || 0) >= n).length;
  const converted = rows.filter((s) => s.converted).length;
  const leads = rows.filter((s) => s.reachedDetails && !s.converted);
  const convRate = total ? Math.round((converted / total) * 100) : 0;

  // drop-off = where each session's furthest step landed
  const leftAt = {};
  rows.forEach((s) => { const m = s.converted ? 4 : (s.maxStep || 0); leftAt[m] = (leftAt[m] || 0) + 1; });

  // visits by hour of day (0–23)
  const byHour = Array(24).fill(0);
  rows.forEach((s) => { const t = toMs(s.startedAt); if (t) byHour[new Date(t).getHours()]++; });
  const hourMax = Math.max(1, ...byHour);
  // device split
  const mobileCount = rows.filter((s) => s.device === 'mobile').length;
  const desktopCount = total - mobileCount;

  // today
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();
  const todayVisits = rows.filter((s) => toMs(s.startedAt) >= todayMs).length;
  const todayOrders = rows.filter((s) => s.converted && toMs(s.convertedAt || s.startedAt) >= todayMs).length;

  // daily trend (within window)
  const dayKey = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const dayMap = {};
  rows.forEach((s) => { const t = toMs(s.startedAt); if (!t) return; const k = dayKey(t); if (!dayMap[k]) dayMap[k] = { v: 0, o: 0 }; dayMap[k].v++; if (s.converted) dayMap[k].o++; });
  const dailyDays = Math.min(days, 30);
  const daily = [];
  for (let i = dailyDays - 1; i >= 0; i--) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i); const k = dayKey(d.getTime()); daily.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, ...(dayMap[k] || { v: 0, o: 0 }) }); }
  const dailyMax = Math.max(1, ...daily.map((x) => x.v));

  // day of week (0=Sun)
  const dowNames = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  const byDow = Array(7).fill(0);
  rows.forEach((s) => { const t = toMs(s.startedAt); if (t) byDow[new Date(t).getDay()]++; });
  const dowMax = Math.max(1, ...byDow);

  // traffic sources (from referrer)
  const sourceOf = (ref) => {
    if (!ref) return 'ישיר';
    try { const h = new URL(ref).hostname.replace('www.', ''); if (/instagram/.test(h)) return 'אינסטגרם'; if (/tiktok/.test(h)) return 'טיקטוק'; if (/facebook|fb\./.test(h)) return 'פייסבוק'; if (/youtube|youtu\.be/.test(h)) return 'יוטיוב'; if (/google/.test(h)) return 'גוגל'; if (/animoment/.test(h)) return 'ישיר'; return h; } catch (e) { return 'אחר'; }
  };
  const srcMap = {};
  rows.forEach((s) => { const k = sourceOf(s.referrer); srcMap[k] = (srcMap[k] || 0) + 1; });
  const sources = Object.entries(srcMap).sort((a, b) => b[1] - a[1]);

  // avg time to complete (converted sessions)
  const durations = rows.filter((s) => s.converted && toMs(s.convertedAt) && toMs(s.startedAt)).map((s) => toMs(s.convertedAt) - toMs(s.startedAt));
  const avgMin = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 60000) : 0;

  // avg time on site (endedAt/updatedAt − startedAt across all sessions)
  const onSite = rows.map((s) => { const end = toMs(s.endedAt) || toMs(s.updatedAt); const st = toMs(s.startedAt); return (end && st && end > st) ? end - st : 0; }).filter((d) => d > 0);
  const avgOnSiteSec = onSite.length ? Math.round(onSite.reduce((a, b) => a + b, 0) / onSite.length / 1000) : 0;
  const fmtDur = (sec) => sec >= 60 ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')} דק׳` : `${sec} שנ׳`;
  // gallery visits
  const galleryVisits = rows.filter((s) => s.viewedGallery).length;

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
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ fontFamily: "'Heebo', sans-serif", fontSize: 14, padding: '8px 12px', borderRadius: 10, border: `1px solid ${BORDER}` }}>
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
      </div>

      <div style={{ display: 'flex', gap: 6, background: '#F3E7D8', borderRadius: 999, padding: 4, width: 'fit-content' }}>
        <button onClick={() => setTab('funnel')} style={{ border: 'none', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 14, color: tab === 'funnel' ? '#fff' : BODY, background: tab === 'funnel' ? ACCENT : 'transparent', padding: '7px 18px', borderRadius: 999 }}>משפך המרה</button>
        <button onClick={() => setTab('leads')} style={{ border: 'none', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 14, color: tab === 'leads' ? '#fff' : BODY, background: tab === 'leads' ? ACCENT : 'transparent', padding: '7px 18px', borderRadius: 999 }}>לידים ({leads.length})</button>
        <button onClick={() => setTab('hours')} style={{ border: 'none', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 14, color: tab === 'hours' ? '#fff' : BODY, background: tab === 'hours' ? ACCENT : 'transparent', padding: '7px 18px', borderRadius: 999 }}>שעות ומכשירים</button>
        <button onClick={() => setTab('trends')} style={{ border: 'none', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 14, color: tab === 'trends' ? '#fff' : BODY, background: tab === 'trends' ? ACCENT : 'transparent', padding: '7px 18px', borderRadius: 999 }}>מגמות ומקורות</button>
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
            {[['נייד', mobileCount], ['מחשב', desktopCount]].map(([lbl, c]) => {
              const pct = total ? Math.round((c / total) * 100) : 0;
              return (
                <div key={lbl} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: INK, fontWeight: 700 }}>{lbl}</span>
                    <span style={{ color: BODY }}>{c} ({pct}%)</span>
                  </div>
                  <div style={{ height: 12, background: '#F3E7D8', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct + '%', background: `linear-gradient(90deg, ${ACCENT}, #D96A38)`, borderRadius: 999 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
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
            {sources.length === 0 ? <div style={{ color: BODY }}>אין נתונים.</div> : sources.map(([name, c]) => {
              const pct = total ? Math.round((c / total) * 100) : 0;
              return (
                <div key={name} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: INK, fontWeight: 700 }}>{name}</span>
                    <span style={{ color: BODY }}>{c} ({pct}%)</span>
                  </div>
                  <div style={{ height: 12, background: '#F3E7D8', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct + '%', background: `linear-gradient(90deg, ${ACCENT}, #D96A38)`, borderRadius: 999 }} />
                  </div>
                </div>
              );
            })}
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
    <div style={{ minHeight: '100vh', background: BG, direction: 'rtl', padding: '20px 16px 60px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <h1 style={{ fontWeight: 800, fontSize: '1.5rem', color: INK, margin: 0 }}>ניהול</h1>
          <div style={{ display: 'flex', gap: 6, background: '#F3E7D8', borderRadius: 999, padding: 4 }}>
            <button onClick={() => setTab('orders')} style={{ border: 'none', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 14, color: tab === 'orders' ? '#fff' : BODY, background: tab === 'orders' ? ACCENT : 'transparent', padding: '7px 18px', borderRadius: 999 }}>הזמנות</button>
            <button onClick={() => setTab('settings')} style={{ border: 'none', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 14, color: tab === 'settings' ? '#fff' : BODY, background: tab === 'settings' ? ACCENT : 'transparent', padding: '7px 18px', borderRadius: 999 }}>הגדרות האתר</button>
            <button onClick={() => setTab('gallery')} style={{ border: 'none', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 14, color: tab === 'gallery' ? '#fff' : BODY, background: tab === 'gallery' ? ACCENT : 'transparent', padding: '7px 18px', borderRadius: 999 }}>גלריה</button>
            <button onClick={() => setTab('monitoring')} style={{ border: 'none', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 14, color: tab === 'monitoring' ? '#fff' : BODY, background: tab === 'monitoring' ? ACCENT : 'transparent', padding: '7px 18px', borderRadius: 999 }}>מעקב</button>
          </div>
          <div style={{ flex: 1 }} />
          {tab === 'orders' && <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ fontFamily: "'Heebo', sans-serif", fontSize: 14, padding: '8px 12px', borderRadius: 10, border: `1px solid ${BORDER}` }}>
            <option value="all">הכול</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>}
          {tab === 'orders' && <button onClick={load} style={{ border: `1.5px solid ${ACCENT}`, background: '#fff', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 14, color: ACCENT, padding: '8px 16px', borderRadius: 999 }}>רענון</button>}
          <button onClick={() => adminLogout()} style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 14, color: BODY }}>יציאה</button>
        </div>

        {tab === 'settings' ? <SettingsEditor /> : tab === 'gallery' ? <GalleryEditor /> : tab === 'monitoring' ? <MonitoringPanel /> : (
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

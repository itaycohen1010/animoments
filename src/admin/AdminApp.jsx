import React, { useState, useEffect } from 'react';
import { config } from '../config.js';
import { adminLogin, adminLogout, onAdminAuth, listOrders, listProducts, saveProduct, setOrderStatus, getSettings, saveSettings, listGallery, saveGalleryItem, deleteGalleryItem } from '../firebase.js';

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
          </div>
          <div style={{ flex: 1 }} />
          {tab === 'orders' && <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ fontFamily: "'Heebo', sans-serif", fontSize: 14, padding: '8px 12px', borderRadius: 10, border: `1px solid ${BORDER}` }}>
            <option value="all">הכול</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>}
          {tab === 'orders' && <button onClick={load} style={{ border: `1.5px solid ${ACCENT}`, background: '#fff', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 14, color: ACCENT, padding: '8px 16px', borderRadius: 999 }}>רענון</button>}
          <button onClick={() => adminLogout()} style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 14, color: BODY }}>יציאה</button>
        </div>

        {tab === 'settings' ? <SettingsEditor /> : tab === 'gallery' ? <GalleryEditor /> : (
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

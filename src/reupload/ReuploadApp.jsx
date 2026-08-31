import React, { useState, useRef, useEffect } from 'react';
import { config, colors as C } from '../config.js';
import { pillBtn } from '../styles.js';
import { fetchSettings, sha256Hex, saveOrder } from '../firebase.js';

// Standalone photo upload page (reupload.html) — the simplest thing that works.
// No order id, no payment, no database: photos go into a fresh Cloudinary folder
// named by the customer's name + timestamp, which we link to the order manually.
export default function ReuploadApp() {
  // The page is CLOSED by default and only opens when we flip `reuploadOpen`
  // in the admin (settings/site). When a password is set there too, the customer
  // must enter it before the upload form appears.
  const [gate, setGate] = useState('checking'); // checking | locked | open | closed
  const [hashes, setHashes] = useState([]); // [{hash,label}] — any one grants access
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState(false);
  const [tries, setTries] = useState(0);
  useEffect(() => {
    fetchSettings()
      .then(async (s) => {
        if (!s || !s.reuploadOpen) { setGate('closed'); return; }
        const list = Array.isArray(s.reuploadPasswordHashes) ? s.reuploadPasswordHashes
          : (s.reuploadPasswordHash ? [{ hash: s.reuploadPasswordHash, label: '' }] : []); // legacy single
        setHashes(list);
        if (!list.length) { setGate('open'); return; }
        const ok = sessionStorage.getItem('reuploadOk');
        setGate(list.some((p) => p.hash === ok) ? 'open' : 'locked');
      })
      .catch(() => setGate('closed'));
  }, []);
  const submitPw = async (e) => {
    e.preventDefault();
    if (tries >= 5) return;
    const h = await sha256Hex(pwInput.trim());
    const match = hashes.find((p) => p.hash === h);
    if (match) {
      try { sessionStorage.setItem('reuploadOk', h); } catch (err) { /* ignore */ }
      setGate('open'); setPwError(false);
    } else { setPwError(true); setTries((n) => n + 1); }
  };
  const [photos, setPhotos] = useState([]);
  const [name, setName] = useState('');
  const [orderId, setOrderId] = useState('');
  const [dragIndex, setDragIndex] = useState(null);
  const [dzOver, setDzOver] = useState(false);
  const [state, setState] = useState('form'); // form | uploading | done | failed
  const [done, setDone] = useState(0);
  const [errDetail, setErrDetail] = useState('');
  const fileRef = useRef(null);
  const folderRef = useRef(null);
  const orderRef = useRef(null);
  const wa = (config.socialLinks?.whatsapp || '').trim();

  const addFiles = (list) => {
    setDzOver(false);
    const imgs = Array.from(list || []).filter((f) => f.type.startsWith('image/'));
    if (!imgs.length) return;
    setPhotos((prev) => [...prev, ...imgs.map((f) => ({ id: Math.random().toString(36).slice(2), file: f, url: URL.createObjectURL(f) }))]);
  };
  const reorder = (from, to) => {
    if (from == null || to == null || from === to) return;
    setPhotos((prev) => { const n = [...prev]; const [m] = n.splice(from, 1); n.splice(to, 0, m); return n; });
    setDragIndex(to);
  };

  const upload = async () => {
    if (!photos.length) return;
    setState('uploading'); setDone(0); setErrDetail('');
    const cloud = (config.cloudinary.cloudName || '').trim();
    const preset = (config.cloudinary.uploadPreset || '').trim();
    if (!cloud || !preset) { setState('failed'); return; }

    if (!folderRef.current) {
      // real order number, same format as the site — so this upload behaves like an
      // order: it shows up in the admin and can be collected from הסרטון שלי.
      const d = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
      const id = `AM-${pad(d.getDate())}${pad(d.getMonth() + 1)}${String(d.getFullYear()).slice(2)}-${rnd}`;
      const who = (name.trim() || 'ללא-שם').replace(/\s+/g, '-');
      const stamp = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
      orderRef.current = id;
      setOrderId(id);
      folderRef.current = `video-orders/${id}_${who}-${stamp}`;
    }
    const folder = folderRef.current;
    const base = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}`;

    try {
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        if (p.uploaded) { setDone(i + 1); continue; }
        let res = null, lastErr = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const fd = new FormData();
            fd.append('file', p.file);
            fd.append('upload_preset', preset);
            fd.append('folder', folder);
            fd.append('asset_folder', folder); // dynamic-folder mode
            fd.append('tags', folder.split('/')[1]);
            fd.append('public_id', String(i + 1).padStart(3, '0'));
            // zero-padded so Cloudinary's A–Z sort matches the real order
            fd.append('context', `order=${i + 1}|from=${name.trim()}`);
            res = await fetch(`${base}/image/upload`, { method: 'POST', body: fd });
            if (res.ok) break;
            let msg = '';
            try { msg = (await res.clone().json())?.error?.message || ''; } catch (e2) { /* ignore */ }
            lastErr = new Error(`${res.status}${msg ? ' · ' + msg : ''}`);
          } catch (e) { lastErr = e; }
          await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
        }
        if (!res || !res.ok) throw (lastErr || new Error('upload failed'));
        p.uploaded = true;
        setDone(i + 1);
      }
      // register it as a real order so it appears in the admin and can be collected
      // from הסרטון שלי by its order number
      saveOrder({
        orderId: orderRef.current, name: name.trim(), phone: '', email: '',
        packageKey: 'manual', price: 0, photoCount: photos.length,
        folder: folderRef.current, status: 'new'
      });
      setState('done');
    } catch (e) {
      console.warn('upload failed', e);
      setErrDetail(String(e && e.message || e));
      setState('failed');
    }
  };

  const card = { background: '#fff', border: `1px solid ${C.border}`, borderRadius: 20, padding: '22px', marginBottom: 18 };

  if (gate === 'checking') {
    return <Shell><div style={{ ...card, textAlign: 'center', padding: '46px 24px', color: C.body }}>טוען…</div></Shell>;
  }
  if (gate === 'locked') {
    return (
      <Shell>
        <form onSubmit={submitPw} style={{ ...card, textAlign: 'center', padding: '46px 24px' }}>
          <div style={{ fontSize: 46, marginBottom: 12 }}>🔑</div>
          <h1 style={{ fontWeight: 900, fontSize: 'clamp(1.3rem, 5vw, 1.7rem)', margin: '0 0 10px' }}>הזינו את הסיסמה</h1>
          <p style={{ color: C.body, fontSize: '1rem', lineHeight: 1.8, margin: '0 0 20px' }}>
            הדף מוגן בסיסמה שקיבלתם מאיתנו.
          </p>
          <input type="password" value={pwInput} autoFocus
            onChange={(e) => { setPwInput(e.target.value); setPwError(false); }}
            placeholder="סיסמה"
            style={{ width: '100%', maxWidth: 280, boxSizing: 'border-box', fontFamily: "'Heebo', sans-serif", fontSize: 16, textAlign: 'center', padding: '12px 16px', borderRadius: 14, border: `1.5px solid ${pwError ? C.accent : C.borderStrong}`, background: '#FFFDFA', color: C.ink, marginBottom: 14, display: 'block', marginInline: 'auto' }} />
          {pwError && <div style={{ color: C.accentDark, fontWeight: 700, fontSize: '.9rem', marginBottom: 14 }}>{tries >= 5 ? 'יותר מדי ניסיונות — רעננו את הדף' : 'סיסמה שגויה, נסו שוב'}</div>}
          <button type="submit" disabled={tries >= 5} style={{ ...pillBtn, padding: '12px 34px', opacity: tries >= 5 ? .5 : 1, cursor: tries >= 5 ? 'not-allowed' : 'pointer' }}>כניסה</button>
        </form>
      </Shell>
    );
  }
  if (gate === 'closed') {
    return (
      <Shell>
        <div style={{ ...card, textAlign: 'center', padding: '46px 24px' }}>
          <div style={{ fontSize: 46, marginBottom: 12 }}>🔒</div>
          <h1 style={{ fontWeight: 900, fontSize: 'clamp(1.3rem, 5vw, 1.7rem)', margin: '0 0 10px' }}>הדף סגור כרגע</h1>
          <p style={{ color: C.body, fontSize: '1rem', lineHeight: 1.8, margin: '0 0 18px' }}>
            דף העלאת התמונות נפתח רק לפי תיאום איתנו. אם ביקשנו מכם להעלות תמונות מחדש, צרו איתנו קשר ונפתח אותו עבורכם.
          </p>
          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" style={{ ...pillBtn, background: '#25D366', textDecoration: 'none', display: 'inline-block' }}>כתבו לנו בוואטסאפ</a>}
        </div>
      </Shell>
    );
  }

  if (state === 'done') {
    return (
      <Shell>
        <div style={{ ...card, textAlign: 'center', padding: '46px 24px' }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>🎉</div>
          <h1 style={{ fontWeight: 900, fontSize: 'clamp(1.5rem, 5vw, 2rem)', margin: '0 0 12px' }}>התמונות התקבלו ✓</h1>
          <div style={{ background: '#FBE4D7', borderRadius: 16, padding: '16px 18px', margin: '0 auto 18px', maxWidth: 340 }}>
            <div style={{ color: C.body, fontSize: '.85rem', marginBottom: 4 }}>מספר ההזמנה שלכם</div>
            <div style={{ fontWeight: 900, fontSize: '1.5rem', color: C.accentDark, direction: 'ltr', letterSpacing: '.5px' }}>{orderId}</div>
            <div style={{ color: C.body, fontSize: '.82rem', marginTop: 6, lineHeight: 1.6 }}>שמרו אותו — איתו תוכלו לאסוף את הסרטון כשיהיה מוכן.</div>
          </div>
          <p style={{ color: C.body, fontSize: '1rem', lineHeight: 1.8, margin: '0 0 16px' }}>
            {photos.length} תמונות נקלטו במערכת. אנחנו ממשיכים בהפקת הסרטון ונעדכן אתכם כשהוא מוכן.
          </p>
          <a href={`/?lookup=1&order=${encodeURIComponent(orderId)}`} style={{ ...pillBtn, padding: '12px 30px', textDecoration: 'none', display: 'inline-block' }}>מעבר ל״הסרטון שלי״</a>
        </div>
      </Shell>
    );
  }

  if (state === 'uploading' || state === 'failed') {
    const failed = state === 'failed';
    return (
      <Shell>
        <div style={{ ...card, textAlign: 'center', padding: '46px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{failed ? '😕' : '⏳'}</div>
          <h1 style={{ fontWeight: 900, fontSize: 'clamp(1.4rem, 5vw, 1.9rem)', margin: '0 0 10px' }}>
            {failed ? 'ההעלאה נקטעה' : 'מעלים את התמונות…'}
          </h1>
          <p style={{ color: C.body, fontSize: '1rem', lineHeight: 1.8, margin: '0 0 20px' }}>
            {failed
              ? 'לא כל התמונות הועלו. אפשר לנסות שוב — תמונות שכבר עלו לא יועלו פעמיים.'
              : `${done} מתוך ${photos.length} — נא לא לסגור את החלון.`}
          </p>
          {failed && errDetail && (
            <div style={{ background: C.errorBg, color: C.accentDark, fontSize: '.82rem', direction: 'ltr', textAlign: 'left', borderRadius: 12, padding: '10px 14px', margin: '0 auto 18px', maxWidth: 460, wordBreak: 'break-word' }}>{errDetail}</div>
          )}
          {!failed ? (
            <div style={{ height: 10, background: C.cream, borderRadius: 999, overflow: 'hidden', maxWidth: 320, margin: '0 auto' }}>
              <div style={{ height: '100%', width: `${Math.round((done / Math.max(photos.length, 1)) * 100)}%`, background: C.accent, transition: 'width .3s ease' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={upload} style={pillBtn}>נסו שוב</button>
              {wa && <a href={wa} target="_blank" rel="noopener noreferrer" style={{ ...pillBtn, background: '#25D366', textDecoration: 'none', display: 'inline-block' }}>כתבו לנו בוואטסאפ</a>}
            </div>
          )}
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div style={{ background: C.soft, border: `1px solid ${C.border}`, borderRadius: 18, padding: '16px 20px', marginBottom: 18 }}>
        <div style={{ fontWeight: 800, color: C.accentDark, marginBottom: 4 }}>העלאת התמונות לסרטון</div>
        <div style={{ color: C.body, fontSize: '.95rem', lineHeight: 1.7 }}>
          בחרו את התמונות וסדרו אותן — הסדר כאן הוא הסדר בסרטון. <strong>ללא תשלום נוסף.</strong>
        </div>
      </div>

      <div style={card}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: '.95rem', marginBottom: 6 }}>שם</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="השם שלכם"
          style={{ width: '100%', boxSizing: 'border-box', fontFamily: "'Heebo', sans-serif", fontSize: 16, padding: '12px 14px', borderRadius: 14, border: `1.5px solid ${C.borderStrong}`, background: '#FFFDFA', color: C.ink }} />
      </div>

      <input type="file" accept="image/*" multiple ref={fileRef} onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} style={{ display: 'none' }} />
      <div onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDzOver(true); }}
        onDragLeave={() => setDzOver(false)}
        onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
        style={{ border: `2.5px dashed ${dzOver ? C.accent : C.borderStrong}`, background: dzOver ? C.soft : '#FFFDFA', borderRadius: 24, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all .15s ease', marginBottom: 16 }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>📷</div>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>גררו לכאן תמונות, או לחצו לבחירה מהמכשיר</div>
        <div style={{ color: C.muted, fontSize: '.9rem' }}>אפשר לבחור כמה תמונות בבת אחת</div>
      </div>

      {photos.length > 0 && (
        <>
          <p style={{ color: C.muted, fontSize: '.92rem', lineHeight: 1.7, margin: '0 0 12px' }}>
            גררו תמונה כדי לשנות את מיקומה — המספר מציין את מקומה בסרטון.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 12, marginBottom: 24 }}>
            {photos.map((p, i) => (
              <div key={p.id} draggable
                onDragStart={() => setDragIndex(i)}
                onDragEnter={() => reorder(dragIndex, i)}
                onDragOver={(e) => e.preventDefault()}
                onDragEnd={() => setDragIndex(null)}
                style={{ position: 'relative', aspectRatio: '1', borderRadius: 16, overflow: 'hidden', cursor: 'grab',
                  boxShadow: dragIndex === i ? '0 12px 30px rgba(196,80,46,.4)' : '0 6px 16px rgba(59,42,32,.12)',
                  outline: dragIndex === i ? `3px solid ${C.accent}` : 'none' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("${p.url}")`, backgroundSize: 'cover', backgroundPosition: 'center', pointerEvents: 'none' }} />
                <span style={{ position: 'absolute', top: 6, right: 6, minWidth: 26, height: 26, borderRadius: 999, background: C.accent, color: '#fff', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>{i + 1}</span>
                <button onClick={(e) => { e.stopPropagation(); setPhotos((prev) => prev.filter((x) => x.id !== p.id)); }} aria-label="הסרת התמונה"
                  style={{ position: 'absolute', top: 6, left: 6, width: 26, height: 26, borderRadius: '50%', border: 'none', background: 'rgba(59,42,32,.7)', color: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: "'Heebo', sans-serif" }}>×</button>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 40 }}>
        <button onClick={upload} disabled={!photos.length}
          style={{ ...pillBtn, padding: '14px 38px',
            background: photos.length ? pillBtn.background : '#D9C4B2',
            boxShadow: photos.length ? pillBtn.boxShadow : 'none',
            cursor: photos.length ? 'pointer' : 'not-allowed' }}>
          שליחת התמונות
        </button>
      </div>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: C.cream, fontFamily: "'Heebo', sans-serif", color: C.ink, direction: 'rtl' }}>
      <div style={{ background: 'rgba(250,240,230,.9)', borderBottom: `1px solid ${C.border}`, padding: '14px 20px', textAlign: 'center', fontWeight: 900, fontSize: '1.1rem', color: C.accentDark }}>
        {config.brandName}
      </div>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 18px 40px', boxSizing: 'border-box' }}>{children}</div>
    </div>
  );
}

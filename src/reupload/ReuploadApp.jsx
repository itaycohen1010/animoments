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
  const [hashes, setHashes] = useState([]); // [{hash,label,max}] — any one grants access
  const [maxPhotos, setMaxPhotos] = useState(0); // 0 = unlimited, from the matched password
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
        const match = list.find((p) => p.hash === ok);
        if (match) { setMaxPhotos(Number(match.max) || 0); setGate('open'); } else setGate('locked');
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
      setMaxPhotos(Number(match.max) || 0);
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
  const overLimit = maxPhotos > 0 && photos.length > maxPhotos;

  const addFiles = (list) => {
    setDzOver(false);
    const imgs = Array.from(list || []).filter((f) => f.type.startsWith('image/'));
    if (!imgs.length) return;
    // same behaviour as the site: accept up to a hard cap of 40; anything past the
    // per-password limit is marked and blocks continuing until removed.
    const HARD_CAP = 40;
    const room = HARD_CAP - photos.length;
    if (room <= 0) return;
    setPhotos((prev) => [...prev, ...imgs.slice(0, room).map((f) => ({ id: Math.random().toString(36).slice(2), file: f, url: URL.createObjectURL(f) }))]);
  };
  const reorder = (from, to) => {
    if (from == null || to == null || from === to) return;
    setPhotos((prev) => { const n = [...prev]; const [m] = n.splice(from, 1); n.splice(to, 0, m); return n; });
    setDragIndex(to);
  };

  // touch drag (press-and-hold ~180ms) — same as the site's upload screen
  const touchDrag = useRef({ dragging: false, timer: null, start: null, index: null });
  useEffect(() => {
    const td = touchDrag.current;
    const onMove = (e) => {
      const t = e.touches && e.touches[0];
      if (!t) return;
      if (!td.dragging) {
        if (td.start && (Math.abs(t.clientX - td.start.x) > 10 || Math.abs(t.clientY - td.start.y) > 10)) {
          clearTimeout(td.timer); td.start = null;
        }
        return;
      }
      e.preventDefault();
      const el = document.elementFromPoint(t.clientX, t.clientY);
      const cardEl = el && el.closest && el.closest('[data-photo-idx]');
      if (cardEl) {
        const to = parseInt(cardEl.getAttribute('data-photo-idx'), 10);
        if (!isNaN(to) && to !== td.index) { reorder(td.index, to); td.index = to; }
      }
    };
    const onEnd = () => {
      clearTimeout(td.timer); td.start = null;
      if (td.dragging) { td.dragging = false; setDragIndex(null); }
    };
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);
    return () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
  }, []); // eslint-disable-line

  // free the object URLs when leaving the page (40 full-size photos is real memory)
  useEffect(() => () => photos.forEach((p) => { try { URL.revokeObjectURL(p.url); } catch (e) {} }), []); // eslint-disable-line

  const upload = async () => {
    if (!photos.length || overLimit) return;
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
        <div style={{ color: overLimit ? C.accentDark : C.muted, fontSize: '.9rem', fontWeight: overLimit ? 700 : 400 }}>{maxPhotos ? `עד ${maxPhotos} תמונות · נבחרו ${photos.length}` : 'אפשר לבחור כמה תמונות בבת אחת'}</div>
      </div>

      {photos.length > 0 && (
        <>
          <p style={{ color: C.muted, fontSize: '.92rem', lineHeight: 1.7, margin: '0 0 12px' }}>
            גררו תמונה כדי לשנות את מיקומה — המספר מציין את מקומה בסרטון. בנייד — לחיצה ארוכה וגרירה.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12, marginBottom: 24 }}>
            {photos.map((p, i) => (
              <div key={p.id} draggable data-photo-idx={i}
              onDragStart={(e) => { setDragIndex(i); e.dataTransfer.effectAllowed = 'move'; }}
              onDragEnter={() => reorder(dragIndex, i)}
              onDragOver={(e) => e.preventDefault()}
              onDragEnd={() => setDragIndex(null)}
              onTouchStart={(e) => {
                const t = e.touches[0];
                const td = touchDrag.current;
                td.start = { x: t.clientX, y: t.clientY };
                clearTimeout(td.timer);
                td.timer = setTimeout(() => {
                  td.dragging = true; td.index = i; setDragIndex(i);
                  if (navigator.vibrate) navigator.vibrate(20);
                }, 180);
              }}
                style={{ position: 'relative', aspectRatio: '1', borderRadius: 16, overflow: 'hidden', cursor: 'grab', touchAction: 'manipulation',
                  boxShadow: dragIndex === i ? '0 12px 30px rgba(196,80,46,.4)' : '0 6px 16px rgba(59,42,32,.12)',
                  outline: dragIndex === i ? `3px solid ${C.accent}` : (maxPhotos && i >= maxPhotos ? `2px solid ${C.accent}` : 'none'),
                  opacity: maxPhotos && i >= maxPhotos ? .55 : 1 }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("${p.url}")`, backgroundSize: 'cover', backgroundPosition: 'center', pointerEvents: 'none' }} />
                <span style={{ position: 'absolute', top: 6, right: 6, minWidth: 26, height: 26, borderRadius: 999, background: C.accent, color: '#fff', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>{i + 1}</span>
                <button onClick={(e) => { e.stopPropagation(); setPhotos((prev) => prev.filter((x) => x.id !== p.id)); }} aria-label="הסרת התמונה"
                  style={{ position: 'absolute', top: 6, left: 6, width: 26, height: 26, borderRadius: '50%', border: 'none', background: 'rgba(59,42,32,.7)', color: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: "'Heebo', sans-serif" }}>×</button>
                {maxPhotos > 0 && i >= maxPhotos && (
                  <span style={{ position: 'absolute', bottom: 0, right: 0, left: 0, background: 'rgba(168,62,32,.92)', color: '#fff', fontWeight: 700, fontSize: 11, textAlign: 'center', padding: '3px 4px', direction: 'rtl' }}>⚠ מעבר למכסה</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {overLimit && (
        <div style={{ background: C.errorBg, border: `1.5px solid ${C.accent}`, borderRadius: 16, padding: '14px 18px', marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontWeight: 800, color: C.accentDark, marginBottom: 4 }}>חרגתם ממכסת התמונות</div>
          <div style={{ color: C.body, fontSize: '.94rem', lineHeight: 1.7 }}>
            נבחרו {photos.length} תמונות, והמכסה שלכם היא {maxPhotos}. הסירו {photos.length - maxPhotos} כדי להמשיך.
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 40 }}>
        <button onClick={upload} disabled={!photos.length || overLimit}
          style={{ ...pillBtn, padding: '14px 38px',
            background: (photos.length && !overLimit) ? pillBtn.background : '#D9C4B2',
            boxShadow: (photos.length && !overLimit) ? pillBtn.boxShadow : 'none',
            cursor: (photos.length && !overLimit) ? 'pointer' : 'not-allowed' }}>
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

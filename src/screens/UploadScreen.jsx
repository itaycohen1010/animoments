import React from 'react';
import { config, colors as C } from '../config.js';
import { pillBtn, ghostBtn, smallGhostBtn } from '../styles.js';

// Screen 2 — upload & arrange photos: dropzone, bundle switcher, drag-to-reorder grid.
export default function UploadScreen({
  pkg, pkgKey, setPkgKey, photos, setPhotos,
  dragIndex, setDragIndex, dzOver, setDzOver,
  addFiles, reorder, touchDrag, fileInputRef,
  showToast, onBack, onContinue, onOpenTips, onOpenHow
}) {
  return (
    <div data-screen-label="Upload" style={{ maxWidth: 880, margin: '0 auto', padding: '40px 20px 60px', animation: 'rise-in .5s ease both', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2rem)', margin: '0 0 8px' }}>בחרו את התמונות לסרטון</h2>
          <p style={{ color: C.body, fontSize: '1rem', lineHeight: 1.7, margin: '0 0 24px' }}>העלו לפחות 2 תמונות. הסדר שתקבעו כאן הוא הסדר שבו הן יופיעו בסרטון.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={onOpenTips} style={smallGhostBtn}>💡 דברים שחשוב לדעת</button>
          <button onClick={() => onOpenHow(2)} style={smallGhostBtn}>איך זה עובד? 👀</button>
        </div>
      </div>

      <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} style={{ display: 'none' }} />

      <div onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDzOver(true); }}
        onDragLeave={() => setDzOver(false)}
        onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
        style={{ border: `2.5px dashed ${dzOver ? C.accent : C.borderStrong}`, background: dzOver ? C.soft : '#FFFDFA', borderRadius: 24, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all .15s ease' }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>📷</div>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>גררו לכאן תמונות, או לחצו לבחירה מהמכשיר</div>
        <div style={{ color: C.muted, fontSize: '.9rem' }}>אפשר לבחור כמה תמונות בבת אחת</div>
      </div>

      {/* bundle switcher */}
      <div style={{ margin: '18px 0 4px' }}>
        <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: 8 }}>החבילה שלכם — אפשר להחליף בכל שלב:</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {config.packages.map((p) => {
            const active = p.key === pkgKey;
            return (
              <button key={p.key} onClick={() => {
                setPkgKey(p.key);
                if (photos.length > p.maxPhotos) showToast(`שימו לב: יש לכם ${photos.length} תמונות — חבילת "${p.name}" מוגבלת ל-${p.maxPhotos}`);
                else showToast(`עברתם לחבילת "${p.name}" · ₪${p.price}`);
              }}
                style={{ border: active ? `2px solid ${C.accent}` : `1.5px solid ${C.borderStrong}`, background: active ? C.soft : '#fff', color: active ? C.accentDark : C.body, cursor: 'pointer', fontWeight: active ? 800 : 700, fontSize: 13.5, padding: '9px 16px', borderRadius: 999, transition: 'all .15s ease' }}>
                {p.name} · ₪{p.price} · עד {p.maxPhotos}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', margin: '14px 0 14px' }}>
        <p style={{ color: C.muted, fontSize: '.92rem', lineHeight: 1.7, margin: 0, flex: 1, minWidth: 220 }}>
          גררו תמונה כדי לשנות את מיקומה — המספר על כל תמונה מציין את מקומה בסרטון (מימין לשמאל).
        </p>
        <span style={{
          background: photos.length > pkg.maxPhotos ? C.errorBg : '#fff',
          border: photos.length > pkg.maxPhotos ? `1.5px solid ${C.accent}` : `1.5px solid ${C.border}`,
          color: photos.length > pkg.maxPhotos ? C.accentDark : C.body,
          borderRadius: 999, padding: '6px 16px', fontSize: '.88rem', fontWeight: 700, whiteSpace: 'nowrap'
        }}>{photos.length} / {pkg.maxPhotos} תמונות (חבילת {pkg.name})</span>
      </div>

      {photos.length > pkg.maxPhotos && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ background: '#3B2A20', color: '#FFE9B0', fontWeight: 700, fontSize: '.95rem', padding: '12px 22px', borderRadius: 999, boxShadow: '0 8px 20px rgba(59,42,32,.3)', direction: 'rtl', textAlign: 'center' }}>
            חבילת "{pkg.name}" מוגבלת ל-{pkg.maxPhotos} תמונות — הסירו {photos.length - pkg.maxPhotos} או שדרגו חבילה
          </div>
        </div>
      )}
      {photos.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12, marginBottom: 30 }}>
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
              style={{ position: 'relative', aspectRatio: '1', borderRadius: 16, overflow: 'hidden',
                boxShadow: dragIndex === i ? '0 12px 30px rgba(196,80,46,.4)' : '0 6px 16px rgba(59,42,32,.12)',
                outline: dragIndex === i ? `3px solid ${C.accent}` : 'none',
                cursor: 'grab', touchAction: 'manipulation' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("${p.url}")`, backgroundSize: 'cover', backgroundPosition: 'center', pointerEvents: 'none' }} />
              <span style={{ position: 'absolute', top: 6, right: 6, minWidth: 26, height: 26, borderRadius: 999, background: C.accent, color: '#fff', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 8px rgba(59,42,32,.3)', padding: '0 6px' }}>{i + 1}</span>
              <button onClick={(e) => { e.stopPropagation(); setPhotos((prev) => prev.filter((x) => x.id !== p.id)); }} aria-label="הסרת התמונה"
                style={{ position: 'absolute', top: 6, left: 6, width: 26, height: 26, borderRadius: '50%', border: 'none', background: 'rgba(59,42,32,.7)', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Heebo', sans-serif" }}>×</button>
              {i >= pkg.maxPhotos && (
                <span style={{ position: 'absolute', bottom: 0, right: 0, left: 0, background: 'rgba(168,62,32,.92)', color: '#fff', fontWeight: 700, fontSize: 11, textAlign: 'center', padding: '3px 4px', direction: 'rtl' }}>⚠ מעבר למכסה</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: C.muted, fontSize: '.95rem', padding: '26px 0 34px' }}>עדיין לא נבחרו תמונות</div>
      )}

      <div className="actions-row" style={{ display: 'flex', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={ghostBtn}>חזרה</button>
        <button onClick={onContinue} disabled={photos.length < 2}
          style={{ ...pillBtn, padding: '13px 34px',
            background: photos.length >= 2 ? pillBtn.background : '#D9C4B2',
            boxShadow: photos.length >= 2 ? pillBtn.boxShadow : 'none',
            cursor: photos.length >= 2 ? 'pointer' : 'not-allowed' }}>
          המשך לתשלום
        </button>
      </div>
    </div>
  );
}

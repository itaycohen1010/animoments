import React, { useState, useEffect } from 'react';
import { colors as C } from '../config.js';
import { fetchGallery } from '../firebase.js';

// Public gallery — videos from the separate `gallery` collection (grows over time).
export default function GalleryScreen({ onHome }) {
  const [items, setItems] = useState(null);
  const [lightbox, setLightbox] = useState(null); // { title, video }

  useEffect(() => { fetchGallery().then(setItems); }, []);

  const playerEl = (url) => {
    const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    if (yt) return <iframe src={`https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0`} title="סרטון" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen style={{ width: '100%', height: '100%', border: 'none', background: '#000' }} />;
    const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vm) return <iframe src={`https://player.vimeo.com/video/${vm[1]}?autoplay=1`} title="סרטון" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen style={{ width: '100%', height: '100%', border: 'none', background: '#000' }} />;
    return <video src={url} controls autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} />;
  };

  const ytThumb = (url) => {
    const m = (url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : '';
  };

  return (
    <div data-screen-label="Gallery" style={{ flex: 1, minHeight: '70vh', background: C.cream }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '56px 20px 70px', direction: 'rtl' }}>
        <div style={{ textAlign: 'right', margin: '0 0 18px' }}>
          <button onClick={onHome} style={{ border: `1.5px solid ${C.border}`, background: '#fff', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: 15, color: C.body, padding: '10px 22px', borderRadius: 999 }}>חזרה למסך הבית</button>
        </div>
        <h1 style={{ fontWeight: 900, fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', textAlign: 'center', margin: '0 0 8px', color: C.ink }}>גלריית הסרטונים</h1>
        <p style={{ textAlign: 'center', color: C.body, fontSize: '1.05rem', margin: '0 0 40px' }}>הצצה לסרטונים שיצרנו — לחצו כדי לצפות.</p>

        {items === null ? (
          <div style={{ textAlign: 'center', color: C.muted, padding: 40 }}>טוען…</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', color: C.muted, padding: 40 }}>בקרוב יתווספו כאן סרטונים.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {items.map((ex) => {
              const thumb = ex.img || ytThumb(ex.video);
              return (
                <a key={ex.id} onClick={() => setLightbox({ title: ex.title, video: (ex.video || '').trim() })}
                  style={{ position: 'relative', aspectRatio: '16 / 10', borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(135deg, #C4502E, #E8A13C)', display: 'block', cursor: 'pointer', boxShadow: '0 10px 30px rgba(180,100,70,.14)' }}>
                  {thumb && <img src={thumb} alt={ex.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(.18) saturate(1.1)' }} />}
                  <span aria-hidden="true" style={{ position: 'absolute', inset: 0, margin: 'auto', width: 54, height: 54, borderRadius: '50%', background: 'rgba(255,255,255,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent, fontSize: 20, boxShadow: '0 6px 16px rgba(59,42,32,.25)' }}>▶</span>
                  <span style={{ position: 'absolute', bottom: 0, right: 0, left: 0, background: 'linear-gradient(to top, rgba(46,31,23,.85), transparent)', color: '#fff', fontSize: 15, fontWeight: 700, padding: '26px 14px 12px', textAlign: 'right' }}>{ex.title}</span>
                </a>
              );
            })}
          </div>
        )}

      </div>

      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(30,20,14,.82)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={lightbox.title} style={{ position: 'relative', width: '100%', maxWidth: 640 }}>
            <button onClick={() => setLightbox(null)} aria-label="סגירה" style={{ position: 'absolute', top: -46, left: 0, border: 'none', background: 'rgba(255,255,255,.14)', cursor: 'pointer', width: 38, height: 38, borderRadius: '50%', color: '#fff', fontSize: 20, lineHeight: 1 }}>×</button>
            <div style={{ borderRadius: 14, overflow: 'hidden', background: '#000', boxShadow: '0 30px 70px rgba(0,0,0,.5)', aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {lightbox.video ? playerEl(lightbox.video) : (
                <div style={{ textAlign: 'center', color: '#F4E7DA', direction: 'rtl', padding: 30 }}>
                  <div style={{ fontSize: 46, marginBottom: 12 }}>🎬</div>
                  <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{lightbox.title}</div>
                </div>
              )}
            </div>
            <div style={{ direction: 'rtl', textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: '1.02rem', marginTop: 14 }}>{lightbox.title}</div>
          </div>
        </div>
      )}
    </div>
  );
}

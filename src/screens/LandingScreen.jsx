import React, { useState } from 'react';
import { config, colors as C } from '../config.js';
import { pillBtn, smallGhostBtn } from '../styles.js';

// Screen 0 — landing page: hero, dictionary word, filmstrip, how-it-works, pricing, closing CTA.
export default function LandingScreen({ onStart, onOpenHow }) {
  const [lightbox, setLightbox] = useState(null); // { title, video }

  // Build the right player for a URL: YouTube/Vimeo → iframe embed, else <video>.
  const playerEl = (url) => {
    const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    if (yt) return <iframe src={`https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0`} title="סרטון דוגמה" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen style={{ width: '100%', height: '100%', border: 'none', background: '#000' }} />;
    const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vm) return <iframe src={`https://player.vimeo.com/video/${vm[1]}?autoplay=1`} title="סרטון דוגמה" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen style={{ width: '100%', height: '100%', border: 'none', background: '#000' }} />;
    return <video src={url} controls autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} />;
  };

  return (
    <div data-screen-label="Landing">
      <div style={{ position: 'relative', overflow: 'hidden', background: `radial-gradient(900px 480px at 50% -120px, #FFE3C4, transparent), ${C.cream}` }}>
        <div className="hero-pad" style={{ maxWidth: 1080, margin: '0 auto', padding: '72px 24px 40px', textAlign: 'center', animation: 'rise-in .6s ease both' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.badgeBg, border: `1px solid ${C.badgeBorder}`, color: C.badgeText, fontWeight: 700, fontSize: 14, padding: '6px 16px', borderRadius: 999, marginBottom: 26 }}>✨ מהתמונות שבטלפון — לסרטון מרגש</div>
          <h1 style={{ fontWeight: 900, fontSize: 'clamp(2.3rem, 6vw, 4rem)', lineHeight: 1.15, margin: '0 auto 20px', maxWidth: 760, letterSpacing: '-0.01em' }}>
            הופכים את הזכרונות שלכם <span style={{ color: C.accent }}>לסרטון מרגש</span>
          </h1>
          <p style={{ fontSize: 'clamp(1.05rem, 2vw, 1.25rem)', lineHeight: 1.75, color: C.body, maxWidth: 560, margin: '0 auto 30px', textWrap: 'pretty' }}>
            בוחרים תמונות, קובעים את הסדר — ואנחנו מחברים אותן לסרטון וידאו חלק ואיכותי.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 34 }}>
            {['✓ מוכן תוך 48 שעות', '✓ עובד ישירות מהטלפון', '✓ בלי להתקין כלום'].map((t) => (
              <span key={t} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 999, padding: '8px 18px', fontSize: 14, fontWeight: 600, color: C.body, boxShadow: '0 4px 14px rgba(180,100,70,.08)' }}>{t}</span>
            ))}
          </div>
          <button onClick={() => onStart()} style={{ ...pillBtn, fontSize: 19, padding: '18px 44px', animation: 'cta-pulse 2.2s ease-in-out infinite' }}>מתחילים — העלאת תמונות</button>
          <div style={{ marginTop: 14 }}>
            <button onClick={() => onOpenHow(1)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: C.muted, textDecoration: 'underline', textUnderlineOffset: 4 }}>לצפייה בהדגמה קצרה 👀</button>
          </div>
        </div>

        {/* dictionary word — connected to the filmstrip */}
        <div style={{ margin: '30px 0 0', background: C.filmDark, padding: '44px 24px 30px', textAlign: 'right', direction: 'rtl' }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
              <span style={{ fontWeight: 900, fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: '#E8A13C' }}>זִכְרוֹנִימַצְיָה</span>
              <span style={{ color: 'rgba(250,240,230,.6)', fontSize: '.9rem', fontStyle: 'italic' }}>שֵׁם עֶצֶם</span>
            </div>
            <p style={{ margin: '0 auto', color: 'rgba(250,240,230,.85)', fontSize: '1.02rem', lineHeight: 1.9, textWrap: 'pretty' }}> הַדֶּרֶךְ לְהַפוֹךְ אֶת הַזִּכְרוֹנוֹת הֲכִי כְּמוּסִים שֶׁלָּנוּ לְמַשֶּׁהוּ שֶׁאֶפְשָׁר לִרְאוֹת, לְשַׁתֵּף וְלִשְׁמֹר קָרוֹב לַלֵּב לָנֶצַח.</p>
          </div>
        </div>

        {/* filmstrip marquee */}
        <div style={{ position: 'relative', margin: 0, background: C.filmDark, boxShadow: '0 20px 50px rgba(59,42,32,.25)', direction: 'ltr', overflow: 'hidden' }}>
          <div style={{ height: 16, backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 12px, #FAF0E6 12px 24px, transparent 24px 34px)', opacity: .85 }} />
          <div style={{ display: 'flex', width: 'max-content', animation: 'film-scroll 36s linear infinite' }}>
            {[0, 1].map((half) => (
              <div key={half} style={{ display: 'flex', gap: 10, padding: '8px 5px' }}>
                {config.examples.map((ex, i) => (
                  <a key={i} onClick={() => setLightbox({ title: ex.title, video: (ex.video || '').trim() })} style={{ position: 'relative', width: 220, height: 140, borderRadius: 6, overflow: 'hidden', background: '#4a352a', display: 'block', cursor: 'pointer' }}>
                    <img src={ex.img} alt={`קטע מסרטון: ${ex.title}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(.22) saturate(1.12) brightness(.97)' }} />
                    <span aria-hidden="true" style={{ position: 'absolute', inset: 0, margin: 'auto', width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent, fontSize: 15, boxShadow: '0 6px 16px rgba(59,42,32,.25)' }}>▶</span>
                    <span style={{ position: 'absolute', bottom: 0, right: 0, left: 0, direction: 'rtl', background: 'linear-gradient(to top, rgba(46,31,23,.85), transparent)', color: '#fff', fontSize: 13, fontWeight: 700, padding: '18px 12px 8px', textAlign: 'right' }}>{ex.title}</span>
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div style={{ height: 16, backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 12px, #FAF0E6 12px 24px, transparent 24px 34px)', opacity: .85 }} />
        </div>
      </div>

      {/* how it works */}
      <div id="how" className="section-pad" style={{ maxWidth: 1080, margin: '0 auto', padding: '90px 24px 20px', scrollMarginTop: 90 }}>
        <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', textAlign: 'center', margin: '0 0 12px' }}>איך זה עובד?</h2>
        <p style={{ textAlign: 'center', color: C.muted, fontSize: '1.05rem', margin: '0 0 44px' }}>שלושה צעדים — וזהו.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {[
            { n: '1', icon: '📷', title: 'בוחרים תמונות', text: 'ישירות מהטלפון או מהמחשב — בלי להתקין כלום.' },
            { n: '2', icon: '↔️', title: 'קובעים סדר', text: 'גוררים את התמונות לסדר שבו יופיעו בסרטון.' },
            { n: '3', icon: '✅', title: 'שולחים', text: 'אנחנו מפיקים את הסרטון ומתקשרים תוך 48 שעות.' }
          ].map((s) => (
            <div key={s.n} style={{ background: '#fff', borderRadius: 24, padding: '30px 26px', boxShadow: '0 14px 40px rgba(180,100,70,.1)', position: 'relative' }}>
              <div style={{ fontWeight: 900, fontSize: 60, color: '#F5DFCC', position: 'absolute', top: 10, left: 22, lineHeight: 1 }}>{s.n}</div>
              <div style={{ fontSize: 38, marginBottom: 14 }}>{s.icon}</div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: 6 }}>{s.title}</div>
              <div style={{ color: C.body, fontSize: '.98rem', lineHeight: 1.7 }}>{s.text}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 26 }}>
          <button onClick={() => onOpenHow(1)} style={{ ...smallGhostBtn, fontSize: 15, padding: '11px 26px' }}>לצפייה בהדגמה קצרה 👀</button>
        </div>
      </div>

      {/* pricing */}
      <div id="pricing" className="section-pad" style={{ maxWidth: 1080, margin: '0 auto', padding: '90px 24px 40px', scrollMarginTop: 90 }}>
        <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', textAlign: 'center', margin: '0 0 12px' }}>מחירים וחבילות</h2>
        <p style={{ textAlign: 'center', color: C.muted, fontSize: '1.05rem', margin: '0 0 48px' }}>בוחרים חבילה — משלמים רק בסוף, אחרי שבחרתם תמונות.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 22, alignItems: 'stretch' }}>
          {config.packages.map((p) => (
            <div key={p.key} className={p.featured ? 'featured-card' : ''}
              style={{ background: '#fff', borderRadius: 24, padding: '32px 28px', display: 'flex', flexDirection: 'column', position: 'relative',
                border: p.featured ? `2.5px solid ${C.accent}` : `1.5px solid ${C.border}`,
                transform: p.featured ? 'scale(1.04)' : 'none',
                boxShadow: p.featured ? '0 20px 50px rgba(196,80,46,.18)' : 'none' }}>
              {p.featured && (
                <div style={{ position: 'absolute', top: -14, right: 24, background: `linear-gradient(135deg, ${C.gold}, #F2B45C)`, color: '#5C3A10', fontWeight: 800, fontSize: 13, padding: '5px 16px', borderRadius: 999, boxShadow: '0 4px 12px rgba(232,161,60,.4)' }}>הכי אהובה ❤️</div>
              )}
              <div style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: 4 }}>{p.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 18 }}>
                {p.basePrice !== p.price && <span style={{ color: '#A78B74', fontWeight: 700, fontSize: '1.2rem', textDecoration: 'line-through' }}>₪{p.basePrice}</span>}
                <span style={{ fontWeight: 900, fontSize: '2.4rem', color: C.accent }}>₪{p.price}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, color: C.body, fontSize: '.98rem', marginBottom: 26 }}>
                {p.features.map((f) => <span key={f}>✓ {f}</span>)}
              </div>
              <div style={{ flex: 1 }} />
              <button onClick={() => onStart(p.key)}
                style={p.featured
                  ? { ...pillBtn, fontSize: 15, padding: '13px 20px' }
                  : { border: `1.5px solid ${C.accent}`, background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 15, color: C.accent, padding: '12px 20px', borderRadius: 999 }}>
                בחירת חבילה זו
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* closing CTA */}
      <div style={{ margin: '60px 0 0', background: `linear-gradient(135deg, #B04A2C, ${C.accent} 55%, #D9822E)`, padding: '76px 24px', textAlign: 'center' }}>
        <h2 style={{ fontWeight: 900, fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1.2, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.01em' }}>מוכנים להתחיל?</h2>
        <p style={{ color: '#FFE9D6', fontSize: '1.1rem', margin: '0 0 34px' }}>כל התהליך לוקח כחמש דקות.</p>
        <button onClick={() => onStart()} style={{ border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 18, color: C.accent, background: '#fff', padding: '17px 46px', borderRadius: 999, boxShadow: '0 12px 30px rgba(59,42,32,.3)' }}>העלאת תמונות</button>
      </div>

      {/* example-video lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(30,20,14,.82)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={lightbox.title} style={{ position: 'relative', width: '100%', maxWidth: 460 }}>
            <button onClick={() => setLightbox(null)} aria-label="סגירה" style={{ position: 'absolute', top: -46, left: 0, border: 'none', background: 'rgba(255,255,255,.14)', cursor: 'pointer', width: 38, height: 38, borderRadius: '50%', color: '#fff', fontSize: 20, lineHeight: 1 }}>×</button>
            <div style={{ borderRadius: 14, overflow: 'hidden', background: '#000', boxShadow: '0 30px 70px rgba(0,0,0,.5)', aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {lightbox.video ? (
                playerEl(lightbox.video)
              ) : (
                <div style={{ textAlign: 'center', color: '#F4E7DA', direction: 'rtl', padding: 30 }}>
                  <div style={{ fontSize: 46, marginBottom: 12 }}>🎬</div>
                  <div style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: 6 }}>{lightbox.title}</div>
                  <div style={{ color: '#C9B4A3', fontSize: '.95rem' }}>הסרטון לדוגמה יתווסף כאן בקרוב.</div>
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

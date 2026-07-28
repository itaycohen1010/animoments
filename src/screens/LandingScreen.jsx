import React, { useState, useEffect } from 'react';
import { config, colors as C } from '../config.js';
import { saveQuote } from '../firebase.js';
import { pillBtn, smallGhostBtn } from '../styles.js';

// Screen 0 — landing page: hero, dictionary word, filmstrip, how-it-works, pricing, closing CTA.
export default function LandingScreen({ onStart, onOpenHow }) {
  const [lightbox, setLightbox] = useState(null); // { title, video }
  const [priceTick, setPriceTick] = useState(Date.now());
  const [quote, setQuote] = useState({ name: '', phone: '', email: '', message: '' });
  const [quoteSent, setQuoteSent] = useState(false);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [quoteErr, setQuoteErr] = useState('');
  useEffect(() => { if (!config.promoTimerOnCards || !(config.promoDeadline || '').trim()) return; const t = setInterval(() => setPriceTick(Date.now()), 1000); return () => clearInterval(t); }, []);
  const priceTimer = (() => {
    if (!config.promoTimerOnCards || !(config.promoDeadline || '').trim()) return '';
    const rem = new Date(config.promoDeadline).getTime() - priceTick;
    if (rem <= 0) return '';
    const s = Math.floor(rem / 1000), d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
    const p = (n) => String(n).padStart(2, '0');
    return d > 0 ? `${d} ימים ${p(h)}:${p(m)}:${p(ss)}` : `${p(h)}:${p(m)}:${p(ss)}`;
  })();
  const [zoomImg, setZoomImg] = useState(null); // testimonial / hero photo zoom
  const [zoomVideo, setZoomVideo] = useState(false);
  const [openPkg, setOpenPkg] = useState(null);
  const heroPhotos = (config.heroPhotos && config.heroPhotos.length ? config.heroPhotos : [
    'https://res.cloudinary.com/dmxkoz4jo/image/upload/v1785129056/1_2_gheqtf.png',
    'https://res.cloudinary.com/dmxkoz4jo/image/upload/v1785129019/2_ykbann.png',
    'https://res.cloudinary.com/dmxkoz4jo/image/upload/v1785129020/3_heendd.png',
    'https://res.cloudinary.com/dmxkoz4jo/image/upload/v1785129055/4_2_sdyqfx.png'
  ]);
  const heroVideo = (config.heroVideo || 'https://res.cloudinary.com/dmxkoz4jo/video/upload/f_auto,q_auto/v1785130216/herovideo_v9hg8t.mp4');
  const heroPoster = (config.heroPoster || 'https://res.cloudinary.com/dmxkoz4jo/video/upload/so_0/v1785130216/herovideo_v9hg8t.jpg');
  const [openFaq, setOpenFaq] = useState(null);
  const faqs = (config.faq && config.faq.length ? config.faq : [
    { q: 'איך עובד תהליך יצירת הסרטון?', a: 'אתם מעלים תמונות, מסדרים אותן לפי הסדר הרצוי ומשלימים את ההזמנה. לאחר מכן, הכלים המתקדמים שלנו יחברו אותן לסרטון אנימציה זורם הכולל סאונד מותאם.' },
    { q: 'תוך כמה זמן אקבל את הסרטון?', a: 'זמן האספקה הוא לרוב מספר שעות, ועד מקסימום 48 שעות. כל סרטון עובר עיבוד מורכב של בינה מלאכותית, כדי להבטיח את התוצאה האיכותית ביותר.' }
  ]);

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
          <div style={{ height: 54 }}></div>
          <h1 style={{ fontWeight: 900, fontSize: 'clamp(2.3rem, 6vw, 4rem)', lineHeight: 1.15, margin: '0 auto 20px', maxWidth: 760, letterSpacing: '-0.01em' }}>
            הופכים את הזכרונות שלכם <span style={{ color: C.accent }}>לסרטון מרגש</span>
          </h1>
          <p style={{ fontSize: 'clamp(1.05rem, 2vw, 1.25rem)', lineHeight: 1.75, color: C.body, maxWidth: 560, margin: '0 auto 30px', textWrap: 'pretty' }}>
            בוחרים תמונות, קובעים את הסדר — ואנחנו מחברים אותן לסרטון וידאו חלק ואיכותי.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
            {['✓ מוכן תוך 48 שעות', '✓ עובד ישירות מהטלפון', '✓ בלי להתקין כלום'].map((t) => (
              <span key={t} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 999, padding: '8px 18px', fontSize: 14, fontWeight: 600, color: C.body, boxShadow: '0 4px 14px rgba(180,100,70,.08)' }}>{t}</span>
            ))}
          </div>
          <button onClick={() => onStart()} data-track="צרו את הסרטון שלכם" style={{ ...pillBtn, fontSize: 19, padding: '18px 44px', animation: 'cta-pulse 2.2s ease-in-out infinite' }}>צרו את הסרטון שלכם</button>
          <div style={{ marginTop: 14 }}>
            <button onClick={() => onOpenHow(1)} data-track="צפייה בהדגמה" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: C.muted, textDecoration: 'underline', textUnderlineOffset: 4 }}>לצפייה בהדגמה קצרה 👀</button>
          </div>
          <div className="hero-media" style={{ maxWidth: 900, margin: '34px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, flexWrap: 'nowrap' }}>
            <div className="hero-reel-wrap hero-phone" data-track="הירו וידאו" onClick={() => setZoomVideo(true)} style={{ position: 'relative', zIndex: 2, width: 'clamp(190px, 46vw, 420px)', padding: 'clamp(7px, 1.6vw, 16px) clamp(8px, 1.8vw, 18px)', background: 'linear-gradient(160deg, #2E1F17, #17120F)', borderRadius: 'clamp(18px, 3vw, 32px)', boxShadow: '0 26px 60px rgba(59,42,32,.4)', cursor: 'pointer', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: '50%', right: 22, transform: 'translateY(-50%)', width: 6, height: 60, borderRadius: 6, background: 'rgba(255,255,255,.25)', zIndex: 3 }} />
              <div style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', background: '#000', aspectRatio: '16/9' }}>
                <video autoPlay muted loop playsInline preload="auto" poster={heroPoster}
                  ref={(v) => { if (v && !v._kept) { v._kept = true; v.muted = true; const play = () => { const p = v.play(); if (p && p.catch) p.catch(() => {}); }; play(); v.addEventListener('canplay', play); v.addEventListener('pause', play); v.addEventListener('ended', play); v.addEventListener('stalled', () => { try { v.load(); play(); } catch (e) {} }); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') play(); }); } }}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }}>
                  <source src={heroVideo} type="video/mp4" />
                </video>
              </div>
            </div>
            {heroPhotos.length >= 2 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="hero-arrow" style={{ color: C.accent, flexShrink: 0, fontSize: 30, fontWeight: 900, lineHeight: 1 }}>→</div>
                <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(5px, 1vw, 10px)' }}>
                  {heroPhotos.slice(0, 4).map((ph, i) => (
                    <div key={i} className="hero-thumb" onClick={() => setZoomImg(ph)} style={{ width: 'clamp(44px, 11vw, 92px)', borderRadius: 10, overflow: 'hidden', background: '#fff', boxShadow: '0 8px 22px rgba(59,42,32,.22)', border: '3px solid #fff' }}>
                      <img src={ph} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* dictionary word — connected to the filmstrip */}
        <div style={{ margin: '30px 0 0', background: C.filmDark, padding: '40px 24px 26px', textAlign: 'center', direction: 'rtl' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
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
                  <a key={i} onClick={() => setLightbox({ title: ex.title, video: (ex.video || '').trim() })} style={{ position: 'relative', width: 220, height: 140, borderRadius: 6, overflow: 'hidden', background: 'linear-gradient(135deg, #C4502E, #E8A13C)', display: 'block', cursor: 'pointer' }}>
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
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 14, padding: '22px 24px 4px', color: C.body, fontSize: 15, fontWeight: 800 }}>
          <span>🎬 {(config.socialProof || {}).stat || '+300 סרטונים נוצרו'}</span>
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
          <button onClick={() => onOpenHow(1)} data-track="צפייה בהדגמה" style={{ ...smallGhostBtn, fontSize: 15, padding: '11px 26px' }}>לצפייה בהדגמה קצרה 👀</button>
        </div>
      </div>

      {/* testimonials — WhatsApp-style */}
      <div id="testimonials" className="section-pad" style={{ maxWidth: 1080, margin: '0 auto', padding: '80px 24px 10px', scrollMarginTop: 90 }}>
        <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', textAlign: 'center', margin: '0 0 44px' }}>לקוחות מספרים...</h2>
        <div className="testi-scroll" style={{ overflow: 'hidden', direction: 'ltr' }}>
          <div className="testi-track" style={{ display: 'flex', width: 'max-content', gap: 18, alignItems: 'flex-start', animation: 'film-scroll 48s linear infinite' }}>
            {[0, 1].map((half) => (
              <div key={half} style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                {(config.testimonialImages || []).map((src, i) => (
                  <div key={i} className="testi-card" onClick={() => setZoomImg(src)} style={{ position: 'relative', width: 210, borderRadius: 18, overflow: 'hidden', boxShadow: '0 14px 36px rgba(59,42,32,.22)', flexShrink: 0, cursor: 'pointer', background: 'transparent', fontSize: 0, lineHeight: 0 }}>
                    <img src={src} alt="תגובת לקוח/ה בוואטסאפ" loading="lazy" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* pricing */}
      <div id="pricing" className="section-pad" style={{ maxWidth: 1080, margin: '0 auto', padding: '90px 24px 40px', scrollMarginTop: 90 }}>
        <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', textAlign: 'center', margin: '0 0 12px' }}>מחירים וחבילות</h2>
        <p style={{ textAlign: 'center', color: C.muted, fontSize: '1.05rem', margin: '0 0 20px' }}>בוחרים חבילה — משלמים רק בסוף, אחרי שבחרתם תמונות.</p>
        {priceTimer && <div style={{ textAlign: 'center', margin: '0 0 20px' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: config.promoCardBg || C.accent, color: config.promoCardColor || '#fff', borderRadius: 999, padding: '11px 26px', fontWeight: 900, fontSize: 19, boxShadow: '0 10px 26px rgba(196,80,46,.35)' }}>{(config.promoCardLabel || '').trim() && <span>{config.promoCardLabel}</span>}<span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontVariantNumeric: 'tabular-nums' }}><span style={{ display: 'inline-block', animation: 'clock-tick 1s steps(2) infinite' }}>⏳</span> {priceTimer}</span></span></div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, margin: '0 0 44px', color: C.body, fontSize: 13.5, fontWeight: 700 }}>
          {['🔒 תשלום מאובטח', '⏱️ מוכן תוך 48 שעות'].map((t) => (
            <span key={t} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 999, padding: '7px 16px', boxShadow: '0 4px 14px rgba(180,100,70,.08)' }}>{t}</span>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 22, alignItems: 'start' }}>
          {config.packages.map((p) => {
            const open = openPkg === p.key;
            return (
            <div key={p.key} className={p.featured ? 'featured-card' : ''}
              onClick={() => setOpenPkg(open ? null : p.key)} data-track={'חבילה ' + p.name} data-open={open ? '1' : '0'}
              style={{ background: '#fff', borderRadius: 24, padding: '22px 24px', display: 'flex', flexDirection: 'column', position: 'relative', cursor: 'pointer', transition: 'box-shadow .2s ease',
                border: p.featured ? `2.5px solid ${C.accent}` : `1.5px solid ${C.border}`,
                transform: p.featured ? 'scale(1.04)' : 'none',
                boxShadow: (p.featured || open) ? '0 20px 50px rgba(196,80,46,.18)' : '0 6px 20px rgba(180,100,70,.08)' }}>
              {p.featured && (
                <div style={{ position: 'absolute', top: -14, right: 24, background: `linear-gradient(135deg, ${C.gold}, #F2B45C)`, color: '#5C3A10', fontWeight: 800, fontSize: 13, padding: '5px 16px', borderRadius: 999, boxShadow: '0 4px 12px rgba(232,161,60,.4)' }}>הכי אהובה ❤️</div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>{p.name}</span>
                <span style={{ color: C.accent, fontSize: 20, fontWeight: 900, transition: 'transform .2s ease', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>⌄</span>
              </div>
              <div style={{ maxHeight: open ? 400 : 0, overflow: 'hidden', transition: 'max-height .3s ease' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '16px 0 4px' }}>
                  <span style={{ fontWeight: 900, fontSize: '2rem', color: C.accent }}>₪{p.price}</span>
                  {p.basePrice !== p.price && <span style={{ color: '#A78B74', fontWeight: 700, fontSize: '1.1rem', textDecoration: 'line-through' }}>₪{p.basePrice}</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, color: C.body, fontSize: '.98rem', margin: '14px 0 22px' }}>
                  {p.features.map((f) => <span key={f}>✓ {f}</span>)}
                </div>
                <button onClick={(e) => { e.stopPropagation(); onStart(p.key); }} data-track={'בחירת חבילה בכרטיס — ' + p.name}
                  style={p.featured
                    ? { ...pillBtn, width: '100%', fontSize: 15, padding: '13px 20px' }
                    : { border: `1.5px solid ${C.accent}`, background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 15, color: C.accent, padding: '12px 20px', borderRadius: 999, width: '100%' }}>
                  בחירת חבילה זו
                </button>
              </div>
            </div>
          );})}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center', background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 18, padding: '14px 22px', boxShadow: '0 6px 20px rgba(180,100,70,.08)' }}>
            <span style={{ color: C.body, fontSize: '.95rem' }}>רוצים יותר מסרטון אחד?</span>
            <a href={`https://wa.me/972552745188?text=${encodeURIComponent('היי, אשמח להצעת מחיר להפקה מיוחדת / כמה סרטונים')}`} target="_blank" rel="noopener" data-track="בקשת הצעת מחיר" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#25D366', color: '#fff', fontWeight: 800, fontSize: '.92rem', textDecoration: 'none', padding: '9px 18px', borderRadius: 999, whiteSpace: 'nowrap' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.043zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
              צרו קשר בוואטסאפ
            </a>
          </div>
        </div>
      </div>

      {/* closing CTA */}
      <div style={{ margin: '60px 0 0', background: `linear-gradient(135deg, #B04A2C, ${C.accent} 55%, #D9822E)`, padding: '76px 24px', textAlign: 'center' }}>
        <h2 style={{ fontWeight: 900, fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1.2, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.01em' }}>מוכנים להתחיל?</h2>
        <p style={{ color: '#FFE9D6', fontSize: '1.1rem', margin: '0 0 34px' }}>כל התהליך לוקח כחמש דקות.</p>
        <button onClick={() => onStart()} data-track="CTA סיום — מוכנים להתחיל" style={{ border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 18, color: C.accent, background: '#fff', padding: '17px 46px', borderRadius: 999, boxShadow: '0 12px 30px rgba(59,42,32,.3)' }}>העלאת תמונות</button>
      </div>

      {/* FAQ accordion */}
      <div id="faq" style={{ background: C.cream, padding: '56px 20px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontWeight: 900, fontSize: 'clamp(1.5rem, 4vw, 2rem)', textAlign: 'center', margin: '0 0 8px', color: C.ink }}>שאלות ותשובות</h2>
          <p style={{ textAlign: 'center', color: C.body, fontSize: '1rem', margin: '0 0 28px' }}>לחצו על שאלה כדי לראות את התשובה</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faqs.map((f, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #F0D9C4', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 14px rgba(180,100,70,.06)' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} data-open={openFaq === i ? '1' : '0'} style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', fontFamily: "'Heebo', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '18px 22px', textAlign: 'right', direction: 'rtl' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.05rem', color: C.ink }}>{f.q}</span>
                  <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', background: '#FBE4D7', color: C.accent, fontWeight: 900, fontSize: 20, lineHeight: '26px', textAlign: 'center' }}>{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 22px 20px', direction: 'rtl' }}>
                    <p style={{ color: C.body, fontSize: '.98rem', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* testimonial / hero photo zoom */}
      {zoomImg && (
        <div onClick={() => setZoomImg(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(30,20,14,.85)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <img src={zoomImg} alt="" style={{ maxWidth: '92vw', maxHeight: '88vh', borderRadius: 18, boxShadow: '0 30px 70px rgba(0,0,0,.5)' }} />
        </div>
      )}
      {zoomVideo && (
        <div onClick={() => setZoomVideo(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(30,20,14,.88)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <video autoPlay muted loop playsInline controlsList="nofullscreen nodownload noplaybackrate" disablePictureInPicture style={{ maxWidth: '92vw', maxHeight: '88vh', borderRadius: 18, boxShadow: '0 30px 70px rgba(0,0,0,.5)' }}>
            <source src={heroVideo} type="video/mp4" />
          </video>
        </div>
      )}

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

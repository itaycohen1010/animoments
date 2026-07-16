// Animoments admin panel — control the ai-video-maker pipeline from a browser.
// Static page (built with the site, served from /admin); all state lives on
// the pipeline machine and is fetched from its admin API.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, fileUrl, getBase, getToken, hasSettings, saveSettings } from './api.js';

// ------------------------------- styling ---------------------------------- #
const C = {
  bg: '#12141A', panel: '#1B1E27', card: '#232734', border: '#333949',
  ink: '#E8EAF2', muted: '#9AA1B5', accent: '#D96A38', accentSoft: '#E8A13C',
  ok: '#4CAF7D', err: '#E05B5B', run: '#5B9DE0'
};
const S = {
  page: { minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'system-ui, sans-serif' },
  wrap: { maxWidth: 1100, margin: '0 auto', padding: '20px 16px 80px' },
  h1: { fontSize: 22, margin: '0 0 4px', color: C.accentSoft },
  card: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, marginBottom: 12 },
  input: { background: C.panel, color: C.ink, border: `1px solid ${C.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 14, width: '100%', boxSizing: 'border-box' },
  btn: { background: C.accent, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 14, cursor: 'pointer', fontWeight: 600 },
  btnGhost: { background: 'transparent', color: C.ink, border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 12px', fontSize: 13, cursor: 'pointer' },
  label: { fontSize: 12, color: C.muted, display: 'block', marginBottom: 4 },
  chip: (color) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: `${color}22`, color, border: `1px solid ${color}55` }),
  err: { color: C.err, fontSize: 13, whiteSpace: 'pre-wrap' }
};
const stepChip = (next) =>
  next === 'storyboard' ? ['needs storyboard', C.accentSoft]
    : next === 'render' ? ['needs render', C.run]
      : next === 'combine' ? ['needs combine', C.run]
        : ['complete', C.ok];

// ------------------------------ tiny pieces -------------------------------- #
function Btn({ ghost, busy, children, ...rest }) {
  return (
    <button {...rest} disabled={busy || rest.disabled}
      style={{ ...(ghost ? S.btnGhost : S.btn), opacity: busy || rest.disabled ? 0.55 : 1, ...(rest.style || {}) }}>
      {busy ? '…' : children}
    </button>
  );
}

function JobRow({ job, onShowLog }) {
  const color = job.state === 'done' ? C.ok : job.state === 'failed' ? C.err : C.run;
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
      <span style={S.chip(color)}>{job.state}</span>
      <span style={{ fontWeight: 600 }}>{job.command}</span>
      <span style={{ color: C.muted, fontSize: 12, flex: 1 }}>
        {(job.started_at || job.created_at || '').replace('T', ' ').slice(0, 19)}
      </span>
      {job.error && <span style={{ ...S.err, maxWidth: 380, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.error}</span>}
      <Btn ghost onClick={() => onShowLog(job.id)}>log</Btn>
    </div>
  );
}

// -------------------------------- settings --------------------------------- #
function Settings({ onConnected }) {
  const [base, setBase] = useState(getBase());
  const [token, setToken] = useState(getToken());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const connect = async () => {
    setBusy(true); setError('');
    saveSettings(base, token);
    try {
      await api.health();
      await api.projects(); // exercises auth, not just reachability
      onConnected();
    } catch (e) {
      setError(`Could not connect: ${e.message}`);
    } finally { setBusy(false); }
  };

  return (
    <div style={{ ...S.card, maxWidth: 520, margin: '10vh auto' }}>
      <h2 style={{ marginTop: 0 }}>Connect to the pipeline</h2>
      <p style={{ color: C.muted, fontSize: 13 }}>
        The machine running <code>pipeline.py serve</code> — a local address
        (http://127.0.0.1:8300) or your tunnel URL.
      </p>
      <label style={S.label}>API URL</label>
      <input style={S.input} value={base} onChange={(e) => setBase(e.target.value)}
        placeholder="https://pipeline.example.com" />
      <label style={{ ...S.label, marginTop: 10 }}>Admin token</label>
      <input style={S.input} value={token} onChange={(e) => setToken(e.target.value)}
        type="password" placeholder="ADMIN_API_TOKEN from .env" />
      {error && <p style={S.err}>{error}</p>}
      <div style={{ marginTop: 14 }}>
        <Btn busy={busy} onClick={connect}>Connect</Btn>
      </div>
    </div>
  );
}

// --------------------------------- orders ---------------------------------- #
function Orders({ onOpenProject, notify }) {
  const [orders, setOrders] = useState(null);
  const [busyRow, setBusyRow] = useState('');
  const [checking, setChecking] = useState(false);

  const refresh = useCallback(async () => {
    try { setOrders((await api.orders()).orders); }
    catch (e) { notify(`Orders failed: ${e.message}`); }
  }, [notify]);
  useEffect(() => { refresh(); }, [refresh]);

  const ingest = async (order) => {
    setBusyRow(order.folder);
    try {
      const res = await api.ingestOrder(order.folder, true);
      notify(`Ingesting as project "${res.project}" (storyboard follows)`);
      await refresh();
    } catch (e) { notify(`Ingest failed: ${e.message}`); }
    finally { setBusyRow(''); }
  };

  const checkNow = async () => {
    setChecking(true);
    try {
      const res = await api.pollWatcher();
      notify(res.enqueued.length
        ? `Watcher queued: ${res.enqueued.join(', ')}`
        : 'No new complete orders.');
      await refresh();
    } catch (e) { notify(`Watcher poll failed: ${e.message}`); }
    finally { setChecking(false); }
  };

  if (orders === null) return <p style={{ color: C.muted }}>Loading orders…</p>;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 style={{ margin: 0, fontSize: 17 }}>Orders in Cloudinary</h2>
        <Btn ghost busy={checking} onClick={checkNow}>Check for new orders now</Btn>
      </div>
      {orders.length === 0 && <p style={{ color: C.muted }}>No order folders found.</p>}
      {orders.map((o) => (
        <div key={o.folder} style={{ ...S.card, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{o.customer || o.folder}</div>
            <div style={{ color: C.muted, fontSize: 12 }}>{o.order_id} · uploaded {o.uploaded_at}</div>
          </div>
          {o.project ? (
            <>
              <span style={S.chip(C.ok)}>ingested</span>
              <Btn ghost onClick={() => onOpenProject(o.project)}>open “{o.project}”</Btn>
            </>
          ) : o.ingesting ? (
            <span style={S.chip(C.run)}>ingesting…</span>
          ) : (
            <Btn busy={busyRow === o.folder} onClick={() => ingest(o)}>Ingest + storyboard</Btn>
          )}
        </div>
      ))}
    </div>
  );
}

// -------------------------------- projects --------------------------------- #
function Projects({ onOpenProject, notify }) {
  const [projects, setProjects] = useState(null);
  useEffect(() => {
    api.projects().then((d) => setProjects(d.projects))
      .catch((e) => notify(`Projects failed: ${e.message}`));
  }, [notify]);

  if (projects === null) return <p style={{ color: C.muted }}>Loading projects…</p>;
  return (
    <div>
      {projects.map((p) => {
        const [text, color] = p.error ? ['error', C.err] : stepChip(p.next_step);
        const rendered = (p.clips || []).filter((c) => c.rendered).length;
        return (
          <div key={p.project} style={{ ...S.card, display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}
            onClick={() => onOpenProject(p.project)}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{p.project}
                {p.order?.customer ? <span style={{ color: C.muted, fontWeight: 400 }}> · {p.order.customer}</span> : null}
              </div>
              <div style={{ color: C.muted, fontSize: 12 }}>
                {p.error || `${(p.input_images || []).length} photos · ${rendered}/${(p.clips || []).length} clips` +
                  (p.final_video ? ' · final ready' : '')}
              </div>
            </div>
            <span style={S.chip(color)}>{text}</span>
          </div>
        );
      })}
      {projects.length === 0 && <p style={{ color: C.muted }}>No projects yet.</p>}
    </div>
  );
}

// ---------------------------- project detail ------------------------------- #
// A transition's start_frame/end_frame is the styled image path in practice
// ("styled_images/img1.png"), but may also be a frame id — handle both.
function frameName(framesById, frameRef) {
  if (frameRef && frameRef.includes('/')) return frameRef.split('/').pop();
  const f = framesById[frameRef];
  return f ? f.output_path.split('/').pop() : '';
}

function TransitionCard({ project, tr, framesById, clip, edited, onEdit, onRegenerate, busy }) {
  const startImg = frameName(framesById, tr.start_frame);
  const endImg = frameName(framesById, tr.end_frame);
  const clipFile = tr.output_path.split('/').pop();
  return (
    <div style={S.card}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
        <strong>{tr.id}</strong>
        <span style={S.chip(clip?.rendered ? C.ok : C.accentSoft)}>
          {clip?.rendered ? (clip.sfx ? 'rendered · sfx' : 'rendered · silent') : 'not rendered'}
        </span>
        <span style={{ color: C.muted, fontSize: 12 }}>{tr.duration}s</span>
        {edited && <span style={S.chip(C.accentSoft)}>edited</span>}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {startImg && <img src={fileUrl(project, 'styled', startImg)} alt={tr.start_frame}
            style={{ width: 128, borderRadius: 6 }} />}
          <span style={{ color: C.muted }}>→</span>
          {endImg && <img src={fileUrl(project, 'styled', endImg)} alt={tr.end_frame}
            style={{ width: 128, borderRadius: 6 }} />}
        </div>
        {clip?.rendered && (
          <video controls preload="metadata" style={{ width: 260, borderRadius: 6, background: '#000' }}
            src={fileUrl(project, 'clips', clipFile)} />
        )}
      </div>
      <label style={{ ...S.label, marginTop: 10 }}>Motion prompt</label>
      <textarea style={{ ...S.input, minHeight: 60, resize: 'vertical' }} value={tr.motion_prompt}
        onChange={(e) => onEdit({ ...tr, motion_prompt: e.target.value })} />
      <div style={{ display: 'flex', gap: 10, marginTop: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label style={S.label}>Duration</label>
          <select style={{ ...S.input, width: 90 }} value={tr.duration}
            onChange={(e) => onEdit({ ...tr, duration: Number(e.target.value) })}>
            <option value={5}>5s</option>
            <option value={10}>10s</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <label style={S.label}>Sound prompt (optional)</label>
          <input style={S.input} value={tr.sound_prompt || ''}
            onChange={(e) => onEdit({ ...tr, sound_prompt: e.target.value })} />
        </div>
        <Btn ghost busy={busy} onClick={() => onRegenerate(tr.id)}
          title="Re-render just this clip (save edits first)">
          {clip?.rendered ? 'Regenerate clip' : 'Render this clip'}
        </Btn>
      </div>
    </div>
  );
}

function ProjectDetail({ name, onBack, notify }) {
  const [snap, setSnap] = useState(null);
  const [storyboard, setStoryboard] = useState(null); // parsed, editable copy
  const [dirty, setDirty] = useState(new Set());
  const [busyAction, setBusyAction] = useState('');
  const [logJob, setLogJob] = useState(null);
  const [showPhotos, setShowPhotos] = useState(false);
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    const data = await api.project(name);
    setSnap(data);
    if (data.storyboard_json) {
      try {
        setStoryboard((prev) => {
          const fresh = JSON.parse(data.storyboard_json);
          // Keep unsaved edits across background refreshes.
          if (!prev) return fresh;
          const editedById = Object.fromEntries(
            prev.transitions.filter((t) => dirtyRef.current.has(t.id)).map((t) => [t.id, t])
          );
          fresh.transitions = fresh.transitions.map((t) => editedById[t.id] || t);
          return fresh;
        });
      } catch { setStoryboard(null); }
    } else setStoryboard(null);
    return data;
  }, [name]);

  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  useEffect(() => { load().catch((e) => notify(`Load failed: ${e.message}`)); }, [load, notify]);

  // Poll while a job is queued/running, refresh once when it settles.
  useEffect(() => {
    const active = (snap?.jobs || []).some((j) => j.state === 'queued' || j.state === 'running');
    if (!active) return undefined;
    pollRef.current = setInterval(() => load().catch(() => {}), 3000);
    return () => clearInterval(pollRef.current);
  }, [snap, load]);

  if (!snap) return <p style={{ color: C.muted }}>Loading {name}…</p>;

  const framesById = Object.fromEntries((storyboard?.frames || []).map((f) => [f.id, f]));
  const clipsById = Object.fromEntries((snap.clips || []).map((c) => [c.id, c]));
  const [stepText, stepColor] = stepChip(snap.next_step);
  const activeJob = (snap.jobs || []).find((j) => j.state === 'running' || j.state === 'queued');

  const run = async (command, options = {}, label = command) => {
    setBusyAction(label);
    try {
      await api.runAction(name, command, options);
      notify(`${label} started`);
      await load();
    } catch (e) { notify(`${label} failed: ${e.message}`); }
    finally { setBusyAction(''); }
  };

  const saveEdits = async () => {
    setBusyAction('save');
    try {
      await api.saveStoryboard(name, storyboard);
      setDirty(new Set());
      notify('Storyboard saved');
      await load();
    } catch (e) { notify(`Save failed: ${e.message}`); }
    finally { setBusyAction(''); }
  };

  const editTransition = (tr) => {
    setStoryboard((sb) => ({
      ...sb, transitions: sb.transitions.map((t) => (t.id === tr.id ? tr : t))
    }));
    setDirty((d) => new Set(d).add(tr.id));
  };

  const regenerate = async (clipId) => {
    if (dirty.size) { notify('Save your storyboard edits first.'); return; }
    await run('render', { clips: [clipId] }, `render ${clipId}`);
  };

  const showLog = async (jobId) => {
    try { setLogJob(await api.job(jobId)); }
    catch (e) { notify(`Log failed: ${e.message}`); }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
        <Btn ghost onClick={onBack}>← back</Btn>
        <h2 style={{ margin: 0, fontSize: 18 }}>{name}</h2>
        <span style={S.chip(stepColor)}>{stepText}</span>
        {snap.order?.customer && <span style={{ color: C.muted, fontSize: 13 }}>
          {snap.order.customer} · {snap.order.order_id}</span>}
        {activeJob && <span style={S.chip(C.run)}>{activeJob.command} {activeJob.state}…</span>}
      </div>

      <div style={{ ...S.card, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Btn ghost busy={busyAction === 'storyboard'} disabled={Boolean(activeJob)}
          onClick={() => run('storyboard')}>Storyboard</Btn>
        <Btn busy={busyAction === 'render'} disabled={Boolean(activeJob)}
          onClick={() => run('render')}>Render all missing clips</Btn>
        <Btn ghost busy={busyAction === 'audio'} disabled={Boolean(activeJob)}
          onClick={() => run('audio')}>Audio</Btn>
        <Btn ghost busy={busyAction === 'finalize'} disabled={Boolean(activeJob)}
          onClick={() => run('combine', { intro_clip: true, credits_photos: true, force: true }, 'finalize')}>
          Finalize (intro + credits)
        </Btn>
        <span style={{ flex: 1 }} />
        <Btn ghost onClick={() => setShowPhotos((v) => !v)}>
          {showPhotos ? 'Hide photos' : `Photos (${(snap.input_images || []).length})`}
        </Btn>
      </div>

      {snap.final_video && (
        <div style={S.card}>
          <strong>Final video</strong>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            <video controls preload="metadata" style={{ width: 420, maxWidth: '100%', borderRadius: 8, background: '#000' }}
              src={fileUrl(name, 'output', 'final_video.mp4')} />
            <a style={{ color: C.accentSoft }} href={fileUrl(name, 'output', 'final_video.mp4')}
              download={`${name}.mp4`}>Download</a>
          </div>
        </div>
      )}

      {showPhotos && (
        <div style={{ ...S.card, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(snap.styled_images.length ? snap.styled_images : snap.input_images).map((img) => (
            <img key={img} style={{ width: 120, borderRadius: 6 }} alt={img}
              src={fileUrl(name, snap.styled_images.length ? 'styled' : 'input', img)} />
          ))}
        </div>
      )}

      {(snap.jobs || []).length > 0 && (
        <div style={S.card}>
          <strong>Jobs</strong>
          {(snap.jobs || []).map((j) => <JobRow key={j.id} job={j} onShowLog={showLog} />)}
        </div>
      )}

      {logJob && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{logJob.command} — {logJob.state}</strong>
            <Btn ghost onClick={() => setLogJob(null)}>close</Btn>
          </div>
          <pre style={{ fontSize: 11, color: C.muted, overflowX: 'auto', maxHeight: 300 }}>
            {(logJob.log || []).join('\n') || '(no log lines)'}
          </pre>
        </div>
      )}

      {storyboard && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0 8px' }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>
              Storyboard — {storyboard.transitions.length} clips
            </h3>
            {dirty.size > 0 && (
              <Btn busy={busyAction === 'save'} onClick={saveEdits}>
                Save {dirty.size} edited transition{dirty.size > 1 ? 's' : ''}
              </Btn>
            )}
          </div>
          {storyboard.transitions.map((tr) => (
            <TransitionCard key={tr.id} project={name} tr={tr} framesById={framesById}
              clip={clipsById[tr.output_path.split('/').pop()?.replace(/\.mp4$/, '')]}
              edited={dirty.has(tr.id)} onEdit={editTransition}
              onRegenerate={regenerate} busy={busyAction === `render ${tr.id}`} />
          ))}
        </>
      )}
      {snap.storyboard_error && <p style={S.err}>Storyboard unreadable: {snap.storyboard_error}</p>}
    </div>
  );
}

// ---------------------------------- shell ---------------------------------- #
export default function AdminApp() {
  const [connected, setConnected] = useState(hasSettings());
  const [tab, setTab] = useState('orders');
  const [project, setProject] = useState('');
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);

  const notify = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 5000);
  }, []);

  if (!connected) {
    return <div style={S.page}><Settings onConnected={() => setConnected(true)} /></div>;
  }

  const openProject = (name) => { setProject(name); setTab('project'); };

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
          <h1 style={S.h1}>Animoments admin</h1>
          <nav style={{ display: 'flex', gap: 8 }}>
            <Btn ghost style={tab === 'orders' ? { borderColor: C.accent, color: C.accentSoft } : {}}
              onClick={() => { setTab('orders'); setProject(''); }}>Orders</Btn>
            <Btn ghost style={tab === 'projects' || tab === 'project' ? { borderColor: C.accent, color: C.accentSoft } : {}}
              onClick={() => { setTab('projects'); setProject(''); }}>Projects</Btn>
          </nav>
          <span style={{ flex: 1 }} />
          <Btn ghost onClick={() => setConnected(false)}>Settings</Btn>
        </div>
        {tab === 'orders' && <Orders onOpenProject={openProject} notify={notify} />}
        {tab === 'projects' && <Projects onOpenProject={openProject} notify={notify} />}
        {tab === 'project' && project && (
          <ProjectDetail name={project} onBack={() => setTab('projects')} notify={notify} />
        )}
      </div>
      {toast && (
        <div style={{
          position: 'fixed', bottom: 18, left: '50%', transform: 'translateX(-50%)',
          background: C.panel, border: `1px solid ${C.border}`, color: C.ink,
          padding: '10px 18px', borderRadius: 8, fontSize: 14, maxWidth: '90vw'
        }}>{toast}</div>
      )}
    </div>
  );
}

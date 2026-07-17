// Thin client for the pipeline's admin API (ai-video-maker `pipeline.py serve`).
// The API base URL + token are entered once in the panel and kept in
// localStorage — the panel is static, the pipeline machine is wherever the
// user runs/tunnels it.

const LS_BASE = 'am_admin_api_base';
const LS_TOKEN = 'am_admin_api_token';

export const getBase = () => (localStorage.getItem(LS_BASE) || '').replace(/\/+$/, '');
export const getToken = () => localStorage.getItem(LS_TOKEN) || '';
export const saveSettings = (base, token) => {
  localStorage.setItem(LS_BASE, (base || '').trim());
  localStorage.setItem(LS_TOKEN, (token || '').trim());
};
export const hasSettings = () => Boolean(getBase() && getToken());

async function request(path, options = {}) {
  const res = await fetch(`${getBase()}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try { detail = (await res.json()).detail || detail; } catch { /* not json */ }
    throw new Error(detail);
  }
  return res.json();
}

export const api = {
  health: () => request('/api/health'),
  orders: () => request('/api/orders'),
  ingestOrder: (order, storyboard) =>
    request('/api/orders/ingest', { method: 'POST', body: JSON.stringify({ order, storyboard }) }),
  pollWatcher: () => request('/api/watch/poll', { method: 'POST' }),
  projects: () => request('/api/projects'),
  project: (name) => request(`/api/projects/${encodeURIComponent(name)}`),
  saveStoryboard: (name, storyboard) =>
    request(`/api/projects/${encodeURIComponent(name)}/storyboard`, {
      method: 'PUT', body: JSON.stringify(storyboard)
    }),
  runAction: (name, command, options = {}) =>
    request(`/api/projects/${encodeURIComponent(name)}/actions/${command}`, {
      method: 'POST', body: JSON.stringify(options)
    }),
  jobs: (project) =>
    request(`/api/jobs${project ? `?project=${encodeURIComponent(project)}` : ''}`),
  job: (id) => request(`/api/jobs/${id}`),
  cancelJob: (id) => request(`/api/jobs/${id}/cancel`, { method: 'POST' })
};

// <img>/<video> tags can't send an Authorization header — the API accepts the
// token as a query param for exactly this case.
export const fileUrl = (project, kind, filename) =>
  `${getBase()}/api/projects/${encodeURIComponent(project)}/files/${kind}/` +
  `${encodeURIComponent(filename)}?token=${encodeURIComponent(getToken())}`;

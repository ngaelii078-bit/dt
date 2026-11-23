// Local stand-in for claude.ai's window.claude, so the CRM runs on localhost.
// db      -> saved in this browser's localStorage, seeded from /local/seed.json
// downloads -> normal browser download
// user    -> a single local user
// mcp (Gmail) -> not available locally: the page shows email sending as unavailable.
(() => {
  'use strict';
  const KEY = 'dtcrm-local-db-v1';
  // seed.json sits next to this file, wherever it is served from (/local/ locally, /crm/local/ on Vercel).
  const SEED_URL = new URL('seed.json', (document.currentScript && document.currentScript.src) || location.href).href;
  let data = null;
  const listeners = new Set();

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} };
  const copy = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));

  const ready = (async () => {
    const params = new URLSearchParams(location.search);
    const reset = params.has('reset');
    data = reset ? null : load();
    if (!data) {
      const seed = await (await fetch(SEED_URL, {cache: 'no-store'})).json();
      data = {};
      for (const [path, value] of Object.entries(seed)) {
        const [c, id] = path.split('/');
        (data[c] = data[c] || {})[id] = value;
      }
      save();
    }
    if (reset) history.replaceState(null, '', location.pathname + location.hash);
  })();

  const snap = (id, v) => { const body = copy(v); return {id, exists: v !== undefined, data: () => body, metadata: {fromCache: false, hasPendingWrites: false}}; };
  function fire(l) {
    if (l.kind === 'coll') {
      const c = data[l.path] || {};
      const docs = Object.keys(c).sort().map(id => snap(id, c[id]));
      l.next({docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {fromCache: false, hasPendingWrites: false}});
    } else {
      const [c, id] = l.path.split('/');
      l.next(snap(id, (data[c] || {})[id]));
    }
  }
  const emit = () => queueMicrotask(() => listeners.forEach(fire));
  function merge(t, s) {
    for (const k of Object.keys(s)) {
      const v = s[k];
      if (v && typeof v === 'object' && !Array.isArray(v) && t[k] && typeof t[k] === 'object' && !Array.isArray(t[k])) merge(t[k], v);
      else t[k] = v;
    }
    return t;
  }
  const rid = () => Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-4);
  const listen = (kind, path, next) => { const l = {kind, path, next}; listeners.add(l); ready.then(() => fire(l)); return () => listeners.delete(l); };

  function docRef(path) {
    const [c, id] = path.split('/');
    return {
      id, path,
      async get() { await ready; return snap(id, (data[c] || {})[id]); },
      async set(obj) { await ready; (data[c] = data[c] || {})[id] = copy(obj); save(); emit(); },
      async update(obj) {
        await ready;
        const cur = (data[c] || {})[id];
        if (cur === undefined) throw {code: 'invalid_argument', message: 'That record no longer exists.'};
        merge(cur, copy(obj)); save(); emit();
      },
      async delete() { await ready; if (data[c]) delete data[c][id]; save(); emit(); },
      onSnapshot(next) { return listen('doc', path, next); },
      collection(sub) { return collRef(path + '/' + sub); }
    };
  }
  function collRef(c) {
    return {
      path: c,
      doc: id => docRef(c + '/' + (id || rid())),
      async add(obj) { const r = docRef(c + '/' + rid()); await r.set(obj); return r; },
      onSnapshot(next) { return listen('coll', c, next); }
    };
  }

  // Keep two open tabs in step.
  window.addEventListener('storage', e => { if (e.key === KEY) { data = load() || data; emit(); } });

  const db = {doc: docRef, collection: collRef};
  const downloads = {
    async save({filename, data: d}) {
      const blob = d instanceof Blob ? d : new Blob([d]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      return {status: 'saved'};
    }
  };
  const user = {
    async me() { return {id: 'local', name: '', avatarUrl: '', color: '#262626', email: null, isOwner: true, canEdit: true}; },
    async id() { return 'local'; }, async isOwner() { return true; }, async canEdit() { return true; }, async can() { return true; }
  };
  const caps = {db, downloads, user};
  window.claude = {use: name => Promise.resolve(caps[name] || null)};

  // Add the "local preview" note once the CRM's layout exists (it may be injected after load).
  function addBanner() {
    const wrap = document.querySelector('main .wrap');
    if (!wrap || wrap.dataset.localNote) return !!wrap;
    wrap.dataset.localNote = '1';
    const hide = document.createElement('style');
    hide.textContent = '#banner{display:none!important}';
    document.head.appendChild(hide);
    const w = document.createElement('div');
    w.className = 'banner';
    w.innerHTML = '<span class="dot"></span><p><b>Local preview.</b> Changes are saved in this browser only. ' +
      'Emailing quotes and invoices works when the CRM is opened in claude.ai; here you can use WhatsApp and Download PDF. ' +
      'To start again with the sample data, add <b>?reset</b> to the address.</p>';
    wrap.prepend(w);
    return true;
  }
  if (!addBanner()) {
    const mo = new MutationObserver(() => { if (addBanner()) mo.disconnect(); });
    mo.observe(document.documentElement, {childList: true, subtree: true});
  }
})();

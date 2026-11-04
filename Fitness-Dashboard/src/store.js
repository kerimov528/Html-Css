// Yaddaş qatı. Claude Artifact daxilində "db" + "assets" imkanlarından istifadə edir;
// adi brauzerdə (məs. GitHub Pages) localStorage + IndexedDB-yə keçir.

const LS_KEY = 'prime-ili:v1';

function lsRead() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}
function lsWrite(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); return true; } catch { return false; }
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------- IndexedDB (yalnız lokal rejimdə şəkil/video üçün) ----------
function idb() {
  return new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open('prime-ili-media', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('media');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (e) { reject(e); }
  });
}
async function idbPut(key, blob) {
  const db = await idb();
  return new Promise((res, rej) => {
    const tx = db.transaction('media', 'readwrite');
    tx.objectStore('media').put(blob, key);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}
async function idbGet(key) {
  const db = await idb();
  return new Promise((res, rej) => {
    const tx = db.transaction('media', 'readonly');
    const r = tx.objectStore('media').get(key);
    r.onsuccess = () => res(r.result || null);
    r.onerror = () => rej(r.error);
  });
}
async function idbDel(key) {
  const db = await idb();
  return new Promise((res) => {
    const tx = db.transaction('media', 'readwrite');
    tx.objectStore('media').delete(key);
    tx.oncomplete = () => res();
    tx.onerror = () => res();
  });
}

// ---------- Lokal store ----------
function createLocalStore(reason) {
  const listeners = new Map();
  let state = lsRead();
  const coll = (name) => state[name] || {};
  const emit = (name) => (listeners.get(name) || []).forEach((cb) => cb(name.includes('/') ? state[name] || null : Object.entries(coll(name)).map(([id, v]) => ({ id, ...v }))));
  const save = (name) => { const ok = lsWrite(state); emit(name); if (!ok) throw new Error('local_storage_unavailable'); };
  const urlCache = new Map();

  return {
    mode: 'local',
    reason,
    canWrite: true,
    canUpload: typeof indexedDB !== 'undefined',
    subscribe(name, cb) {
      if (!listeners.has(name)) listeners.set(name, []);
      listeners.get(name).push(cb);
      setTimeout(() => emit(name), 0);
      return () => listeners.set(name, (listeners.get(name) || []).filter((f) => f !== cb));
    },
    async add(name, data) { const id = uid(); state[name] = { ...coll(name), [id]: data }; save(name); return id; },
    async put(name, id, data) { state[name] = { ...coll(name), [id]: data }; save(name); },
    async remove(name, id) { const c = { ...coll(name) }; delete c[id]; state[name] = c; save(name); },
    async setDoc(path, data) { state[path] = data; save(path); },
    async upload(blob) {
      const key = 'idb:' + uid();
      await idbPut(key, blob);
      const url = URL.createObjectURL(blob);
      urlCache.set(key, url);
      return { ref: key, url };
    },
    async mediaUrl(ref) {
      if (urlCache.has(ref)) return urlCache.get(ref);
      const blob = await idbGet(ref).catch(() => null);
      if (!blob) return null;
      const url = URL.createObjectURL(blob);
      urlCache.set(ref, url);
      return url;
    },
    async removeMedia(ref) { await idbDel(ref); },
  };
}

// ---------- Claude db store ----------
function createCloudStore(db, assets) {
  return {
    mode: 'cloud',
    canWrite: true,
    canUpload: !!assets,
    subscribe(name, cb, onError) {
      if (name.includes('/')) {
        return db.doc(name).onSnapshot((snap) => cb(snap.exists ? snap.data() : null, snap.metadata), onError);
      }
      return db.collection(name).onSnapshot(
        (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })), snap.metadata),
        onError,
      );
    },
    async add(name, data) { const ref = db.collection(name).doc(); await ref.set(data); return ref.id; },
    async put(name, id, data) { await db.collection(name).doc(id).set(data); },
    async remove(name, id) { await db.collection(name).doc(id).delete(); },
    async setDoc(path, data) { await db.doc(path).set(data); },
    async upload(blob, type) {
      const r = await assets.upload(blob, type ? { type } : undefined);
      return { ref: r.id, url: r.url };
    },
    async mediaUrl(ref) { return ref.startsWith('idb:') ? null : '/_blob/' + ref; },
    async removeMedia(ref) { if (assets) await assets.delete(ref); },
  };
}

// Store-u qurur. Claude mühiti yoxdursa dərhal lokal rejim.
export async function initStore() {
  const c = typeof window !== 'undefined' ? window.claude : undefined;
  if (!c || typeof c.use !== 'function') return createLocalStore('standalone');
  try {
    const [db, user] = await Promise.all([c.use('db'), c.use('user').catch(() => null)]);
    if (!db) return createLocalStore('no_db');
    let canEdit = true;
    if (user) {
      try { canEdit = await user.canEdit(); } catch { canEdit = true; }
    }
    if (!canEdit) return createLocalStore('viewer');
    const assets = await c.use('assets').catch(() => null);
    return createCloudStore(db, assets);
  } catch {
    return createLocalStore('error');
  }
}

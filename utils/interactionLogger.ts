// On-device interaction logging (IndexedDB) + best-effort streaming to a backend
// audit endpoint (/api/log). Both destinations get the SAME entries:
//   - IndexedDB: durable local copy on the tablet, used for the export-to-Downloads.
//   - Backend:   central audit log that survives a lost / wiped tablet.
//
// Only interaction TYPE + a short element/event LABEL + timestamp are recorded —
// never the values typed into inputs — so account numbers, OTPs and PINs are
// never stored anywhere.

const DB_NAME = 'zsmart_logs';
const STORE = 'interactions';
const MAX_LOGS = 50000; // local cap so storage can't grow unbounded

export type LogEntry = {
  ts: string; // ISO timestamp
  session: string; // per-visit id
  type: string; // 'session_start' | 'click' | 'submit' | 'login_success' | ...
  label: string; // element label / event detail (no input values)
  path: string; // location.pathname + hash
};

// Stable per-visit id (regenerated each time the tab loads in the browser).
export const SESSION_ID: string =
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const pathOf = () =>
  typeof location !== 'undefined' ? location.pathname + location.hash : '';

// ---------------------------------------------------------------------------
// IndexedDB (durable local copy + export source)
// ---------------------------------------------------------------------------

let dbPromise: Promise<IDBDatabase | null> | null = null;
let writeCount = 0;

const openDb = (): Promise<IDBDatabase | null> => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
};

const trim = (db: IDBDatabase) => {
  try {
    const store = db.transaction(STORE, 'readwrite').objectStore(STORE);
    const countReq = store.count();
    countReq.onsuccess = () => {
      let over = countReq.result - MAX_LOGS;
      if (over <= 0) return;
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor && over > 0) {
          cursor.delete();
          over--;
          cursor.continue();
        }
      };
    };
  } catch {
    /* ignore */
  }
};

export const logEvent = async (entry: LogEntry): Promise<void> => {
  const db = await openDb();
  if (!db) return;
  try {
    db.transaction(STORE, 'readwrite').objectStore(STORE).add(entry);
    if (++writeCount % 200 === 0) trim(db);
  } catch {
    /* ignore */
  }
};

// ---------------------------------------------------------------------------
// Backend streaming (Option A: central server audit log)
// ---------------------------------------------------------------------------

const ENDPOINT = '/api/log';
let queue: LogEntry[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let unloadHooked = false;

const flush = async () => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (typeof fetch === 'undefined' || queue.length === 0) return;
  const batch = queue;
  queue = [];
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: batch }),
      keepalive: true,
    });
    if (!res.ok) throw new Error('bad status');
  } catch {
    // couldn't reach the server — keep for retry (bounded so memory can't grow)
    queue = batch.concat(queue).slice(-1000);
    scheduleFlush();
  }
};

const scheduleFlush = () => {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    flush();
  }, 4000);
};

const sendBeaconNow = () => {
  if (queue.length === 0) return;
  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify({ entries: queue })], {
        type: 'application/json',
      });
      if (navigator.sendBeacon(ENDPOINT, blob)) queue = [];
    }
  } catch {
    /* ignore */
  }
};

const hookUnload = () => {
  if (unloadHooked || typeof window === 'undefined') return;
  unloadHooked = true;
  window.addEventListener('pagehide', sendBeaconNow);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flush();
      sendBeaconNow();
    }
  });
};

const enqueueRemote = (entry: LogEntry) => {
  queue.push(entry);
  hookUnload();
  if (queue.length >= 10) flush();
  else scheduleFlush();
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Record one interaction to BOTH the local IndexedDB (for on-tablet export)
 * and the backend audit endpoint. Pass a short, non-sensitive label only.
 */
export const track = (type: string, label = ''): void => {
  const entry: LogEntry = {
    ts: new Date().toISOString(),
    session: SESSION_ID,
    type,
    label: String(label || '').slice(0, 120),
    path: pathOf(),
  };
  logEvent(entry);
  enqueueRemote(entry);
};

// ---------------------------------------------------------------------------
// Export / maintenance (used by the staff panel)
// ---------------------------------------------------------------------------

export const getAllLogs = async (): Promise<LogEntry[]> => {
  const db = await openDb();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
      req.onsuccess = () => resolve((req.result as LogEntry[]) || []);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
};

export const countLogs = async (): Promise<number> => {
  const db = await openDb();
  if (!db) return 0;
  return new Promise((resolve) => {
    try {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => resolve(0);
    } catch {
      resolve(0);
    }
  });
};

export const clearLogs = async (): Promise<void> => {
  const db = await openDb();
  if (!db) return;
  try {
    db.transaction(STORE, 'readwrite').objectStore(STORE).clear();
  } catch {
    /* ignore */
  }
};

const download = (filename: string, mime: string, content: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

const stamp = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};

export const exportLogsJson = async (): Promise<number> => {
  const logs = await getAllLogs();
  download(`zsmart-interactions-${stamp()}.json`, 'application/json', JSON.stringify(logs, null, 2));
  return logs.length;
};

const csvCell = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export const exportLogsCsv = async (): Promise<number> => {
  const logs = await getAllLogs();
  const rows = logs.map((l) => [l.ts, l.session, l.type, l.label, l.path].map(csvCell).join(','));
  download(`zsmart-interactions-${stamp()}.csv`, 'text/csv', ['ts,session,type,label,path', ...rows].join('\n'));
  return logs.length;
};

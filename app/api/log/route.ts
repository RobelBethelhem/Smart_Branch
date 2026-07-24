import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { executeQuery } from '@/lib/db';

// Central interaction audit log. The browser streams batches of interaction
// entries here; each entry carries the tablet SERIAL number (the audit key) and
// the BRANCH code, so with many tablets you can always tell which device an
// action came from.
//
// Primary store: an Oracle table (default ZSMART_INTERACTION_LOG). See the DDL
// in app/api/log/interaction_log.sql — your DBA must create it and grant INSERT
// to the app's DB user.
//
// Safety net: if the DB is unreachable or the table isn't created yet, the batch
// is appended to a daily JSONL file (INTERACTION_LOG_DIR, default
// logs/interactions/) so nothing is lost. The tablet also keeps its own copy in
// IndexedDB. This route only appends to its own table/files — it never touches
// an existing table or feature.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LOG_DIR =
  process.env.INTERACTION_LOG_DIR ||
  path.join(process.cwd(), 'logs', 'interactions');

// Table name is trusted config (not user input); sanitise defensively anyway.
const TABLE = (process.env.INTERACTION_LOG_TABLE || 'ZSMART_INTERACTION_LOG').replace(
  /[^A-Za-z0-9_.]/g,
  ''
);

const MAX_ENTRIES = 1000; // per request, defensive cap
const DB_CHUNK = 100; // rows per INSERT ALL statement
const s = (v: unknown, n: number) => String(v ?? '').slice(0, n);

type Row = {
  serial: string;
  branch: string;
  session: string;
  type: string;
  label: string;
  path: string;
  ip: string;
  ts: string;
};

const COLS = '(SERIAL, BRANCH, SESSION_ID, EVENT_TYPE, LABEL, PATH, CLIENT_IP, EVENT_TS)';

// Build a single multi-row "INSERT ALL ... SELECT 1 FROM DUAL" with positional binds.
function buildInsertAll(rows: Row[]): { sql: string; binds: string[] } {
  let sql = 'INSERT ALL\n';
  const binds: string[] = [];
  let p = 1;
  for (const r of rows) {
    sql += `  INTO ${TABLE} ${COLS} VALUES (:${p++}, :${p++}, :${p++}, :${p++}, :${p++}, :${p++}, :${p++}, :${p++})\n`;
    binds.push(r.serial, r.branch, r.session, r.type, r.label, r.path, r.ip, r.ts);
  }
  sql += 'SELECT 1 FROM DUAL';
  return { sql, binds };
}

async function appendToFile(rows: Row[], recvTs: string) {
  const day = recvTs.slice(0, 10);
  const lines =
    rows.map((r) => JSON.stringify({ recvTs, ...r })).join('\n') + '\n';
  await fs.mkdir(LOG_DIR, { recursive: true });
  await fs.appendFile(path.join(LOG_DIR, `interactions-${day}.jsonl`), lines, 'utf8');
}

export async function POST(request: Request) {
  const recvTs = new Date().toISOString();
  try {
    const body = await request.json().catch(() => null);
    const entries: unknown[] = Array.isArray((body as any)?.entries)
      ? (body as any).entries
      : [];

    if (entries.length === 0) {
      return NextResponse.json({ success: true, written: 0 });
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '';

    const rows: Row[] = entries.slice(0, MAX_ENTRIES).map((e: any) => ({
      serial: s(e?.serial, 80),
      branch: s(e?.branch, 40),
      session: s(e?.session, 80),
      type: s(e?.type, 60),
      label: s(e?.label, 200),
      path: s(e?.path, 200),
      ip,
      ts: typeof e?.ts === 'string' ? e.ts.slice(0, 40) : recvTs,
    }));

    // Primary: insert into the Oracle audit table, chunk by chunk.
    const chunks: Row[][] = [];
    for (let i = 0; i < rows.length; i += DB_CHUNK) chunks.push(rows.slice(i, i + DB_CHUNK));

    let insertedChunks = 0;
    let dbError = '';
    for (const chunk of chunks) {
      const { sql, binds } = buildInsertAll(chunk);
      const r = await executeQuery(sql, binds, { autoCommit: true });
      if (!r.success) {
        dbError = r.error || 'insert failed';
        break;
      }
      insertedChunks++;
    }

    if (insertedChunks === chunks.length) {
      return NextResponse.json({ success: true, stored: 'db', written: rows.length });
    }

    // DB failed (down / table missing / no grant) — persist the not-yet-stored
    // rows to the file safety net so nothing is lost.
    const remaining = chunks.slice(insertedChunks).flat();
    try {
      await appendToFile(remaining, recvTs);
      return NextResponse.json({
        success: true,
        stored: insertedChunks > 0 ? 'db+file' : 'file',
        written: rows.length,
        dbError,
      });
    } catch {
      // Both DB and file failed — signal failure so the client retries later.
      return NextResponse.json(
        { success: false, error: 'db_and_file_failed', dbError },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json({ success: false, error: 'log_write_failed' }, { status: 500 });
  }
}

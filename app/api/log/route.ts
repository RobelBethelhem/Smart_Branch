import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Central interaction audit log. The browser streams batches of interaction
// entries here; we append them (one JSON object per line) to a daily file on
// the server, so the audit trail survives even if a tablet is lost or wiped.
//
// Storage location is configurable via INTERACTION_LOG_DIR; by default it is
// <project>/logs/interactions/interactions-YYYY-MM-DD.jsonl. This route only
// appends to its own files — it does not touch any existing table or feature.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LOG_DIR =
  process.env.INTERACTION_LOG_DIR ||
  path.join(process.cwd(), 'logs', 'interactions');

const MAX_ENTRIES = 1000; // per request, defensive cap
const s = (v: unknown, n: number) => String(v ?? '').slice(0, n);

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const entries: unknown[] = Array.isArray((body as any)?.entries)
      ? (body as any).entries
      : [];

    if (entries.length === 0) {
      return NextResponse.json({ success: true, written: 0 });
    }

    const recvTs = new Date().toISOString();
    const day = recvTs.slice(0, 10);
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '';

    const lines =
      entries
        .slice(0, MAX_ENTRIES)
        .map((e: any) =>
          JSON.stringify({
            recvTs,
            ip,
            ts: typeof e?.ts === 'string' ? e.ts.slice(0, 40) : recvTs,
            session: s(e?.session, 80),
            type: s(e?.type, 60),
            label: s(e?.label, 200),
            path: s(e?.path, 200),
          })
        )
        .join('\n') + '\n';

    await fs.mkdir(LOG_DIR, { recursive: true });
    await fs.appendFile(path.join(LOG_DIR, `interactions-${day}.jsonl`), lines, 'utf8');

    return NextResponse.json({
      success: true,
      written: Math.min(entries.length, MAX_ENTRIES),
    });
  } catch {
    // Signal failure so the client keeps the batch and retries later.
    return NextResponse.json({ success: false, error: 'log_write_failed' }, { status: 500 });
  }
}

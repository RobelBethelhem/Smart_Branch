'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  logEvent,
  exportLogsJson,
  exportLogsCsv,
  clearLogs,
  countLogs,
} from '@/utils/interactionLogger';

// Per-visit session id (stable for the tab's lifetime).
const SESSION_ID = Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);

const path = () => (typeof location !== 'undefined' ? location.pathname + location.hash : '');

// A short, safe label for the interacted element — never an input's value.
const labelFor = (el: Element | null): string => {
  if (!el) return '';
  const t =
    ((el.closest('button, a, [role="button"], [data-log]') as HTMLElement) ||
      (el as HTMLElement)) ?? null;
  if (!t) return '';
  const dataLog = t.getAttribute?.('data-log');
  if (dataLog) return dataLog.slice(0, 80);
  const aria = t.getAttribute?.('aria-label') || t.getAttribute?.('title');
  if (aria) return aria.trim().slice(0, 80);
  const tag = t.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    // identify the field, NOT its value
    return `${tag}#${(t as HTMLInputElement).name || t.id || ''}`.slice(0, 80);
  }
  const text = (t.textContent || '').replace(/\s+/g, ' ').trim();
  return (text || tag || 'element').slice(0, 80);
};

const btn: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  border: 'none',
  background: '#E60000',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
};

export default function InteractionLogger() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    logEvent({
      ts: new Date().toISOString(),
      session: SESSION_ID,
      type: 'session_start',
      label: (navigator.userAgent || '').slice(0, 80),
      path: path(),
    });

    const skip = (target: EventTarget | null) =>
      !!(target as Element)?.closest?.('[data-nolog]');

    const onClick = (e: MouseEvent) => {
      if (skip(e.target)) return; // don't log the admin panel itself
      logEvent({
        ts: new Date().toISOString(),
        session: SESSION_ID,
        type: 'click',
        label: labelFor(e.target as Element),
        path: path(),
      });
    };
    const onSubmit = (e: Event) => {
      if (skip(e.target)) return;
      logEvent({
        ts: new Date().toISOString(),
        session: SESSION_ID,
        type: 'submit',
        label: labelFor(e.target as Element),
        path: path(),
      });
    };

    document.addEventListener('click', onClick, true);
    document.addEventListener('submit', onSubmit, true);

    // Optional staff shortcut: open with ?logs or #logs in the URL.
    if (/[?&#]logs\b/.test(location.search + location.hash)) openPanel();

    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('submit', onSubmit, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openPanel = async () => {
    setCount(await countLogs());
    setOpen(true);
  };

  // Long-press the corner handle (700ms) so a stray tap by a customer does nothing.
  const startPress = () => {
    pressTimer.current = setTimeout(openPanel, 700);
  };
  const cancelPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  return (
    <div data-nolog>
      {/* Discreet, semi-invisible handle in the bottom-right corner. */}
      <div
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          position: 'fixed',
          right: 4,
          bottom: 4,
          width: 22,
          height: 22,
          borderRadius: 11,
          background: 'rgba(0,0,0,0.08)',
          zIndex: 2147483000,
          touchAction: 'none',
        }}
        aria-hidden
      />

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483001,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 12, padding: 20, width: 320, maxWidth: '92%' }}
          >
            <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: 18 }}>Interaction Log</h3>
            <p style={{ fontSize: 14, color: '#555', marginBottom: 16 }}>
              {count} entries stored on this tablet. Exports save to the Downloads folder.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                style={btn}
                onClick={async () => {
                  const n = await exportLogsJson();
                  alert(`Exported ${n} entries (JSON) to Downloads.`);
                }}
              >
                Export JSON to Downloads
              </button>
              <button
                style={btn}
                onClick={async () => {
                  const n = await exportLogsCsv();
                  alert(`Exported ${n} entries (CSV) to Downloads.`);
                }}
              >
                Export CSV to Downloads
              </button>
              <button
                style={{ ...btn, background: '#fee2e2', color: '#b91c1c' }}
                onClick={async () => {
                  if (confirm('Clear all stored interaction logs on this tablet?')) {
                    await clearLogs();
                    setCount(0);
                  }
                }}
              >
                Clear logs
              </button>
              <button
                style={{ ...btn, background: '#f3f4f6', color: '#111' }}
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

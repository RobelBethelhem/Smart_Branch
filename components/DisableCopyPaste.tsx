'use client';

import { useEffect } from 'react';

/**
 * Kiosk hardening: disable copy / cut / paste and the right-click context menu
 * across the whole app, so sensitive data (account numbers, OTPs, etc.) can't be
 * copied out and arbitrary data can't be pasted in. Typing and every other
 * interaction are unaffected — this only cancels the clipboard/context-menu events.
 *
 * To keep the right-click menu, remove 'contextmenu' from the list below.
 */
export default function DisableCopyPaste() {
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    const events: (keyof DocumentEventMap)[] = ['copy', 'cut', 'paste', 'contextmenu'];
    events.forEach((ev) => document.addEventListener(ev, prevent));
    return () => events.forEach((ev) => document.removeEventListener(ev, prevent));
  }, []);

  return null;
}

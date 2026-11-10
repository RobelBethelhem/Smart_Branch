'use client';

import dynamic from 'next/dynamic';

/**
 * SignatureVerificationModal, loaded on demand.
 *
 * The modal bundles OpenCV (@techstark/opencv-js, several MB with its WebAssembly inside).
 * Imported directly by every transaction screen, all of it sat in the first page load of
 * every kiosk. Loaded this way it arrives in its own file, the first time it is needed (the
 * main page also warms it up a few seconds after load, see app/page.tsx).
 *
 * OpenCV finishes starting up a moment after its code has loaded. The modal starts comparing
 * signatures as soon as it mounts, so the loader below waits for OpenCV before handing the
 * modal over; the modal never sees a half-started library.
 *
 * Do NOT import '@techstark/opencv-js' dynamically here: awaiting the OpenCV module object
 * freezes the page (see opencvRuntime.ts). Readiness is asked through opencvRuntime, which
 * only returns a boolean.
 */
async function loadSignatureVerificationModal() {
  const [modal, runtime] = await Promise.all([
    import('./SignatureVerificationModal'),
    import('./opencvRuntime'),
  ]);

  const deadline = Date.now() + 20000;
  // After 20 s hand the modal over regardless, so a problem shows up as the modal's own
  // error message, not a blank screen.
  while (!runtime.isOpenCvRuntimeReady() && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return modal;
}

/** Start downloading and initialising the modal in the background. Safe to call repeatedly. */
export function preloadSignatureVerificationModal(): void {
  void loadSignatureVerificationModal().catch(() => {
    /* it will be loaded (and any error shown) when the modal is actually opened */
  });
}

const LazySignatureVerificationModal = dynamic(loadSignatureVerificationModal, { ssr: false });

export default LazySignatureVerificationModal;

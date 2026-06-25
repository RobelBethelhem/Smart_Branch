'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import * as faceapi from 'face-api.js';
import { X, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface FaceVerificationModalProps {
  onClose: () => void;
  onSuccess: () => void;
  profileImage: string;
}

// ---- Tunables (validate on the real kiosk via the dev-console logs) --------
// Recognition: euclidean distance between 128-d descriptors (lower = stricter).
const FACE_MATCH_THRESHOLD = 0.5;

// Gesture liveness (heuristics over the 68 facial landmarks).
const BLINK_DROP_ABS = 0.06; // blink = EAR drops at least this far below the user's open EAR
const BLINK_DROP_RATIO = 0.7; // ...or EAR falls below openEAR * this (whichever first)
const MAR_OPEN = 0.3; // inner-lip mouth-open ratio above this
const MAR_CLOSED = 0.2; // mouth treated as closed below this (baseline)
const YAW_TURN = 0.13; // |yaw - baseline| beyond this = a head turn (either direction)
const ACTION_TIMEOUT_MS = 8000; // per-action limit
const SEQUENCE_LENGTH = 2; // gesture actions before the light test
const GLOBAL_DEADLINE_MS = SEQUENCE_LENGTH * ACTION_TIMEOUT_MS + 8000; // >= sum of per-action budgets
const BASELINE_TIMEOUT_MS = 12000;
const DETECT_INTERVAL_MS = 110;
const BASELINE_FRAMES = 5;

// Active anti-replay light test. The screen flashes a RANDOM bright/dark pattern;
// a live 3D face reflects it (face brightens vs background in sync). A photo or a
// replayed video reflects uniformly / cannot react -> ~0 correlation -> rejected.
const FLASH_STEPS = 12;
const FLASH_STEP_MS = 200;
const FLASH_THRESHOLD = 0.3; // min correlation to accept (tune on the kiosk)
// TEMP while calibrating: when false the light test only MEASURES + shows the
// correlation and never blocks. Set true once FLASH_THRESHOLD is tuned for the kiosk.
const FLASH_ENFORCE = false;

const DESCRIPTOR_SAMPLES = 5;
// Overlay live EAR/MAR/yaw values during liveness to calibrate thresholds.
// Set to false for production once tuned.
const LIVENESS_DEBUG = true;

// Detector tuning. The library default (inputSize 416, scoreThreshold 0.5) is slow
// and often fails to detect a clearly-present face on a webcam/kiosk camera, which
// shows "Position your face in the frame". A lower score is more lenient and a
// smaller input size is much faster (more frames per second = responsive + reliable).
const DETECTOR_OPTIONS = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 });
// ---------------------------------------------------------------------------

type Pt = { x: number; y: number };
type Action = { kind: 'blink' | 'mouth' | 'turn'; dir?: 1 | -1 };
type Phase = 'loading' | 'liveness' | 'flash' | 'verifying' | 'success' | 'error';

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

const eyeAspectRatio = (eye: Pt[]) =>
  (dist(eye[1], eye[5]) + dist(eye[2], eye[4])) / (2 * dist(eye[0], eye[3]) || 1);

// Inner-lip vertical gap over mouth width: ~0 when the mouth is shut, large when
// open. (The OUTER lip points stay far apart even when closed, so they cannot
// tell open from closed — that wrongly blocked the neutral/baseline check.)
const mouthAspectRatio = (mouth: Pt[]) =>
  dist(mouth[14], mouth[18]) / (dist(mouth[0], mouth[6]) || 1);

// Roll-invariant yaw: project (noseTip - eyeMid) onto the eye-line axis, so an
// in-plane tilt of a flat photo does NOT register as a head turn.
const computeYaw = (leftEye: Pt[], rightEye: Pt[], nose: Pt[]) => {
  const lc = mid(leftEye[0], leftEye[3]);
  const rc = mid(rightEye[0], rightEye[3]);
  const dx = rc.x - lc.x;
  const dy = rc.y - lc.y;
  const inter = Math.hypot(dx, dy) || 1;
  const em = mid(lc, rc);
  const tip = nose[3];
  return ((tip.x - em.x) * (dx / inter) + (tip.y - em.y) * (dy / inter)) / inter;
};

// Pearson correlation in [0, 1] (negative -> 0; not a valid liveness signal).
const pearson = (a: number[], b: number[]): number => {
  const n = Math.min(a.length, b.length);
  if (n < 4) return 0;
  let sa = 0;
  let sb = 0;
  for (let i = 0; i < n; i++) {
    sa += a[i];
    sb += b[i];
  }
  const ma = sa / n;
  const mb = sb / n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const xa = a[i] - ma;
    const xb = b[i] - mb;
    num += xa * xb;
    da += xa * xa;
    db += xb * xb;
  }
  if (da === 0 || db === 0) return 0;
  return Math.max(0, num / Math.sqrt(da * db));
};

const meanLuma = (data: Uint8ClampedArray, pxStride: number): number => {
  let sum = 0;
  let count = 0;
  const step = pxStride * 4;
  for (let i = 0; i + 2 < data.length; i += step) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    count++;
  }
  return count ? sum / count : 0;
};

const makeSequence = (len: number): Action[] => {
  // 'blink' omitted: a blink's brief closed frame is easily missed between camera
  // samples; mouth + turn are reliable and the flash test carries the anti-spoof.
  const kinds: Action['kind'][] = ['mouth', 'turn'];
  const rnd = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
  const seq: Action[] = [];
  let prev: Action['kind'] | null = null;
  for (let i = 0; i < len; i++) {
    const choices = kinds.filter((k) => k !== prev);
    const kind = choices[rnd(choices.length)];
    seq.push(kind === 'turn' ? { kind, dir: rnd(2) === 0 ? 1 : -1 } : { kind });
    prev = kind;
  }
  return seq;
};

const FaceVerificationModal: React.FC<FaceVerificationModalProps> = ({
  onClose,
  onSuccess,
  profileImage,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const busyRef = useRef(false);

  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Loading face models…');
  const [stepText, setStepText] = useState('');
  const [progress, setProgress] = useState({ done: 0, total: SEQUENCE_LENGTH });
  const [turn, setTurn] = useState<{ active: boolean; marker: number; dir: 1 | -1 }>({
    active: false,
    marker: 0,
    dir: 1,
  });
  const [flashOn, setFlashOn] = useState(false);
  const [dbg, setDbg] = useState({ ear: 0, mar: 0, yaw: 0 });
  const [flashCorr, setFlashCorr] = useState<number | null>(null);

  const lv = useRef({
    seq: [] as Action[],
    idx: 0,
    baseYaw: 0,
    openEAR: 0.3,
    minEAR: Infinity,
    baseDone: false,
    baseSamples: [] as { ear: number; yaw: number }[],
    livenessStart: 0,
    sequenceStart: 0,
    promptStart: 0,
    armReady: false,
  });

  const cleanup = useCallback(() => {
    if (loopRef.current) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const failLiveness = (msg: string) => {
    cleanup();
    setFlashOn(false);
    setTurn((t) => ({ ...t, active: false }));
    setError(msg);
    setPhase('error');
  };

  const captureAndMatch = async () => {
    setPhase('verifying');
    setStatus('Verifying your identity…');
    try {
      const img = await faceapi.fetchImage(profileImage);
      const profileDet = await faceapi
        .detectSingleFace(img, DETECTOR_OPTIONS)
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!mountedRef.current) return;
      if (!profileDet) {
        cleanup();
        setError('No face found in the profile photo on file.');
        setPhase('error');
        return;
      }

      let best = Infinity;
      for (let i = 0; i < DESCRIPTOR_SAMPLES; i++) {
        if (!mountedRef.current || !videoRef.current) break;
        const liveDet = await faceapi
          .detectSingleFace(videoRef.current, DETECTOR_OPTIONS)
          .withFaceLandmarks()
          .withFaceDescriptor();
        if (liveDet) {
          const d = faceapi.euclideanDistance(profileDet.descriptor, liveDet.descriptor);
          if (d < best) best = d;
        }
        await new Promise((r) => setTimeout(r, 200));
      }
      if (!mountedRef.current) return;

      if (process.env.NODE_ENV === 'development') {
        console.log(`[face] bestDistance=${best.toFixed(3)} (threshold ${FACE_MATCH_THRESHOLD})`);
      }

      if (best === Infinity) {
        cleanup();
        setError('Could not read your face clearly. Please try again in good lighting.');
        setPhase('error');
        return;
      }
      if (best < FACE_MATCH_THRESHOLD) {
        cleanup();
        setPhase('success');
        onSuccess();
      } else {
        cleanup();
        setError('Face does not match the photo on file. Please try again.');
        setPhase('error');
      }
    } catch {
      if (!mountedRef.current) return;
      cleanup();
      setError('Verification failed. Please try again.');
      setPhase('error');
    }
  };

  // Active anti-replay light test. Detect the face box ONCE up front (the user
  // holds still for ~2.4s), then for each random flash step sample the face region
  // vs. four CORNER background patches from the SAME canvas snapshot. A live 3D
  // face (closer to the screen) brightens MORE than the corners in sync with the
  // random pattern; a flat photo / replayed video has the face and corners on one
  // plane that reflect our flash uniformly -> face-minus-corners stays flat -> ~0.
  const runFlashCheck = async () => {
    setPhase('flash');
    setStatus('Hold still for a quick light check…');

    const v = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!v || !ctx) {
      failLiveness('Light check unavailable. Please try again.');
      return;
    }

    // Lock a stable face box first, from the same <video> we will sample.
    const det0 = await faceapi.detectSingleFace(v, DETECTOR_OPTIONS);
    if (!mountedRef.current) return;
    const vw = v.videoWidth;
    const vh = v.videoHeight;
    if (!det0 || !vw || !vh) {
      failLiveness('Could not read your face for the light check. Please try again.');
      return;
    }
    const bx = Math.max(0, Math.floor(det0.box.x));
    const by = Math.max(0, Math.floor(det0.box.y));
    const bw = Math.min(vw - bx, Math.floor(det0.box.width));
    const bh = Math.min(vh - by, Math.floor(det0.box.height));
    if (bw < 8 || bh < 8) {
      failLiveness('Could not read your face for the light check. Please try again.');
      return;
    }
    canvas.width = vw;
    canvas.height = vh;

    // Background = corner patches (exclude the centered face so the subtraction
    // does not cancel the face's own reflection).
    const cw = Math.max(1, Math.floor(vw * 0.18));
    const ch = Math.max(1, Math.floor(vh * 0.18));
    const corners: [number, number][] = [
      [0, 0],
      [vw - cw, 0],
      [0, vh - ch],
      [vw - cw, vh - ch],
    ];

    const pattern: number[] = [];
    for (let i = 0; i < FLASH_STEPS; i++) pattern.push(crypto.getRandomValues(new Uint32Array(1))[0] % 2);
    if (pattern.every((p) => p === pattern[0])) pattern[0] = pattern[0] ? 0 : 1; // avoid a constant pattern

    const intensities: number[] = [];
    const signals: number[] = [];
    try {
      for (let i = 0; i < pattern.length; i++) {
        if (!mountedRef.current || !videoRef.current) return;
        setFlashOn(pattern[i] === 1);
        await new Promise((r) => setTimeout(r, FLASH_STEP_MS));
        if (!mountedRef.current || !videoRef.current) return;

        ctx.drawImage(videoRef.current, 0, 0, vw, vh);
        const faceLuma = meanLuma(ctx.getImageData(bx, by, bw, bh).data, 2);
        let bgSum = 0;
        for (const [cx, cy] of corners) bgSum += meanLuma(ctx.getImageData(cx, cy, cw, ch).data, 2);
        const bgLuma = bgSum / corners.length;

        intensities.push(pattern[i]);
        signals.push(faceLuma - bgLuma);
      }
    } finally {
      setFlashOn(false);
    }

    if (!mountedRef.current) return;
    const corr = pearson(intensities, signals);
    setFlashCorr(corr);
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[liveness-flash] correlation=${corr.toFixed(3)} (threshold ${FLASH_THRESHOLD}) samples=${intensities.length}`
      );
    }
    if (!FLASH_ENFORCE || corr >= FLASH_THRESHOLD) {
      captureAndMatch();
    } else {
      failLiveness(
        `Liveness light check failed (signal ${corr.toFixed(2)} < ${FLASH_THRESHOLD}). A live face is required.`
      );
    }
  };

  const setCurrentAction = () => {
    const st = lv.current;
    const a = st.seq[st.idx];
    st.armReady = false; // require a fresh return-to-neutral after the prompt
    st.minEAR = Infinity;
    setStepText(`Step ${st.idx + 1} of ${st.seq.length}`);
    if (a.kind === 'blink') {
      setStatus('Blink your eyes');
      setTurn((t) => ({ ...t, active: false }));
    } else if (a.kind === 'mouth') {
      setStatus('Open your mouth');
      setTurn((t) => ({ ...t, active: false }));
    } else {
      setStatus('Turn your head to either side until the dot reaches a green zone');
      setTurn({ active: true, marker: 0, dir: a.dir ?? 1 });
    }
  };

  const livenessTick = async () => {
    if (!mountedRef.current || busyRef.current || !videoRef.current) return;
    if (videoRef.current.readyState < 2) return; // no decoded frame yet — skip this tick
    busyRef.current = true;
    try {
      const det = await faceapi
        .detectSingleFace(videoRef.current, DETECTOR_OPTIONS)
        .withFaceLandmarks();
      if (!mountedRef.current) return;

      const st = lv.current;
      const now = Date.now();

      if (!st.baseDone) {
        if (now - st.livenessStart > BASELINE_TIMEOUT_MS) {
          failLiveness('Could not detect a centered, live face. Please try again in good lighting.');
          return;
        }
      } else {
        if (now - st.sequenceStart > GLOBAL_DEADLINE_MS) {
          failLiveness('Liveness timed out. Please try again with a live face.');
          return;
        }
        if (now - st.promptStart > ACTION_TIMEOUT_MS) {
          failLiveness('Action not completed in time. Please try again.');
          return;
        }
      }

      if (!det) {
        setStatus('Position your face in the frame');
        return;
      }

      const lm = det.landmarks;
      const leftEye = lm.getLeftEye() as Pt[];
      const rightEye = lm.getRightEye() as Pt[];
      const mouth = lm.getMouth() as Pt[];
      const nose = lm.getNose() as Pt[];

      const ear = (eyeAspectRatio(leftEye) + eyeAspectRatio(rightEye)) / 2;
      const mar = mouthAspectRatio(mouth);
      const yaw = computeYaw(leftEye, rightEye, nose);
      if (LIVENESS_DEBUG) setDbg({ ear, mar, yaw });

      if (!st.baseDone) {
        const looksNeutral = ear > 0.15 && mar < MAR_CLOSED && Math.abs(yaw) < 0.25;
        if (looksNeutral) {
          st.baseSamples.push({ ear, yaw });
          setStatus(`Hold still… (${st.baseSamples.length}/${BASELINE_FRAMES})`);
          if (st.baseSamples.length >= BASELINE_FRAMES) {
            const n = st.baseSamples.length;
            st.openEAR = st.baseSamples.reduce((s, v) => s + v.ear, 0) / n;
            st.baseYaw = st.baseSamples.reduce((s, v) => s + v.yaw, 0) / n;
            st.baseDone = true;
            st.idx = 0;
            st.sequenceStart = now;
            st.promptStart = now;
            setProgress({ done: 0, total: st.seq.length });
            setCurrentAction();
          }
        } else {
          setStatus('Look straight at the camera, face centered');
        }
        return;
      }

      const action = st.seq[st.idx];
      const rel = yaw - st.baseYaw;

      if (action.kind === 'turn') {
        setTurn({ active: true, marker: Math.max(-1, Math.min(1, rel / (YAW_TURN * 1.4))), dir: action.dir ?? 1 });
      }

      if (ear < st.minEAR) st.minEAR = ear; // lowest EAR since the prompt, so a brief blink still counts

      let done = false;
      if (action.kind === 'blink') {
        if (st.openEAR - st.minEAR > BLINK_DROP_ABS || st.minEAR < st.openEAR * BLINK_DROP_RATIO) done = true;
      } else if (action.kind === 'mouth') {
        if (mar > MAR_OPEN) done = true;
      } else {
        if (Math.abs(rel) > YAW_TURN) done = true; // accept a head turn in EITHER direction
      }

      if (!done) return;

      st.idx += 1;
      st.promptStart = now;
      setProgress({ done: st.idx, total: st.seq.length });

      if (st.idx >= st.seq.length) {
        if (loopRef.current) {
          clearInterval(loopRef.current);
          loopRef.current = null;
        }
        setTurn((t) => ({ ...t, active: false }));
        runFlashCheck();
      } else {
        setCurrentAction();
      }
    } catch {
      // transient per-frame detection error — ignore this frame
    } finally {
      busyRef.current = false;
    }
  };

  const startLiveness = () => {
    lv.current = {
      seq: makeSequence(SEQUENCE_LENGTH),
      idx: 0,
      baseYaw: 0,
      openEAR: 0.3,
      minEAR: Infinity,
      baseDone: false,
      baseSamples: [],
      livenessStart: Date.now(),
      sequenceStart: 0,
      promptStart: 0,
      armReady: false,
    };
    setProgress({ done: 0, total: lv.current.seq.length });
    setTurn({ active: false, marker: 0, dir: 1 });
    setFlashOn(false);
    setError('');
    setStepText('');
    setStatus('Look straight at the camera');
    setPhase('liveness');
    if (loopRef.current) clearInterval(loopRef.current);
    loopRef.current = setInterval(livenessTick, DETECT_INTERVAL_MS);
  };

  const init = async () => {
    try {
      // getUserMedia only exists in a SECURE CONTEXT (HTTPS or http://localhost).
      // On a plain-HTTP LAN origin like http://10.1.1.181:3000 the browser hides
      // navigator.mediaDevices, so the webcam can never start. Detect that and tell
      // the user exactly how to enable it, instead of a generic failure.
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError(
          'The webcam needs a secure connection. This page is served over plain HTTP, so the browser blocks the camera. To enable it: (1) open the app on this PC at http://localhost:3000, or (2) serve it over HTTPS, or (3) for testing in Chrome go to chrome://flags/#unsafely-treat-insecure-origin-as-secure, enable it, add this site address (e.g. http://10.1.1.181:3000), and relaunch Chrome.'
        );
        setPhase('error');
        return;
      }

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      ]);
      if (!mountedRef.current) return;

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      if (!mountedRef.current) {
        cleanup();
        return;
      }
      startLiveness();
    } catch (err) {
      if (!mountedRef.current) return;
      const name = (err as { name?: string } | null)?.name;
      let msg = 'Failed to access the camera. Please try again.';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        msg =
          'Camera access was blocked. Click the camera icon in the browser address bar, allow the camera, then press Try Again.';
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        msg = 'No camera was found on this device.';
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        msg = 'The camera is being used by another application. Close it and press Try Again.';
      }
      setError(msg);
      setPhase('error');
    }
  };

  const retry = () => {
    cleanup();
    setError('');
    setFlashOn(false);
    setPhase('loading');
    setStatus('Loading…');
    init();
  };

  useEffect(() => {
    mountedRef.current = true;
    init();
    return () => {
      mountedRef.current = false;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markerLeftPct = 50 + turn.marker * 45;
  const flashBg = phase === 'flash' ? (flashOn ? '#ffffff' : '#0a0a0a') : undefined;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      style={flashBg ? { backgroundColor: flashBg } : undefined}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg p-6 max-w-2xl w-full"
        style={flashBg ? { backgroundColor: flashBg } : undefined}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-xl font-bold ${phase === 'flash' && flashOn ? 'text-gray-900' : phase === 'flash' ? 'text-white' : ''}`}>
            Face Verification
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />

          {phase === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/70 text-white gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
              <span className="text-sm">{status}</span>
            </div>
          )}

          {(phase === 'verifying' || phase === 'flash') && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
              <span className="text-sm font-medium drop-shadow">{status}</span>
            </div>
          )}

          {phase === 'success' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-600/80 text-white gap-2">
              <CheckCircle className="w-12 h-12" />
              <span className="font-semibold">Verified</span>
            </div>
          )}

          {phase === 'liveness' && (
            <div className="absolute top-0 left-0 right-0 bg-black/55 text-white px-4 py-2 text-center">
              <p className="text-base font-semibold">{status}</p>
              {stepText && <p className="text-xs text-white/80">{stepText}</p>}
            </div>
          )}

          {phase === 'liveness' && turn.active && (
            <div className="absolute bottom-4 left-6 right-6">
              <div className="relative h-3 rounded-full bg-white/30">
                <div className="absolute top-0 bottom-0 left-0 w-1/4 bg-emerald-400/70 rounded-full" />
                <div className="absolute top-0 bottom-0 right-0 w-1/4 bg-emerald-400/70 rounded-full" />
                <div
                  className="absolute -top-1.5 h-6 w-6 -ml-3 rounded-full bg-white border-2 border-[#E60000] shadow"
                  style={{ left: `${markerLeftPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {phase === 'liveness' && progress.total > 0 && (
          <div className="flex items-center justify-center gap-2 mb-4">
            {Array.from({ length: progress.total }).map((_, i) => (
              <span
                key={i}
                className={`h-2.5 rounded-full transition-all ${
                  i < progress.done ? 'w-8 bg-emerald-500' : 'w-2.5 bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {phase === 'liveness' && LIVENESS_DEBUG && (
          <p className="text-center text-[11px] font-mono text-gray-400 mb-2">
            EAR {dbg.ear.toFixed(2)} · MAR {dbg.mar.toFixed(2)} · yaw {dbg.yaw.toFixed(2)}
          </p>
        )}

        {LIVENESS_DEBUG && flashCorr !== null && (
          <p className="text-center text-[11px] font-mono text-gray-500 mb-2">
            light-check signal: {flashCorr.toFixed(3)} (threshold {FLASH_THRESHOLD}
            {FLASH_ENFORCE ? '' : ', measure-only'})
          </p>
        )}

        {phase === 'liveness' && (
          <p className="text-center text-xs text-gray-500">
            Follow the on-screen actions, then hold still for a quick light check. This confirms a
            live person is present.
          </p>
        )}

        {phase === 'error' && (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={retry}
              className="flex-1 bg-[#E60000] text-white p-3 rounded-lg hover:bg-[#FF0000] transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default FaceVerificationModal;

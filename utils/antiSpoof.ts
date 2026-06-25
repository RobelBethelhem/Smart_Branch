// Passive face anti-spoofing (liveness) — MiniFASNet-V2, Apache-2.0
// (minivision-ai / Silent-Face-Anti-Spoofing), run fully offline in the browser
// via onnxruntime-web with self-hosted wasm (no cloud, no per-check cost, no lock-in).
//
//   model:   public/models/antispoof/minifasnet_v2.onnx   (1x3x80x80, NCHW, BGR, /255)
//   runtime: public/ort/ort-wasm-simd-threaded.{wasm,mjs}
//   output:  3-class softmax [live, print-attack, replay-attack] -> liveProb = out[0]
//
// If the model or runtime fails to load, scoreLiveness() returns null and the
// caller skips the gate (the app keeps working).

export const ANTISPOOF_MODEL_URL = '/models/antispoof/minifasnet_v2.onnx';
export const ANTISPOOF_INPUT = 80; // model input side (px)
export const ANTISPOOF_CROP_SCALE = 2.7; // expand the face box before cropping

type Box = { x: number; y: number; width: number; height: number };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ortPromise: Promise<any> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sessionPromise: Promise<any | null> | null = null;
let unavailable = false;
let canvas: HTMLCanvasElement | null = null;

const getOrt = () => {
  if (!ortPromise) {
    ortPromise = (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ort: any = await import('onnxruntime-web');
      ort.env.wasm.wasmPaths = '/ort/'; // self-hosted wasm (works offline / behind a proxy)
      ort.env.wasm.numThreads = 1; // no SharedArrayBuffer / cross-origin isolation needed
      return ort;
    })();
  }
  return ortPromise;
};

// Loads (and caches) the model + runtime. Returns null if unavailable.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const loadAntiSpoofModel = async (): Promise<any | null> => {
  if (unavailable) return null;
  if (!sessionPromise) {
    sessionPromise = (async () => {
      try {
        const ort = await getOrt();
        return await ort.InferenceSession.create(ANTISPOOF_MODEL_URL, {
          executionProviders: ['wasm'],
        });
      } catch (e) {
        unavailable = true;
        console.warn('[antispoof] could not load model/runtime — gate disabled.', e);
        return null;
      }
    })();
  }
  return sessionPromise;
};

// Probability (0..1) that the cropped face is a LIVE person, or null when the
// model/runtime is unavailable (caller should then skip the gate).
export const scoreLiveness = async (
  source: HTMLVideoElement | HTMLCanvasElement,
  box: Box
): Promise<number | null> => {
  const session = await loadAntiSpoofModel();
  if (!session) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ort: any = await getOrt();

  const sw = (source as HTMLVideoElement).videoWidth || (source as HTMLCanvasElement).width;
  const sh = (source as HTMLVideoElement).videoHeight || (source as HTMLCanvasElement).height;
  if (!sw || !sh) return null;

  // Square crop, expanded around the face centre (the model expects some margin).
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const side = Math.max(box.width, box.height) * ANTISPOOF_CROP_SCALE;
  let x0 = Math.round(cx - side / 2);
  let y0 = Math.round(cy - side / 2);
  x0 = Math.max(0, Math.min(x0, sw - 1));
  y0 = Math.max(0, Math.min(y0, sh - 1));
  const s = Math.max(1, Math.min(Math.round(side), Math.min(sw - x0, sh - y0)));

  if (!canvas) canvas = document.createElement('canvas');
  canvas.width = ANTISPOOF_INPUT;
  canvas.height = ANTISPOOF_INPUT;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, x0, y0, s, s, 0, 0, ANTISPOOF_INPUT, ANTISPOOF_INPUT);
  const { data } = ctx.getImageData(0, 0, ANTISPOOF_INPUT, ANTISPOOF_INPUT); // RGBA

  // Build NCHW, BGR, /255 input tensor [1,3,80,80].
  const n = ANTISPOOF_INPUT * ANTISPOOF_INPUT;
  const input = new Float32Array(3 * n);
  for (let i = 0; i < n; i++) {
    input[i] = data[i * 4 + 2] / 255; // B
    input[n + i] = data[i * 4 + 1] / 255; // G
    input[2 * n + i] = data[i * 4] / 255; // R
  }

  try {
    const tensor = new ort.Tensor('float32', input, [1, 3, ANTISPOOF_INPUT, ANTISPOOF_INPUT]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const feeds: Record<string, any> = {};
    feeds[session.inputNames[0]] = tensor;
    const results = await session.run(feeds);
    const out = Array.from(results[session.outputNames[0]].data as Float32Array);
    if (!out.length) return null;

    // Output is a 3-class softmax [live, print, replay]; re-softmax if it looks
    // like raw logits (doesn't sum to ~1).
    let probs = out;
    const sum = out.reduce((a, b) => a + b, 0);
    if (sum < 0.99 || sum > 1.01) {
      const max = Math.max(...out);
      const exps = out.map((v) => Math.exp(v - max));
      const es = exps.reduce((a, b) => a + b, 0) || 1;
      probs = exps.map((e) => e / es);
    }
    return probs[0]; // P(live)
  } catch (e) {
    console.warn('[antispoof] inference failed:', e);
    return null;
  }
};

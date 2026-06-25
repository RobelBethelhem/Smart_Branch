// Optional passive anti-spoofing (face liveness) using a TensorFlow.js model.
//
// This is OFFLINE and FREE: drop a converted model at
//   public/models/antispoof/model.json  (+ its weight .bin shard files)
// and it runs entirely in the browser (no cloud, no per-check cost, no lock-in).
//
// If no model file is present, scoreLiveness() returns null and the caller skips
// the gate — so the app keeps working until you add the model.
//
// The default preprocessing matches the MiniFASNet / Silent-Face-Anti-Spoofing
// model (Apache-2.0). If you use a different model, adjust the constants below
// (input size, crop scale, the output index that means "live"). See README in
// public/models/antispoof/.

export const ANTISPOOF_MODEL_URL = '/models/antispoof/model.json';
export const ANTISPOOF_INPUT = 80; // model input side in px (MiniFASNet = 80)
export const ANTISPOOF_CROP_SCALE = 2.7; // expand the face box before cropping (MiniFASNet ~2.7)
export const ANTISPOOF_LIVE_INDEX = 1; // output index whose probability means "real/live"

type Box = { x: number; y: number; width: number; height: number };

let tfPromise: Promise<typeof import('@tensorflow/tfjs')> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let modelPromise: Promise<any | null> | null = null;
let modelMissing = false;

const getTf = () => {
  if (!tfPromise) tfPromise = import('@tensorflow/tfjs');
  return tfPromise;
};

// Loads (and caches) the model. Returns null if no model is deployed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const loadAntiSpoofModel = async (): Promise<any | null> => {
  if (modelMissing) return null;
  if (!modelPromise) {
    modelPromise = (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tf: any = await getTf();
      try {
        return await tf.loadGraphModel(ANTISPOOF_MODEL_URL);
      } catch {
        try {
          return await tf.loadLayersModel(ANTISPOOF_MODEL_URL);
        } catch (e) {
          modelMissing = true;
          console.warn(
            `[antispoof] No anti-spoof model at ${ANTISPOOF_MODEL_URL} — liveness model gate is disabled.`,
            e
          );
          return null;
        }
      }
    })();
  }
  return modelPromise;
};

// Probability (0..1) that the cropped face is a LIVE person, or null when no
// model is deployed (caller should then skip the model gate).
export const scoreLiveness = async (
  source: HTMLVideoElement | HTMLCanvasElement,
  box: Box
): Promise<number | null> => {
  const model = await loadAntiSpoofModel();
  if (!model) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tf: any = await getTf();

  const w = (source as HTMLVideoElement).videoWidth || (source as HTMLCanvasElement).width;
  const h = (source as HTMLVideoElement).videoHeight || (source as HTMLCanvasElement).height;
  if (!w || !h) return null;

  // Square crop, expanded around the face centre (models expect some margin).
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const side = Math.max(box.width, box.height) * ANTISPOOF_CROP_SCALE;
  let x0 = Math.round(cx - side / 2);
  let y0 = Math.round(cy - side / 2);
  x0 = Math.max(0, Math.min(x0, w - 1));
  y0 = Math.max(0, Math.min(y0, h - 1));
  const s = Math.max(1, Math.min(Math.round(side), Math.min(w - x0, h - y0)));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let t: any;
  try {
    t = tf.tidy(() => {
      const px = tf.browser.fromPixels(source); // [h, w, 3]
      const crop = px.slice([y0, x0, 0], [s, s, 3]); // [s, s, 3]
      const resized = tf.image.resizeBilinear(crop, [ANTISPOOF_INPUT, ANTISPOOF_INPUT]);
      const input = resized.toFloat().div(255).expandDims(0); // [1, H, W, 3]
      const pred = model.predict(input);
      return Array.isArray(pred) ? pred[0] : pred;
    });
    const data = Array.from((await t.data()) as Float32Array);
    if (!data.length) return null;

    // Single output -> sigmoid -> P(live). Multiple outputs -> softmax, take the
    // configured live index.
    if (data.length === 1) {
      const v = data[0];
      return v >= 0 && v <= 1 ? v : 1 / (1 + Math.exp(-v));
    }
    const max = Math.max(...data);
    const exps = data.map((v) => Math.exp(v - max));
    const sum = exps.reduce((a, b) => a + b, 0) || 1;
    const idx = Math.min(ANTISPOOF_LIVE_INDEX, data.length - 1);
    return exps[idx] / sum;
  } catch (e) {
    console.warn('[antispoof] scoring failed:', e);
    return null;
  } finally {
    if (t) t.dispose();
  }
};

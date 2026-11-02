/**
 * signatureSimilarity.ts
 *
 * Pure (DOM-free) offline signature comparison engine built on OpenCV.js.
 *
 * Pipeline
 * --------
 * 1. extractStoredSignatures / extractDrawnSignature  -> binary ink masks
 * 2. prepareSignature                                 -> canonical 256x128, stroke-normalised
 *                                                        mask + orientation field + topology
 * 3. compareSignatures                                -> pattern-led fused score
 *
 * What changed vs the previous version
 * ------------------------------------
 *  - NEW `pattern` metric (dominant weight): orientation-aware chamfer on the
 *    stroke path + skeleton topology. This is what "compare the pattern"
 *    actually means: it rewards strokes that follow the same path AND the same
 *    direction, independent of thickness and small positional drift.
 *  - Softened chance correction:  corrected = (raw - α·chance) / (1 - α·chance)
 *    with α < 1, plus a gamma lift, so genuine re-signings no longer collapse
 *    into the 0.10–0.20 band.
 *  - Tiered verdict bands (`match` / `review` / `no-match`) so a borderline
 *    genuine pair gets flagged for review instead of hard-failing.
 *  - Single distance transform per direction is reused for chamfer + oriented
 *    chamfer (no extra cost).
 */

import cv from '@techstark/opencv-js';

// ---------------------------------------------------------------------------
// Tunables
// ---------------------------------------------------------------------------

export const CANON = { W: 256, H: 128, PAD: 8 } as const;

/**
 * Metric fusion weights (sum to 1). `pattern` is intentionally dominant:
 * it is the metric that actually models the shape of the signature, the
 * others are supporting evidence.
 */
export const WEIGHTS = {
  pattern: 0.4,    // oriented stroke-path match + skeleton topology  (NEW, dominant)
  chamfer: 0.18,   // plain stroke proximity
  softNcc: 0.15,   // blurred correlation, best over ±SHIFT_SEARCH_PX
  hog: 0.12,       // stroke-direction structure per region + global slant
  profileDtw: 0.06,
  zoning: 0.06,
  geometry: 0.03,
} as const;

export const CHAMFER_CAP_PX = 16;
export const SHIFT_SEARCH_PX = 12;
export const BLUR_SIGMA = 2.5;
export const HOG = { X: 8, Y: 4, BINS: 6, GLOBAL_BINS: 12 } as const;
export const DTW = { BAND: 0.1, COST_SCALE: 2.5 } as const;
export const ZONING_GRIDS: ReadonlyArray<readonly [number, number]> = [
  [4, 2],
  [8, 4],
  [16, 8],
];

/**
 * Very small values are fine here. The previous 15 was fine for ink counting
 * but the real cause of failures was the score fusion, not extraction.
 */
export const MIN_INK_PIXELS = 12;

/**
 * Chance-correction and final-score shaping.
 *  - α < 1 means we only subtract *part* of the chance level. α = 1 is the old
 *    behaviour (too aggressive); α = 0 disables chance correction entirely.
 *  - GAMMA < 1 lifts mid-range scores into a usable band without moving the
 *    floor (0 stays 0) or the ceiling (1 stays 1).
 */
export const PATTERN = {
  CHANCE_ALPHA: 0.45,
  FINAL_GAMMA: 0.75,
  /** Orientation tolerance for the oriented-chamfer score, in radians. */
  ORIENT_TOL: Math.PI / 4,
  /** Mix of oriented chamfer vs topology inside the pattern metric. */
  MIX_ORIENTED: 0.75,
  MIX_TOPOLOGY: 0.25,
} as const;

/**
 * Tiered verdict bands. `strong` is a confident match, `weak` is a
 * "possible match — send for review" band, below `weak` is a reject.
 * The single `DEFAULT_MATCH_THRESHOLD` is kept for API compatibility and
 * points at `weak`.
 */
export const MATCH_BANDS = { strong: 0.7, weak: 0.45 } as const;
export const DEFAULT_MATCH_THRESHOLD = MATCH_BANDS.weak;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SimilarityBreakdown {
  pattern: number;      // NEW: orientation-aware stroke-path + topology
  chamfer: number;
  softNcc: number;
  hog: number;
  profileDtw: number;
  zoning: number;
  geometry: number;
  densityRatio: number;
  raw: number;          // fused raw similarity in [0,1]
  chance: number;       // best score against shape-destroyed transforms of drawn
  corrected: number;    // (raw - α·chance) / (1 - α·chance)
  final: number;        // corrected ^ gamma — compare to bands
}

export interface PatternTopology {
  endpoints: number;
  junctions: number;
  length: number;
}

export interface PreparedSignature {
  mask: cv.Mat;               // canonical, uniform stroke width
  aspect: number;
  ink: number;
  orientation: Float32Array;  // radians in [0, PI), NaN where no ink
  topology: PatternTopology;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface Deletable { delete(): void; }

class MatScope {
  private mats: Deletable[] = [];
  track<T extends Deletable>(m: T): T { this.mats.push(m); return m; }
  release(): void {
    for (const m of this.mats) { try { m.delete(); } catch { /* freed */ } }
    this.mats = [];
  }
}

const clamp01 = (v: number): number =>
  Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;

const oddAtLeast = (v: number, min: number): number => {
  let k = Math.max(min, Math.floor(v));
  if (k % 2 === 0) k += 1;
  return k;
};

const toGray = (src: cv.Mat, scope: MatScope): cv.Mat => {
  const gray = scope.track(new cv.Mat());
  switch (src.channels()) {
    case 1: src.copyTo(gray); break;
    case 3: cv.cvtColor(src, gray, cv.COLOR_RGB2GRAY); break;
    default: cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  }
  return gray;
};

interface Box { x: number; y: number; width: number; height: number; }

const inkBounds = (mask: cv.Mat): Box | null => {
  const rows = mask.rows, cols = mask.cols, d = mask.data;
  let minX = cols, minY = rows, maxX = -1, maxY = -1;
  for (let y = 0; y < rows; y++) {
    const base = y * cols;
    for (let x = 0; x < cols; x++) {
      if (d[base + x] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX || maxY < minY) return null;
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
};

const cosine = (a: ArrayLike<number>, b: ArrayLike<number>): number => {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return clamp01(dot / Math.sqrt(na * nb));
};

// ---------------------------------------------------------------------------
// Zhang-Suen thinning (unchanged)
// ---------------------------------------------------------------------------

const zhangSuenThin = (mask: cv.Mat): cv.Mat => {
  const rows = mask.rows, cols = mask.cols, src = mask.data;
  const img = new Uint8Array(rows * cols);
  for (let i = 0; i < img.length; i++) img[i] = src[i] > 0 ? 1 : 0;

  const toDelete: number[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (let step = 0; step < 2; step++) {
      toDelete.length = 0;
      for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
          const i = y * cols + x;
          if (img[i] !== 1) continue;
          const p2 = img[i - cols], p3 = img[i - cols + 1], p4 = img[i + 1],
                p5 = img[i + cols + 1], p6 = img[i + cols], p7 = img[i + cols - 1],
                p8 = img[i - 1], p9 = img[i - cols - 1];
          const b = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
          if (b < 2 || b > 6) continue;
          let a = 0;
          if (p2 === 0 && p3 === 1) a++;
          if (p3 === 0 && p4 === 1) a++;
          if (p4 === 0 && p5 === 1) a++;
          if (p5 === 0 && p6 === 1) a++;
          if (p6 === 0 && p7 === 1) a++;
          if (p7 === 0 && p8 === 1) a++;
          if (p8 === 0 && p9 === 1) a++;
          if (p9 === 0 && p2 === 1) a++;
          if (a !== 1) continue;
          if (step === 0) {
            if (p2 * p4 * p6 !== 0 || p4 * p6 * p8 !== 0) continue;
          } else if (p2 * p4 * p8 !== 0 || p2 * p6 * p8 !== 0) continue;
          toDelete.push(i);
        }
      }
      if (toDelete.length > 0) {
        changed = true;
        for (const i of toDelete) img[i] = 0;
      }
    }
  }
  const out = cv.Mat.zeros(rows, cols, cv.CV_8UC1);
  const od = out.data;
  for (let i = 0; i < img.length; i++) od[i] = img[i] ? 255 : 0;
  return out;
};

// ---------------------------------------------------------------------------
// Extraction (unchanged)
// ---------------------------------------------------------------------------

const removeBorderRemnants = (bin: cv.Mat, scope: MatScope): void => {
  const contours = scope.track(new cv.MatVector());
  const hierarchy = scope.track(new cv.Mat());
  cv.findContours(bin, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  const rows = bin.rows, cols = bin.cols;
  const black = new cv.Scalar(0, 0, 0, 0);
  for (let i = 0; i < contours.size(); i++) {
    const c = contours.get(i);
    try {
      const r = cv.boundingRect(c);
      const touches = r.x <= 1 || r.y <= 1 ||
        r.x + r.width >= cols - 1 || r.y + r.height >= rows - 1;
      if (!touches) continue;
      const long = Math.max(r.width, r.height);
      const thin = Math.min(r.width, r.height);
      const spansEdge = long >= (r.width >= r.height ? cols : rows) * 0.6;
      if (spansEdge && long / Math.max(1, thin) > 25) {
        const region = bin.roi(new cv.Rect(r.x, r.y, r.width, r.height));
        region.setTo(black);
        region.delete();
      }
    } finally { c.delete(); }
  }
};

const binariseInk = (gray: cv.Mat, scope: MatScope): cv.Mat => {
  const bin = scope.track(new cv.Mat());
  const block = oddAtLeast(Math.min(gray.rows, gray.cols) / 6, 25);
  cv.adaptiveThreshold(gray, bin, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv.THRESH_BINARY_INV, block, 10);
  return bin;
};

const significantInkBounds = (bin: cv.Mat, scope: MatScope, minInkPixels: number): Box | null => {
  const contours = scope.track(new cv.MatVector());
  const hierarchy = scope.track(new cv.Mat());
  cv.findContours(bin, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  const rects: Box[] = [];
  let largestDim = 0;
  for (let i = 0; i < contours.size(); i++) {
    const c = contours.get(i);
    const r = cv.boundingRect(c);
    c.delete();
    const dim = Math.max(r.width, r.height);
    if (dim < 4) continue;
    rects.push(r);
    if (dim > largestDim) largestDim = dim;
  }
  if (rects.length === 0) return null;

  const keepDim = largestDim * 0.15;
  let union: Box | null = null;
  for (const r of rects) {
    if (Math.max(r.width, r.height) < keepDim) continue;
    if (!union) union = { ...r };
    else {
      const x1 = Math.min(union.x, r.x);
      const y1 = Math.min(union.y, r.y);
      const x2 = Math.max(union.x + union.width, r.x + r.width);
      const y2 = Math.max(union.y + union.height, r.y + r.height);
      union = { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
    }
  }
  if (!union) return null;
  const roi = bin.roi(new cv.Rect(union.x, union.y, union.width, union.height));
  const ink = cv.countNonZero(roi);
  roi.delete();
  return ink >= minInkPixels ? union : null;
};

const isRectangular = (approx: cv.Mat, bbox: Box, contourArea: number): boolean => {
  if (contourArea < bbox.width * bbox.height * 0.9) return false;
  const pts = approx.data32S;
  for (let i = 0; i < 4; i++) {
    const px = pts[((i + 3) % 4) * 2], py = pts[((i + 3) % 4) * 2 + 1];
    const cx = pts[i * 2], cy = pts[i * 2 + 1];
    const nx = pts[((i + 1) % 4) * 2], ny = pts[((i + 1) % 4) * 2 + 1];
    const ax = px - cx, ay = py - cy, bx = nx - cx, by = ny - cy;
    const cos = (ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by) || 1);
    if (Math.abs(cos) > 0.2) return false;
  }
  return true;
};

const detectSignatureBoxes = (gray: cv.Mat, scope: MatScope): Box[] => {
  const edges = scope.track(new cv.Mat());
  cv.adaptiveThreshold(gray, edges, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv.THRESH_BINARY_INV, 11, 2);
  const contours = scope.track(new cv.MatVector());
  const hierarchy = scope.track(new cv.Mat());
  cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

  const imgArea = gray.rows * gray.cols;
  const minArea = Math.max(1000, imgArea * 0.005);
  const maxArea = imgArea * 0.9;
  const minWidth = gray.cols * 0.25;
  const candidates: Box[] = [];
  for (let i = 0; i < contours.size(); i++) {
    const c = contours.get(i);
    const approx = new cv.Mat();
    try {
      const perimeter = cv.arcLength(c, true);
      cv.approxPolyDP(c, approx, 0.04 * perimeter, true);
      if (approx.rows !== 4) continue;
      const r = cv.boundingRect(c);
      const area = r.width * r.height;
      if (area < minArea || area > maxArea) continue;
      if (r.width < minWidth || r.width < r.height * 1.2) continue;
      if (!isRectangular(approx, r, cv.contourArea(c))) continue;
      candidates.push(r);
    } finally { approx.delete(); c.delete(); }
  }
  candidates.sort((a, b) => a.width * a.height - b.width * b.height);
  const kept: Box[] = [];
  const contains = (o: Box, i: Box, m: number): boolean =>
    i.x >= o.x - m && i.y >= o.y - m &&
    i.x + i.width <= o.x + o.width + m && i.y + i.height <= o.y + o.height + m;
  for (const r of candidates) {
    const margin = Math.max(4, Math.min(r.width, r.height) * 0.05);
    const redundant = kept.some((k) => contains(r, k, margin) || contains(k, r, margin));
    if (!redundant) kept.push(r);
  }
  kept.sort((a, b) => a.y - b.y || a.x - b.x);
  return kept;
};

export interface StoredExtractionDebug { boxes: Box[]; usedFallback: boolean; }

export const extractStoredSignatures = (
  src: cv.Mat,
  debug?: StoredExtractionDebug,
): cv.Mat[] => {
  const scope = new MatScope();
  const out: cv.Mat[] = [];
  try {
    const gray = toGray(src, scope);
    const boxes = detectSignatureBoxes(gray, scope);
    if (debug) debug.boxes = boxes;

    for (const box of boxes) {
      const inset = Math.max(4, Math.round(Math.min(box.width, box.height) * 0.03));
      const w = box.width - 2 * inset, h = box.height - 2 * inset;
      if (w < 16 || h < 16) continue;
      const boxScope = new MatScope();
      try {
        const roi = boxScope.track(gray.roi(new cv.Rect(box.x + inset, box.y + inset, w, h)));
        const bin = binariseInk(roi, boxScope);
        removeBorderRemnants(bin, boxScope);
        const bounds = significantInkBounds(bin, boxScope, Math.max(60, Math.round(w * h * 0.002)));
        if (!bounds || (bounds.width < w * 0.2 && bounds.height < h * 0.35)) continue;
        const sig = bin.roi(new cv.Rect(bounds.x, bounds.y, bounds.width, bounds.height));
        out.push(sig.clone());
        sig.delete();
      } finally { boxScope.release(); }
    }

    if (out.length === 0) {
      if (debug) debug.usedFallback = true;
      const bin = binariseInk(gray, scope);
      removeBorderRemnants(bin, scope);
      const bounds = significantInkBounds(bin, scope, 60);
      if (bounds) {
        const sig = bin.roi(new cv.Rect(bounds.x, bounds.y, bounds.width, bounds.height));
        out.push(sig.clone());
        sig.delete();
      }
    }
    return out;
  } catch (e) {
    out.forEach((m) => m.delete());
    throw e;
  } finally { scope.release(); }
};

export const extractDrawnSignature = (src: cv.Mat): cv.Mat[] => {
  const scope = new MatScope();
  try {
    const gray = toGray(src, scope);
    const bin = scope.track(new cv.Mat());
    cv.threshold(gray, bin, 160, 255, cv.THRESH_BINARY_INV);
    const b = significantInkBounds(bin, scope, MIN_INK_PIXELS);
    if (!b) return [];
    const pad = 10;
    const x = Math.max(0, b.x - pad);
    const y = Math.max(0, b.y - pad);
    const w = Math.min(bin.cols, b.x + b.width + pad) - x;
    const h = Math.min(bin.rows, b.y + b.height + pad) - y;
    const roi = bin.roi(new cv.Rect(x, y, w, h));
    const outMat = roi.clone();
    roi.delete();
    return [outMat];
  } finally { scope.release(); }
};

// ---------------------------------------------------------------------------
// Pattern features (NEW)
// ---------------------------------------------------------------------------

/**
 * Per-pixel stroke orientation derived from the gradient of the blurred mask.
 * The gradient is normal to the stroke, so we rotate by 90° to get the tangent.
 * Unsigned (mod PI) so a stroke and its reverse count as the same direction.
 * NaN where the mask has no energy (background).
 */
const orientationFieldFromMask = (mask: cv.Mat, scope: MatScope): Float32Array => {
  const f = scope.track(new cv.Mat());
  mask.convertTo(f, cv.CV_32F, 1 / 255);
  const k = oddAtLeast(Math.ceil(BLUR_SIGMA * 2) * 2 + 1, 3);
  cv.GaussianBlur(f, f, new cv.Size(k, k), BLUR_SIGMA, BLUR_SIGMA);
  const dx = scope.track(new cv.Mat());
  const dy = scope.track(new cv.Mat());
  cv.Sobel(f, dx, cv.CV_32F, 1, 0, 3);
  cv.Sobel(f, dy, cv.CV_32F, 0, 1, 3);
  const gx = dx.data32F, gy = dy.data32F;
  const out = new Float32Array(gx.length);
  for (let i = 0; i < gx.length; i++) {
    const mag = Math.hypot(gx[i], gy[i]);
    if (mag < 1e-4) { out[i] = NaN; continue; }
    let ang = Math.atan2(gy[i], gx[i]) + Math.PI / 2;
    if (ang < 0) ang += Math.PI;
    if (ang >= Math.PI) ang -= Math.PI;
    out[i] = ang;
  }
  return out;
};

/**
 * Counts endpoints (1 neighbour), junctions (>= 3 neighbours) and total
 * skeleton length. These capture the *topology* of the signature — how many
 * separate strokes it has, how often it crosses itself — which is stable
 * across natural re-signings but differs between people.
 */
const skeletonTopology = (skel: cv.Mat): PatternTopology => {
  const d = skel.data, rows = skel.rows, cols = skel.cols;
  let endpoints = 0, junctions = 0, length = 0;
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      const i = y * cols + x;
      if (d[i] === 0) continue;
      length++;
      let nbrs = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (d[(y + dy) * cols + (x + dx)] > 0) nbrs++;
        }
      if (nbrs === 1) endpoints++;
      else if (nbrs >= 3) junctions++;
    }
  }
  return { endpoints, junctions, length };
};

const topologySimilarity = (a: PatternTopology, b: PatternTopology): number => {
  if (a.length === 0 || b.length === 0) return 0;
  const ea = a.endpoints / a.length, eb = b.endpoints / b.length;
  const ja = a.junctions / a.length, jb = b.junctions / b.length;
  const eSim = 1 - Math.min(1, Math.abs(ea - eb) / Math.max(ea, eb, 1e-6));
  const jSim = 1 - Math.min(1, Math.abs(ja - jb) / Math.max(ja, jb, 1e-6));
  const lenSim = Math.min(a.length, b.length) / Math.max(a.length, b.length);
  return 0.4 * eSim + 0.4 * jSim + 0.2 * lenSim;
};

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

const makeEmptyPrepared = (mask: cv.Mat): PreparedSignature => ({
  mask,
  aspect: 1,
  ink: 0,
  orientation: new Float32Array(0),
  topology: { endpoints: 0, junctions: 0, length: 0 },
});

export const prepareSignature = (src: cv.Mat): PreparedSignature => {
  const scope = new MatScope();
  let canvas: cv.Mat | null = null;
  try {
    const work = toGray(src, scope);
    cv.threshold(work, work, 127, 255, cv.THRESH_BINARY);

    canvas = cv.Mat.zeros(CANON.H, CANON.W, cv.CV_8UC1);
    const b = inkBounds(work);
    if (!b) {
      const empty = canvas; canvas = null;
      return makeEmptyPrepared(empty);
    }

    const crop = scope.track(work.roi(new cv.Rect(b.x, b.y, b.width, b.height)));
    const scale = Math.min(
      (CANON.W - CANON.PAD * 2) / b.width,
      (CANON.H - CANON.PAD * 2) / b.height,
    );
    const nw = Math.max(1, Math.round(b.width * scale));
    const nh = Math.max(1, Math.round(b.height * scale));
    const resized = scope.track(new cv.Mat());
    cv.resize(crop, resized, new cv.Size(nw, nh), 0, 0,
      scale < 1 ? cv.INTER_AREA : cv.INTER_LINEAR);
    cv.threshold(resized, resized, 40, 255, cv.THRESH_BINARY);

    const xo = Math.floor((CANON.W - nw) / 2);
    const yo = Math.floor((CANON.H - nh) / 2);
    const dst = scope.track(canvas.roi(new cv.Rect(xo, yo, nw, nh)));
    resized.copyTo(dst);

    // Stroke-width normalisation: 1px skeleton -> uniform ~3px stroke.
    const skeleton = scope.track(zhangSuenThin(canvas));
    const topology = skeletonTopology(skeleton);
    const kernel = scope.track(cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(3, 3)));
    cv.dilate(skeleton, canvas, kernel);

    const orientation = orientationFieldFromMask(canvas, scope);
    const ink = cv.countNonZero(canvas);

    const out = canvas; canvas = null;
    return { mask: out, aspect: b.width / b.height, ink, orientation, topology };
  } catch (e) {
    canvas?.delete();
    throw e;
  } finally { scope.release(); }
};

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

/**
 * One direction of the chamfer/oriented-chamfer pair. A single distance
 * transform is shared: the plain chamfer is the position-only average, the
 * oriented variant additionally weights each probe ink pixel by how well its
 * stroke direction agrees with the reference's local direction.
 */
const chamferPair = (
  refMask: cv.Mat,
  probeMask: cv.Mat,
  refOri: Float32Array,
  probeOri: Float32Array,
  scope: MatScope,
): { plain: number; oriented: number } => {
  const inv = scope.track(new cv.Mat());
  cv.bitwise_not(refMask, inv);
  const dt = scope.track(new cv.Mat());
  cv.distanceTransform(inv, dt, cv.DIST_L2, 3);
  const dist = dt.data32F;
  const probe = probeMask.data;
  const oriTol = PATTERN.ORIENT_TOL;

  let sumP = 0, sumO = 0, n = 0;
  for (let i = 0; i < probe.length; i++) {
    if (probe[i] === 0) continue;
    n++;
    const d = dist[i];
    const posScore = d >= CHAMFER_CAP_PX ? 0 : 1 - d / CHAMFER_CAP_PX;
    sumP += posScore;

    const oa = refOri[i], ob = probeOri[i];
    let oriScore = 1;
    if (!Number.isNaN(oa) && !Number.isNaN(ob)) {
      let diff = Math.abs(oa - ob);
      if (diff > Math.PI / 2) diff = Math.PI - diff;
      oriScore = Math.max(0, 1 - diff / oriTol);
    }
    sumO += posScore * (0.4 + 0.6 * oriScore);
  }
  if (n === 0) return { plain: 0, oriented: 0 };
  return { plain: sumP / n, oriented: sumO / n };
};

const softMask = (mask: cv.Mat, scope: MatScope): cv.Mat => {
  const f = scope.track(new cv.Mat());
  mask.convertTo(f, cv.CV_32F, 1 / 255);
  const k = oddAtLeast(Math.ceil(BLUR_SIGMA * 3) * 2 + 1, 3);
  cv.GaussianBlur(f, f, new cv.Size(k, k), BLUR_SIGMA, BLUR_SIGMA, cv.BORDER_DEFAULT);
  return f;
};

const softNcc = (softA: cv.Mat, softB: cv.Mat, scope: MatScope): number => {
  const s = SHIFT_SEARCH_PX;
  const padded = scope.track(new cv.Mat());
  cv.copyMakeBorder(softA, padded, s, s, s, s, cv.BORDER_CONSTANT,
    new cv.Scalar(0, 0, 0, 0));
  const result = scope.track(new cv.Mat());
  cv.matchTemplate(padded, softB, result, cv.TM_CCOEFF_NORMED);
  const noMask = scope.track(new cv.Mat());
  const mm = cv.minMaxLoc(result, noMask);
  return clamp01(mm.maxVal);
};

interface HogFeatures { grid: Float64Array; global: Float64Array; }

const hogFeatures = (soft: cv.Mat, scope: MatScope): HogFeatures => {
  const dx = scope.track(new cv.Mat());
  const dy = scope.track(new cv.Mat());
  cv.Sobel(soft, dx, cv.CV_32F, 1, 0, 3, 1, 0, cv.BORDER_DEFAULT);
  cv.Sobel(soft, dy, cv.CV_32F, 0, 1, 3, 1, 0, cv.BORDER_DEFAULT);
  const gx = dx.data32F, gy = dy.data32F;
  const rows = soft.rows, cols = soft.cols;
  const grid = new Float64Array(HOG.X * HOG.Y * HOG.BINS);
  const global = new Float64Array(HOG.GLOBAL_BINS);
  const cellW = cols / HOG.X, cellH = rows / HOG.Y;
  for (let y = 0; y < rows; y++) {
    const cy = Math.min(HOG.Y - 1, Math.floor(y / cellH));
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const mag = Math.hypot(gx[i], gy[i]);
      if (mag < 1e-3) continue;
      let ang = Math.atan2(gy[i], gx[i]);
      if (ang < 0) ang += Math.PI;
      const t = ang / Math.PI;
      const cx = Math.min(HOG.X - 1, Math.floor(x / cellW));
      const bin = Math.min(HOG.BINS - 1, Math.floor(t * HOG.BINS));
      grid[(cy * HOG.X + cx) * HOG.BINS + bin] += mag;
      const gbin = Math.min(HOG.GLOBAL_BINS - 1, Math.floor(t * HOG.GLOBAL_BINS));
      global[gbin] += mag;
    }
  }
  return { grid, global };
};

interface ProfileFeatures { row: Float64Array; col: Float64Array; zones: Float64Array[]; }

const profileFeatures = (mask: cv.Mat): ProfileFeatures => {
  const rows = mask.rows, cols = mask.cols, d = mask.data;
  const row = new Float64Array(rows);
  const col = new Float64Array(cols);
  const zones = ZONING_GRIDS.map(([gx, gy]) => new Float64Array(gx * gy));
  for (let y = 0; y < rows; y++) {
    const base = y * cols;
    for (let x = 0; x < cols; x++) {
      if (d[base + x] > 0) {
        row[y]++; col[x]++;
        for (let g = 0; g < ZONING_GRIDS.length; g++) {
          const [gx, gy] = ZONING_GRIDS[g];
          const cx = Math.min(gx - 1, Math.floor((x * gx) / cols));
          const cy = Math.min(gy - 1, Math.floor((y * gy) / rows));
          zones[g][cy * gx + cx]++;
        }
      }
    }
  }
  const norm = (p: Float64Array) => {
    let max = 0;
    for (let i = 0; i < p.length; i++) if (p[i] > max) max = p[i];
    if (max > 0) for (let i = 0; i < p.length; i++) p[i] /= max;
    return p;
  };
  return { row: norm(row), col: norm(col), zones };
};

const dtwCost = (a: Float64Array, b: Float64Array): number => {
  const n = a.length, m = b.length;
  const band = Math.max(Math.round(Math.max(n, m) * DTW.BAND), Math.abs(n - m) + 1);
  const INF = Number.POSITIVE_INFINITY;
  let prev = new Float64Array(m + 1).fill(INF);
  let curr = new Float64Array(m + 1).fill(INF);
  prev[0] = 0;
  for (let i = 1; i <= n; i++) {
    curr.fill(INF);
    const jc = Math.round((i * m) / n);
    const jStart = Math.max(1, jc - band);
    const jEnd = Math.min(m, jc + band);
    for (let j = jStart; j <= jEnd; j++) {
      const cost = Math.abs(a[i - 1] - b[j - 1]);
      curr[j] = cost + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    const t = prev; prev = curr; curr = t;
  }
  const total = prev[m];
  return Number.isFinite(total) ? total / Math.max(n, m) : 1;
};

const huMoments = (mask: cv.Mat): number[] => {
  const mo = cv.moments(mask, true);
  const { nu20: n20, nu02: n02, nu11: n11, nu30: n30,
          nu12: n12, nu21: n21, nu03: n03 } = mo;
  const h1 = n20 + n02;
  const h2 = (n20 - n02) ** 2 + 4 * n11 ** 2;
  const h3 = (n30 - 3 * n12) ** 2 + (3 * n21 - n03) ** 2;
  const h4 = (n30 + n12) ** 2 + (n21 + n03) ** 2;
  return [h1, h2, h3, h4];
};

const huSimilarity = (a: number[], b: number[]): number => {
  const logAbs = (v: number) => Math.log10(Math.abs(v) + 1e-12);
  let d = 0;
  for (let i = 0; i < a.length; i++) d += Math.abs(logAbs(a[i]) - logAbs(b[i]));
  d /= a.length;
  return clamp01(Math.exp(-2 * d));
};

// ---------------------------------------------------------------------------
// Fusion
// ---------------------------------------------------------------------------

const EMPTY: SimilarityBreakdown = {
  pattern: 0, chamfer: 0, softNcc: 0, hog: 0, profileDtw: 0, zoning: 0,
  geometry: 0, densityRatio: 0, raw: 0, chance: 0, corrected: 0, final: 0,
};

type RawScores = Omit<SimilarityBreakdown, 'raw' | 'chance' | 'corrected' | 'final'> & {
  fused: number;
};

const rawSimilarity = (a: PreparedSignature, b: PreparedSignature): RawScores => {
  const scope = new MatScope();
  try {
    // Chamfer + oriented chamfer share one distance transform per direction.
    const ab = chamferPair(a.mask, b.mask, a.orientation, b.orientation, scope);
    const ba = chamferPair(b.mask, a.mask, b.orientation, a.orientation, scope);
    const chamfer = (ab.plain + ba.plain) / 2;
    const oriented = (ab.oriented + ba.oriented) / 2;

    // Soft NCC
    const softA = softMask(a.mask, scope);
    const softB = softMask(b.mask, scope);
    const ncc = softNcc(softA, softB, scope);

    // HOG
    const hA = hogFeatures(softA, scope);
    const hB = hogFeatures(softB, scope);
    const hog = 0.6 * cosine(hA.grid, hB.grid) + 0.4 * cosine(hA.global, hB.global);

    // Profiles / zoning
    const pA = profileFeatures(a.mask);
    const pB = profileFeatures(b.mask);
    const dtwRow = dtwCost(pA.row, pB.row);
    const dtwCol = dtwCost(pA.col, pB.col);
    const profileDtw = clamp01(1 - DTW.COST_SCALE * ((dtwRow + dtwCol) / 2));
    let zoning = 0;
    for (let g = 0; g < pA.zones.length; g++) zoning += cosine(pA.zones[g], pB.zones[g]);
    zoning /= pA.zones.length;

    // Geometry
    const aspectSim = Math.min(a.aspect, b.aspect) / Math.max(a.aspect, b.aspect);
    const geometry = 0.5 * aspectSim +
      0.5 * huSimilarity(huMoments(a.mask), huMoments(b.mask));

    // Pattern (NEW): oriented stroke-path match + skeleton topology.
    const pattern = PATTERN.MIX_ORIENTED * oriented +
      PATTERN.MIX_TOPOLOGY * topologySimilarity(a.topology, b.topology);

    const densityRatio = Math.min(a.ink, b.ink) / Math.max(a.ink, b.ink);

    let fused =
      WEIGHTS.pattern * pattern +
      WEIGHTS.chamfer * chamfer +
      WEIGHTS.softNcc * ncc +
      WEIGHTS.hog * hog +
      WEIGHTS.profileDtw * profileDtw +
      WEIGHTS.zoning * zoning +
      WEIGHTS.geometry * geometry;
    fused *= 0.85 + 0.15 * densityRatio;

    return {
      pattern, chamfer, softNcc: ncc, hog, profileDtw, zoning, geometry,
      densityRatio, fused: clamp01(fused),
    };
  } finally { scope.release(); }
};

const makePrepared = (
  mask: cv.Mat,
  aspect: number,
  ink: number,
  scope: MatScope,
): PreparedSignature => {
  const skel = zhangSuenThin(mask);
  const topology = skeletonTopology(skel);
  skel.delete();
  return { mask, aspect, ink, orientation: orientationFieldFromMask(mask, scope), topology };
};

const nullTransforms = (p: PreparedSignature, scope: MatScope): PreparedSignature[] => {
  const rot = scope.track(new cv.Mat());
  cv.rotate(p.mask, rot, cv.ROTATE_180);
  const flipH = scope.track(new cv.Mat());
  cv.flip(p.mask, flipH, 1);
  const flipV = scope.track(new cv.Mat());
  cv.flip(p.mask, flipV, 0);
  return [rot, flipH, flipV].map((m) => makePrepared(m, p.aspect, p.ink, scope));
};

// ---------------------------------------------------------------------------
// Public comparison API
// ---------------------------------------------------------------------------

export const comparePrepared = (
  a: PreparedSignature,
  b: PreparedSignature,
): SimilarityBreakdown => {
  if (a.ink < MIN_INK_PIXELS || b.ink < MIN_INK_PIXELS) return { ...EMPTY };
  const scope = new MatScope();
  try {
    const real = rawSimilarity(a, b);
    let chance = 0;
    for (const n of nullTransforms(b, scope))
      chance = Math.max(chance, rawSimilarity(a, n).fused);

    const alpha = PATTERN.CHANCE_ALPHA;
    const denom = 1 - alpha * chance;
    const corrected = denom <= 1e-6 ? 0 : clamp01((real.fused - alpha * chance) / denom);
    const final = Math.pow(corrected, PATTERN.FINAL_GAMMA);

    return {
      pattern: real.pattern,
      chamfer: real.chamfer,
      softNcc: real.softNcc,
      hog: real.hog,
      profileDtw: real.profileDtw,
      zoning: real.zoning,
      geometry: real.geometry,
      densityRatio: real.densityRatio,
      raw: real.fused,
      chance,
      corrected,
      final,
    };
  } finally { scope.release(); }
};

export const compareSignatures = (stored: cv.Mat, drawn: cv.Mat): SimilarityBreakdown => {
  const a = prepareSignature(stored);
  try {
    const b = prepareSignature(drawn);
    try { return comparePrepared(a, b); }
    finally { b.mask.delete(); }
  } finally { a.mask.delete(); }
};

// ---------------------------------------------------------------------------
// Verdict / reporting
// ---------------------------------------------------------------------------

export type Verdict = 'match' | 'review' | 'no-match';

export const classify = (
  b: SimilarityBreakdown,
  bands: { strong: number; weak: number } = MATCH_BANDS,
): Verdict =>
  b.final >= bands.strong ? 'match' :
  b.final >= bands.weak ? 'review' :
  'no-match';

/**
 * Convenience for callers who want a boolean plus the full breakdown.
 * `review` is treated as a soft pass so borderline genuine pairs are not
 * silently thrown away — the UI can still show the breakdown for the operator.
 */
export const verify = (
  b: SimilarityBreakdown,
  bands: { strong: number; weak: number } = MATCH_BANDS,
): { ok: boolean; verdict: Verdict; score: number } => {
  const verdict = classify(b, bands);
  return { ok: verdict !== 'no-match', verdict, score: b.final };
};

export const formatBreakdown = (
  b: SimilarityBreakdown,
  threshold = DEFAULT_MATCH_THRESHOLD,
): string =>
  `pattern=${b.pattern.toFixed(3)} chamfer=${b.chamfer.toFixed(3)} ` +
  `ncc=${b.softNcc.toFixed(3)} hog=${b.hog.toFixed(3)} ` +
  `dtw=${b.profileDtw.toFixed(3)} zoning=${b.zoning.toFixed(3)} ` +
  `geom=${b.geometry.toFixed(3)} density=${b.densityRatio.toFixed(3)} | ` +
  `raw=${(b.raw * 100).toFixed(1)}% chance=${(b.chance * 100).toFixed(1)}% ` +
  `corrected=${(b.corrected * 100).toFixed(1)}% => final=${(b.final * 100).toFixed(1)}% ` +
  `(bands: strong≥${(MATCH_BANDS.strong * 100).toFixed(0)}% ` +
  `weak≥${(MATCH_BANDS.weak * 100).toFixed(0)}%, legacy threshold ${(threshold * 100).toFixed(0)}%)`;









  /**
 * signatureSimilarity.ts
 *
 * Pure (DOM-free) offline signature comparison engine built on OpenCV.js.
 * Everything here works on cv.Mat inputs so it can be unit-tested in Node
 * and reused by any UI. The modal only handles image loading / rendering.
 *
 * Pipeline
 * --------
 * 1. extractStoredSignatures / extractDrawnSignature
 *      RGBA image  ->  one or more binary ink masks (ink = 255).
 * 2. prepareSignature
 *      ink mask  ->  canonical 256x128 mask, aspect-preserving, centred,
 *      stroke width normalised (Zhang-Suen thinning + 3px re-inking) so that
 *      pen-on-paper specimens and finger/mouse drawings become comparable.
 * 3. compareSignatures
 *      Deformation-tolerant shape metrics (chamfer distance, blurred NCC with
 *      shift search, oriented-gradient histograms, DTW on projection profiles,
 *      multi-scale zoning, global geometry) fused into one score in [0, 1].
 *
 * Two failure modes this design guards against:
 *   - Pixel-exact overlap (the original NCC / Dice score) never exceeds ~35 %
 *     for genuine pairs, because two signatures by the same person never
 *     overlap pixel for pixel. Every metric here tolerates that drift.
 *   - Tolerant metrics saturate on DENSE signatures: two different cursive
 *     signatures both fill the canvas with ink, share slant and layout, and
 *     score 50-70 % against each other. `comparePrepared` therefore measures
 *     the score the specimen gets against shape-destroyed copies of the drawn
 *     signature (rotated / flipped: same ink, same texture, different shape)
 *     and only counts what the real drawing scores ABOVE that chance level.
 */

// import cv from '@techstark/opencv-js';

// // ---------------------------------------------------------------------------
// // Tunables — every constant that affects the score lives here.
// // ---------------------------------------------------------------------------

// /** Canonical comparison canvas (landscape, like a signature). */
// export const CANON = { W: 256, H: 128, PAD: 8 } as const;

// /** Metric fusion weights (sum to 1). */
// export const WEIGHTS = {
//   chamfer: 0.3, // stroke-path proximity (translation / deformation tolerant)
//   softNcc: 0.25, // blurred correlation, best over ±SHIFT_SEARCH_PX
//   hog: 0.2, // stroke-direction structure per region + global slant
//   profileDtw: 0.1, // row/column ink profiles aligned with DTW
//   zoning: 0.1, // multi-scale ink-density layout
//   geometry: 0.05, // aspect ratio + Hu moments
// } as const;

// /** Chamfer: an ink pixel farther than this (px, canonical scale) from the other signature scores 0. */
// export const CHAMFER_CAP_PX = 16;
// /** Soft NCC: maximum translation searched in each direction (px, canonical scale). */
// export const SHIFT_SEARCH_PX = 12;
// /** Gaussian sigma (px) used to soften masks before correlation / gradients. */
// export const BLUR_SIGMA = 2.5;
// /** HOG grid and bins. */
// export const HOG = { X: 8, Y: 4, BINS: 6, GLOBAL_BINS: 12 } as const;
// /** DTW Sakoe-Chiba band as a fraction of profile length, and cost -> similarity scale. */
// export const DTW = { BAND: 0.1, COST_SCALE: 2.5 } as const;
// /** Zoning grids evaluated (cols x rows). */
// export const ZONING_GRIDS: ReadonlyArray<readonly [number, number]> = [
//   [4, 2],
//   [8, 4],
//   [16, 8],
// ];
// /** Minimum ink pixels (after normalisation) for a mask to count as a signature. */
// export const MIN_INK_PIXELS = 15;
// /**
//  * Suggested starting threshold on the chance-corrected `final` score.
//  * On synthetic suites the corrected score of a DIFFERENT signature stays below ~0.2-0.4
//  * while genuine re-signings sit around 0.5-0.65 — so 0.30 is the starting point.
//  * Calibrate against real genuine / other-person pairs (see the breakdown log).
//  */
// export const DEFAULT_MATCH_THRESHOLD = 0.50;

// // ---------------------------------------------------------------------------
// // Types
// // ---------------------------------------------------------------------------

// export interface SimilarityBreakdown {
//   chamfer: number;
//   softNcc: number;
//   hog: number;
//   profileDtw: number;
//   zoning: number;
//   geometry: number;
//   densityRatio: number;
//   /** Fused raw similarity in [0, 1] before chance correction. */
//   raw: number;
//   /**
//    * Best raw similarity of the stored specimen against shape-destroying transforms of
//    * the drawn signature (rotated 180°, flipped horizontally, flipped vertically).
//    * Those keep ink density, stroke width, aspect and slant statistics but destroy the
//    * actual shape, so this is the score a different signature with the same "texture"
//    * would get by chance.
//    */
//   chance: number;
//   /** Chance-corrected score in [0, 1]: (raw - chance) / (1 - chance). Compare this to the threshold. */
//   final: number;
// }

// export interface PreparedSignature {
//   /** Canonical CANON.W x CANON.H binary mask, ink = 255, uniform stroke width. Caller must delete(). */
//   mask: cv.Mat;
//   /** Ink bounding-box aspect ratio (w / h) of the ORIGINAL mask, before normalisation. */
//   aspect: number;
//   /** Ink pixel count of the canonical mask. */
//   ink: number;
// }

// // ---------------------------------------------------------------------------
// // Small helpers
// // ---------------------------------------------------------------------------

// interface Deletable {
//   delete(): void;
// }

// /** Tracks Mats / MatVectors so they are released exactly once, even when OpenCV throws. */
// class MatScope {
//   private mats: Deletable[] = [];
//   track<T extends Deletable>(m: T): T {
//     this.mats.push(m);
//     return m;
//   }
//   release(): void {
//     for (const m of this.mats) {
//       try {
//         m.delete();
//       } catch {
//         /* already freed */
//       }
//     }
//     this.mats = [];
//   }
// }

// const clamp01 = (v: number): number => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);

// const oddAtLeast = (v: number, min: number): number => {
//   let k = Math.max(min, Math.floor(v));
//   if (k % 2 === 0) k += 1;
//   return k;
// };

// const toGray = (src: cv.Mat, scope: MatScope): cv.Mat => {
//   const gray = scope.track(new cv.Mat());
//   switch (src.channels()) {
//     case 1:
//       src.copyTo(gray);
//       break;
//     case 3:
//       cv.cvtColor(src, gray, cv.COLOR_RGB2GRAY);
//       break;
//     default:
//       cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
//   }
//   return gray;
// };

// interface Box {
//   x: number;
//   y: number;
//   width: number;
//   height: number;
// }

// /** Ink bounding box computed from pixels (robust to hairline strokes). null if no ink. */
// const inkBounds = (mask: cv.Mat): Box | null => {
//   const rows = mask.rows;
//   const cols = mask.cols;
//   const d = mask.data;
//   let minX = cols;
//   let minY = rows;
//   let maxX = -1;
//   let maxY = -1;
//   for (let y = 0; y < rows; y++) {
//     const base = y * cols;
//     for (let x = 0; x < cols; x++) {
//       if (d[base + x] > 0) {
//         if (x < minX) minX = x;
//         if (x > maxX) maxX = x;
//         if (y < minY) minY = y;
//         if (y > maxY) maxY = y;
//       }
//     }
//   }
//   if (maxX < minX || maxY < minY) return null;
//   return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
// };

// const cosine = (a: ArrayLike<number>, b: ArrayLike<number>): number => {
//   let dot = 0;
//   let na = 0;
//   let nb = 0;
//   for (let i = 0; i < a.length; i++) {
//     dot += a[i] * b[i];
//     na += a[i] * a[i];
//     nb += b[i] * b[i];
//   }
//   if (na === 0 || nb === 0) return 0;
//   return clamp01(dot / Math.sqrt(na * nb));
// };

// // ---------------------------------------------------------------------------
// // Stroke-width normalisation: Zhang-Suen thinning
// // ---------------------------------------------------------------------------

// /** Returns a new 8UC1 Mat holding the 1-px skeleton of a binary mask. */
// const zhangSuenThin = (mask: cv.Mat): cv.Mat => {
//   const rows = mask.rows;
//   const cols = mask.cols;
//   const src = mask.data;
//   const img = new Uint8Array(rows * cols);
//   for (let i = 0; i < img.length; i++) img[i] = src[i] > 0 ? 1 : 0;

//   const toDelete: number[] = [];
//   let changed = true;
//   while (changed) {
//     changed = false;
//     for (let step = 0; step < 2; step++) {
//       toDelete.length = 0;
//       for (let y = 1; y < rows - 1; y++) {
//         for (let x = 1; x < cols - 1; x++) {
//           const i = y * cols + x;
//           if (img[i] !== 1) continue;
//           const p2 = img[i - cols];
//           const p3 = img[i - cols + 1];
//           const p4 = img[i + 1];
//           const p5 = img[i + cols + 1];
//           const p6 = img[i + cols];
//           const p7 = img[i + cols - 1];
//           const p8 = img[i - 1];
//           const p9 = img[i - cols - 1];
//           const b = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
//           if (b < 2 || b > 6) continue;
//           let a = 0;
//           if (p2 === 0 && p3 === 1) a++;
//           if (p3 === 0 && p4 === 1) a++;
//           if (p4 === 0 && p5 === 1) a++;
//           if (p5 === 0 && p6 === 1) a++;
//           if (p6 === 0 && p7 === 1) a++;
//           if (p7 === 0 && p8 === 1) a++;
//           if (p8 === 0 && p9 === 1) a++;
//           if (p9 === 0 && p2 === 1) a++;
//           if (a !== 1) continue;
//           if (step === 0) {
//             if (p2 * p4 * p6 !== 0 || p4 * p6 * p8 !== 0) continue;
//           } else if (p2 * p4 * p8 !== 0 || p2 * p6 * p8 !== 0) {
//             continue;
//           }
//           toDelete.push(i);
//         }
//       }
//       if (toDelete.length > 0) {
//         changed = true;
//         for (const i of toDelete) img[i] = 0;
//       }
//     }
//   }

//   const out = cv.Mat.zeros(rows, cols, cv.CV_8UC1);
//   const od = out.data;
//   for (let i = 0; i < img.length; i++) od[i] = img[i] ? 255 : 0;
//   return out;
// };

// // ---------------------------------------------------------------------------
// // Extraction: image -> ink mask(s)
// // ---------------------------------------------------------------------------

// /**
//  * Removes border remnants from a binary ink mask in place: components that touch the
//  * mask edge AND are very elongated along it (leftovers of a skewed box border). Signature
//  * strokes that merely cross the border are short and low-aspect, so they are kept —
//  * as are underlines, which a morphological "remove ruled lines" pass would destroy.
//  */
// const removeBorderRemnants = (bin: cv.Mat, scope: MatScope): void => {
//   const contours = scope.track(new cv.MatVector());
//   const hierarchy = scope.track(new cv.Mat());
//   cv.findContours(bin, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
//   const rows = bin.rows;
//   const cols = bin.cols;
//   const black = new cv.Scalar(0, 0, 0, 0);
//   for (let i = 0; i < contours.size(); i++) {
//     const c = contours.get(i);
//     try {
//       const r = cv.boundingRect(c);
//       const touches = r.x <= 1 || r.y <= 1 || r.x + r.width >= cols - 1 || r.y + r.height >= rows - 1;
//       if (!touches) continue;
//       const long = Math.max(r.width, r.height);
//       const thin = Math.min(r.width, r.height);
//       // Conservative: only very flat, very long components (a skewed 1-3 px rule leaves a
//       // ~1000 x 15 px sliver). Wide flat strokes (aspect ~10) are left alone.
//       const spansEdge = long >= (r.width >= r.height ? cols : rows) * 0.6;
//       if (spansEdge && long / Math.max(1, thin) > 25) {
//         const region = bin.roi(new cv.Rect(r.x, r.y, r.width, r.height));
//         region.setTo(black);
//         region.delete();
//       }
//     } finally {
//       c.delete();
//     }
//   }
// };

// /** Adaptive binarisation for scanned / photographed ink: ink -> 255. Block size scales with the region. */
// const binariseInk = (gray: cv.Mat, scope: MatScope): cv.Mat => {
//   const bin = scope.track(new cv.Mat());
//   const block = oddAtLeast(Math.min(gray.rows, gray.cols) / 6, 25);
//   cv.adaptiveThreshold(gray, bin, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, block, 10);
//   return bin;
// };

// /**
//  * Union bounding box of the significant ink components in a binary mask.
//  * Components much smaller than the largest one (specks, printed labels, i-dots)
//  * are ignored. Returns null when there is no meaningful ink.
//  */
// const significantInkBounds = (bin: cv.Mat, scope: MatScope, minInkPixels: number): Box | null => {
//   const contours = scope.track(new cv.MatVector());
//   const hierarchy = scope.track(new cv.Mat());
//   cv.findContours(bin, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

//   const rects: Box[] = [];
//   let largestDim = 0;
//   for (let i = 0; i < contours.size(); i++) {
//     const c = contours.get(i);
//     const r = cv.boundingRect(c);
//     c.delete();
//     const dim = Math.max(r.width, r.height);
//     if (dim < 4) continue;
//     rects.push(r);
//     if (dim > largestDim) largestDim = dim;
//   }
//   if (rects.length === 0) return null;

//   const keepDim = largestDim * 0.15;
//   let union: Box | null = null;
//   for (const r of rects) {
//     if (Math.max(r.width, r.height) < keepDim) continue;
//     if (!union) {
//       union = { ...r };
//     } else {
//       const x1 = Math.min(union.x, r.x);
//       const y1 = Math.min(union.y, r.y);
//       const x2 = Math.max(union.x + union.width, r.x + r.width);
//       const y2 = Math.max(union.y + union.height, r.y + r.height);
//       union = { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
//     }
//   }
//   if (!union) return null;

//   const roi = bin.roi(new cv.Rect(union.x, union.y, union.width, union.height));
//   const ink = cv.countNonZero(roi);
//   roi.delete();
//   return ink >= minInkPixels ? union : null;
// };

// /** True when a 4-point polygon is a real (near-)right-angled rectangle, not a rounded handwriting loop. */
// const isRectangular = (approx: cv.Mat, bbox: Box, contourArea: number): boolean => {
//   if (contourArea < bbox.width * bbox.height * 0.9) return false; // a loop fills ~0.79 of its bbox at best
//   const pts = approx.data32S; // [x0, y0, x1, y1, ...]
//   for (let i = 0; i < 4; i++) {
//     const px = pts[((i + 3) % 4) * 2];
//     const py = pts[((i + 3) % 4) * 2 + 1];
//     const cx = pts[i * 2];
//     const cy = pts[i * 2 + 1];
//     const nx = pts[((i + 1) % 4) * 2];
//     const ny = pts[((i + 1) % 4) * 2 + 1];
//     const ax = px - cx;
//     const ay = py - cy;
//     const bx = nx - cx;
//     const by = ny - cy;
//     const cos = (ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by) || 1);
//     if (Math.abs(cos) > 0.2) return false; // corner further than ~12° from a right angle
//   }
//   return true;
// };

// /**
//  * Detects ruled signature boxes on a specimen card. Deliberately strict: a box must be
//  * a right-angled rectangle, landscape, and at least a quarter of the image wide, so a
//  * closed loop in a plain signature crop is never mistaken for a box (which would make
//  * the "specimen" a fragment of the signature). Innermost boxes win; duplicates merge.
//  */
// const detectSignatureBoxes = (gray: cv.Mat, scope: MatScope): Box[] => {
//   const edges = scope.track(new cv.Mat());
//   cv.adaptiveThreshold(gray, edges, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);
//   const contours = scope.track(new cv.MatVector());
//   const hierarchy = scope.track(new cv.Mat());
//   cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

//   const imgArea = gray.rows * gray.cols;
//   const minArea = Math.max(1000, imgArea * 0.005);
//   const maxArea = imgArea * 0.9;
//   const minWidth = gray.cols * 0.25;
//   const candidates: Box[] = [];
//   for (let i = 0; i < contours.size(); i++) {
//     const c = contours.get(i);
//     const approx = new cv.Mat();
//     try {
//       const perimeter = cv.arcLength(c, true);
//       cv.approxPolyDP(c, approx, 0.04 * perimeter, true);
//       if (approx.rows !== 4) continue;
//       const r = cv.boundingRect(c);
//       const area = r.width * r.height;
//       if (area < minArea || area > maxArea) continue;
//       if (r.width < minWidth || r.width < r.height * 1.2) continue;
//       if (!isRectangular(approx, r, cv.contourArea(c))) continue;
//       candidates.push(r);
//     } finally {
//       approx.delete();
//       c.delete();
//     }
//   }

//   // Smallest first: keep a box unless it duplicates or contains one already kept.
//   candidates.sort((a, b) => a.width * a.height - b.width * b.height);
//   const kept: Box[] = [];
//   const contains = (o: Box, i: Box, m: number): boolean =>
//     i.x >= o.x - m && i.y >= o.y - m && i.x + i.width <= o.x + o.width + m && i.y + i.height <= o.y + o.height + m;
//   for (const r of candidates) {
//     const margin = Math.max(4, Math.min(r.width, r.height) * 0.05);
//     const redundant = kept.some((k) => contains(r, k, margin) || contains(k, r, margin));
//     if (!redundant) kept.push(r);
//   }
//   kept.sort((a, b) => a.y - b.y || a.x - b.x);
//   return kept;
// };

// /** Optional debug output from extractStoredSignatures (boxes drawn on a copy of the source). */
// export interface StoredExtractionDebug {
//   boxes: Box[];
//   usedFallback: boolean;
// }

// /**
//  * Extracts every specimen signature from a stored image. Handles both a
//  * signature card with ruled boxes (one mask per box that actually contains ink)
//  * and a plain signature crop (single mask). Returned Mats are owned by the caller.
//  */
// export const extractStoredSignatures = (
//   src: cv.Mat,
//   debug?: StoredExtractionDebug,
// ): cv.Mat[] => {
//   const scope = new MatScope();
//   const out: cv.Mat[] = [];
//   try {
//     const gray = toGray(src, scope);
//     const boxes = detectSignatureBoxes(gray, scope);
//     if (debug) debug.boxes = boxes;

//     for (const box of boxes) {
//       const inset = Math.max(4, Math.round(Math.min(box.width, box.height) * 0.03));
//       const w = box.width - 2 * inset;
//       const h = box.height - 2 * inset;
//       if (w < 16 || h < 16) continue;
//       const boxScope = new MatScope();
//       try {
//         const roi = boxScope.track(gray.roi(new cv.Rect(box.x + inset, box.y + inset, w, h)));
//         const bin = binariseInk(roi, boxScope);
//         removeBorderRemnants(bin, boxScope);
//         const bounds = significantInkBounds(bin, boxScope, Math.max(60, Math.round(w * h * 0.002)));
//         // Empty box, or only a printed label: real signatures span a good part of the box.
//         if (!bounds || (bounds.width < w * 0.2 && bounds.height < h * 0.35)) continue;
//         const sig = bin.roi(new cv.Rect(bounds.x, bounds.y, bounds.width, bounds.height));
//         out.push(sig.clone());
//         sig.delete();
//       } finally {
//         boxScope.release();
//       }
//     }

//     if (out.length === 0) {
//       // No usable boxes: treat the whole image as one signature.
//       if (debug) debug.usedFallback = true;
//       const bin = binariseInk(gray, scope);
//       removeBorderRemnants(bin, scope);
//       const bounds = significantInkBounds(bin, scope, 60);
//       if (bounds) {
//         const sig = bin.roi(new cv.Rect(bounds.x, bounds.y, bounds.width, bounds.height));
//         out.push(sig.clone());
//         sig.delete();
//       }
//     }
//     return out;
//   } catch (e) {
//     out.forEach((m) => m.delete());
//     throw e;
//   } finally {
//     scope.release();
//   }
// };

// /**
//  * Extracts the ink from a signature drawn in the app (black on white).
//  * Returns a single cropped binary mask, or an empty array if nothing was drawn.
//  */
// export const extractDrawnSignature = (src: cv.Mat): cv.Mat[] => {
//   const scope = new MatScope();
//   try {
//     const gray = toGray(src, scope);
//     const bin = scope.track(new cv.Mat());
//     cv.threshold(gray, bin, 160, 255, cv.THRESH_BINARY_INV);
//     // Same component rule as the stored side, so both crops are defined identically.
//     const b = significantInkBounds(bin, scope, MIN_INK_PIXELS);
//     if (!b) return [];
//     const pad = 10;
//     const x = Math.max(0, b.x - pad);
//     const y = Math.max(0, b.y - pad);
//     const w = Math.min(bin.cols, b.x + b.width + pad) - x;
//     const h = Math.min(bin.rows, b.y + b.height + pad) - y;
//     const roi = bin.roi(new cv.Rect(x, y, w, h));
//     const outMat = roi.clone();
//     roi.delete();
//     return [outMat];
//   } finally {
//     scope.release();
//   }
// };

// // ---------------------------------------------------------------------------
// // Normalisation: ink mask -> canonical, stroke-normalised mask
// // ---------------------------------------------------------------------------

// export const prepareSignature = (src: cv.Mat): PreparedSignature => {
//   const scope = new MatScope();
//   let canvas: cv.Mat | null = null;
//   try {
//     const work = toGray(src, scope);
//     cv.threshold(work, work, 127, 255, cv.THRESH_BINARY);

//     canvas = cv.Mat.zeros(CANON.H, CANON.W, cv.CV_8UC1);
//     const b = inkBounds(work);
//     if (!b) {
//       const empty = canvas;
//       canvas = null;
//       return { mask: empty, aspect: 1, ink: 0 };
//     }

//     // 1) Aspect-preserving fit of the ink bounding box into the padded canvas.
//     const crop = scope.track(work.roi(new cv.Rect(b.x, b.y, b.width, b.height)));
//     const scale = Math.min((CANON.W - CANON.PAD * 2) / b.width, (CANON.H - CANON.PAD * 2) / b.height);
//     const nw = Math.max(1, Math.round(b.width * scale));
//     const nh = Math.max(1, Math.round(b.height * scale));
//     const resized = scope.track(new cv.Mat());
//     cv.resize(crop, resized, new cv.Size(nw, nh), 0, 0, scale < 1 ? cv.INTER_AREA : cv.INTER_LINEAR);
//     // Low threshold after area-averaging so hairline strokes survive downscaling.
//     cv.threshold(resized, resized, 40, 255, cv.THRESH_BINARY);

//     const xo = Math.floor((CANON.W - nw) / 2);
//     const yo = Math.floor((CANON.H - nh) / 2);
//     const dst = scope.track(canvas.roi(new cv.Rect(xo, yo, nw, nh)));
//     resized.copyTo(dst);

//     // 2) Stroke-width normalisation: 1px skeleton, then a uniform ~3px stroke.
//     const skeleton = scope.track(zhangSuenThin(canvas));
//     const kernel = scope.track(cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(3, 3)));
//     cv.dilate(skeleton, canvas, kernel);

//     const ink = cv.countNonZero(canvas);
//     const out = canvas;
//     canvas = null;
//     return { mask: out, aspect: b.width / b.height, ink };
//   } catch (e) {
//     canvas?.delete();
//     throw e;
//   } finally {
//     scope.release();
//   }
// };

// // ---------------------------------------------------------------------------
// // Metrics (all operate on canonical masks from prepareSignature)
// // ---------------------------------------------------------------------------

// /** Mean, over ink pixels of `probe`, of max(0, 1 - d / cap) where d is the distance to the nearest ink of `ref`. */
// const chamferOneWay = (refMask: cv.Mat, probeMask: cv.Mat, scope: MatScope): number => {
//   const inv = scope.track(new cv.Mat());
//   cv.bitwise_not(refMask, inv); // ink -> 0, background -> 255
//   const dt = scope.track(new cv.Mat());
//   cv.distanceTransform(inv, dt, cv.DIST_L2, 3); // 32F: distance to nearest ref ink
//   const dist = dt.data32F;
//   const probe = probeMask.data;
//   let sum = 0;
//   let n = 0;
//   for (let i = 0; i < probe.length; i++) {
//     if (probe[i] > 0) {
//       sum += Math.max(0, 1 - dist[i] / CHAMFER_CAP_PX);
//       n++;
//     }
//   }
//   return n === 0 ? 0 : sum / n;
// };

// const softMask = (mask: cv.Mat, scope: MatScope): cv.Mat => {
//   const f = scope.track(new cv.Mat());
//   mask.convertTo(f, cv.CV_32F, 1 / 255);
//   const k = oddAtLeast(Math.ceil(BLUR_SIGMA * 3) * 2 + 1, 3);
//   cv.GaussianBlur(f, f, new cv.Size(k, k), BLUR_SIGMA, BLUR_SIGMA, cv.BORDER_DEFAULT);
//   return f;
// };

// /** Best normalised cross-correlation of the two blurred masks over ±SHIFT_SEARCH_PX. */
// const softNcc = (softA: cv.Mat, softB: cv.Mat, scope: MatScope): number => {
//   const s = SHIFT_SEARCH_PX;
//   const padded = scope.track(new cv.Mat());
//   cv.copyMakeBorder(softA, padded, s, s, s, s, cv.BORDER_CONSTANT, new cv.Scalar(0, 0, 0, 0));
//   const result = scope.track(new cv.Mat());
//   cv.matchTemplate(padded, softB, result, cv.TM_CCOEFF_NORMED);
//   const noMask = scope.track(new cv.Mat());
//   const mm = cv.minMaxLoc(result, noMask);
//   return clamp01(mm.maxVal);
// };

// interface HogFeatures {
//   grid: Float64Array;
//   global: Float64Array;
// }

// /** Magnitude-weighted unsigned orientation histograms: per grid cell and global. */
// const hogFeatures = (soft: cv.Mat, scope: MatScope): HogFeatures => {
//   const dx = scope.track(new cv.Mat());
//   const dy = scope.track(new cv.Mat());
//   cv.Sobel(soft, dx, cv.CV_32F, 1, 0, 3, 1, 0, cv.BORDER_DEFAULT);
//   cv.Sobel(soft, dy, cv.CV_32F, 0, 1, 3, 1, 0, cv.BORDER_DEFAULT);
//   const gx = dx.data32F;
//   const gy = dy.data32F;
//   const rows = soft.rows;
//   const cols = soft.cols;
//   const grid = new Float64Array(HOG.X * HOG.Y * HOG.BINS);
//   const global = new Float64Array(HOG.GLOBAL_BINS);
//   const cellW = cols / HOG.X;
//   const cellH = rows / HOG.Y;
//   for (let y = 0; y < rows; y++) {
//     const cy = Math.min(HOG.Y - 1, Math.floor(y / cellH));
//     for (let x = 0; x < cols; x++) {
//       const i = y * cols + x;
//       const mag = Math.hypot(gx[i], gy[i]);
//       if (mag < 1e-3) continue;
//       let ang = Math.atan2(gy[i], gx[i]);
//       if (ang < 0) ang += Math.PI; // unsigned orientation in [0, PI)
//       const t = ang / Math.PI;
//       const cx = Math.min(HOG.X - 1, Math.floor(x / cellW));
//       const bin = Math.min(HOG.BINS - 1, Math.floor(t * HOG.BINS));
//       grid[(cy * HOG.X + cx) * HOG.BINS + bin] += mag;
//       const gbin = Math.min(HOG.GLOBAL_BINS - 1, Math.floor(t * HOG.GLOBAL_BINS));
//       global[gbin] += mag;
//     }
//   }
//   return { grid, global };
// };

// interface ProfileFeatures {
//   row: Float64Array;
//   col: Float64Array;
//   zones: Float64Array[];
// }

// /** Row/col ink profiles (max-normalised) and multi-scale zoning densities, one pass. */
// const profileFeatures = (mask: cv.Mat): ProfileFeatures => {
//   const rows = mask.rows;
//   const cols = mask.cols;
//   const d = mask.data;
//   const row = new Float64Array(rows);
//   const col = new Float64Array(cols);
//   const zones = ZONING_GRIDS.map(([gx, gy]) => new Float64Array(gx * gy));
//   for (let y = 0; y < rows; y++) {
//     const base = y * cols;
//     for (let x = 0; x < cols; x++) {
//       if (d[base + x] > 0) {
//         row[y]++;
//         col[x]++;
//         for (let g = 0; g < ZONING_GRIDS.length; g++) {
//           const [gx, gy] = ZONING_GRIDS[g];
//           const cx = Math.min(gx - 1, Math.floor((x * gx) / cols));
//           const cy = Math.min(gy - 1, Math.floor((y * gy) / rows));
//           zones[g][cy * gx + cx]++;
//         }
//       }
//     }
//   }
//   const norm = (p: Float64Array) => {
//     let max = 0;
//     for (let i = 0; i < p.length; i++) if (p[i] > max) max = p[i];
//     if (max > 0) for (let i = 0; i < p.length; i++) p[i] /= max;
//     return p;
//   };
//   return { row: norm(row), col: norm(col), zones };
// };

// /** Dynamic time warping with a Sakoe-Chiba band; returns mean per-step cost in [0, 1]. */
// const dtwCost = (a: Float64Array, b: Float64Array): number => {
//   const n = a.length;
//   const m = b.length;
//   const band = Math.max(Math.round(Math.max(n, m) * DTW.BAND), Math.abs(n - m) + 1);
//   const INF = Number.POSITIVE_INFINITY;
//   let prev = new Float64Array(m + 1).fill(INF);
//   let curr = new Float64Array(m + 1).fill(INF);
//   prev[0] = 0;
//   for (let i = 1; i <= n; i++) {
//     curr.fill(INF);
//     const jc = Math.round((i * m) / n);
//     const jStart = Math.max(1, jc - band);
//     const jEnd = Math.min(m, jc + band);
//     for (let j = jStart; j <= jEnd; j++) {
//       const cost = Math.abs(a[i - 1] - b[j - 1]);
//       curr[j] = cost + Math.min(prev[j], curr[j - 1], prev[j - 1]);
//     }
//     const t = prev;
//     prev = curr;
//     curr = t;
//   }
//   const total = prev[m];
//   return Number.isFinite(total) ? total / Math.max(n, m) : 1;
// };

// /** Hu moment invariants computed from cv.moments output (avoids relying on cv.HuMoments being exported). */
// const huMoments = (mask: cv.Mat): number[] => {
//   const mo = cv.moments(mask, true);
//   const n20 = mo.nu20;
//   const n02 = mo.nu02;
//   const n11 = mo.nu11;
//   const n30 = mo.nu30;
//   const n12 = mo.nu12;
//   const n21 = mo.nu21;
//   const n03 = mo.nu03;
//   const h1 = n20 + n02;
//   const h2 = (n20 - n02) ** 2 + 4 * n11 ** 2;
//   const h3 = (n30 - 3 * n12) ** 2 + (3 * n21 - n03) ** 2;
//   const h4 = (n30 + n12) ** 2 + (n21 + n03) ** 2;
//   return [h1, h2, h3, h4];
// };

// const huSimilarity = (a: number[], b: number[]): number => {
//   const logAbs = (v: number) => Math.log10(Math.abs(v) + 1e-12);
//   let d = 0;
//   for (let i = 0; i < a.length; i++) d += Math.abs(logAbs(a[i]) - logAbs(b[i]));
//   d /= a.length;
//   return clamp01(Math.exp(-2 * d));
// };

// // ---------------------------------------------------------------------------
// // Public comparison API
// // ---------------------------------------------------------------------------

// const EMPTY: SimilarityBreakdown = {
//   chamfer: 0,
//   softNcc: 0,
//   hog: 0,
//   profileDtw: 0,
//   zoning: 0,
//   geometry: 0,
//   densityRatio: 0,
//   raw: 0,
//   chance: 0,
//   final: 0,
// };

// type RawScores = Omit<SimilarityBreakdown, 'raw' | 'chance' | 'final'> & { fused: number };

// /** Raw fused similarity of two prepared signatures (no chance correction). */
// const rawSimilarity = (a: PreparedSignature, b: PreparedSignature): RawScores => {
//   const scope = new MatScope();
//   try {
//     // Chamfer (symmetric)
//     const chamfer = (chamferOneWay(a.mask, b.mask, scope) + chamferOneWay(b.mask, a.mask, scope)) / 2;

//     // Soft NCC with shift search
//     const softA = softMask(a.mask, scope);
//     const softB = softMask(b.mask, scope);
//     const ncc = softNcc(softA, softB, scope);

//     // HOG-style orientation structure
//     const hA = hogFeatures(softA, scope);
//     const hB = hogFeatures(softB, scope);
//     const hog = 0.6 * cosine(hA.grid, hB.grid) + 0.4 * cosine(hA.global, hB.global);

//     // Profiles (DTW) and zoning
//     const pA = profileFeatures(a.mask);
//     const pB = profileFeatures(b.mask);
//     const dtwRow = dtwCost(pA.row, pB.row);
//     const dtwCol = dtwCost(pA.col, pB.col);
//     const profileDtw = clamp01(1 - DTW.COST_SCALE * ((dtwRow + dtwCol) / 2));
//     let zoning = 0;
//     for (let g = 0; g < pA.zones.length; g++) zoning += cosine(pA.zones[g], pB.zones[g]);
//     zoning /= pA.zones.length;

//     // Geometry
//     const aspectSim = Math.min(a.aspect, b.aspect) / Math.max(a.aspect, b.aspect);
//     const geometry = 0.5 * aspectSim + 0.5 * huSimilarity(huMoments(a.mask), huMoments(b.mask));

//     // Stroke-length agreement (ink counts are comparable after stroke normalisation).
//     const densityRatio = Math.min(a.ink, b.ink) / Math.max(a.ink, b.ink);

//     let fused =
//       WEIGHTS.chamfer * chamfer +
//       WEIGHTS.softNcc * ncc +
//       WEIGHTS.hog * hog +
//       WEIGHTS.profileDtw * profileDtw +
//       WEIGHTS.zoning * zoning +
//       WEIGHTS.geometry * geometry;
//     fused *= 0.85 + 0.15 * densityRatio;

//     return { chamfer, softNcc: ncc, hog, profileDtw, zoning, geometry, densityRatio, fused: clamp01(fused) };
//   } finally {
//     scope.release();
//   }
// };

// /** Shape-destroying transforms of a prepared signature that preserve its "texture" statistics. */
// const nullTransforms = (p: PreparedSignature, scope: MatScope): PreparedSignature[] => {
//   const rot = scope.track(new cv.Mat());
//   cv.rotate(p.mask, rot, cv.ROTATE_180);
//   const flipH = scope.track(new cv.Mat());
//   cv.flip(p.mask, flipH, 1);
//   const flipV = scope.track(new cv.Mat());
//   cv.flip(p.mask, flipV, 0);
//   return [rot, flipH, flipV].map((mask) => ({ mask, aspect: p.aspect, ink: p.ink }));
// };

// /**
//  * Compares two already-prepared signatures. Neither input is modified or freed.
//  *
//  * The returned `final` is chance-corrected: dense, cursive signatures by two different
//  * people share a lot of generic structure (ink everywhere, similar slant, similar
//  * layout), which inflates every proximity metric. Scoring the specimen against
//  * shape-destroyed versions of the drawn signature measures exactly that generic
//  * share, and only what the drawn signature scores ABOVE it counts as evidence.
//  */
// export const comparePrepared = (a: PreparedSignature, b: PreparedSignature): SimilarityBreakdown => {
//   if (a.ink < MIN_INK_PIXELS || b.ink < MIN_INK_PIXELS) return { ...EMPTY };
//   const scope = new MatScope();
//   try {
//     const real = rawSimilarity(a, b);
//     let chance = 0;
//     for (const n of nullTransforms(b, scope)) chance = Math.max(chance, rawSimilarity(a, n).fused);
//     const final = chance >= 1 ? 0 : clamp01((real.fused - chance) / (1 - chance));
//     return {
//       chamfer: real.chamfer,
//       softNcc: real.softNcc,
//       hog: real.hog,
//       profileDtw: real.profileDtw,
//       zoning: real.zoning,
//       geometry: real.geometry,
//       densityRatio: real.densityRatio,
//       raw: real.fused,
//       chance,
//       final,
//     };
//   } finally {
//     scope.release();
//   }
// };

// /** Convenience: prepare both raw ink masks and compare. Inputs are not freed. */
// export const compareSignatures = (stored: cv.Mat, drawn: cv.Mat): SimilarityBreakdown => {
//   const a = prepareSignature(stored);
//   try {
//     const b = prepareSignature(drawn);
//     try {
//       return comparePrepared(a, b);
//     } finally {
//       b.mask.delete();
//     }
//   } finally {
//     a.mask.delete();
//   }
// };

// export const formatBreakdown = (b: SimilarityBreakdown, threshold: number): string =>
//   `chamfer=${b.chamfer.toFixed(3)} ncc=${b.softNcc.toFixed(3)} hog=${b.hog.toFixed(3)} ` +
//   `dtw=${b.profileDtw.toFixed(3)} zoning=${b.zoning.toFixed(3)} geom=${b.geometry.toFixed(3)} ` +
//   `density=${b.densityRatio.toFixed(3)} | raw=${(b.raw * 100).toFixed(1)}% chance=${(b.chance * 100).toFixed(1)}% ` +
//   `=> final=${(b.final * 100).toFixed(1)}% (threshold ${(threshold * 100).toFixed(0)}%)`;

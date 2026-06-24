import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, RefreshCw } from 'lucide-react';
import { useOpenCV } from './OpenCVProvider';
import cv from '@techstark/opencv-js';

interface SignatureModalProps {
  amount: string;
  onClose: () => void;
  onConfirm: (signature: string) => Promise<void>;
  onError: (errorMessage: string) => void;
  type: 'withdrawal' | 'deposit' | 'transfer' | 'exchange' | 'otherBankTransfer'; // Updated types
  storedSignature: string;
  drawnSignature: string;
  additionalInfo?: string;
}

// Minimum combined similarity (0..1) required to accept a signature as a match.
// Far stricter than the old 0.2. The score below is built from discriminative,
// ink-focused metrics, so this maps to a meaningful confidence. Tune against real
// genuine-vs-forged samples using the per-metric breakdown logged in development.
const SIGNATURE_MATCH_THRESHOLD = 0.45;

const extractSignatures = async (imageUrl: string, isDrawn: boolean = false): Promise<cv.Mat[]> => {
    if (!imageUrl) {
      throw new Error('Invalid signature URL');
    }
  
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Failed to get canvas context');
          }
  
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          ctx.drawImage(img, 0, 0);
          
          const src = cv.imread(canvas);
          
          if (!isDrawn) {
            // Process stored signature
            const gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            
            // Apply adaptive threshold to get binary image
            const binary = new cv.Mat();
            cv.adaptiveThreshold(gray, binary, 255,
              cv.ADAPTIVE_THRESH_GAUSSIAN_C,
              cv.THRESH_BINARY_INV, 11, 2);
  
            // Find contours
            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();
            cv.findContours(
              binary,
              contours,
              hierarchy,
              cv.RETR_EXTERNAL,
              cv.CHAIN_APPROX_SIMPLE
            );
  
            // Find rectangle boxes
            const rectangles = [];
            for (let i = 0; i < contours.size(); i++) {
              const contour = contours.get(i);
              const perimeter = cv.arcLength(contour, true);
              const approx = new cv.Mat();
              cv.approxPolyDP(contour, approx, 0.04 * perimeter, true);
  
              // Check if it's a rectangle (4 points) and has reasonable size
              if (approx.rows === 4 && cv.contourArea(contour) > 1000) {
                const rect = cv.boundingRect(contour);
                rectangles.push(rect);
              }
              approx.delete();
            }
  
            // Sort rectangles by y-coordinate (top to bottom)
            rectangles.sort((a, b) => a.y - b.y);
  
            // Process each rectangle to find signatures
            const signatures: cv.Mat[] = [];
            
            for (const rect of rectangles) {
              // Add padding inside the rectangle
              const padding = 5;
              const roi = gray.roi(new cv.Rect(
                rect.x + padding,
                rect.y + padding,
                rect.width - 2 * padding,
                rect.height - 2 * padding
              ));
  
              // Threshold the ROI
              const signatureBinary = new cv.Mat();
              cv.adaptiveThreshold(
                roi,
                signatureBinary,
                255,
                cv.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv.THRESH_BINARY_INV,
                11,
                2
              );
  
              // Find signature contours
              const signatureContours = new cv.MatVector();
              const signatureHierarchy = new cv.Mat();
              cv.findContours(
                signatureBinary,
                signatureContours,
                signatureHierarchy,
                cv.RETR_EXTERNAL,
                cv.CHAIN_APPROX_SIMPLE
              );
  
              // Find the largest contour (signature)
              let maxArea = 0;
              let signatureContourIdx = -1;
  
              for (let i = 0; i < signatureContours.size(); i++) {
                const area = cv.contourArea(signatureContours.get(i));
                if (area > maxArea && area > 100) {
                  maxArea = area;
                  signatureContourIdx = i;
                }
              }
  
              if (signatureContourIdx !== -1) {
                const signatureRect = cv.boundingRect(signatureContours.get(signatureContourIdx));
                const signatureRoi = signatureBinary.roi(signatureRect);
                signatures.push(signatureRoi.clone());
                signatureRoi.delete();
              }
  
              // Cleanup
              roi.delete();
              signatureBinary.delete();
              signatureContours.delete();
              signatureHierarchy.delete();
            }
  
            // Debug visualization
            if (process.env.NODE_ENV === 'development') {
              const debugCanvas = document.createElement('canvas');
              const debugMat = src.clone();
              
              // Draw rectangles
              for (const rect of rectangles) {
                const point1 = new cv.Point(rect.x, rect.y);
                const point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
                cv.rectangle(debugMat, point1, point2, new cv.Scalar(0, 255, 0), 2);
              }
              
              cv.imshow(debugCanvas, debugMat);
              console.log('Found signature boxes:', debugCanvas.toDataURL());
              debugMat.delete();
            }
  
            // Cleanup
            gray.delete();
            binary.delete();
            contours.delete();
            hierarchy.delete();
            src.delete();
  
            resolve(signatures);
          } else {
            // Processing for drawn signature
            const gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            
            // Simple threshold for drawn signature
            const binary = new cv.Mat();
            cv.threshold(gray, binary, 200, 255, cv.THRESH_BINARY_INV);
            
            // Find contours
            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();
            cv.findContours(
              binary,
              contours,
              hierarchy,
              cv.RETR_EXTERNAL,
              cv.CHAIN_APPROX_SIMPLE
            );
            
            // Get bounding rectangle of all valid contours
            let minX = canvas.width, minY = canvas.height;
            let maxX = 0, maxY = 0;
            let hasValidContour = false;
            
            for (let i = 0; i < contours.size(); i++) {
              const area = cv.contourArea(contours.get(i));
              if (area > 100) { // Filter small noise
                const rect = cv.boundingRect(contours.get(i));
                minX = Math.min(minX, rect.x);
                minY = Math.min(minY, rect.y);
                maxX = Math.max(maxX, rect.x + rect.width);
                maxY = Math.max(maxY, rect.y + rect.height);
                hasValidContour = true;
              }
            }
            
            if (hasValidContour) {
              // Add padding
              const padding = 10;
              minX = Math.max(0, minX - padding);
              minY = Math.max(0, minY - padding);
              maxX = Math.min(canvas.width, maxX + padding);
              maxY = Math.min(canvas.height, maxY + padding);
              
              const roi = binary.roi(new cv.Rect(
                minX, minY, maxX - minX, maxY - minY
              ));
              resolve([roi.clone()]);
              roi.delete();
            } else {
              throw new Error('No valid signature drawn');
            }
            
            // Cleanup
            gray.delete();
            binary.delete();
            contours.delete();
            hierarchy.delete();
            src.delete();
          }
        } catch (error) {
          // Expected validation outcome (e.g. no valid signature) — log without
          // tripping the Next.js dev error overlay; the toast is shown via onError.
          console.warn('Error processing signature:', error);
          reject(error);
        }
      };
  
      img.onerror = () => reject(new Error('Failed to load signature image'));
      img.src = cleanImageUrl(imageUrl);
    });
  };
  
  
  // Add this helper function
  const cleanImageUrl = (url: string): string => {
    try {
      // Remove any duplicate data:image prefixes
      while (url.includes('data:image/jpeg;base64,data:image/jpeg;base64,')) {
        url = url.replace('data:image/jpeg;base64,data:image/jpeg;base64,', 'data:image/jpeg;base64,');
      }
      
      // Check if it's already a valid data URL
      if (url.startsWith('data:image/')) {
        return url;
      }
      
      // If it's just base64 data, add the prefix
      if (url.match(/^[A-Za-z0-9+/=]+$/)) {
        return `data:image/jpeg;base64,${url}`;
      }
      
      throw new Error('Invalid image data format');
    } catch (error) {
      console.warn('Error cleaning image URL:', error);
      throw new Error('Invalid image data format');
    }
  };














  const showDebugImages = (storedImage: cv.Mat, drawnImage: cv.Mat, similarity: number) => {
    const debugContainer = document.createElement('div');
    debugContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
  
    const createImageSection = (title: string, mat: cv.Mat) => {
      const section = document.createElement('div');
      section.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
      `;
  
      const label = document.createElement('div');
      label.textContent = title;
      label.style.cssText = `
        font-weight: bold;
        font-size: 14px;
        color: #333;
      `;
  
      const canvas = document.createElement('canvas');
      canvas.style.cssText = `
        border: 1px solid #ddd;
        margin: 5px;
        width: 200px;
        height: 200px;
        object-fit: contain;
      `;
  
      cv.imshow(canvas, mat);
      
      section.appendChild(label);
      section.appendChild(canvas);
      return section;
    };
  
    debugContainer.appendChild(createImageSection('Stored Signature', storedImage));
    debugContainer.appendChild(createImageSection('Drawn Signature', drawnImage));
  
    const scoreDiv = document.createElement('div');
    scoreDiv.style.cssText = `
      text-align: center;
      font-size: 16px;
      font-weight: bold;
      color: ${similarity > 0.6 ? '#22c55e' : '#ef4444'};
      margin-top: 10px;
    `;
    scoreDiv.textContent = `Similarity Score: ${(similarity * 100).toFixed(2)}%`;
    debugContainer.appendChild(scoreDiv);
  
    document.body.appendChild(debugContainer);
  
    setTimeout(() => {
      document.body.removeChild(debugContainer);
    }, 5000);
  };
  

  const calculateSimilarity = async (signature1: cv.Mat, signature2: cv.Mat): Promise<number> => {
    // Canonical canvas. Aspect-preserving normalization removes position/scale
    // differences so the score reflects stroke SHAPE, not where the ink sits or how big it is.
    const CANON_W = 256;
    const CANON_H = 128;
    const PAD = 8;
    const GRID_X = 8;
    const GRID_Y = 4;

    // Normalize a binary ink mask (ink = 255) into a fixed, centered, aspect-preserving
    // canvas. Leak-safe: every internal Mat is released even if an OpenCV call throws.
    const normalize = (src: cv.Mat): cv.Mat => {
      let work: cv.Mat | null = null;
      let crop: cv.Mat | null = null;
      let rs: cv.Mat | null = null;
      let dstRoi: cv.Mat | null = null;
      let canvas: cv.Mat | null = null;
      try {
        work = new cv.Mat();
        if (src.channels() > 1) {
          cv.cvtColor(src, work, cv.COLOR_RGBA2GRAY);
        } else {
          src.copyTo(work);
        }
        cv.threshold(work, work, 127, 255, cv.THRESH_BINARY);

        // Ink bounding box straight from pixels — robust to thin (~1px) strokes whose
        // contour polygon area is ~0 (which a contourArea filter would wrongly drop).
        const rows = work.rows;
        const cols = work.cols;
        const wd = work.data;
        let minX = cols, minY = rows, maxX = -1, maxY = -1;
        for (let y = 0; y < rows; y++) {
          const rowBase = y * cols;
          for (let x = 0; x < cols; x++) {
            if (wd[rowBase + x] > 0) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        canvas = cv.Mat.zeros(CANON_H, CANON_W, cv.CV_8UC1);
        if (maxX < minX || maxY < minY) {
          const empty = canvas;
          canvas = null; // ownership transfers to caller
          return empty;
        }

        const bw = maxX - minX + 1;
        const bh = maxY - minY + 1;
        crop = work.roi(new cv.Rect(minX, minY, bw, bh));

        const scale = Math.min((CANON_W - PAD * 2) / bw, (CANON_H - PAD * 2) / bh);
        const nw = Math.max(1, Math.round(bw * scale));
        const nh = Math.max(1, Math.round(bh * scale));

        rs = new cv.Mat();
        cv.resize(crop, rs, new cv.Size(nw, nh), 0, 0, cv.INTER_AREA);
        cv.threshold(rs, rs, 127, 255, cv.THRESH_BINARY);

        const xo = Math.floor((CANON_W - nw) / 2);
        const yo = Math.floor((CANON_H - nh) / 2);
        dstRoi = canvas.roi(new cv.Rect(xo, yo, nw, nh));
        rs.copyTo(dstRoi);

        const out = canvas;
        canvas = null; // ownership transfers to caller
        return out;
      } catch (e) {
        canvas?.delete();
        throw e;
      } finally {
        work?.delete();
        crop?.delete();
        rs?.delete();
        dstRoi?.delete();
      }
    };

    // Row/col ink projection profiles + a coarse 2D zoning histogram (ink pixels per
    // grid cell) of a normalized canvas, all computed in a single pass.
    const features = (m: cv.Mat) => {
      const rows = m.rows;
      const cols = m.cols;
      const data = m.data;
      const row = new Float64Array(rows);
      const col = new Float64Array(cols);
      const zones = new Float64Array(GRID_X * GRID_Y);
      const cellW = cols / GRID_X;
      const cellH = rows / GRID_Y;
      let ink = 0;
      for (let y = 0; y < rows; y++) {
        const rowBase = y * cols;
        const gy = Math.min(GRID_Y - 1, Math.floor(y / cellH));
        for (let x = 0; x < cols; x++) {
          if (data[rowBase + x] > 0) {
            row[y]++;
            col[x]++;
            const gx = Math.min(GRID_X - 1, Math.floor(x / cellW));
            zones[gy * GRID_X + gx]++;
            ink++;
          }
        }
      }
      return { row, col, zones, ink };
    };

    // Pearson correlation of two equal-length arrays, clamped to [0, 1].
    const pearson = (a: Float64Array, b: Float64Array): number => {
      const n = a.length;
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

    // Cosine similarity of two non-negative vectors, in [0, 1].
    const cosine = (a: Float64Array, b: Float64Array): number => {
      let dot = 0;
      let na = 0;
      let nb = 0;
      for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
      }
      if (na === 0 || nb === 0) return 0;
      return Math.max(0, Math.min(1, dot / Math.sqrt(na * nb)));
    };

    let n1: cv.Mat | null = null;
    let n2: cv.Mat | null = null;
    let kernel: cv.Mat | null = null;
    let d1: cv.Mat | null = null;
    let d2: cv.Mat | null = null;
    let inter: cv.Mat | null = null;
    let tm: cv.Mat | null = null;
    let maskTm: cv.Mat | null = null;

    try {
      n1 = normalize(signature1);
      n2 = normalize(signature2);

      const ink1 = cv.countNonZero(n1);
      const ink2 = cv.countNonZero(n2);
      // No real ink in one of them -> not a match.
      if (ink1 < 15 || ink2 < 15) return 0;

      // Metric (primary): mean-subtracted normalized cross-correlation of the aligned
      // masks. This is the key discriminator — for two DIFFERENT signatures it is ~0
      // even when both fill the canvas, while a genuine match correlates strongly. This
      // is what prevents "a different scrawl still scores high".
      tm = new cv.Mat();
      cv.matchTemplate(n1, n2, tm, cv.TM_CCOEFF_NORMED);
      // minMaxLoc's 2nd positional arg is the optional mask at runtime; an empty Mat
      // means "no mask". It is passed so the call type-checks against the binding.
      maskTm = new cv.Mat();
      const mm = cv.minMaxLoc(tm, maskTm);
      const ncc = Number.isFinite(mm.maxVal) ? Math.max(0, mm.maxVal) : 0;

      // Metric: Dice overlap of lightly (3x3) dilated ink — stroke-path overlap with a
      // small tolerance for genuine pen variation. Kept tight so two different
      // signatures don't match merely by filling the same footprint.
      kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(3, 3));
      d1 = new cv.Mat();
      d2 = new cv.Mat();
      cv.dilate(n1, d1, kernel);
      cv.dilate(n2, d2, kernel);
      inter = new cv.Mat();
      cv.bitwise_and(d1, d2, inter);
      const areaD1 = cv.countNonZero(d1);
      const areaD2 = cv.countNonZero(d2);
      const interCount = cv.countNonZero(inter);
      const dice = (areaD1 + areaD2) > 0 ? (2 * interCount) / (areaD1 + areaD2) : 0;

      // Metric: 2D zoning (ink per grid cell, arrangement-sensitive) + marginal row/col
      // profiles (weaker supporting cue).
      const f1 = features(n1);
      const f2 = features(n2);
      const zoneSim = cosine(f1.zones, f2.zones);
      const profileSim = (pearson(f1.row, f2.row) + pearson(f1.col, f2.col)) / 2;

      // Soft gate: down-weight when the two masks hold very different ink amounts.
      const densityRatio = Math.min(ink1, ink2) / Math.max(ink1, ink2);

      let finalSimilarity =
        0.35 * ncc + 0.3 * dice + 0.2 * zoneSim + 0.15 * profileSim;
      finalSimilarity *= 0.7 + 0.3 * densityRatio;
      finalSimilarity = Math.max(0, Math.min(1, finalSimilarity));

      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[signature] ncc=${ncc.toFixed(3)} dice=${dice.toFixed(3)} zone=${zoneSim.toFixed(3)} profile=${profileSim.toFixed(3)} density=${densityRatio.toFixed(3)} => final=${(finalSimilarity * 100).toFixed(1)}% (threshold ${(SIGNATURE_MATCH_THRESHOLD * 100).toFixed(0)}%)`
        );
      }

      return finalSimilarity;
    } catch (error) {
      console.warn('Error calculating similarity:', error);
      throw error;
    } finally {
      n1?.delete();
      n2?.delete();
      kernel?.delete();
      d1?.delete();
      d2?.delete();
      inter?.delete();
      tm?.delete();
      maskTm?.delete();
    }
  };




const SignatureVerificationModal: React.FC<SignatureModalProps> = ({
  amount,
  onClose,
  onConfirm,
  onError,
  type,
  storedSignature,
  drawnSignature,
  additionalInfo
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [similarityScores, setSimilarityScores] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { isReady: isOpenCVReady } = useOpenCV();
  
  // Ref to prevent multiple confirmations
  const hasConfirmedRef = useRef(false);

  useEffect(() => {
    if (isOpenCVReady && drawnSignature) {
      verifySignature();
    }
  }, [isOpenCVReady, drawnSignature]);

  const verifySignature = async () => {
    if (!isOpenCVReady) {
      onError('Signature verification system is not ready');
      return;
    }

    setIsProcessing(true);

    let storedSignatures: cv.Mat[] = [];
    let drawnSignatures: cv.Mat[] = [];
    try {
      storedSignatures = await extractSignatures(storedSignature, false);
      drawnSignatures = await extractSignatures(drawnSignature, true);

      if (storedSignatures.length === 0) {
        throw new Error('No stored signatures found');
      }

      if (drawnSignatures.length === 0) {
        throw new Error('No valid signature drawn');
      }

      // Calculate similarity scores
      const scores = await Promise.all(
        storedSignatures.map(stored => 
          Promise.all(drawnSignatures.map(drawn => 
            calculateSimilarity(stored, drawn)
          ))
        )
      );

      // Debug visualization of the comparison
      if (process.env.NODE_ENV === 'development') {
        const bestStoredIdx = scores.findIndex(row => 
          row.includes(Math.max(...scores.flat()))
        );
        const bestDrawnIdx = scores[bestStoredIdx].indexOf(Math.max(...scores.flat()));
        
        showDebugImages(
          storedSignatures[bestStoredIdx],
          drawnSignatures[bestDrawnIdx],
          Math.max(...scores.flat())
        );
      }

      const flatScores = scores.flat();
      setSimilarityScores(flatScores);
      setShowResults(true);

      const maxSimilarity = Math.max(...flatScores);
      console.log('Final similarity score:', maxSimilarity);

      if (maxSimilarity >= SIGNATURE_MATCH_THRESHOLD) {
        if (!hasConfirmedRef.current) {
          hasConfirmedRef.current = true;
          await onConfirm(drawnSignature);
        }
      } else {
        onError('Signature verification failed - Please try again');
      }

    } catch (error) {
      // Expected verification failure (no/invalid signature, mismatch) — surface
      // it via the toast (onError) and log at warn level so the Next.js dev
      // error overlay does not pop up over the toast.
      console.warn('Signature verification error:', error);
      onError(error instanceof Error ? error.message : 'Failed to verify signature');
    } finally {
      // Release extracted Mats on every path (success or thrown) to avoid WASM-heap leaks.
      storedSignatures.forEach((mat) => { try { mat.delete(); } catch { /* already freed */ } });
      drawnSignatures.forEach((mat) => { try { mat.delete(); } catch { /* already freed */ } });
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (isProcessing || hasConfirmedRef.current) return;
    setIsProcessing(true);
    try {
      await onConfirm(drawnSignature);
      hasConfirmedRef.current = true;
    } catch (error) {
      onError('Failed to confirm signature');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Verifying Signature</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {isProcessing ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Verifying your signature...</p>
          </div>
        ) : (
          <>
            {showResults && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Similarity Scores:</h3>
                {similarityScores.map((score, index) => (
                  <div key={index} className="flex justify-between items-center mb-2">
                    <span>Signature {index + 1}:</span>
                    <span className={`font-medium ${score > 0.7 ? 'text-green-600' : 'text-red-600'}`}>
                      {(score * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 text-sm text-gray-600">
              <p>Verifying {type} of ETB {amount}</p>
              {additionalInfo && <p className="mt-1">{additionalInfo}</p>}
            </div>

            <div className="flex space-x-4 mt-4">
              <button
                onClick={handleConfirm}
                disabled={isProcessing || hasConfirmedRef.current}
                className={`flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ${
                  isProcessing || hasConfirmedRef.current ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isProcessing ? 'Processing...' : 'Confirm Signature'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SignatureVerificationModal;
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
    try {
      // Step 1: Resize both signatures to same size
      const size = new cv.Size(256, 256);
      const resized1 = new cv.Mat();
      const resized2 = new cv.Mat();
      cv.resize(signature1, resized1, size, 0, 0, cv.INTER_LINEAR);
      cv.resize(signature2, resized2, size, 0, 0, cv.INTER_LINEAR);
  
      // Step 2: Ensure binary images with adaptive thresholding
      const binary1 = new cv.Mat();
      const binary2 = new cv.Mat();
      cv.adaptiveThreshold(resized1, binary1, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);
      cv.adaptiveThreshold(resized2, binary2, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);
  
      // Step 3: Find contours for shape analysis
      const contours1 = new cv.MatVector();
      const contours2 = new cv.MatVector();
      const hierarchy = new cv.Mat();
  
      cv.findContours(binary1, contours1, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
      cv.findContours(binary2, contours2, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  
      // Step 4: Calculate shape metrics
      const getShapeMetrics = (contours: cv.MatVector) => {
        let totalPoints = 0;
        let totalPerimeter = 0;
        let totalArea = 0;
        let boundingRectArea = 0;
  
        for (let i = 0; i < contours.size(); i++) {
          const contour = contours.get(i);
          totalPoints += contour.data32S.length / 2;
          totalPerimeter += cv.arcLength(contour, true);
          const area = cv.contourArea(contour);
          totalArea += area;
  
          // Calculate bounding rect area
          const rect = cv.boundingRect(contour);
          boundingRectArea += rect.width * rect.height;
        }
  
        return {
          points: totalPoints,
          perimeter: totalPerimeter,
          area: totalArea,
          complexity: totalArea > 0 ? (totalPerimeter * totalPerimeter) / (4 * Math.PI * totalArea) : 0,
          extent: totalArea > 0 ? totalArea / boundingRectArea : 0
        };
      };
  
      const metrics1 = getShapeMetrics(contours1);
      const metrics2 = getShapeMetrics(contours2);
  
      // Step 5: Calculate various similarity measures
      const calculateMetricSimilarity = (a: number, b: number) => {
        const max = Math.max(Math.abs(a), Math.abs(b));
        return max === 0 ? 1 : 1 - Math.abs(a - b) / max;
      };
  
      // Calculate individual similarities
      const complexitySimilarity = calculateMetricSimilarity(metrics1.complexity, metrics2.complexity);
      const pointsSimilarity = calculateMetricSimilarity(metrics1.points, metrics2.points);
      const areaSimilarity = calculateMetricSimilarity(metrics1.area, metrics2.area);
      const extentSimilarity = calculateMetricSimilarity(metrics1.extent, metrics2.extent);
  
      // Step 6: Pixel-wise similarity
      const diff = new cv.Mat();
      cv.absdiff(binary1, binary2, diff);
      const totalPixels = size.width * size.height;
      const nonZeroPixels = cv.countNonZero(diff);
      const pixelSimilarity = 1 - (nonZeroPixels / totalPixels);
  
      // Step 7: Template matching similarity
      const templateResult = new cv.Mat();
      cv.matchTemplate(binary1, binary2, templateResult, cv.TM_CCOEFF_NORMED);
      
      // Corrected minMaxLoc usage
      const result = cv.minMaxLoc(templateResult, new cv.Mat()); // Added an empty mask
      const templateSimilarity = result.maxVal;
  
      // Step 8: Calculate final similarity score with weighted components
      const weights = {
        pixel: 0.35,      // Pixel-wise comparison
        template: 0.25,   // Template matching
        complexity: 0.15, // Shape complexity
        points: 0.15,     // Number of points
        area: 0.05,       // Area comparison
        extent: 0.05      // Extent (density) comparison
      };

    
  
      const finalSimilarity = (
        pixelSimilarity * weights.pixel +
        templateSimilarity * weights.template +
        complexitySimilarity * weights.complexity +
        pointsSimilarity * weights.points +
        areaSimilarity * weights.area +
        extentSimilarity * weights.extent
      );
  
      // Debug visualization
      if (process.env.NODE_ENV === 'development') {
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
          font-family: monospace;
        `;
  
        const createDebugImage = (title: string, mat: cv.Mat) => {
          const wrapper = document.createElement('div');
          wrapper.style.marginBottom = '10px';
  
          const label = document.createElement('div');
          label.textContent = title;
          label.style.fontWeight = 'bold';
  
          const canvas = document.createElement('canvas');
          cv.imshow(canvas, mat);
          canvas.style.width = '200px';
          canvas.style.height = '200px';
          canvas.style.border = '1px solid #ccc';
  
          wrapper.appendChild(label);
          wrapper.appendChild(canvas);
          return wrapper;
        };
  
        debugContainer.appendChild(createDebugImage('Binary 1', binary1));
        debugContainer.appendChild(createDebugImage('Binary 2', binary2));
        debugContainer.appendChild(createDebugImage('Difference', diff));
  
        const scoresDiv = document.createElement('div');
        scoresDiv.innerHTML = `
          <div style="margin-top: 10px;">
            <div>Pixel Similarity: ${(pixelSimilarity * 100).toFixed(1)}%</div>
            <div>Template Match: ${(templateSimilarity * 100).toFixed(1)}%</div>
            <div>Complexity: ${(complexitySimilarity * 100).toFixed(1)}%</div>
            <div>Points: ${(pointsSimilarity * 100).toFixed(1)}%</div>
            <div>Area: ${(areaSimilarity * 100).toFixed(1)}%</div>
            <div>Extent: ${(extentSimilarity * 100).toFixed(1)}%</div>
            <div style="font-weight: bold; margin-top: 5px;">
              Final Score: ${(finalSimilarity * 100).toFixed(1)}%
            </div>
          </div>
        `;
        debugContainer.appendChild(scoresDiv);
  
        document.body.appendChild(debugContainer);
        setTimeout(() => document.body.removeChild(debugContainer), 5000);
      }
  
      // Cleanup
      resized1.delete();
      resized2.delete();
      binary1.delete();
      binary2.delete();
      contours1.delete();
      contours2.delete();
      hierarchy.delete();
      diff.delete();
      templateResult.delete();
  
      return finalSimilarity;
    } catch (error) {
      console.warn('Error calculating similarity:', error);
      throw error;
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
    
    try {
      const storedSignatures = await extractSignatures(storedSignature, false);
      const drawnSignatures = await extractSignatures(drawnSignature, true);

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

      // Cleanup
      storedSignatures.forEach(mat => mat.delete());
      drawnSignatures.forEach(mat => mat.delete());

      const flatScores = scores.flat();
      setSimilarityScores(flatScores);
      setShowResults(true);

      const maxSimilarity = Math.max(...flatScores);
      console.log('Final similarity score:', maxSimilarity);

      if (maxSimilarity > 0.2) { // Example threshold
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
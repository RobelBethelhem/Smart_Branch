// import React, { useRef } from 'react';
// import { motion } from 'framer-motion';
// import { X } from 'lucide-react';
// import SignaturePad from 'react-signature-canvas';

// interface SignatureModalProps {
//   amount: string;
//   onClose: () => void;
//   onConfirm: (signature: string) => void;
//   type?: 'withdrawal' | 'deposit' | 'transfer' | 'exchange' | 'otherBankTransfer';
//   additionalInfo?: string;
// }

// const SignatureModal: React.FC<SignatureModalProps> = ({ 
//   amount, 
//   onClose, 
//   onConfirm, 
//   type = 'withdrawal',
//   additionalInfo
// }) => {
//   const signaturePadRef = useRef<SignaturePad>(null);

//   const handleClear = () => {
//     signaturePadRef.current?.clear();
//   };

//   const handleConfirm = () => {
//     if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
//       alert('Please provide your signature');
//       return;
//     }
  
//     try {
//       const canvas = signaturePadRef.current.getTrimmedCanvas();
//       const context = canvas.getContext('2d');
      
//       if (context) {
//         // Create a new canvas with white background
//         const newCanvas = document.createElement('canvas');
//         newCanvas.width = canvas.width;
//         newCanvas.height = canvas.height;
//         const newContext = newCanvas.getContext('2d');
        
//         if (newContext) {
//           // Fill with white background
//           newContext.fillStyle = '#FFFFFF';
//           newContext.fillRect(0, 0, newCanvas.width, newCanvas.height);
          
//           // Draw signature in black
//           newContext.drawImage(canvas, 0, 0);
          
//           // Convert to base64 with JPEG format and remove data:image/jpeg;base64, prefix
//           const signatureData = newCanvas.toDataURL('image/jpeg', 1.0).split(',')[1];
//           onConfirm(signatureData);
//         }
//       }
//     } catch (error) {
//       console.error('Error capturing signature:', error);
//       alert('Failed to capture signature. Please try again.');
//     }
//   };

//   const getTitle = () => {
//     switch (type) {
//       case 'withdrawal': return 'Verify Withdrawal';
//       case 'deposit': return 'Verify Deposit';
//       case 'transfer': return 'Verify Transfer';
//       case 'exchange': return 'Verify Exchange';
//       case 'otherBankTransfer': return 'Verify Inter-bank Transfer';
//       default: return 'Verify Transaction';
//     }
//   };

//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
//     >
//       <motion.div
//         initial={{ scale: 0.9, opacity: 0 }}
//         animate={{ scale: 1, opacity: 1 }}
//         exit={{ scale: 0.9, opacity: 0 }}
//         className="bg-white rounded-lg p-6 w-full max-w-lg mx-4"
//       >
//         <div className="flex justify-between items-center mb-4">
//           <h3 className="text-xl font-bold">{getTitle()}</h3>
//           <button
//             onClick={onClose}
//             className="text-gray-500 hover:text-gray-700 transition-colors"
//           >
//             <X className="w-6 h-6" />
//           </button>
//         </div>

//         <div className="bg-gray-50 p-4 rounded-lg mb-4">
//           <p className="text-sm text-gray-600">Amount:</p>
//           <p className="text-lg font-bold">ETB {amount}</p>
//           {additionalInfo && (
//             <p className="text-sm text-gray-600 mt-1">{additionalInfo}</p>
//           )}
//           <p className="text-sm text-gray-600 mt-2">Please sign below to confirm:</p>
//         </div>

//         <div className="border rounded-lg mb-4">
//           <SignaturePad
//             ref={signaturePadRef}
//             canvasProps={{
//               className: 'w-full h-64'
//             }}
//           />
//         </div>

//         <div className="flex space-x-4">
//           <button
//             onClick={handleClear}
//             className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//           >
//             Clear
//           </button>
//           <button
//             onClick={handleConfirm}
//             className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
//           >
//             Confirm Signature
//           </button>
//         </div>
//       </motion.div>
//     </motion.div>
//   );
// };

// export default SignatureModal;

































































import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import SignaturePad from 'react-signature-canvas';

interface SignatureModalProps {
  amount: string;
  onClose: () => void;
  onConfirm: (signature: string) => void;
  type?: 'withdrawal' | 'deposit' | 'transfer' | 'exchange' | 'otherBankTransfer';
  additionalInfo?: string;
}

/**
 * Transport-size policy.
 *
 * The pad captures at device-pixel resolution (a 512x256 CSS canvas is 1024x512
 * or 1536x768 pixels on HiDPI screens) so strokes stay smooth. That resolution
 * must NOT leave the browser: a large signature trimmed from it and encoded as
 * JPEG quality 1.0 is 200-500 KB of base64, which blows past body-size limits
 * (express.json defaults to 100 KB). A small signature drawn in the centre stays
 * under the limit — which is exactly the symptom you saw.
 *
 * Every exported image is therefore fitted into EXPORT_MAX_W x EXPORT_MAX_H with
 * a white background, so the payload is bounded (~10-30 KB) regardless of how
 * large the customer signs. 640x320 is far more than the verifier needs (it
 * normalises to 256x128) and plenty for archival display.
 */
const EXPORT_MAX_W = 640;
const EXPORT_MAX_H = 320;
const EXPORT_PADDING = 12;
const EXPORT_JPEG_QUALITY = 0.85;

/**
 * Downscales a canvas in halving steps (each step uses bilinear filtering, so
 * a single large jump would alias and break thin strokes), then a final resize.
 */
const downscaleCanvas = (source: HTMLCanvasElement, targetW: number, targetH: number): HTMLCanvasElement => {
  let current: HTMLCanvasElement = source;
  let w = source.width;
  let h = source.height;

  while (w / 2 >= targetW && h / 2 >= targetH) {
    w = Math.floor(w / 2);
    h = Math.floor(h / 2);
    const step = document.createElement('canvas');
    step.width = w;
    step.height = h;
    const ctx = step.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(current, 0, 0, w, h);
    current = step;
  }

  if (w === targetW && h === targetH) return current;
  const final = document.createElement('canvas');
  final.width = targetW;
  final.height = targetH;
  const ctx = final.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(current, 0, 0, targetW, targetH);
  return final;
};

/**
 * Trimmed signature canvas -> bounded, white-background JPEG base64 (no data: prefix).
 */
const exportSignature = (trimmed: HTMLCanvasElement): string => {
  const innerW = EXPORT_MAX_W - 2 * EXPORT_PADDING;
  const innerH = EXPORT_MAX_H - 2 * EXPORT_PADDING;
  const scale = Math.min(1, innerW / trimmed.width, innerH / trimmed.height);
  const w = Math.max(1, Math.round(trimmed.width * scale));
  const h = Math.max(1, Math.round(trimmed.height * scale));

  const scaled = scale < 1 ? downscaleCanvas(trimmed, w, h) : trimmed;

  const out = document.createElement('canvas');
  out.width = w + 2 * EXPORT_PADDING;
  out.height = h + 2 * EXPORT_PADDING;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(scaled, EXPORT_PADDING, EXPORT_PADDING, w, h);

  const base64 = out.toDataURL('image/jpeg', EXPORT_JPEG_QUALITY).split(',')[1];

  if (process.env.NODE_ENV === 'development') {
    const kb = ((base64.length * 3) / 4 / 1024).toFixed(1);
    console.log(`[signature] captured ${trimmed.width}x${trimmed.height} -> exported ${out.width}x${out.height}, ~${kb} KB`);
  }
  return base64;
};

const SignatureModal: React.FC<SignatureModalProps> = ({
  amount,
  onClose,
  onConfirm,
  type = 'withdrawal',
  additionalInfo,
}) => {
  const signaturePadRef = useRef<SignaturePad>(null);
  const [hasInk, setHasInk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClear = () => {
    signaturePadRef.current?.clear();
    setHasInk(false);
    setError(null);
  };

  const handleConfirm = () => {
    const pad = signaturePadRef.current;
    if (!pad || pad.isEmpty()) {
      setError('Please sign in the box before confirming.');
      return;
    }
    try {
      onConfirm(exportSignature(pad.getTrimmedCanvas()));
    } catch (err) {
      console.error('Error capturing signature:', err);
      setError('Could not capture the signature. Please clear and try again.');
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'withdrawal':
        return 'Verify Withdrawal';
      case 'deposit':
        return 'Verify Deposit';
      case 'transfer':
        return 'Verify Transfer';
      case 'exchange':
        return 'Verify Exchange';
      case 'otherBankTransfer':
        return 'Verify Inter-bank Transfer';
      default:
        return 'Verify Transaction';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg p-6 w-full max-w-lg mx-4"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{getTitle()}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-gray-600">Amount:</p>
          <p className="text-lg font-bold">ETB {amount}</p>
          {additionalInfo && <p className="text-sm text-gray-600 mt-1">{additionalInfo}</p>}
          <p className="text-sm text-gray-600 mt-2">Please sign below to confirm:</p>
        </div>

        <div className="border rounded-lg mb-2 bg-white touch-none">
          <SignaturePad
            ref={signaturePadRef}
            penColor="black"
            minWidth={1.2}
            maxWidth={3}
            onBegin={() => {
              setHasInk(true);
              setError(null);
            }}
            canvasProps={{ className: 'w-full h-64' }}
          />
        </div>
        <p className="text-xs text-gray-500 mb-3">Sign as you would on paper. Use as much of the box as you like.</p>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div className="flex space-x-4">
          <button
            onClick={handleClear}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleConfirm}
            disabled={!hasInk}
            className={`flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ${
              !hasInk ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Confirm Signature
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SignatureModal;

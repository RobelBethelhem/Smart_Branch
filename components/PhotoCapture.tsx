// import * as faceapi from 'face-api.js';
// import React, { useState, useRef, useEffect } from 'react';

// interface PhotoCaptureProps {
//   onNext: () => void;
//   onPrev: () => void;
//   formData: any;
//   setFormData: React.Dispatch<React.SetStateAction<any>>;
// }

// const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onNext, onPrev, formData, setFormData }) => {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const [isCapturing, setIsCapturing] = useState(false);
//   const [capturedImage, setCapturedImage] = useState<string | null>(formData.photo || null);

//   useEffect(() => {
//     const loadModels = async () => {
//       await faceapi.loadSsdMobilenetv1Model('/models');
//       await faceapi.loadFaceLandmarkModel('/models');
//     };
//     loadModels();
//   }, []);

//   useEffect(() => {
//     if (isCapturing) {
//       startVideo();
//     } else {
//       stopVideo();
//     }
//   }, [isCapturing]);

//   const startVideo = async () => {
//     const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//     if (videoRef.current) {
//       videoRef.current.srcObject = stream;
//     }
//   };

//   const stopVideo = () => {
//     const stream = videoRef.current?.srcObject as MediaStream;
//     const tracks = stream?.getTracks();
//     tracks?.forEach(track => track.stop());
//   };

//   const capturePhoto = async () => {
//     if (videoRef.current && canvasRef.current) {
//       const video = videoRef.current;
//       const canvas = canvasRef.current;
//       canvas.width = video.videoWidth;
//       canvas.height = video.videoHeight;
//       canvas.getContext('2d')?.drawImage(video, 0, 0);
      
//       // Capture the image data URL without drawing landmarks
//       const imageDataUrl = canvas.toDataURL('image/jpeg');
//       setCapturedImage(imageDataUrl);
//       setFormData({ ...formData, photo: imageDataUrl });
//       setIsCapturing(false);
//     }
//   };

//   const retakePhoto = () => {
//     setCapturedImage(null);
//     setIsCapturing(true);
//   };

//   const handleNext = () => {
//     setIsCapturing(false); // Stop the camera
//     onNext();
//   };

//   const handlePrev = () => {
//     setIsCapturing(false); // Stop the camera
//     onPrev();
//   };

//   return (
//     <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
//       <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Capture Your Photo</h2>
//       <div className="space-y-4">
//         {!isCapturing && !capturedImage && (
//           <button
//             onClick={() => setIsCapturing(true)}
//             className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-300"
//           >
//             Start Camera
//           </button>
//         )}
//         {isCapturing && (
//           <div className="relative">
//             <video ref={videoRef} autoPlay muted className="w-full rounded-lg" />
//             <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
//             <button
//               onClick={capturePhoto}
//               className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-300"
//             >
//               Capture
//             </button>
//           </div>
//         )}
//         {capturedImage && (
//           <div className="space-y-4">
//             <img src={capturedImage} alt="Captured" className="w-full rounded-lg" />
//             <div className="flex justify-between">
//               <button
//                 onClick={handlePrev}
//                 className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors duration-300"
//               >
//                 Prev
//               </button>
//               <button
//                 onClick={retakePhoto}
//                 className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors duration-300"
//               >
//                 Retake
//               </button>
//               <button
//                 onClick={handleNext}
//                 className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-300"
//               >
//                 Next
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default PhotoCapture;

























import * as faceapi from 'face-api.js';
import React, { useState, useRef, useEffect } from 'react';

interface PhotoCaptureProps {
  onNext: () => void;
  onPrev: () => void;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onNext, onPrev, formData, setFormData }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(formData.photo || null);

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.loadSsdMobilenetv1Model('/models');
      await faceapi.loadFaceLandmarkModel('/models');
    };
    loadModels();
  }, []);

  // Cleanup: stop video when component unmounts
  useEffect(() => {
    return () => {
      stopVideo();
    };
  }, []);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.log('Error accessing camera:', error);
    }
  };

  const stopVideo = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  // Directly triggered by a user click, so the permission prompt appears
  const handleStartCamera = async () => {
    await startVideo();
    setIsCapturing(true);
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);

      const imageDataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(imageDataUrl);
      setFormData({ ...formData, photo: imageDataUrl });
      setIsCapturing(false);
      stopVideo();
    }
  };

  const retakePhoto = async () => {
    setCapturedImage(null);
    // Restart capturing by directly calling startVideo from a user gesture
    await startVideo();
    setIsCapturing(true);
  };

  const handleNext = () => {
    setIsCapturing(false);
    stopVideo();
    onNext();
  };

  const handlePrev = () => {
    setIsCapturing(false);
    stopVideo();
    onPrev();
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Capture Your Photo</h2>
      <div className="space-y-4">
        {!isCapturing && !capturedImage && (
          <button
            onClick={handleStartCamera}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-300"
          >
            Start Camera
          </button>
        )}
        {isCapturing && (
          <div className="relative">
            <video ref={videoRef} autoPlay muted className="w-full rounded-lg" />
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
            <button
              onClick={capturePhoto}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-300"
            >
              Capture
            </button>
          </div>
        )}
        {capturedImage && (
          <div className="space-y-4">
            <img src={capturedImage} alt="Captured" className="w-full rounded-lg" />
            <div className="flex justify-between">
              <button
                onClick={handlePrev}
                className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors duration-300"
              >
                Prev
              </button>
              <button
                onClick={retakePhoto}
                className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors duration-300"
              >
                Retake
              </button>
              <button
                onClick={handleNext}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoCapture;

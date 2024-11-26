import React, { useRef, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import Dashboard from './CustomerOnboardingDashbord';

const dataURLToBlob = (dataURL: string): Blob => {
  const byteString = atob(dataURL.split(',')[1]);
  const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];

  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ab], { type: mimeString });
};

interface FaceVerificationProps {
  onNext: () => void;
  onPrev: () => void;
  formData: any;
}

const FaceVerification: React.FC<FaceVerificationProps> = ({ onNext, onPrev, formData }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<string | null>(null);
  const [livenessPrompt, setLivenessPrompt] = useState<string | null>(null);
  const [livenessVerified, setLivenessVerified] = useState(false);
  const [isVideoStarted, setIsVideoStarted] = useState(false);
  const [navigateToDashboard, setNavigateToDashboard] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        await faceapi.nets.faceExpressionNet.loadFromUri('/models');
        setModelsLoaded(true);
      } catch (error) {
        console.error('Error loading models:', error);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (modelsLoaded) {
      startVideo();
    }
    return () => stopVideo();
  }, [modelsLoaded]);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsVideoStarted(true);
        };
      }
    } catch (error) {
      console.error('Error starting video:', error);
    }
  };

  const stopVideo = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    const tracks = stream?.getTracks();
    tracks?.forEach(track => track.stop());
    setIsVideoStarted(false);
  };

  const drawFaceLandmarks = async () => {
    if (videoRef.current && canvasRef.current && isVideoStarted) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      
      if (displaySize.width === 0 || displaySize.height === 0) {
        console.log('Video dimensions not ready yet');
        return;
      }

      faceapi.matchDimensions(canvas, displaySize);

      const detections = await faceapi.detectAllFaces(video)
        .withFaceLandmarks()
        .withFaceExpressions();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);

      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isVideoStarted) {
      interval = setInterval(drawFaceLandmarks, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVideoStarted]);

  const generateLivenessPrompt = () => {
    const prompts = [
      'Smile', 'Blink twice', 'Turn your head slightly to the right', 
      'Raise your eyebrows', 'Look up', 'Look down', 'Open your mouth'
    ];
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    setLivenessPrompt(randomPrompt);
    return randomPrompt;
  };

  const checkLiveness = async (prompt: string) => {
    if (!videoRef.current) return false;

    const detections = await faceapi.detectSingleFace(videoRef.current)
      .withFaceLandmarks()
      .withFaceExpressions();
    
    if (!detections) return false;

    switch (prompt) {
      case 'Smile':
        return detections.expressions.happy > 0.7;
      case 'Blink twice':
        return detections.landmarks.getLeftEye()[1].y - detections.landmarks.getLeftEye()[5].y < 1;
      case 'Turn your head slightly to the right':
        const leftEye = detections.landmarks.getLeftEye();
        const rightEye = detections.landmarks.getRightEye();
        return (rightEye[0].x - leftEye[3].x) < (leftEye[3].x - leftEye[0].x);
      case 'Raise your eyebrows':
        return detections.expressions.surprised > 0.3;
      case 'Look up':
        return detections.landmarks.getNose()[3].y < detections.landmarks.getNose()[0].y;
      case 'Look down':
        return detections.landmarks.getNose()[3].y > detections.landmarks.getNose()[0].y;
      case 'Open your mouth':
        const topLip = detections.landmarks.getMouth()[14];
        const bottomLip = detections.landmarks.getMouth()[18];
        return (bottomLip.y - topLip.y) > 10;
      default:
        return false;
    }
  };

  const verifyFace = async () => {
    if (!videoRef.current || !canvasRef.current || !formData.photo) {
      setVerificationResult('Missing video, canvas, or uploaded photo');
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    let livenessAttempts = 0;
    const maxLivenessAttempts = 3;
    
    while (livenessAttempts < maxLivenessAttempts) {
      const livenessPrompt = generateLivenessPrompt();
      await new Promise(resolve => setTimeout(resolve, 3000));
      const isLive = await checkLiveness(livenessPrompt);
      if (isLive) {
        setLivenessVerified(true);
        break;
      }
      livenessAttempts++;
    }

    if (!livenessVerified) {
      setVerificationResult('Liveness check failed. Please try again.');
      setIsVerifying(false);
      return;
    }

    try {
      const imageBlob = dataURLToBlob(formData.photo);
      const uploadedImage = await faceapi.bufferToImage(imageBlob);
      const detections = await faceapi.detectSingleFace(uploadedImage).withFaceLandmarks().withFaceDescriptor();

      if (!detections) {
        setVerificationResult('No face detected in the uploaded image');
        setIsVerifying(false);
        return;
      }

      const uploadedFaceDescriptor = detections.descriptor;
      const video = videoRef.current;

      if (!video) {
        setVerificationResult('Video element not found');
        setIsVerifying(false);
        return;
      }

      const numFrames = 10;
      let totalDistance = 0;
      let validFrames = 0;

      for (let i = 0; i < numFrames; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const liveDetections = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();
        
        if (liveDetections) {
          const distance = faceapi.euclideanDistance(uploadedFaceDescriptor, liveDetections.descriptor);
          totalDistance += distance;
          validFrames++;
        }
      }

      if (validFrames === 0) {
        setVerificationResult('Unable to detect face. Please try again in better lighting.');
        setIsVerifying(false);
        return;
      }

      const averageDistance = totalDistance / validFrames;
      const threshold = 0.4;

      if (averageDistance < threshold) {
        setVerificationResult('Face verified successfully');
        stopVideo();
        setNavigateToDashboard(true);
      } else {
        setVerificationResult('Face verification failed. Please try again.');
      }

    } catch (error) {
      console.error('Error during face verification:', error);
      setVerificationResult('Error during face verification');
    }

    setIsVerifying(false);
  };

  const handlePrev = () => {
    stopVideo();
    onPrev();
  };

  const handleNext = () => {
    stopVideo();
    onNext();
  };

  if (navigateToDashboard) {
    return <Dashboard />;
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Face Verification</h2>
      <div className="space-y-4">
        <div className="relative">
          <video ref={videoRef} autoPlay muted className="w-full rounded-lg" />
          <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
        </div>
        {livenessPrompt && (
          <div className="p-4 bg-blue-100 text-blue-700 rounded-lg">
            Liveness Check: {livenessPrompt}
          </div>
        )}
        {verificationResult && (
          <div className={`p-4 rounded-lg ${verificationResult.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {verificationResult}
          </div>
        )}
        <div className="flex justify-between">
          <button
            onClick={handlePrev}
            className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors duration-300"
          >
            Prev
          </button>
          <button
            onClick={verifyFace}
            disabled={isVerifying || !isVideoStarted}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-300"
          >
            {isVerifying ? 'Verifying...' : 'Verify Face'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FaceVerification;
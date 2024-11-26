import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import * as faceapi from 'face-api.js';
import { X, Camera, AlertCircle } from 'lucide-react';

interface FaceVerificationModalProps {
  onClose: () => void;
  onSuccess: () => void;
  profileImage: string;
}

const FaceVerificationModal: React.FC<FaceVerificationModalProps> = ({
  onClose,
  onSuccess,
  profileImage,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadModelsAndStartVideo();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const loadModelsAndStartVideo = async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      ]);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsLoading(false);
    } catch (err) {
      setError('Failed to access camera. Please ensure camera permissions are granted.');
      setIsLoading(false);
    }
  };

  const verifyFace = async () => {
    if (!videoRef.current) return;
    
    try {
      setIsVerifying(true);
      setError('');

      // Load the profile image
      const profileFaceImage = await faceapi.fetchImage(profileImage);
      const profileDetection = await faceapi
        .detectSingleFace(profileFaceImage, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!profileDetection) {
        throw new Error('No face detected in profile image');
      }

      // Capture current frame from video
      const videoDetection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!videoDetection) {
        throw new Error('No face detected in video');
      }

      // Compare the descriptors
      const distance = faceapi.euclideanDistance(
        profileDetection.descriptor,
        videoDetection.descriptor
      );

      if (!(distance < 0.4)) { 
        onSuccess();
      } else {
        setError('Face does not match the profile image');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg p-6 max-w-md w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Face Verification</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        <button
          onClick={verifyFace}
          disabled={isLoading || isVerifying}
          className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center disabled:bg-gray-400"
        >
          {isVerifying ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <>
              <Camera className="w-5 h-5 mr-2" />
              Verify Face
            </>
          )}
        </button>
      </motion.div>
    </motion.div>
  );
};

export default FaceVerificationModal;
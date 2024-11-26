import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';

interface PhotoUploadProps {
  onNext: () => void;
  onPrev: () => void;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ onNext, onPrev, formData, setFormData }) => {
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const loadModels = async () => {
      setIsLoading(true);
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models')
      ]);
      setIsLoading(false);
    };
    loadModels();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const photoPreviewUrl = URL.createObjectURL(file);
      setFormData({ 
        ...formData, 
        photo: file, 
        photoPreviewUrl 
      });
      setIsFaceDetected(false);
    }
  };

  const detectFace = async () => {
    if (imgRef.current) {
      const detections = await faceapi.detectAllFaces(imgRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();
      setIsFaceDetected(detections.length > 0);
    }
  };

  useEffect(() => {
    if (formData.photoPreviewUrl) {
      detectFace();
    }
  }, [formData.photoPreviewUrl]);

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Upload Your Photo</h2>
      {isLoading ? (
        <p className="text-center">Loading face detection models...</p>
      ) : (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <label htmlFor="photoUpload" className="block cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-700">Upload Photo</span>
              <input
                id="photoUpload"
                name="photo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <span className="mt-2 block text-sm text-gray-500">
                {formData.photo ? formData.photo.name : 'Drag and drop or click to upload'}
              </span>
            </label>
          </div>
          {formData.photoPreviewUrl && (
            <div className="mt-4">
              <img 
                ref={imgRef}
                src={formData.photoPreviewUrl} 
                alt="Preview" 
                className="max-w-full h-auto rounded-lg" 
                onLoad={detectFace}
              />
              {isFaceDetected ? (
                <p className="text-green-600 mt-2">Face detected</p>
              ) : (
                <p className="text-red-600 mt-2">No face detected. Please upload a photo with a clear face.</p>
              )}
            </div>
          )}
          <div className="flex justify-between">
            <button
              onClick={onPrev}
              className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors duration-300"
            >
              Prev
            </button>
            {isFaceDetected && (
              <button
                onClick={onNext}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Next
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
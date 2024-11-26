import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as faceapi from 'face-api.js';
import FaceVerification from './FaceVerification'; 
import PhotoUpload from './PhotoUpload';
import LandingPage from './CustomerOnboardingLanding';
import RegistrationForm from './RegistrationForm';
import DocumentUpload from './DocumentUpload';
import IdentityVerification from './IdentityVerification';
import AccountSetup from './AccountSetup';  
import ProgressTracker from './ProgressTracker';
import Dashboard from './CustomerOnboardingDashbord';
import PullingMan from './PullingMan';
import PhotoCapture from './PhotoCapture'

// Main App Component
const CustomerOnboarding: React.FC = () => {
    const [step, setStep] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [formData, setFormData] = useState<any>({});
  
    const nextStep = () => {
      setIsAnimating(true);
      setTimeout(() => {
        setStep(step + 1);
        setIsAnimating(false);
      }, 1000);
    };
  
    const prevStep = () => {
      setIsAnimating(true);
      setTimeout(() => {
        setStep(step - 1);
        setIsAnimating(false);
      }, 1000);
    };
  
    const renderStep = () => {
      switch (step) {
        case 0:
          return <LandingPage onStart={nextStep} />;
        case 1:
          return <RegistrationForm onNext={nextStep} onPrev={prevStep} formData={formData} setFormData={setFormData} />;
        case 2:
          return <PhotoCapture onNext={nextStep} onPrev={prevStep} formData={formData} setFormData={setFormData} />;
        case 3:
          return <DocumentUpload onNext={nextStep} onPrev={prevStep} formData={formData} setFormData={setFormData} />;
        case 4:
          return <IdentityVerification onNext={nextStep} onPrev={prevStep} formData={formData} setFormData={setFormData} />;
        case 5:
          return <AccountSetup onNext={nextStep} onPrev={prevStep} formData={formData} setFormData={setFormData} />;
        case 6:
          return <FaceVerification onNext={nextStep} onPrev={prevStep} formData={formData} />;
        case 7:
          return <Dashboard />;
        default:
          return null;
      }
    };
  
    const contentVariants = {
      initial: { x: '100%', y: 0 },
      animate: {
        x: 0,
        y: [0, -20, 0],
        transition: {
          x: { type: 'spring', stiffness: 100, damping: 20 },
          y: { duration: 0.5, repeat: 1 },
        },
      },
      exit: { x: '-100%', transition: { duration: 0.3 } },
    };
  
    return (
      <div className="min-h-screen bg-gray-100 overflow-hidden relative">
        <PullingMan isActive={isAnimating} />
        {step > 0 && step < 7 && (
          <div className="max-w-4xl mx-auto pt-8">
            <ProgressTracker activeStep={step - 1} />
          </div>
        )}
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={step}
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
        {step === 7 && (
          <div className="max-w-md mx-auto mt-6 transform transition-all duration-500 ease-in-out">
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4" role="alert">
              <p className="font-bold">Success</p>
              <p>Your account has been successfully created!</p>
            </div>
          </div>
        )}
      </div>
    );
  };
export default CustomerOnboarding;
// 6. Progress Tracker
interface ProgressTrackerProps {
    activeStep: number;
  }

  //['Basic Information', 'PhotoUpload', 'Document Upload', 'Verification', 'Account Setup', 'FaceVerification']


    const ProgressTracker: React.FC<ProgressTrackerProps> = ({ activeStep }) => (
    <div className="max-w-2xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {['Basic Information', 'Capture Photo', 'Personal Details', 'Verification', 'Account Setup', 'FaceVerification'].map((step, index) => (
          <div key={step} className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${index <= activeStep ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              {index + 1}
            </div>
            <div className="mt-2 text-sm text-gray-600">{step}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 h-1 bg-gray-200">
        <div
          className="h-full bg-blue-600 transition-all duration-500 ease-in-out"
          style={{ width: `${(activeStep / 5) * 100}%` }}
        ></div>
      </div>
    </div>
  );

  export default ProgressTracker
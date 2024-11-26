// 1. Landing Page
interface LandingPageProps {
    onStart: () => void;
  }
  
  const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-4 animate-fade-in-down">
          Welcome to Zemen Bank Digital Account Openning
        </h1>
        <p className="text-xl mb-8 animate-fade-in-up">
          Start your journey with us. Open an account in minutes!
        </p>
        <button
          onClick={onStart}
          className="bg-white text-purple-600 px-6 py-3 rounded-full font-semibold text-lg hover:bg-purple-100 transition-colors duration-300 animate-fade-in"
        >
          Get Started
        </button>
      </div>
    </div>
  );

  export default LandingPage;
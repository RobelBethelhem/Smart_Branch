import { motion, AnimatePresence } from 'framer-motion';
// Pulling Man Animation
interface PullingManProps {
    isActive: boolean;
  }
  
  const PullingMan: React.FC<PullingManProps> = ({ isActive }) => (
    <svg width="100" height="100" viewBox="0 0 100 100" className="absolute left-0 top-1/2 transform -translate-y-1/2">
      <motion.path
        d="M20,50 Q25,45 30,50 Q35,55 40,50"
        stroke="#000"
        strokeWidth="2"
        fill="none"
        initial={false}
        animate={isActive ? { d: "M20,50 Q40,45 60,50 Q80,55 100,50" } : { d: "M20,50 Q25,45 30,50 Q35,55 40,50" }}
      />
      <motion.circle cx="20" cy="50" r="5" fill="#000" />
      <motion.path
        d="M10,30 Q15,25 20,30 L20,50 L10,50 Z"
        fill="#000"
        initial={false}
        animate={isActive ? { rotate: 15, originX: 15, originY: 40 } : { rotate: 0 }}
      />
    </svg>
  );

  export default PullingMan;
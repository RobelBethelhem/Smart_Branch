import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle } from 'lucide-react';

interface CommentComponentProps {
  onBack: () => void;
}

const emojiData = [
  { 
    value: 1, 
    emoji: '😢', 
    label: 'Sad', 
    comment: 'Not satisfied',
    color: '#FF6B6B'
  },
  { 
    value: 2, 
    emoji: '😐', 
    label: 'Neutral', 
    comment: 'It was okay',
    color: '#FFD93D'
  },
  { 
    value: 3, 
    emoji: '😊', 
    label: 'Happy', 
    comment: 'Pretty good!',
    color: '#6BCB77'
  },
  { 
    value: 4, 
    emoji: '🤩', 
    label: 'Excited', 
    comment: 'Really enjoyed it!',
    color: '#4D96FF'
  },
  { 
    value: 5, 
    emoji: '🎉', 
    label: 'Amazing', 
    comment: 'Absolutely fantastic!',
    color: '#FF6B6B'
  },
];

const AnimatedEmoji: React.FC<{
  isSelected: boolean;
  emoji: string;
  label: string;
  color: string;
  onClick: () => void;
}> = ({ isSelected, emoji, label, color, onClick }) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="relative group"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <div
        className={`
          relative w-24 h-24 rounded-full transition-all duration-300
          ${isSelected ? 'border-4' : ''}
        `}
        style={{
          background: isSelected ? `${color}20` : 'transparent',
          borderColor: isSelected ? color : 'transparent'
        }}
      >
        <iframe 
          src={emoji}
          width="100%"
          height="100%"
          className="giphy-embed rounded-full"
          allowFullScreen
          style={{ pointerEvents: 'none' }}
        />
      </div>
      <motion.span
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isSelected ? 1 : 0, y: isSelected ? 0 : 10 }}
        className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium"
        style={{ color }}
      >
        {label}
      </motion.span>
    </motion.button>
  );
};

// Add this CSS to your global styles or as a styled component
const styles = `
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }

  @keyframes shake {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-10deg); }
    75% { transform: rotate(10deg); }
  }

  .emoji-bounce {
    animation: bounce 1s ease infinite;
  }

  .emoji-idle:hover {
    animation: pulse 1s ease infinite;
  }

  .emoji-selected {
    animation: shake 0.5s ease;
  }
`;

const CommentComponent: React.FC<CommentComponentProps> = ({ onBack }) => {
  const [comment, setComment] = useState<string>('');
  const [rating, setRating] = useState<number | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
    setSuccess(false); // Reset success message on change
  };

  const handleRatingClick = (value: number, commentText: string) => {
    setRating(value);
    setComment(commentText); // Update text area with associated comment
    setSuccess(false); // Reset success message on rating change
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim() && rating) {
      console.log('Comment submitted:', { comment, rating });
      setSuccess(true);
      setComment(''); // Clear the comment after submission
      setRating(null); // Reset rating after submission
    }
  };

  const emojiData = [ 
    { 
      value: 1, 
      emoji: 'https://giphy.com/embed/YhMV2cdUWTrPVpZOFN',
      label: 'Sad', 
      comment: 'Not satisfied',
      color: '#FF6B6B'
    },
    { 
      value: 2, 
      emoji: 'https://giphy.com/embed/kfS15Gnvf9UhkwafJn',
      label: 'Neutral', 
      comment: 'It was okay',
      color: '#FFD93D'
    },
    { 
      value: 3, 
      emoji: 'https://giphy.com/embed/QWvra259h4LCvdJnxP',
      label: 'Happy', 
      comment: 'Pretty good!',
      color: '#6BCB77'
    },
    { 
      value: 4, 
      emoji: 'https://giphy.com/embed/ehC4SqtNcEeLAiu66w',
      label: 'Excited', 
      comment: 'Really enjoyed it!',
      color: '#4D96FF'
    },
    { 
      value: 5, 
      emoji: 'https://giphy.com/embed/LC0K42KSTHPtLrwzWN',
      label: 'Amazing', 
      comment: 'Absolutely fantastic!',
      color: '#FF6B6B'
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto"
    >
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-4">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h2 className="text-2xl font-bold">How was your experience?</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex justify-center gap-4 mb-12 py-4">
          {emojiData.map(({ value, emoji, label, comment: emojiComment, color }) => (
            <AnimatedEmoji
              key={value}
              isSelected={rating === value}
              emoji={emoji}
              label={label}
              color={color}
              onClick={() => handleRatingClick(value, emojiComment)}
            />
          ))}
        </div>

        <textarea
          placeholder="Write your comment here..."
          value={comment}
          onChange={handleCommentChange}
          className="border border-gray-300 rounded-lg p-4 w-full h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        {success && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-green-500 mt-4 flex items-center"
          >
            <CheckCircle className="mr-2" /> Thank you for your feedback!
          </motion.p>
        )}

        <div className="flex justify-between mt-6">
          <button
            type="submit"
            disabled={!rating || !comment.trim()}
            className={`px-6 py-2 rounded-lg transition-colors ${
              rating && comment.trim()
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            Submit Feedback
          </button>
          <button
            type="button"
            onClick={onBack}
            className="border border-gray-300 px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Back
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default CommentComponent;
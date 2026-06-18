'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiExternalLink, FiLock, FiRefreshCw } from 'react-icons/fi';

interface FeedbackMiniAppProps {
  onBack: () => void;
}

// Must point at the path whose nginx block adds the
// `Content-Security-Policy: frame-ancestors ...` header (the /feedback/ proxy
// location). The root path still sends X-Frame-Options and would be blocked.
const FEEDBACK_URL = 'https://feedback.zemenbank.com/feedback/';
const FEEDBACK_HOST = 'feedback.zemenbank.com';

/**
 * Embedded "mini app" that opens the feedback portal inside the banking app.
 * The surrounding chrome (slide-in nav bar, branded loading, secure-host
 * indicator) is designed to feel like a native in-app screen. Embedding works
 * because the feedback server proxies /feedback/ and allows this app's origin
 * via CSP frame-ancestors. The "open in new tab" action remains as a fallback.
 */
const FeedbackMiniApp: React.FC<FeedbackMiniAppProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [slow, setSlow] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // If the frame is still loading after a while (e.g. blocked by a redirect to
  // a non-allowed path), reveal an "open in new tab" escape hatch.
  useEffect(() => {
    setSlow(false);
    const t = setTimeout(() => setSlow(true), 12000);
    return () => clearTimeout(t);
  }, [reloadKey]);

  const reload = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: 'spring', stiffness: 280, damping: 32 }}
      className="fixed inset-0 z-50 flex flex-col bg-white"
    >
      {/* Native-style navigation bar */}
      <div className="relative z-10 bg-gradient-to-r from-[#E60000] to-[#FF0000] text-white shadow-lg">
        <div className="flex items-center justify-between px-2 py-3 sm:px-4">
          {/* Back */}
          <button
            onClick={onBack}
            className="flex items-center gap-1 rounded-lg py-1.5 pl-1 pr-3 font-medium text-white/95 transition-colors hover:bg-white/15 active:bg-white/25"
          >
            <FiChevronLeft className="h-6 w-6" />
            <span className="text-base">Back</span>
          </button>

          {/* Title + secure host */}
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-center">
            <h2 className="text-base font-semibold leading-tight sm:text-lg">Give Feedback</h2>
            <div className="flex items-center justify-center gap-1 text-[10px] leading-tight text-white/80">
              <FiLock className="h-2.5 w-2.5" />
              <span>{FEEDBACK_HOST}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={reload}
              aria-label="Reload"
              title="Reload"
              className="rounded-lg p-2 text-white/90 transition-colors hover:bg-white/15 active:bg-white/25"
            >
              <FiRefreshCw className="h-[18px] w-[18px]" />
            </button>
            <a
              href={FEEDBACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open in new tab"
              title="Open in new tab"
              className="rounded-lg p-2 text-white/90 transition-colors hover:bg-white/15 active:bg-white/25"
            >
              <FiExternalLink className="h-[18px] w-[18px]" />
            </a>
          </div>
        </div>
      </div>

      {/* Embedded feedback portal */}
      <div className="relative flex-1 bg-gray-50">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-white">
            <div className="relative h-14 w-14">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#E60000]" />
            </div>
            <p className="text-sm font-medium text-gray-500">Loading feedback…</p>
            {slow && (
              <a
                href={FEEDBACK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[#E60000] underline underline-offset-2 hover:text-[#FF0000]"
              >
                Taking too long? Open in a new tab
              </a>
            )}
          </div>
        )}
        <iframe
          key={reloadKey}
          src={FEEDBACK_URL}
          title="Give Feedback"
          className="absolute inset-0 h-full w-full border-0"
          onLoad={() => setLoading(false)}
          allow="camera; microphone; clipboard-write; geolocation"
        />
      </div>
    </motion.div>
  );
};

export default FeedbackMiniApp;

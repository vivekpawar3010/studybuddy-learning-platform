import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HintTooltipProps {
  /** The content of the hint bubble */
  hint: string;
  /** Whether to show hints (only for new users within first 5 days) */
  show: boolean;
  /** Position of the tooltip relative to trigger */
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}

/**
 * Wraps any element and shows a contextual hint tooltip for new users.
 * Disappears after the user clicks/dismisses it or when show=false.
 */
const HintTooltip: React.FC<HintTooltipProps> = ({
  hint,
  show,
  position = 'top',
  children,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!show || dismissed) {
    return <>{children}</>;
  }

  const positionClasses: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses: Record<string, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-indigo-600',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-indigo-600',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-indigo-600',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-indigo-600',
  };

  return (
    <div className="relative inline-flex">
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15 }}
            className={`absolute ${positionClasses[position]} z-50 pointer-events-auto`}
          >
            <div className="relative bg-indigo-600 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap flex items-center gap-2 max-w-[200px] whitespace-normal leading-tight">
              <span className="shrink-0">✨</span>
              <span>{hint}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
                className="ml-1 shrink-0 opacity-70 hover:opacity-100 transition-opacity text-white font-bold"
              >
                ×
              </button>
            </div>
            {/* Arrow */}
            <div
              className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HintTooltip;

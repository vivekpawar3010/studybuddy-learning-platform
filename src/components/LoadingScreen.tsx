import React, { memo } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface LoadingScreenProps {
  /** Text shown below the animation */
  message?: string;
  /** Smaller hint text below message */
  subtitle?: string;
  /**
   * 'fullscreen' – covers the entire viewport (initial auth check, page load)
   * 'inline'     – fits inside a parent container
   */
  variant?: 'fullscreen' | 'inline';
}

// ─────────────────────────────────────────────────────────────
// Full Loading Screen  (fullscreen + inline)
// ─────────────────────────────────────────────────────────────
const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading StudyBuddy...',
  subtitle,
  variant = 'fullscreen',
}) => {
  const isFullscreen = variant === 'fullscreen';

  return (
    <div
      className={`
        flex flex-col items-center justify-center
        ${isFullscreen
          ? 'fixed inset-0 z-[9999] bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900'
          : 'w-full h-full min-h-[280px]'
        }
      `}
    >
      {/* Ambient glow — fullscreen only */}
      {isFullscreen && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                          w-[520px] h-[520px] rounded-full bg-indigo-600/25 blur-[130px]" />
          <div className="absolute top-1/4 left-1/3 w-[280px] h-[280px]
                          rounded-full bg-violet-500/15 blur-[90px]" />
        </div>
      )}

      {/* Logo strip — fullscreen only */}
      {isFullscreen && (
        <div className="relative z-10 flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center
                          shadow-lg shadow-indigo-500/40">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0
                   00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0
                   003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0
                   003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0
                   00-3.09 3.09z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">StudyBuddy</span>
        </div>
      )}

      {/* Lottie animation */}
      <div className="relative z-10 w-44 h-44">
        <DotLottieReact
          src="/animations/loading.lottie"
          loop
          autoplay
        />
      </div>

      {/* Text block */}
      <div className="relative z-10 text-center mt-1 space-y-1.5">
        <p className={`font-semibold tracking-wide
          ${isFullscreen ? 'text-white text-base' : 'text-gray-700 text-sm'}`}>
          {message}
        </p>
        {subtitle && (
          <p className={`text-xs ${isFullscreen ? 'text-indigo-300/70' : 'text-gray-400'}`}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Bouncing dots */}
      <div className="relative z-10 flex items-center gap-1.5 mt-4">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className={`w-1.5 h-1.5 rounded-full
              ${isFullscreen ? 'bg-indigo-400' : 'bg-indigo-500'}`}
            style={{ animation: `sbDotBounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>

      <style>{`
        @keyframes sbDotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1.2); opacity: 1;   }
        }
      `}</style>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Mini inline spinner (for buttons / cards)
// ─────────────────────────────────────────────────────────────
export const MiniSpinner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin ${className}`} />
);

// ─────────────────────────────────────────────────────────────
// Page-level loader wrapper
// ─────────────────────────────────────────────────────────────
export const PageLoader: React.FC<{ message?: string }> = ({ message }) => (
  <LoadingScreen variant="inline" message={message ?? 'Loading...'} />
);

export default memo(LoadingScreen);

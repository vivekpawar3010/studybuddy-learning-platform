import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFound404: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900
                    flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[140px]" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px]
                        rounded-full bg-violet-500/10 blur-[90px]" />
      </div>

      {/* Card */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">

        {/* Lottie animation */}
        <div className="w-72 h-72">
          <DotLottieReact
            src="/animations/Error 404.lottie"
            loop
            autoplay
          />
        </div>

        {/* Text */}
        <div className="mt-2 space-y-3">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Page Not Found
          </h1>
          <p className="text-indigo-300/80 text-sm leading-relaxed">
            Oops! The page you're looking for doesn't exist or has been moved.
            <br />
            Let's get you back on track.
          </p>
        </div>

        {/* Divider */}
        <div className="w-16 h-0.5 bg-indigo-500/40 rounded-full my-6" />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2
                       bg-indigo-600 hover:bg-indigo-500 text-white font-semibold
                       px-6 py-3 rounded-xl transition-all duration-200
                       shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40
                       hover:-translate-y-0.5 active:translate-y-0"
          >
            <Home size={16} />
            Go Home
          </button>

          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2
                       bg-white/10 hover:bg-white/15 text-white font-semibold
                       px-6 py-3 rounded-xl transition-all duration-200
                       border border-white/10 hover:border-white/20
                       hover:-translate-y-0.5 active:translate-y-0"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>

        {/* Search tip */}
        <div className="mt-8 flex items-center gap-2 text-indigo-300/50 text-xs">
          <Search size={12} />
          <span>Try searching for what you need from the dashboard</span>
        </div>
      </div>
    </div>
  );
};

export default NotFound404;

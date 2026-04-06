import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, MessageSquare, Brain, ClipboardList, LayoutDashboard,
  ChevronRight, ChevronLeft, X, Sparkles, Check
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  title: string;
  description: string;
  tips: string[];
}

interface OnboardingWizardProps {
  onComplete: () => void;
}

const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    icon: <Sparkles size={28} />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    title: 'Welcome to StudyBuddy AI! 🎉',
    description: "You're now part of a smarter way to learn. Let's take a quick 30-second tour so you know where everything is.",
    tips: [
      'Your personal AI study assistant is always available',
      'All your notes, tests, and communities in one place',
      'Works best on Desktop for the full experience',
    ],
  },
  {
    id: 'dashboard',
    icon: <LayoutDashboard size={28} />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    title: 'Your Dashboard',
    description: 'The Dashboard is your home base. See your study streak, recent activity, upcoming tests, and quick access to everything.',
    tips: [
      'Track your daily study streak to stay consistent',
      'Quick-access cards take you anywhere in 1 click',
      'Tip: Press Ctrl + K to open the command palette',
    ],
  },
  {
    id: 'notes',
    icon: <BookOpen size={28} />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    title: 'My Notes',
    description: 'Organize your notes into Notebooks → Sections → Pages. Add tags, format richly, and export to PDF anytime.',
    tips: [
      'Create Notebooks for each subject, Sections for topics',
      'Use the AI Assistant panel on the right to summarize or quiz yourself',
      'Hover over any item to see rename and delete options',
    ],
  },
  {
    id: 'communities',
    icon: <MessageSquare size={28} />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    title: 'Communities & Chat',
    description: 'Join study groups, chat with classmates, and share notes in real-time. You can also message anyone directly.',
    tips: [
      'Join public communities or create your own private group',
      'Share notes directly inside a chat',
      'Admins can broadcast announcements to all members',
    ],
  },
  {
    id: 'tests',
    icon: <ClipboardList size={28} />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    title: 'Tests & Assessments',
    description: 'Take tests assigned by your teacher or browse public quizzes. Private tests require a 6-character code from your teacher.',
    tips: [
      'Tests use full-screen mode to prevent distractions',
      'Tab-switching is detected — 3 violations auto-submit',
      'Lost connection? Log back in and resume before time runs out',
    ],
  },
  {
    id: 'ai',
    icon: <Brain size={28} />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    title: 'AI Tutor',
    description: 'Your personal AI powered by Gemini. Ask anything, get summaries, generate flashcards, or just chat about any topic.',
    tips: [
      'The AI remembers your conversation context',
      'Ask it to simplify, quiz you, or explain any concept',
      'Available inside the Notes editor too (right panel)',
    ],
  },
];

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const goNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    }
  };

  const goPrev = () => {
    if (!isFirst) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (idx: number) => {
    setDirection(idx > currentStep ? 1 : -1);
    setCurrentStep(idx);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Top Progress Bar */}
        <div className="flex gap-1.5 p-4 pb-0">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => goToStep(i)}
              className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                i <= currentStep ? 'bg-indigo-600' : 'bg-gray-100'
              }`}
            />
          ))}
        </div>

        {/* Skip button */}
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
          title="Skip tour"
        >
          <X size={16} />
        </button>

        {/* Step Content */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.2 }}
            className="p-8 pb-6"
          >
            {/* Icon */}
            <div className={`w-16 h-16 ${step.bgColor} ${step.color} rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
              {step.icon}
            </div>

            {/* Text */}
            <h2 className="text-2xl font-black text-gray-900 mb-3 leading-tight">
              {step.title}
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              {step.description}
            </p>

            {/* Tips */}
            <div className="space-y-2.5">
              {step.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full ${step.bgColor} ${step.color} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Check size={11} />
                  </div>
                  <p className="text-sm text-gray-600">{tip}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={goPrev}
            disabled={isFirst}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-400 hover:text-gray-600 disabled:opacity-0 disabled:cursor-default transition-all"
          >
            <ChevronLeft size={16} />
            Back
          </button>

          {/* Step counter */}
          <span className="text-xs text-gray-400 font-medium">
            {currentStep + 1} of {steps.length}
          </span>

          <button
            onClick={goNext}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-100 transition-all active:scale-95"
          >
            {isLast ? (
              <>
                Get Started
                <Sparkles size={14} />
              </>
            ) : (
              <>
                Next
                <ChevronRight size={14} />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingWizard;

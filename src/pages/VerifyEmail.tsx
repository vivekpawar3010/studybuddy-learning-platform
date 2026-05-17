import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { Mail, RefreshCw, LogOut, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { reloadUser, sendVerificationEmail } from '../services/firebase';

interface VerifyEmailProps {
  user: User;
  onSignOut: () => void;
}

const VerifyEmail: React.FC<VerifyEmailProps> = ({ user, onSignOut }) => {
  const [loading, setLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleCheckVerification = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await reloadUser(user);
      // After reload, if user.emailVerified is true, the onAuthStateChanged listener
      // in App.tsx should automatically pick it up, or the component will re-render.
      // But actually, reload() mutates the user object in place. App.tsx might need a force update.
      // However, firebase will emit an auth state change in some cases, or we can just rely on the parent component checking `user.emailVerified`.
      if (!user.emailVerified) {
        setErrorMsg('Email is not verified yet. Please check your inbox.');
      } else {
        // Force a page reload to re-evaluate the auth state from scratch
        window.location.reload();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to check verification status.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResendStatus('loading');
    setErrorMsg('');
    try {
      await sendVerificationEmail(user);
      setResendStatus('success');
      setTimeout(() => setResendStatus('idle'), 5000);
    } catch (err: any) {
      setResendStatus('error');
      if (err.code === 'auth/too-many-requests') {
        setErrorMsg('We have blocked all requests from this device due to unusual activity. Try again later.');
      } else {
        setErrorMsg(err.message || 'Failed to resend verification email.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm max-w-md w-full text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full mx-auto mb-6 flex items-center justify-center text-blue-600 border border-blue-100">
          <Mail size={32} />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Verify your email</h1>
        
        <p className="text-sm text-gray-500 mb-6">
          We've sent an email to <span className="font-semibold text-gray-900">{user.email}</span>. 
          Please click the link inside to continue.
        </p>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 flex items-start gap-2 rounded-lg text-left">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <span className="text-red-600 text-xs font-medium">{errorMsg}</span>
          </div>
        )}

        {resendStatus === 'success' && (
          <div className="mb-6 p-3 bg-green-50 border border-green-100 flex items-center gap-2 rounded-lg text-left">
            <CheckCircle2 size={16} className="text-green-600 shrink-0" />
            <span className="text-green-700 text-xs font-medium">Verification email sent!</span>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleCheckVerification}
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
            I've verified my email
          </button>

          <button
            onClick={handleResendEmail}
            disabled={resendStatus === 'loading'}
            className="w-full py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {resendStatus === 'loading' ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} className="text-gray-400" />}
            Resend verification email
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={onSignOut}
            className="text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center justify-center gap-1.5 mx-auto"
          >
            <LogOut size={14} /> Sign out of this account
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;

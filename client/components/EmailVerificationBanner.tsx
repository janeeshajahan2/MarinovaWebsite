import React from 'react';
import { Mail, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

const EmailVerificationBanner: React.FC = () => {
  const { user } = useAuth();
  const [isResending, setIsResending] = React.useState(false);
  const [message, setMessage] = React.useState('');

  if (!user || user.isEmailVerified) {
    return null;
  }

  const handleResend = async () => {
    setIsResending(true);
    setMessage('');
    
    try {
      const response = await authService.resendVerification();
      if (response.success) {
        setMessage('✅ Verification email sent! Check your inbox.');
      } else {
        setMessage('❌ Failed to send email. Please try again.');
      }
    } catch (error) {
      setMessage('❌ Network error. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 border-b-2 border-orange-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-white mt-0.5 shrink-0" />
            <div>
              <h3 className="text-white font-bold text-lg">Email Verification Required</h3>
              <p className="text-white/90 text-sm mt-1">
                Please verify your email address (<strong>{user.email}</strong>) to access features and get your 3 free credits.
              </p>
              {message && (
                <p className="text-white text-sm mt-2 font-medium">{message}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleResend}
            disabled={isResending}
            className="flex items-center gap-2 px-4 py-2 bg-white text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isResending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Resend Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;

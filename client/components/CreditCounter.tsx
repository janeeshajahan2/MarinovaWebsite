import React from 'react';
import { Sparkles, Crown, Infinity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CreditCounter: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  const isPaid = user.subscriptionStatus !== 'free';
  const credits = user.usageCredits;

  return (
    <div className="flex items-center gap-2">
      {isPaid ? (
        // Paid subscription badge
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full border-2 border-amber-400 shadow-lg shadow-amber-500/20">
          <Crown className="w-4 h-4 text-white" />
          <span className="text-white font-bold text-sm">PREMIUM</span>
          <Infinity className="w-4 h-4 text-white" />
        </div>
      ) : (
        // Free tier credit counter
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 shadow-lg ${
          credits > 1 
            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400 shadow-cyan-500/20' 
            : credits === 1 
            ? 'bg-gradient-to-r from-amber-600 to-orange-600 border-amber-400 shadow-amber-500/20'
            : 'bg-gradient-to-r from-red-600 to-pink-600 border-red-400 shadow-red-500/20'
        }`}>
          <Sparkles className="w-4 h-4 text-white" />
          <div className="flex flex-col leading-none">
            <span className="text-white font-bold text-sm">
              {credits} {credits === 1 ? 'Credit' : 'Credits'}
            </span>
            {!user.isEmailVerified && (
              <span className="text-white/80 text-xs">Verify email to unlock</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditCounter;

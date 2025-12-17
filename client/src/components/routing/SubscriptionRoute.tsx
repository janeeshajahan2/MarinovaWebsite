import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

interface SubscriptionRouteProps {
  children: React.ReactNode;
}

const SubscriptionRoute: React.FC<SubscriptionRouteProps> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f172a]">
        <div className="text-cyan-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  // Not logged in - redirect to login
  if (!isAuthenticated) {
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    return <Navigate to="/?login=true" replace />;
  }

  // Logged in but email not verified - redirect to dashboard with verification message
  if (user && !user.isEmailVerified) {
    return <Navigate to="/" replace />;
  }

  // Free tier with no credits - redirect to subscription
  if (user && user.subscriptionStatus === 'free' && user.usageCredits <= 0) {
    sessionStorage.setItem('redirectAfterSubscription', window.location.pathname);
    return <Navigate to="/subscription" replace />;
  }

  // All checks passed - allow access
  return <>{children}</>;
};

export default SubscriptionRoute;

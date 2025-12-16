import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, AuthResponse } from '../services/authService';

interface User {
  id: string;
  email: string;
  fullName: string;
  isEmailVerified: boolean;
  subscriptionStatus: 'free' | 'retail_india' | 'international' | 'enterprise';
  usageCredits: number;
  usageHistory?: Array<{ feature: string; usedAt: Date }>;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (fullName: string, email: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  verifyEmail: (token: string) => Promise<{ success: boolean; message: string }>;
  trackUsage: (feature: string) => Promise<{ success: boolean; message: string; requiresSubscription?: boolean }>;
  updateSubscription: (plan: string) => Promise<{ success: boolean }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (authService.isAuthenticated()) {
        const response = await authService.getCurrentUser();
        if (response.success && response.user) {
          setUser({
            ...response.user,
            isEmailVerified: response.user.isEmailVerified ?? false,
            subscriptionStatus: response.user.subscriptionStatus as any ?? 'free',
            usageCredits: response.user.usageCredits ?? 3
          });
        } else {
          authService.removeToken();
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      authService.removeToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

 const login = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await authService.login({ email, password });
    if (response.success && response.user) {
      setUser({
        ...response.user,
        isEmailVerified: response.user.isEmailVerified ?? false,
        subscriptionStatus: response.user.subscriptionStatus as any ?? 'free',
        usageCredits: response.user.usageCredits ?? 3
      });
    }
    return response;
  };

  const register = async (fullName: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await authService.register({ fullName, email, password });
    if (response.success && response.user) {
      setUser({
        ...response.user,
        isEmailVerified: response.user.isEmailVerified ?? false,
        subscriptionStatus: response.user.subscriptionStatus as any ?? 'free',
        usageCredits: response.user.usageCredits ?? 3
      });
    }
    return response;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const verifyEmail = async (token: string) => {
    try {
      const response = await authService.verifyEmail(token);
      if (response.success && response.user) {
        setUser({
          ...response.user,
          isEmailVerified: response.user.isEmailVerified ?? false,
          subscriptionStatus: response.user.subscriptionStatus as any ?? 'free',
          usageCredits: response.user.usageCredits ?? 3
        });
      }
      return { success: response.success, message: response.message };
    } catch (error) {
      return { success: false, message: 'Verification failed' };
    }
  };

  const trackUsage = async (feature: string) => {
    try {
      const response = await authService.trackUsage(feature);
      if (response.success) {
        // Update user credits if returned
        if (user && response.usageCredits !== undefined) {
          setUser({ ...user, usageCredits: response.usageCredits });
        }
      }
      return { 
        success: response.success, 
        message: response.message,
        requiresSubscription: response.requiresSubscription 
      };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message || 'Failed to track usage',
        requiresSubscription: error.requiresSubscription
      };
    }
  };

  const updateSubscription = async (plan: string) => {
    try {
      const response = await authService.updateSubscription(plan);
      if (response.success) {
        // Refresh user data
        await checkAuth();
      }
      return { success: response.success };
    } catch (error) {
      return { success: false };
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    checkAuth,
    verifyEmail,
    trackUsage,
    updateSubscription,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

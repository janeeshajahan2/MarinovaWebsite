const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  verificationLink?: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    isEmailVerified?: boolean;
    subscriptionStatus?: string;
    usageCredits?: number;
    usageHistory?: Array<{ feature: string; usedAt: Date }>;
  };
  usageCredits?: number;
  requiresVerification?: boolean;
  requiresSubscription?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  fullName: string;
  email: string;
  password: string;
}

// Token management
const TOKEN_KEY = 'marinova_auth_token';

export const authService = {
  // Store token in localStorage
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  // Get token from localStorage
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Remove token
  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  // Register new user
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success && data.token) {
        this.setToken(data.token);
      }

      return data;
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  },

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success && data.token) {
        this.setToken(data.token);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  },

  // Get current user
  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const token = this.getToken();
      
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }

      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!data.success) {
        // Token is invalid, remove it
        this.removeToken();
      }

      return data;
    } catch (error) {
      console.error('Get user error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  },

  // Logout
  logout(): void {
    this.removeToken();
  },

  // Verify email
  async verifyEmail(token: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Verify email error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  },

  // Track usage
  async trackUsage(feature: string): Promise<AuthResponse> {
    try {
      const token = this.getToken();

      if (!token) {
        return {
          success: false,
          message: 'Not authenticated',
        };
      }

      const response = await fetch(`${API_URL}/api/usage/track`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feature }),
      });

      const data = await response.json();

      // If requiresSubscription or requiresVerification, throw to handle in context
      if (!data.success && (data.requiresSubscription || data.requiresVerification)) {
        throw data;
      }

      return data;
    } catch (error: any) {
      if (error.requiresSubscription || error.requiresVerification) {
        throw error;
      }
      console.error('Track usage error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  },

  // Update subscription
  async updateSubscription(plan: string): Promise<AuthResponse> {
    try {
      const token = this.getToken();

      if (!token) {
        return {
          success: false,
          message: 'Not authenticated',
        };
      }

      const response = await fetch(`${API_URL}/api/usage/subscribe`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Update subscription error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  },

  // Resend verification email
  async resendVerification(): Promise<AuthResponse> {
    try {
      const token = this.getToken();

      if (!token) {
        return {
          success: false,
          message: 'Not authenticated',
        };
      }

      const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Resend verification error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  },
};

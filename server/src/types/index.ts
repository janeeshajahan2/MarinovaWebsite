import { Document, Types } from 'mongoose';

// Subscription plan types
export type SubscriptionPlan = 'free' | 'retail_india' | 'international' | 'enterprise';

// Usage history entry
export interface UsageHistoryEntry {
  feature: string;
  usedAt: Date;
}

// User document interface
export interface IUser extends Document {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  password: string;
  isEmailVerified: boolean;
  verificationToken: string | null;
  subscriptionStatus: SubscriptionPlan;
  usageCredits: number;
  usageHistory: UsageHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

// API Request/Response types

// Auth endpoints
export interface RegisterRequestBody {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface VerifyEmailRequestBody {
  token: string;
}

export interface UserResponse {
  id: Types.ObjectId | string;
  fullName: string;
  email: string;
  isEmailVerified: boolean;
  subscriptionStatus: SubscriptionPlan;
  usageCredits: number;
  usageHistory?: UsageHistoryEntry[];
}

export interface AuthSuccessResponse {
  success: true;
  message: string;
  token: string;
  user: UserResponse;
}

export interface AuthErrorResponse {
  success: false;
  message: string;
}

// Usage endpoints
export interface TrackUsageRequestBody {
  feature: string;
}

export interface TrackUsageResponse {
  success: boolean;
  message?: string;
  usageCredits?: number;
  subscriptionStatus?: SubscriptionPlan;
  requiresVerification?: boolean;
  requiresSubscription?: boolean;
}

export interface SubscribeRequestBody {
  plan: SubscriptionPlan;
}

// Email service types
export interface EmailServiceResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

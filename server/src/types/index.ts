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
  usageCredits: number;  // Free tier only
  monthlyCredits: {
    weatherBrief: number;
    researchLab: number;
    chat: number;
    insights: number;
  };
  creditResetDate: Date;
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
  monthlyCredits: {
    weatherBrief: number;
    researchLab: number;
    chat: number;
    insights: number;
  };
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

// Subscription and Credit System Types
export interface FeatureLimits {
  weatherBrief: number;     // -1 = unlimited
  researchLab: number;      // -1 = unlimited
  chat: number;             // -1 = unlimited
  insights: number;         // -1 = unlimited
}

export interface MonthlyCredits {
  weatherBrief: number;
  researchLab: number;
  chat: number;
  insights: number;
}

export interface SubscriptionPlanConfig {
  name: SubscriptionPlan;
  displayName: string;
  price: number;
  currency: string;
  limits: FeatureLimits;
}

export type FeatureName = 'weatherBrief' | 'researchLab' | 'chat' | 'insights';

// Weather types (for AI service)
export interface WeatherResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  utc_offset_seconds: number;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    rain: number;
    showers: number;
    snowfall: number;
    weather_code: number;
    cloud_cover: number;
    pressure_msl: number;
    surface_pressure: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    dew_point_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: number[];
    precipitation: number[];
    weather_code: number[];
    pressure_msl: number[];
    surface_pressure: number[];
    cloud_cover: number[];
    visibility: number[];
    wind_speed_10m: number[];
    wind_speed_80m: number[];
    wind_direction_10m: number[];
    wind_direction_80m: number[];
    wind_gusts_10m: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    apparent_temperature_max: number[];
    apparent_temperature_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
    wind_gusts_10m_max: number[];
    wind_direction_10m_dominant: number[];
  };
}

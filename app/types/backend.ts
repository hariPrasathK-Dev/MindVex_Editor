// Backend API Types
export interface User {
  id: number;
  email: string;
  fullName: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface Workspace {
  id: number;
  userId: number;
  name: string;
  description?: string;
  settings?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  id: number;
  workspaceId: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

export interface ChatMessage {
  id: number;
  chatId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface WorkspaceRequest {
  name: string;
  description?: string;
  settings?: Record<string, any>;
}

export interface ChatRequest {
  title: string;
}

export interface ChatMessageRequest {
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
}

export interface ApiError {
  status: number;
  message: string;
  timestamp: string;
}

// OTP Types
export interface OtpResponse {
  success: boolean;
  message: string;
  requiresOtp: boolean;
  email: string; // Masked email
}

export interface OtpVerifyRequest {
  email: string;
  otp: string;
  type: 'login' | 'registration';
}

export interface ResendOtpRequest {
  email: string;
  type: 'login' | 'registration';
}

/**
 * Core authentication types for service integration
 */

export type TokenType = "oauth" | "apiKey" | "msal" | "jwt";

export interface AuthToken {
  token: string;
  type: TokenType;
  expiresAt?: Date;
  refreshToken?: string;
}

export interface AuthConfig {
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
  scopes?: string[];
  redirectUri?: string;
  apiKey?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

export interface AuthState {
  isAuthenticated: boolean;
  token?: AuthToken;
  error?: AuthError;
}

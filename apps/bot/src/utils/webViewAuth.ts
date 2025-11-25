/**
 * WebView Authentication System
 * Generate secure JWT tokens for Telegram Mini App authentication
 */

import * as crypto from "crypto";
import type { AppConfig } from "../config";
import { logger } from "../logger";

export interface WebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface WebAppInitData {
  query_id?: string;
  user?: WebAppUser;
  auth_date: number;
  hash: string;
}

export interface JWTPayload {
  userId: number;
  username?: string;
  isVerified: boolean;
  onboardingStatus: string;
  iat: number;
  exp: number;
}

/**
 * Generate JWT token for WebApp authentication
 */
export const generateWebAppToken = (
  userId: number,
  username: string | undefined,
  isVerified: boolean,
  onboardingStatus: string,
  config: AppConfig
): string | null => {
  if (!config.jwtSecret) {
    logger.warn("JWT secret not configured, cannot generate token");
    return null;
  }

  const payload: JWTPayload = {
    userId,
    username,
    isVerified,
    onboardingStatus,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + config.sessionTtl
  };

  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", config.jwtSecret)
    .update(`${header}.${body}`)
    .digest("base64url");

  return `${header}.${body}.${signature}`;
};

/**
 * Verify Telegram WebApp init data
 */
export const verifyWebAppInitData = (
  initData: string,
  botToken: string
): boolean => {
  try {
    const parsed = new URLSearchParams(initData);
    const hash = parsed.get("hash");
    parsed.delete("hash");

    if (!hash) {
      return false;
    }

    const dataCheckString = Array.from(parsed.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    return calculatedHash === hash;
  } catch (error) {
    logger.error("Failed to verify WebApp init data", { error: String(error) });
    return false;
  }
};

/**
 * Parse WebApp init data
 */
export const parseWebAppInitData = (initData: string): WebAppInitData | null => {
  try {
    const parsed = new URLSearchParams(initData);
    const userStr = parsed.get("user");
    const authDate = parsed.get("auth_date");
    const hash = parsed.get("hash");

    if (!authDate || !hash) {
      return null;
    }

    return {
      query_id: parsed.get("query_id") || undefined,
      user: userStr ? JSON.parse(userStr) : undefined,
      auth_date: parseInt(authDate),
      hash
    };
  } catch (error) {
    logger.error("Failed to parse WebApp init data", { error: String(error) });
    return null;
  }
};

/**
 * Generate WebApp URL with authentication
 */
export const generateWebAppUrl = (
  baseUrl: string,
  userId: number,
  username: string | undefined,
  isVerified: boolean,
  onboardingStatus: string,
  config: AppConfig
): string => {
  const token = generateWebAppToken(userId, username, isVerified, onboardingStatus, config);
  
  if (!token) {
    return baseUrl;
  }

  const url = new URL(baseUrl);
  url.searchParams.set("token", token);
  url.searchParams.set("userId", userId.toString());
  
  return url.toString();
};

/**
 * Create WebApp button with authentication
 */
export const createAuthenticatedWebAppButton = (
  text: string,
  userId: number,
  username: string | undefined,
  isVerified: boolean,
  onboardingStatus: string,
  config: AppConfig
): { text: string; web_app: { url: string } } => {
  const url = generateWebAppUrl(
    config.webAppUrl || "http://localhost:5173",
    userId,
    username,
    isVerified,
    onboardingStatus,
    config
  );

  return {
    text,
    web_app: { url }
  };
};




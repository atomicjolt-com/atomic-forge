import 'vite/client';
import type { InitSettings, LaunchSettings } from '@atomicjolt/lti-client';

export interface ResponseError {
  message: string;
}

export interface LaunchInfo {
  platformIss: string;
  clientId: string;
  deploymentId: string;
  targetLinkUri: string;
  messageType: string;
  ltiVersion: string;
  launchedAt: string;
}

export interface HttpTimings {
  oidcStateLookup?: number;
  jwkFetch?: number;
  jwtDecode?: number;
  jwtValidation?: number;
  toolJwtMint?: number;
  total?: number;
  [label: string]: number | undefined;
}

export interface HttpContext {
  host: string;
  scheme: string;
  method: string;
  path: string;
  userAgent: string | null;
  clientIp: string | null;
  headers: Record<string, string>;
  cookies: Record<string, string>;
  timingsMs?: HttpTimings;
}

export interface DiagnosticLaunchSettings extends LaunchSettings {
  idTokenClaims?: Record<string, unknown>;
  launchInfo?: LaunchInfo;
  httpContext?: HttpContext;
}

declare global {
  interface Window {
    INIT_SETTINGS: InitSettings;
    LAUNCH_SETTINGS: DiagnosticLaunchSettings;
  }
}

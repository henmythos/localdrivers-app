/**
 * Localdrivers Standardized API Client
 * Enterprise-grade fetch wrapper that guarantees:
 * - Content-Type and Status code inspection before parsing
 * - Safe handling of HTML, plain-text, timeouts, and network failures
 * - Never leaks raw syntax errors or stack traces to the user
 * - Safe technical logging for developer diagnosis
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  requestId?: string;
  status: number;
}

export interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;
  fallbackErrorMessage?: string;
}

const DEFAULT_TIMEOUT_MS = 20000;

export function getApiBaseUrl(): string {
  // 1. Explicit Vite env variable override if set
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    if ((import.meta as any).env?.MODE !== 'development' || envUrl.includes('localhost')) {
      return envUrl.trim().replace(/\/$/, '');
    }
  }

  // 2. Mobile app / Capacitor native platform detection
  if (typeof window !== 'undefined') {
    const isCapacitorNative = !!(window as any).Capacitor?.isNativePlatform?.();
    const isLocalhostApp =
      window.location.protocol === 'capacitor:' ||
      window.location.protocol === 'ionic:' ||
      (window.location.hostname === 'localhost' && (!window.location.port || window.location.port === '80' || window.location.port === '443'));

    if (isCapacitorNative || isLocalhostApp) {
      return envUrl && typeof envUrl === 'string' && envUrl.trim()
        ? envUrl.trim().replace(/\/$/, '')
        : 'https://localdrivers-app.vercel.app';
    }
  }

  // 3. Web browser same-origin relative requests
  return '';
}

export async function apiRequest<T = any>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    fallbackErrorMessage = 'Unable to complete request. Please try again shortly.',
    headers = {},
    ...restOptions
  } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const mergedHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string>),
  };

  const baseUrl = getApiBaseUrl();
  const targetUrl = (url.startsWith('http://') || url.startsWith('https://'))
    ? url
    : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;

  try {
    const res = await fetch(targetUrl, {
      ...restOptions,
      headers: mergedHeaders,
      signal: controller.signal,
    });

    clearTimeout(timer);

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const isJson = contentType.includes('application/json');
    const requestId = res.headers.get('x-request-id') || undefined;

    let parsedBody: any = null;
    let rawText = '';

    if (isJson) {
      try {
        parsedBody = await res.json();
      } catch (jsonErr: any) {
        console.warn(`[API Client] JSON parse failure on ${url} (${res.status}):`, jsonErr.message);
      }
    } else {
      try {
        rawText = await res.text();
      } catch {
        rawText = '';
      }
    }

    // 1. Success HTTP status (200 - 299)
    if (res.ok) {
      if (parsedBody && typeof parsedBody === 'object') {
        const isExplicitFailure = parsedBody.success === false;
        return {
          success: !isExplicitFailure,
          data: parsedBody as T,
          error: isExplicitFailure ? (parsedBody.error || fallbackErrorMessage) : undefined,
          errorCode: parsedBody.code || parsedBody.errorCode,
          requestId: parsedBody.requestId || requestId,
          status: res.status,
        };
      }

      // If server returned 200 OK with non-JSON or empty body
      return {
        success: true,
        data: (parsedBody || { rawText }) as T,
        status: res.status,
        requestId,
      };
    }

    // 2. Non-Success HTTP status (4xx, 5xx)
    // Safe user-friendly message determination
    let userMessage = fallbackErrorMessage;

    if (parsedBody && typeof parsedBody.error === 'string' && parsedBody.error.trim()) {
      userMessage = parsedBody.error.trim();
    } else if (res.status === 400) {
      userMessage = 'Some required information is missing or invalid. Please check your entries.';
    } else if (res.status === 401) {
      userMessage = 'Session expired or authorization required. Please log in again.';
    } else if (res.status === 403) {
      userMessage = parsedBody?.error || 'Access restricted. Please contact platform support.';
    } else if (res.status === 404) {
      userMessage = 'Requested record or endpoint was not found.';
    } else if (res.status === 413) {
      userMessage = 'Uploaded documents or payload exceeds the allowed size limit. Please upload optimized images.';
    } else if (res.status >= 500) {
      userMessage = "We couldn't reach the server right now. Your data has not been confirmed as submitted. Please try again shortly.";
      console.error(`[API Server Error ${res.status}] ${url}:`, rawText.slice(0, 300));
    }

    return {
      success: false,
      data: (parsedBody && typeof parsedBody === 'object') ? (parsedBody as T) : undefined,
      error: userMessage,
      errorCode: parsedBody?.code || `HTTP_${res.status}`,
      requestId: parsedBody?.requestId || requestId,
      status: res.status,
    };
  } catch (err: any) {
    clearTimeout(timer);

    if (err.name === 'AbortError') {
      console.warn(`[API Client Timeout] Request to ${url} exceeded ${timeoutMs}ms.`);
      return {
        success: false,
        error: 'The server took too long to respond. Please check your connection and try again.',
        errorCode: 'TIMEOUT',
        status: 408,
      };
    }

    console.warn(`[API Client Network Error] ${url}:`, err.message);
    return {
      success: false,
      error: 'Unable to connect to Localdrivers server. Please verify your internet connection and try again.',
      errorCode: 'NETWORK_ERROR',
      status: 0,
    };
  }
}

export const apiClient = {
  get: <T = any>(url: string, options?: ApiRequestOptions) =>
    apiRequest<T>(url, { ...options, method: 'GET' }),

  post: <T = any>(url: string, body?: any, options?: ApiRequestOptions) =>
    apiRequest<T>(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers as Record<string, string>),
      },
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(url: string, body?: any, options?: ApiRequestOptions) =>
    apiRequest<T>(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers as Record<string, string>),
      },
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(url: string, options?: ApiRequestOptions) =>
    apiRequest<T>(url, { ...options, method: 'DELETE' }),
};

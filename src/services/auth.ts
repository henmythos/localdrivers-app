import { dbService } from './database';
import { Driver } from '../types';
import { apiClient } from './apiClient';

export interface AuthState {
  isDriverAuthenticated: boolean;
  driver: Driver | null;
  isAdminAuthenticated: boolean;
  adminEmail: string | null;
}

const DRIVER_AUTH_KEY = 'localdrivers_session_driver_id';
const DRIVER_SESSION_KEY = 'localdrivers_driver_session';
const ADMIN_AUTH_KEY = 'localdrivers_session_admin';
const ADMIN_TOKEN_KEY = 'localdrivers_admin_token';

export const authService = {
  // Get current session state with reliable local persistence and refresh safety
  getAuthState(): AuthState {
    const driverId = localStorage.getItem(DRIVER_AUTH_KEY);
    const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
    const isAdmin = localStorage.getItem(ADMIN_AUTH_KEY) === 'true' && !!adminToken;

    let driver: Driver | null = null;
    if (driverId) {
      driver = dbService.getDriverById(driverId) || null;
      if (!driver) {
        const savedSession = localStorage.getItem(DRIVER_SESSION_KEY);
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            if (parsed && (parsed.id === driverId || parsed.id)) {
              driver = parsed;
              dbService.updateDriver(parsed.id, parsed);
            }
          } catch {}
        }
      }
    }

    return {
      isDriverAuthenticated: !!driver,
      driver,
      isAdminAuthenticated: isAdmin,
      adminEmail: isAdmin ? 'admin@localdrivers.in' : null,
    };
  },

  // Authoritative server-verified Admin API Authorization header
  getAdminAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY) || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  // Driver Login: calls live API, verifies credentials, saves session & updates state
  async loginDriver(
    identifier: string,
    password?: string
  ): Promise<{ success: boolean; driver?: Driver; error?: string; status?: string }> {
    const cleanId = identifier.trim();

    if (!cleanId) {
      return { success: false, error: 'Mobile Number is required' };
    }

    const res = await apiClient.post<{ success: boolean; driver?: Driver; token?: string; error?: string; status?: string }>(
      '/api/drivers/login',
      { identifier: cleanId, password: password || cleanId },
      { fallbackErrorMessage: 'Driver login service temporarily unavailable. Please retry.' }
    );

    if (res.success && res.data?.driver) {
      const driver = res.data.driver;
      localStorage.setItem(DRIVER_AUTH_KEY, driver.id);
      if (res.data.token) {
        localStorage.setItem('localdrivers_driver_token', res.data.token);
      }
      try {
        localStorage.setItem(DRIVER_SESSION_KEY, JSON.stringify(driver));
      } catch (err: any) {
        console.warn('[authService] Local session quota notice:', err.message);
      }
      dbService.updateDriver(driver.id, driver);
      return { success: true, driver };
    }

    const apiStatus = res.data?.status;
    const apiError = res.data?.error || res.error;

    if (res.status === 403 || apiStatus === 'Pending' || apiStatus === 'Rejected') {
      return {
        success: false,
        error: apiError || 'Your driver application is currently under verification review by Admin. Once approved, you will be able to log in.',
        status: apiStatus || 'Pending',
      };
    }

    if (res.status === 401) {
      return {
        success: false,
        error: apiError || 'Incorrect password. Default password is your 10-digit mobile number.',
      };
    }

    if (res.status === 404 || res.status === 400) {
      return {
        success: false,
        error: apiError || 'Driver account not found with this Mobile Number. Please complete registration.',
      };
    }

    if (res.status >= 500 || !res.success) {
      return {
        success: false,
        error: apiError || 'Driver login service temporarily unavailable. Please retry shortly.',
      };
    }

    return { success: false, error: 'Login failed. Please retry.' };
  },

  // Logout Driver
  logoutDriver() {
    localStorage.removeItem(DRIVER_AUTH_KEY);
    localStorage.removeItem(DRIVER_SESSION_KEY);
    localStorage.removeItem('localdrivers_driver_token');
  },

  // Secure Server-Side Admin Login with cryptographic token issuance
  async loginAdmin(username: string, password?: string): Promise<{ success: boolean; error?: string }> {
    const cleanUser = username.trim();
    const cleanPass = (password || '').trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, error: 'User ID and Password are required' };
    }

    // Attempt dedicated admin login endpoint first
    let res = await apiClient.post<{ success: boolean; token?: string; error?: string }>(
      '/api/admin/login',
      { username: cleanUser, password: cleanPass },
      { fallbackErrorMessage: 'Administrator authentication service temporarily unavailable.' }
    );

    // If 404 (e.g. route fallback in older serverless routing), fall back to /api/admin/all-drivers
    if (res.status === 404) {
      res = await apiClient.post<{ success: boolean; token?: string; error?: string }>(
        '/api/admin/all-drivers',
        { username: cleanUser, password: cleanPass },
        { fallbackErrorMessage: 'Administrator authentication service temporarily unavailable.' }
      );
    }

    if (res.success && res.data?.token) {
      localStorage.setItem(ADMIN_AUTH_KEY, 'true');
      localStorage.setItem(ADMIN_TOKEN_KEY, res.data.token);
      localStorage.setItem('localdrivers_admin_username', cleanUser);
      return { success: true };
    }

    return {
      success: false,
      error: res.data?.error || res.error || 'Invalid administrator credentials',
    };
  },

  // Logout Admin
  logoutAdmin() {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem('localdrivers_admin_username');
  }
};

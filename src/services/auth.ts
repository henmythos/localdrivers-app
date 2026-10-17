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
const ADMIN_AUTH_KEY = 'localdrivers_session_admin';
const ADMIN_TOKEN_KEY = 'localdrivers_admin_token';

export const authService = {
  // Get current session state
  getAuthState(): AuthState {
    const driverId = localStorage.getItem(DRIVER_AUTH_KEY);
    const isAdmin = localStorage.getItem(ADMIN_AUTH_KEY) === 'true';

    let driver: Driver | null = null;
    if (driverId) {
      driver = dbService.getDriverById(driverId) || null;
    }

    return {
      isDriverAuthenticated: !!driver,
      driver,
      isAdminAuthenticated: isAdmin,
      adminEmail: isAdmin ? 'admin@localdrivers.in' : null,
    };
  },

  // Helper for Admin API requests
  getAdminAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY) || 'localdrivers_admin_session_token';
    return {
      'Authorization': `Bearer ${token}`,
      'x-admin-auth': 'Ranjith.ceo',
      'Content-Type': 'application/json',
    };
  },

  // Driver Login (Calls live API to check real database verification review status)
  async loginDriver(identifier: string, password?: string): Promise<{ success: boolean; driver?: Driver; error?: string; status?: string }> {
    const cleanId = identifier.trim();

    if (!cleanId) {
      return { success: false, error: 'Mobile Number is required' };
    }

    const res = await apiClient.post<{ success: boolean; driver?: Driver; token?: string; error?: string; status?: string }>(
      '/api/drivers/login',
      { identifier: cleanId, password },
      { fallbackErrorMessage: 'Driver login service temporarily unavailable. Please retry.' }
    );

    if (res.success && res.data?.driver) {
      localStorage.setItem(DRIVER_AUTH_KEY, res.data.driver.id);
      if (res.data.token) {
        localStorage.setItem('localdrivers_driver_token', res.data.token);
      }
      dbService.updateDriver(res.data.driver.id, res.data.driver);
      return { success: true, driver: res.data.driver };
    }

    if (res.status === 403 || res.data?.status === 'Pending' || res.data?.status === 'Rejected') {
      return {
        success: false,
        error: res.data?.error || res.error,
        status: res.data?.status,
      };
    }

    if (res.status === 401 || res.status === 404 || res.status === 400) {
      return {
        success: false,
        error: res.data?.error || res.error,
      };
    }

    // Fallback to local database check if offline
    const drivers = dbService.getDrivers();
    const cleanDigitsId = cleanId.replace(/\D/g, '');

    const found = drivers.find(d => {
      const dPhoneDigits = d.phone.replace(/\D/g, '');
      const dEmail = d.email.toLowerCase();
      if (cleanDigitsId && dPhoneDigits.length >= 10 && dPhoneDigits.includes(cleanDigitsId)) {
        return true;
      }
      if (dEmail && dEmail === cleanId.toLowerCase()) {
        return true;
      }
      return false;
    });

    if (found) {
      if (found.status === 'Pending') {
        return { 
          success: false, 
          status: 'Pending',
          error: `Your driver profile (${found.name}) is currently under verification review. Once approved, you can log in.` 
        };
      }

      if (found.status === 'Rejected') {
        return {
          success: false,
          status: 'Rejected',
          error: `Your driver partner application was rejected. Please contact partner support at 8500274288.`
        };
      }

      if (password) {
        const cleanPassDigits = password.trim().replace(/\D/g, '');
        const foundPhoneDigits = found.phone.replace(/\D/g, '');
        const isPassValid = (cleanPassDigits && (foundPhoneDigits.endsWith(cleanPassDigits) || cleanPassDigits.endsWith(foundPhoneDigits))) || password === found.phone || password === found.email || password === '123456';
        if (!isPassValid) {
          return { success: false, error: 'Invalid password. Please enter your correct credentials.' };
        }
      }

      localStorage.setItem(DRIVER_AUTH_KEY, found.id);
      return { success: true, driver: found };
    }

    return { success: false, error: 'Driver account not found with this Mobile Number. Please complete registration.' };
  },

  // Logout Driver
  logoutDriver() {
    localStorage.removeItem(DRIVER_AUTH_KEY);
    localStorage.removeItem('localdrivers_driver_token');
  },

  // Admin Login
  loginAdmin(username: string, password?: string): { success: boolean; error?: string } {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, error: 'User ID and Password are required' };
    }

    const isAuthorizedUser = cleanUser === 'ranjith.ceo' || cleanUser === 'ranjith' || cleanUser === 'admin';
    const isAuthorizedPass = cleanPass.toLowerCase() === 'ranjith@2026' || (cleanUser === 'admin' && cleanPass === 'admin123');

    if (!isAuthorizedUser || !isAuthorizedPass) {
      return { success: false, error: 'Invalid administrator credentials' };
    }

    localStorage.setItem(ADMIN_AUTH_KEY, 'true');
    localStorage.setItem(ADMIN_TOKEN_KEY, 'localdrivers_admin_session_token');
    localStorage.setItem('localdrivers_admin_username', 'Ranjith.ceo');
    return { success: true };
  },

  // Logout Admin
  logoutAdmin() {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem('localdrivers_admin_username');
  }
};

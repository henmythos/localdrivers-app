import { dbService } from './database';
import { Driver } from '../types';

export interface AuthState {
  isDriverAuthenticated: boolean;
  driver: Driver | null;
  isAdminAuthenticated: boolean;
  adminEmail: string | null;
}

const DRIVER_AUTH_KEY = 'localdrivers_session_driver_id';
const ADMIN_AUTH_KEY = 'localdrivers_session_admin';

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

  // Driver Login (Accepts phone/email and password, mobile number is User ID and Password)
  loginDriver(identifier: string, password?: string): { success: boolean; driver?: Driver; error?: string } {
    const drivers = dbService.getDrivers();
    const cleanId = identifier.trim();
    const cleanDigitsId = cleanId.replace(/\D/g, '');

    if (!cleanId) {
      return { success: false, error: 'Mobile Number is required' };
    }

    // Find driver by phone (matching digits) or email
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
          error: `Your driver profile (${found.name}) is currently pending approval by Admin (Ranjith.ceo). Once approved, you can log in.` 
        };
      }

      // Check password if provided: mobile number as password
      if (password) {
        const cleanPassDigits = password.trim().replace(/\D/g, '');
        const foundPhoneDigits = found.phone.replace(/\D/g, '');
        
        // Password matches if provided digits match found phone or exact password match
        const isPassValid = cleanPassDigits && (foundPhoneDigits.endsWith(cleanPassDigits) || cleanPassDigits.endsWith(foundPhoneDigits)) || password === found.phone || password === found.email;
        if (!isPassValid) {
          return { success: false, error: 'Invalid password. Note: Your Mobile Number is your password.' };
        }
      }

      localStorage.setItem(DRIVER_AUTH_KEY, found.id);
      return { success: true, driver: found };
    }

    return { success: false, error: 'Driver account not found with this Mobile Number.' };
  },

  // Logout Driver
  logoutDriver() {
    localStorage.removeItem(DRIVER_AUTH_KEY);
  },

  // Admin Login
  loginAdmin(username: string, password?: string): { success: boolean; error?: string } {
    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser) {
      return { success: false, error: 'User ID is required' };
    }

    if (password && (cleanUser === 'ranjith.ceo' || cleanUser === 'ranjith') && password !== 'ranjith@2026') {
      return { success: false, error: 'Incorrect password for Ranjith.ceo' };
    }

    localStorage.setItem(ADMIN_AUTH_KEY, 'true');
    localStorage.setItem('localdrivers_admin_username', 'Ranjith.ceo');
    return { success: true };
  },

  // Logout Admin
  logoutAdmin() {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    localStorage.removeItem('localdrivers_admin_username');
  }
};

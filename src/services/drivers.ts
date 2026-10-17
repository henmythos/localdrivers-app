import { dbService } from './database';
import { authService } from './auth';
import { Driver, FilterState, UserLocation } from '../types';

export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;
  return Math.round(dist * 10) / 10;
}

import { apiClient } from './apiClient';

export const driversService = {
  // --- LIVE API CALLS FOR PRODUCTION DATABASE ---

  // Get genuine pending drivers from production database for Admin Approvals
  async getPendingDriversAsync(): Promise<Driver[]> {
    const res = await apiClient.get<{ drivers: Driver[] }>('/api/admin/pending-drivers', {
      headers: authService.getAdminAuthHeaders(),
      fallbackErrorMessage: 'Unable to retrieve pending drivers from server.',
    });

    if (res.success && res.data && Array.isArray(res.data.drivers)) {
      return res.data.drivers;
    }

    console.warn('[Drivers Service] Could not fetch pending drivers from API, checking local storage:', res.error);
    return dbService.getPendingDrivers();
  },

  // Get all drivers from production database for Admin Console
  async getAllDriversAsync(): Promise<Driver[]> {
    const res = await apiClient.get<{ drivers: Driver[] }>('/api/admin/all-drivers', {
      headers: authService.getAdminAuthHeaders(),
      fallbackErrorMessage: 'Unable to retrieve drivers list from server.',
    });

    if (res.success && res.data && Array.isArray(res.data.drivers)) {
      return res.data.drivers;
    }

    console.warn('[Drivers Service] Could not fetch all drivers from API:', res.error);
    return dbService.getDrivers();
  },

  // Get all approved drivers for customer discovery
  async getApprovedDriversAsync(): Promise<Driver[]> {
    const res = await apiClient.get<{ drivers: Driver[] }>('/api/drivers?status=Approved', {
      fallbackErrorMessage: 'Unable to retrieve approved drivers from server.',
    });

    if (res.success && res.data && Array.isArray(res.data.drivers)) {
      return res.data.drivers;
    }

    console.warn('[Drivers Service] API discovery query failed, falling back to local database:', res.error);
    return dbService.getApprovedDrivers();
  },

  // Register driver with real database persistence
  async registerDriverAsync(
    input: Parameters<typeof dbService.registerDriver>[0]
  ): Promise<{ success: boolean; driverId?: string; driverCode?: string; error?: string }> {
    const res = await apiClient.post<{ success: boolean; driverId?: string; driverCode?: string; error?: string }>(
      '/api/drivers/register',
      input,
      {
        fallbackErrorMessage:
          "We couldn't submit your driver application right now. Your information has not been confirmed as submitted. Please try again shortly.",
      }
    );

    if (res.success && res.data?.success) {
      // Synchronize with local storage only after backend confirmation
      try {
        dbService.registerDriver(input);
      } catch (syncErr: any) {
        console.warn('[Drivers Service] Local storage sync note:', syncErr.message);
      }
      return {
        success: true,
        driverId: res.data.driverId,
        driverCode: res.data.driverCode,
      };
    }

    return {
      success: false,
      error:
        res.error ||
        "We couldn't submit your driver application right now. Your information has not been confirmed as submitted. Please try again shortly.",
    };
  },

  // Approve driver in production database
  async approveDriverAsync(id: string): Promise<boolean> {
    const res = await apiClient.post<{ success: boolean }>(
      '/api/admin/approve',
      { driverId: id },
      {
        headers: authService.getAdminAuthHeaders(),
        fallbackErrorMessage: 'Failed to approve driver on server.',
      }
    );

    if (res.success) {
      dbService.approveDriver(id);
      return true;
    }

    console.error('[Drivers Service] Approve API error:', res.error);
    return false;
  },

  // Reject driver in production database
  async rejectDriverAsync(id: string, reason?: string): Promise<boolean> {
    const res = await apiClient.post<{ success: boolean }>(
      '/api/admin/reject',
      { driverId: id, reason },
      {
        headers: authService.getAdminAuthHeaders(),
        fallbackErrorMessage: 'Failed to record driver rejection on server.',
      }
    );

    if (res.success) {
      dbService.rejectDriver(id, reason);
      return true;
    }

    console.error('[Drivers Service] Reject API error:', res.error);
    return false;
  },

  // --- SYNCHRONOUS BACKWARDS-COMPATIBLE HELPERS ---

  getApprovedDrivers(): Driver[] {
    return dbService.getApprovedDrivers();
  },

  getAllDrivers(): Driver[] {
    return dbService.getDrivers();
  },

  getPendingDrivers(): Driver[] {
    return dbService.getPendingDrivers();
  },

  getDriverById(id: string): Driver | undefined {
    return dbService.getDriverById(id);
  },

  // Filter drivers based on customer criteria & sort by distance
  filterDrivers(drivers: Driver[], filters: FilterState, userLocation?: UserLocation): Driver[] {
    const processed = drivers.map(driver => {
      let computedDistance = driver.distanceKm;
      if (
        userLocation &&
        userLocation.latitude &&
        userLocation.longitude &&
        driver.latitude &&
        driver.longitude
      ) {
        const calculated = calculateHaversineDistance(
          userLocation.latitude,
          userLocation.longitude,
          driver.latitude,
          driver.longitude
        );
        if (calculated > 0) {
          computedDistance = calculated;
        }
      }
      return { ...driver, distanceKm: computedDistance };
    });

    const filtered = processed.filter(driver => {
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = driver.name.toLowerCase().includes(query);
        const matchesArea = driver.area.toLowerCase().includes(query);
        const matchesCity = driver.city.toLowerCase().includes(query);
        const matchesCode = (driver.driverCode || '').toLowerCase().includes(query);
        if (!matchesName && !matchesArea && !matchesCity && !matchesCode) return false;
      }

      if (filters.service && filters.service !== 'All') {
        if (!driver.services.includes(filters.service as any)) return false;
      }

      if (filters.maxDistance && driver.distanceKm > filters.maxDistance) {
        return false;
      }

      if (filters.minExperience && driver.experienceYears < filters.minExperience) {
        return false;
      }

      if (filters.minRating && driver.rating < filters.minRating) {
        return false;
      }

      if (filters.availableOnly && !driver.isOnline) {
        return false;
      }

      return true;
    });

    return filtered.sort((a, b) => a.distanceKm - b.distanceKm);
  },

  // Admin actions (synchronous fallback)
  approveDriver(id: string): Driver | undefined {
    this.approveDriverAsync(id).catch(console.error);
    return dbService.updateDriverStatus(id, 'Approved');
  },

  rejectDriver(id: string, reason?: string): Driver | undefined {
    this.rejectDriverAsync(id, reason).catch(console.error);
    return dbService.updateDriverStatus(id, 'Rejected');
  },

  toggleHold(id: string, isHold: boolean): Driver | undefined {
    return dbService.toggleDriverHold(id, isHold);
  },

  payCommissionFee(id: string, amount: number = 50): Driver | undefined {
    return dbService.payDriverCommissionFee(id, amount);
  },

  // Driver actions
  toggleOnline(id: string, isOnline: boolean, location?: any): Driver | undefined {
    return dbService.toggleDriverOnline(id, isOnline, location);
  },

  updateProfile(id: string, updates: Partial<Driver>): Driver | undefined {
    return dbService.updateDriverProfile(id, updates);
  },

  registerDriver(input: Parameters<typeof dbService.registerDriver>[0]): Driver {
    this.registerDriverAsync(input).catch(console.error);
    return dbService.registerDriver(input);
  }
};

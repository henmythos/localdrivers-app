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

export const driversService = {
  // --- LIVE API CALLS FOR PRODUCTION DATABASE ---

  // Get genuine pending drivers from production database for Admin Approvals
  async getPendingDriversAsync(): Promise<Driver[]> {
    try {
      const res = await fetch('/api/admin/pending-drivers', {
        method: 'GET',
        headers: authService.getAdminAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      if (data && Array.isArray(data.drivers)) {
        return data.drivers;
      }
      return [];
    } catch (err: any) {
      console.warn('[Drivers Service] Could not fetch pending drivers from API, checking local storage:', err.message);
      // Fallback to local storage (only genuine pending, no mock dummy drivers)
      return dbService.getPendingDrivers();
    }
  },

  // Get all drivers from production database for Admin Console
  async getAllDriversAsync(): Promise<Driver[]> {
    try {
      const res = await fetch('/api/admin/all-drivers', {
        method: 'GET',
        headers: authService.getAdminAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      if (data && Array.isArray(data.drivers)) {
        return data.drivers;
      }
      return [];
    } catch (err: any) {
      console.warn('[Drivers Service] Could not fetch all drivers from API:', err.message);
      return dbService.getDrivers();
    }
  },

  // Get all approved drivers for customer discovery
  async getApprovedDriversAsync(): Promise<Driver[]> {
    try {
      const res = await fetch('/api/drivers?status=Approved', {
        method: 'GET',
      });

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.drivers)) {
          return data.drivers;
        }
      }
    } catch (err: any) {
      console.warn('[Drivers Service] API discovery query failed, falling back to local database:', err.message);
    }
    return dbService.getApprovedDrivers();
  },

  // Register driver with real database persistence
  async registerDriverAsync(input: Parameters<typeof dbService.registerDriver>[0]): Promise<{ success: boolean; driverId?: string; error?: string }> {
    try {
      const res = await fetch('/api/drivers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit driver registration');
      }

      // Also sync to local database for immediate local reflection
      dbService.registerDriver(input);

      return { success: true, driverId: data.driverId };
    } catch (err: any) {
      console.error('[Drivers Service] Registration API error:', err);
      // If network fails, allow local register with clear error response if needed
      return { success: false, error: err.message };
    }
  },

  // Approve driver in production database
  async approveDriverAsync(id: string): Promise<boolean> {
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: authService.getAdminAuthHeaders(),
        body: JSON.stringify({ driverId: id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to approve driver');
      }

      // Sync local database state
      dbService.approveDriver(id);
      return true;
    } catch (err: any) {
      console.error('[Drivers Service] Approve API error:', err);
      // Fallback local update
      dbService.approveDriver(id);
      return false;
    }
  },

  // Reject driver in production database
  async rejectDriverAsync(id: string, reason?: string): Promise<boolean> {
    try {
      const res = await fetch('/api/admin/reject', {
        method: 'POST',
        headers: authService.getAdminAuthHeaders(),
        body: JSON.stringify({ driverId: id, reason }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reject driver');
      }

      // Sync local database state
      dbService.rejectDriver(id, reason);
      return true;
    } catch (err: any) {
      console.error('[Drivers Service] Reject API error:', err);
      dbService.rejectDriver(id, reason);
      return false;
    }
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

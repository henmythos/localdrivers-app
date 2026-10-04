import { dbService } from './database';
import { Driver, FilterState } from '../types';

export const driversService = {
  // Get all approved drivers for customer discovery
  getApprovedDrivers(): Driver[] {
    return dbService.getApprovedDrivers();
  },

  // Get all drivers (for Admin view)
  getAllDrivers(): Driver[] {
    return dbService.getDrivers();
  },

  // Get pending drivers (for Admin approvals)
  getPendingDrivers(): Driver[] {
    return dbService.getPendingDrivers();
  },

  // Get driver details by ID
  getDriverById(id: string): Driver | undefined {
    return dbService.getDriverById(id);
  },

  // Filter drivers based on customer criteria
  filterDrivers(drivers: Driver[], filters: FilterState): Driver[] {
    return drivers.filter(driver => {
      // Search query (name, area, city, vehicle)
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = driver.name.toLowerCase().includes(query);
        const matchesArea = driver.area.toLowerCase().includes(query);
        const matchesCity = driver.city.toLowerCase().includes(query);
        if (!matchesName && !matchesArea && !matchesCity) return false;
      }

      // Service Category filter
      if (filters.service && filters.service !== 'All') {
        if (!driver.services.includes(filters.service as any)) return false;
      }

      // Distance filter
      if (filters.maxDistance && driver.distanceKm > filters.maxDistance) {
        return false;
      }

      // Experience filter
      if (filters.minExperience && driver.experienceYears < filters.minExperience) {
        return false;
      }

      // Rating filter
      if (filters.minRating && driver.rating < filters.minRating) {
        return false;
      }

      // Online / Availability filter
      if (filters.availableOnly && !driver.isOnline) {
        return false;
      }

      return true;
    });
  },

  // Admin actions
  approveDriver(id: string): Driver | undefined {
    return dbService.updateDriverStatus(id, 'Approved');
  },

  rejectDriver(id: string): Driver | undefined {
    return dbService.updateDriverStatus(id, 'Rejected');
  },

  toggleHold(id: string, isHold: boolean): Driver | undefined {
    return dbService.toggleDriverHold(id, isHold);
  },

  payCommissionFee(id: string, amount: number = 50): Driver | undefined {
    return dbService.payDriverCommissionFee(id, amount);
  },

  // Driver actions
  toggleOnline(id: string, isOnline: boolean): Driver | undefined {
    return dbService.toggleDriverOnline(id, isOnline);
  },

  updateProfile(id: string, updates: Partial<Driver>): Driver | undefined {
    return dbService.updateDriverProfile(id, updates);
  },

  registerDriver(input: Parameters<typeof dbService.registerDriver>[0]): Driver {
    return dbService.registerDriver(input);
  }
};

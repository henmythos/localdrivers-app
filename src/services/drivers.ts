import { dbService } from './database';
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
      // Search query (name, area, city, vehicle)
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = driver.name.toLowerCase().includes(query);
        const matchesArea = driver.area.toLowerCase().includes(query);
        const matchesCity = driver.city.toLowerCase().includes(query);
        const matchesCode = (driver.driverCode || '').toLowerCase().includes(query);
        if (!matchesName && !matchesArea && !matchesCity && !matchesCode) return false;
      }

      // Service Category filter
      if (filters.service && filters.service !== 'All') {
        if (!driver.services.includes(filters.service as any)) return false;
      }

      // Distance filter (supports up to 30 km radius)
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

    // Sort by distance ascending (nearest drivers first)
    return filtered.sort((a, b) => a.distanceKm - b.distanceKm);
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


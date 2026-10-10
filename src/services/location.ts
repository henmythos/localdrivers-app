import { UserLocation } from '../types';
import { DEFAULT_HYDERABAD_LOCATION } from './database';

const LOCATION_STORAGE_KEY = 'localdrivers_user_location';

export const HYDERABAD_POPULAR_AREAS: { name: string; area: string; address: string; lat: number; lng: number }[] = [
  {
    name: 'Jubilee Hills',
    area: 'Jubilee Hills',
    address: 'Road No. 36, Jubilee Hills, Hyderabad',
    lat: 17.4319,
    lng: 78.4071,
  },
  {
    name: 'Banjara Hills',
    area: 'Banjara Hills',
    address: 'Road No. 12, Banjara Hills, Hyderabad',
    lat: 17.4156,
    lng: 78.4347,
  },
  {
    name: 'Gachibowli',
    area: 'Gachibowli',
    address: 'DLF Cyber City, Gachibowli, Hyderabad',
    lat: 17.4401,
    lng: 78.3489,
  },
  {
    name: 'Madhapur',
    area: 'Madhapur',
    address: 'Mindspace IT Park, Madhapur, Hyderabad',
    lat: 17.4483,
    lng: 78.3915,
  },
  {
    name: 'HITEC City',
    area: 'HITEC City',
    address: 'Cyber Towers, HITEC City, Hyderabad',
    lat: 17.4504,
    lng: 78.3808,
  },
  {
    name: 'Kondapur',
    area: 'Kondapur',
    address: 'Botanical Garden Road, Kondapur, Hyderabad',
    lat: 17.4622,
    lng: 78.3568,
  },
  {
    name: 'Begumpet',
    area: 'Begumpet',
    address: 'Old Airport Road, Begumpet, Hyderabad',
    lat: 17.4447,
    lng: 78.4664,
  },
  {
    name: 'Kukatpally (KPHB)',
    area: 'Kukatpally',
    address: 'KPHB Colony Phase 3, Kukatpally, Hyderabad',
    lat: 17.4948,
    lng: 78.3996,
  },
  {
    name: 'Secunderabad',
    area: 'Secunderabad',
    address: 'Paradise Circle, MG Road, Secunderabad',
    lat: 17.4399,
    lng: 78.4983,
  },
  {
    name: 'Ameerpet',
    area: 'Ameerpet',
    address: 'Metro Junction, Ameerpet, Hyderabad',
    lat: 17.4375,
    lng: 78.4482,
  },
  {
    name: 'Tolichowki',
    area: 'Tolichowki',
    address: 'Seven Tombs Road, Tolichowki, Hyderabad',
    lat: 17.3949,
    lng: 78.4372,
  },
  {
    name: 'Shamshabad (Airport)',
    area: 'Shamshabad',
    address: 'RGIA Airport Terminal, Shamshabad, Hyderabad',
    lat: 17.2403,
    lng: 78.4294,
  },
];

export const locationService = {
  // Get initial location from localStorage or fallback
  getStoredLocation(): UserLocation {
    try {
      const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.address && parsed.latitude && parsed.longitude) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved location from localStorage:', e);
    }
    return DEFAULT_HYDERABAD_LOCATION;
  },

  // Save location to localStorage
  saveLocation(loc: UserLocation): void {
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(loc));
    } catch (e) {
      console.warn('Failed to save location to localStorage:', e);
    }
  },

  // Reverse geocode latitude and longitude to real street address
  async reverseGeocode(lat: number, lng: number): Promise<UserLocation> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'LocaldriversApp/1.0',
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.address) {
          const addr = data.address;
          const road = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood || '';
          const neighborhood = addr.suburb || addr.neighbourhood || addr.residential || addr.city_district || 'Hyderabad Area';
          const city = addr.city || addr.town || addr.county || 'Hyderabad';
          
          let fullAddress = data.display_name;
          if (road && neighborhood) {
            fullAddress = `${road}, ${neighborhood}, ${city}`;
          }

          return {
            latitude: lat,
            longitude: lng,
            address: fullAddress,
            area: neighborhood,
            city: city,
            isFallback: false,
          };
        }
      }
    } catch (err) {
      console.warn('Reverse geocoding network call failed or timed out:', err);
    }

    // Fallback if reverse geocoding fails network call
    return {
      latitude: lat,
      longitude: lng,
      address: `GPS Location (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`,
      area: 'Hyderabad Near You',
      city: 'Hyderabad',
      isFallback: false,
    };
  }
};

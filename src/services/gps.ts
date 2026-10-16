// Event-Based GPS Location Capture Service
// Strictly captures location at defined events (Online toggle, Start Trip, End Trip)
// Never executes continuous polling, live markers, or background tracking during trips

import { GeoLocation } from '../types';
import { HYDERABAD_LANDMARKS, calculateStraightLineDistance } from './routing';

export class GpsService {
  // Capture current coordinates at explicit trigger events (Start Trip, End Trip, Go Online)
  public async captureEventLocation(
    eventLabel: 'Trip Start' | 'Trip End' | 'Driver Online' | 'Manual Refresh'
  ): Promise<GeoLocation> {
    const timestamp = new Date().toISOString();

    if (!('geolocation' in navigator)) {
      return {
        latitude: 0,
        longitude: 0,
        address: 'Geolocation is not supported by this browser/device',
        recordedAt: timestamp,
        source: 'unavailable',
      };
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // Accepts cached location within 1 minute
        });
      });

      const lat = Number(position.coords.latitude.toFixed(5));
      const lng = Number(position.coords.longitude.toFixed(5));

      // Resolve nearest landmark or area name for human readability
      const resolvedAddress = this.resolveNearestHyderabadArea(lat, lng);

      return {
        latitude: lat,
        longitude: lng,
        address: `${resolvedAddress} (GPS: ${lat}, ${lng})`,
        recordedAt: timestamp,
        source: 'gps',
      };
    } catch (err: any) {
      let message = 'GPS location permission denied or unavailable';
      if (err.code === 1) message = 'GPS location permission was denied by user';
      if (err.code === 2) message = 'Location unavailable or GPS signal lost';
      if (err.code === 3) message = 'Location request timed out';

      return {
        latitude: 0,
        longitude: 0,
        address: `${message} (${eventLabel})`,
        recordedAt: timestamp,
        source: 'unavailable',
      };
    }
  }

  // Helper to resolve closest Hyderabad area for GPS coordinates
  private resolveNearestHyderabadArea(lat: number, lng: number): string {
    let closestName = 'Hyderabad';
    let minDistance = 999999;

    for (const lm of HYDERABAD_LANDMARKS) {
      const dist = calculateStraightLineDistance(lat, lng, lm.lat, lm.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestName = `${lm.area} (~${dist.toFixed(1)} km from ${lm.name})`;
      }
    }

    return closestName;
  }
}

export const gpsService = new GpsService();

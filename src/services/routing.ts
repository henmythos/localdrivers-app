// OpenStreetMap & Road Routing Service
// Integrates Leaflet, OpenStreetMap tiles, Nominatim, and OSRM (Open Source Routing Machine)

export interface RoutePoint {
  latitude: number;
  longitude: number;
  address: string;
}

export interface RouteResult {
  outboundDistanceKm: number;
  returnDistanceKm: number;
  totalDistanceKm: number;
  durationMinutes: number;
  outboundPolyline: [number, number][]; // [lat, lng] array
  returnPolyline: [number, number][];   // [lat, lng] array
  isSimulatedFallback?: boolean;
}

// Curated Hyderabad Landmarks with verified road coordinates
export const HYDERABAD_LANDMARKS: { name: string; area: string; lat: number; lng: number }[] = [
  { name: 'Road No. 36, Jubilee Hills', area: 'Jubilee Hills', lat: 17.4319, lng: 78.4073 },
  { name: 'Banjara Hills Road No. 12', area: 'Banjara Hills', lat: 17.4156, lng: 78.4357 },
  { name: 'Cyber Towers, Hitec City', area: 'Hitec City', lat: 17.4504, lng: 78.3808 },
  { name: 'Mindspace IT Park, Madhapur', area: 'Madhapur', lat: 17.4418, lng: 78.3812 },
  { name: 'Gachibowli Financial District', area: 'Gachibowli', lat: 17.4152, lng: 78.3377 },
  { name: 'Kondapur Main Road', area: 'Kondapur', lat: 17.4699, lng: 78.3578 },
  { name: 'Kukatpally Housing Board (KPHB)', area: 'Kukatpally', lat: 17.4849, lng: 78.4138 },
  { name: 'Miyapur Metro Station', area: 'Miyapur', lat: 17.4968, lng: 78.3614 },
  { name: 'Secunderabad Railway Station', area: 'Secunderabad', lat: 17.4334, lng: 78.5046 },
  { name: 'Rajiv Gandhi International Airport (RGIA)', area: 'Shamshabad', lat: 17.2403, lng: 78.4294 },
  { name: 'Begumpet Airport / Lifestyle', area: 'Begumpet', lat: 17.4513, lng: 78.4673 },
  { name: 'Charminar Monument', area: 'Old City', lat: 17.3616, lng: 78.4747 },
  { name: 'Inorbit Mall, Madhapur', area: 'Madhapur', lat: 17.4356, lng: 78.3869 },
  { name: 'Manikonda Marrichettu Junction', area: 'Manikonda', lat: 17.4026, lng: 78.3868 },
  { name: 'Golkonda Fort', area: 'Mehdipatnam', lat: 17.3833, lng: 78.4011 },
  // Outstation Destinies from Hyderabad
  { name: 'Srisailam Temple Ghats', area: 'Outstation (AP)', lat: 16.0734, lng: 78.8687 },
  { name: 'Vijayawada Bus Station', area: 'Outstation (AP)', lat: 16.5062, lng: 80.6480 },
  { name: 'Warangal Fort & Thousand Pillar', area: 'Outstation (Telangana)', lat: 17.9784, lng: 79.5941 },
];

// Calculate Haversine straight-line distance in km
export const calculateStraightLineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
};

// Generate curved road-like polyline points between two coordinates for offline fallback
const generateRoadCurvedPolyline = (
  start: [number, number],
  end: [number, number],
  segments = 8
): [number, number][] => {
  const points: [number, number][] = [start];
  for (let i = 1; i < segments; i++) {
    const fraction = i / segments;
    const lat = start[0] + (end[0] - start[0]) * fraction;
    const lng = start[1] + (end[1] - start[1]) * fraction;
    // Introduce minor realistic street curve perturbation
    const offset = Math.sin(fraction * Math.PI) * 0.003 * (i % 2 === 0 ? 1 : -1);
    points.push([Number((lat + offset).toFixed(5)), Number((lng - offset).toFixed(5))]);
  }
  points.push(end);
  return points;
};

class RoutingService {
  private cache = new Map<string, RouteResult>();

  // Search Address using Hyderabad Landmarks + Nominatim API fallback
  public async searchAddress(query: string): Promise<RoutePoint[]> {
    const clean = query.trim().toLowerCase();
    if (!clean || clean.length < 2) return [];

    // 1. Check local landmark matches first (instant & reliable)
    const matchedLandmarks = HYDERABAD_LANDMARKS.filter(
      l => l.name.toLowerCase().includes(clean) || l.area.toLowerCase().includes(clean)
    ).slice(0, 5).map(l => ({
      latitude: l.lat,
      longitude: l.lng,
      address: `${l.name}, Hyderabad`,
    }));

    if (matchedLandmarks.length >= 3) {
      return matchedLandmarks;
    }

    // 2. Query OpenStreetMap Nominatim with Hyderabad bounding box
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query + ', Hyderabad'
      )}&limit=5&addressdetails=1`;

      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
        },
      });

      if (res.ok) {
        const data = await res.json();
        const nominatimResults: RoutePoint[] = data.map((item: any) => ({
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          address: item.display_name.split(',').slice(0, 3).join(','),
        }));

        // Merge without duplicates
        const combined = [...matchedLandmarks];
        for (const nr of nominatimResults) {
          if (!combined.some(c => Math.abs(c.latitude - nr.latitude) < 0.005)) {
            combined.push(nr);
          }
        }
        return combined.slice(0, 6);
      }
    } catch {
      // Return local landmark matches if network request fails
    }

    return matchedLandmarks;
  }

  // Calculate road route distance via OSRM Public Routing Engine with return-trip support
  public async calculateRoadRoute(
    pickup: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    intermediateStops: { latitude: number; longitude: number }[] = [],
    isReturnTrip = false
  ): Promise<RouteResult> {
    const cacheKey = `${pickup.latitude},${pickup.longitude}->${destination.latitude},${destination.longitude}-stops:${intermediateStops.length}-return:${isReturnTrip}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Build outbound waypoints: pickup -> stops -> destination
    const outboundCoords: [number, number][] = [
      [pickup.longitude, pickup.latitude],
      ...intermediateStops.map(s => [s.longitude, s.latitude] as [number, number]),
      [destination.longitude, destination.latitude],
    ];

    try {
      const coordString = outboundCoords.map(c => `${c[0]},${c[1]}`).join(';');
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;

      const response = await fetch(osrmUrl);
      if (response.ok) {
        const data = await response.json();
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const mainRoute = data.routes[0];
          const outboundDistKm = Number((mainRoute.distance / 1000).toFixed(1));
          const durationMins = Math.round(mainRoute.duration / 60);

          // GeoJSON coordinates come as [lng, lat], Leaflet polyline expects [lat, lng]
          const outboundPolyline: [number, number][] = mainRoute.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]]
          );

          let returnDistKm = 0;
          let returnPolyline: [number, number][] = [];

          if (isReturnTrip) {
            // For return trip, route from destination back to pickup
            const returnCoordString = `${destination.longitude},${destination.latitude};${pickup.longitude},${pickup.latitude}`;
            const returnUrl = `https://router.project-osrm.org/route/v1/driving/${returnCoordString}?overview=full&geometries=geojson`;

            const returnRes = await fetch(returnUrl);
            if (returnRes.ok) {
              const returnData = await returnRes.json();
              if (returnData.code === 'Ok' && returnData.routes?.[0]) {
                returnDistKm = Number((returnData.routes[0].distance / 1000).toFixed(1));
                returnPolyline = returnData.routes[0].geometry.coordinates.map(
                  (c: [number, number]) => [c[1], c[0]]
                );
              }
            }
            if (returnDistKm === 0) {
              returnDistKm = outboundDistKm;
              returnPolyline = [...outboundPolyline].reverse();
            }
          }

          const result: RouteResult = {
            outboundDistanceKm: outboundDistKm,
            returnDistanceKm: returnDistKm,
            totalDistanceKm: Number((outboundDistKm + returnDistKm).toFixed(1)),
            durationMinutes: durationMins * (isReturnTrip ? 2 : 1),
            outboundPolyline,
            returnPolyline,
            isSimulatedFallback: false,
          };

          this.cache.set(cacheKey, result);
          return result;
        }
      }
    } catch {
      // Fallback to curvature-adjusted road estimate if OSRM is offline or rate-limited
    }

    // High-Fidelity Curvature Fallback (1.35x Hyderabad Urban/State Road Factor)
    const straightDist = calculateStraightLineDistance(
      pickup.latitude,
      pickup.longitude,
      destination.latitude,
      destination.longitude
    );

    const roadCurvatureFactor = 1.35;
    const outboundDistKm = Number((straightDist * roadCurvatureFactor).toFixed(1));
    const returnDistKm = isReturnTrip ? outboundDistKm : 0;
    const totalDistanceKm = Number((outboundDistKm + returnDistKm).toFixed(1));
    const durationMinutes = Math.round(outboundDistKm * 2.2 * (isReturnTrip ? 2 : 1));

    const outboundPolyline = generateRoadCurvedPolyline(
      [pickup.latitude, pickup.longitude],
      [destination.latitude, destination.longitude]
    );

    const returnPolyline = isReturnTrip
      ? generateRoadCurvedPolyline(
          [destination.latitude, destination.longitude],
          [pickup.latitude, pickup.longitude]
        )
      : [];

    const fallbackResult: RouteResult = {
      outboundDistanceKm: outboundDistKm,
      returnDistanceKm: returnDistKm,
      totalDistanceKm,
      durationMinutes,
      outboundPolyline,
      returnPolyline,
      isSimulatedFallback: true,
    };

    this.cache.set(cacheKey, fallbackResult);
    return fallbackResult;
  }
}

export const routingService = new RoutingService();

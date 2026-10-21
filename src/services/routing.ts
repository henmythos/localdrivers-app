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
  // IT & Tech Corridor
  { name: 'Cyber Towers, Hitec City', area: 'Hitec City', lat: 17.4504, lng: 78.3808 },
  { name: 'Mindspace IT Park, Madhapur', area: 'Madhapur', lat: 17.4418, lng: 78.3812 },
  { name: 'Inorbit Mall, Madhapur', area: 'Madhapur', lat: 17.4356, lng: 78.3869 },
  { name: 'IKEA Hyderabad, Hitec City', area: 'Hitec City', lat: 17.4412, lng: 78.3756 },
  { name: 'DLF Cyber City, Gachibowli', area: 'Gachibowli', lat: 17.4485, lng: 78.3562 },
  { name: 'Gachibowli Financial District', area: 'Financial District', lat: 17.4152, lng: 78.3377 },
  { name: 'Waverock SEZ, Nanakramguda', area: 'Nanakramguda', lat: 17.4208, lng: 78.3411 },
  { name: 'Amazon Campus, Financial District', area: 'Financial District', lat: 17.4165, lng: 78.3348 },
  { name: 'Microsoft Campus, Gachibowli', area: 'Gachibowli', lat: 17.4371, lng: 78.3482 },
  { name: 'IIIT Junction, Gachibowli', area: 'Gachibowli', lat: 17.4452, lng: 78.3491 },
  { name: 'One West Building, Nanakramguda', area: 'Nanakramguda', lat: 17.4184, lng: 78.3458 },
  { name: 'Kokapet SEZ / Golden Mile', area: 'Kokapet', lat: 17.3995, lng: 78.3245 },
  { name: 'Neopolis, Kokapet', area: 'Kokapet', lat: 17.3982, lng: 78.3189 },

  // Jubilee Hills & Banjara Hills Prime Zones
  { name: 'Road No. 36, Jubilee Hills', area: 'Jubilee Hills', lat: 17.4319, lng: 78.4073 },
  { name: 'Jubilee Hills Check Post', area: 'Jubilee Hills', lat: 17.4302, lng: 78.4185 },
  { name: 'Road No. 10, Jubilee Hills', area: 'Jubilee Hills', lat: 17.4385, lng: 78.4112 },
  { name: 'Road No. 45, Jubilee Hills', area: 'Jubilee Hills', lat: 17.4378, lng: 78.3989 },
  { name: 'Film Nagar, Jubilee Hills', area: 'Jubilee Hills', lat: 17.4172, lng: 78.4124 },
  { name: 'Banjara Hills Road No. 12', area: 'Banjara Hills', lat: 17.4156, lng: 78.4357 },
  { name: 'Banjara Hills Road No. 1 / Care Hospital', area: 'Banjara Hills', lat: 17.4168, lng: 78.4521 },
  { name: 'Banjara Hills Road No. 2 / Park Hyatt', area: 'Banjara Hills', lat: 17.4234, lng: 78.4389 },
  { name: 'Taj Krishna, Banjara Hills', area: 'Banjara Hills', lat: 17.4185, lng: 78.4485 },
  { name: 'Basavatarakam Cancer Hospital', area: 'Banjara Hills', lat: 17.4225, lng: 78.4312 },

  // Kondapur, Madhapur & Manikonda
  { name: 'Kondapur Main Road / RTO', area: 'Kondapur', lat: 17.4699, lng: 78.3578 },
  { name: 'Botanical Garden Road, Kondapur', area: 'Kondapur', lat: 17.4622, lng: 78.3568 },
  { name: 'Kothaguda Junction', area: 'Kondapur', lat: 17.4582, lng: 78.3645 },
  { name: 'Durgam Cheruvu Cable Bridge', area: 'Madhapur', lat: 17.4332, lng: 78.3888 },
  { name: 'Madhapur Metro Station', area: 'Madhapur', lat: 17.4398, lng: 78.3915 },
  { name: 'Manikonda Marrichettu Junction', area: 'Manikonda', lat: 17.4026, lng: 78.3868 },
  { name: 'Puppalguda Main Road', area: 'Manikonda', lat: 17.3985, lng: 78.3789 },
  { name: 'Lanco Hills, Manikonda', area: 'Manikonda', lat: 17.4089, lng: 78.3745 },

  // Kukatpally, Miyapur & North-West
  { name: 'Kukatpally Housing Board (KPHB)', area: 'Kukatpally', lat: 17.4849, lng: 78.4138 },
  { name: 'Forum Sujana Mall, KPHB', area: 'Kukatpally', lat: 17.4855, lng: 78.3892 },
  { name: 'JNTU Metro Station', area: 'Kukatpally', lat: 17.4982, lng: 78.3912 },
  { name: 'Miyapur Metro Station', area: 'Miyapur', lat: 17.4968, lng: 78.3614 },
  { name: 'Allwyn X Road, Miyapur', area: 'Miyapur', lat: 17.4988, lng: 78.3524 },
  { name: 'Chandanagar Main Road', area: 'Chandanagar', lat: 17.4925, lng: 78.3289 },
  { name: 'Hafeezpet Flyover', area: 'Hafeezpet', lat: 17.4812, lng: 78.3498 },
  { name: 'Bachupally X Roads', area: 'Bachupally', lat: 17.5342, lng: 78.3712 },
  { name: 'Nizampet Village Road', area: 'Nizampet', lat: 17.5142, lng: 78.3812 },
  { name: 'Nallagandla Flyover / Aparna', area: 'Nallagandla', lat: 17.4721, lng: 78.3145 },
  { name: 'Tellapur Road', area: 'Tellapur', lat: 17.4612, lng: 78.2989 },

  // Central, Begumpet, Secunderabad
  { name: 'Ameerpet Metro Junction', area: 'Ameerpet', lat: 17.4375, lng: 78.4482 },
  { name: 'Panjagutta Central Mall', area: 'Panjagutta', lat: 17.4268, lng: 78.4528 },
  { name: 'Somajiguda Raj Bhavan Road', area: 'Somajiguda', lat: 17.4221, lng: 78.4612 },
  { name: 'Begumpet Airport / Lifestyle', area: 'Begumpet', lat: 17.4513, lng: 78.4673 },
  { name: 'Secunderabad Railway Station', area: 'Secunderabad', lat: 17.4334, lng: 78.5046 },
  { name: 'Paradise Circle, Secunderabad', area: 'Secunderabad', lat: 17.4412, lng: 78.4875 },
  { name: 'Jubilee Bus Station (JBS)', area: 'Secunderabad', lat: 17.4521, lng: 78.4989 },
  { name: 'Clock Tower, Secunderabad', area: 'Secunderabad', lat: 17.4398, lng: 78.4985 },
  { name: 'Kompally Suchitra Circle', area: 'Kompally', lat: 17.5189, lng: 78.4712 },
  { name: 'Alwal / Bolarum', area: 'Alwal', lat: 17.5085, lng: 78.5124 },

  // South Hyderabad, Airport, Old City
  { name: 'Rajiv Gandhi International Airport (RGIA)', area: 'Shamshabad', lat: 17.2403, lng: 78.4294 },
  { name: 'Shamshabad Bus Stand & Toll Plaza', area: 'Shamshabad', lat: 17.2512, lng: 78.4312 },
  { name: 'Charminar Monument', area: 'Old City', lat: 17.3616, lng: 78.4747 },
  { name: 'Salar Jung Museum', area: 'Old City', lat: 17.3712, lng: 78.4802 },
  { name: 'Mehdipatnam Bus Station', area: 'Mehdipatnam', lat: 17.3912, lng: 78.4412 },
  { name: 'Golkonda Fort', area: 'Mehdipatnam', lat: 17.3833, lng: 78.4011 },
  { name: 'Tolichowki / Seven Tombs', area: 'Tolichowki', lat: 17.3949, lng: 78.4372 },
  { name: 'Attapur Pillar 140', area: 'Attapur', lat: 17.3742, lng: 78.4312 },

  // East Hyderabad & Ring Road
  { name: 'Uppal Metro & Cricket Stadium', area: 'Uppal', lat: 17.4012, lng: 78.5612 },
  { name: 'LB Nagar Ring Road Circle', area: 'LB Nagar', lat: 17.3512, lng: 78.5521 },
  { name: 'Dilsukhnagar Metro Station', area: 'Dilsukhnagar', lat: 17.3685, lng: 78.5289 },
  { name: 'Tarnaka Metro / Osmania University', area: 'Tarnaka', lat: 17.4285, lng: 78.5312 },
  { name: 'Habsiguda Main Road', area: 'Habsiguda', lat: 17.4124, lng: 78.5489 },
  { name: 'Nagole Metro Station', area: 'Nagole', lat: 17.3789, lng: 78.5612 },

  // Outstation Destinies from Hyderabad
  { name: 'Srisailam Temple Ghats', area: 'Outstation (AP)', lat: 16.0734, lng: 78.8687 },
  { name: 'Vijayawada Bus Station', area: 'Outstation (AP)', lat: 16.5062, lng: 80.6480 },
  { name: 'Warangal Fort & Thousand Pillar', area: 'Outstation (Telangana)', lat: 17.9784, lng: 79.5941 },
  { name: 'Yadadri Temple (Bhuvanagiri)', area: 'Outstation (Telangana)', lat: 17.5879, lng: 78.9482 },
  { name: 'Nagarjuna Sagar Dam', area: 'Outstation (Telangana)', lat: 16.5789, lng: 79.3124 },
  { name: 'Tirupati Balaji Temple', area: 'Outstation (AP)', lat: 13.6288, lng: 79.4192 },
  { name: 'Bangalore Electronic City', area: 'Outstation (KA)', lat: 12.8452, lng: 77.6602 },
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

  // Search Address using Hyderabad Landmarks + Photon/Nominatim Autocomplete APIs + Google Maps fallback
  public async searchAddress(query: string): Promise<RoutePoint[]> {
    const clean = query.trim().toLowerCase();
    if (!clean || clean.length < 2) return [];

    // 1. Check local landmark matches first (instant 0ms response)
    const matchedLandmarks = HYDERABAD_LANDMARKS.filter(
      l => l.name.toLowerCase().includes(clean) || l.area.toLowerCase().includes(clean)
    ).slice(0, 6).map(l => ({
      latitude: l.lat,
      longitude: l.lng,
      address: `${l.name}, Hyderabad`,
    }));

    // If query matches a landmark with high confidence, return immediately
    if (matchedLandmarks.length >= 4) {
      return matchedLandmarks;
    }

    // 2. Query Photon Komoot API (fast OpenStreetMap autocomplete search, geo-biased to Hyderabad 17.3850, 78.4867)
    try {
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=17.3850&lon=78.4867&limit=6`;
      const photonRes = await fetch(photonUrl, { signal: AbortSignal.timeout(3000) });
      if (photonRes.ok) {
        const photonData = await photonRes.json();
        if (photonData?.features && photonData.features.length > 0) {
          const photonResults: RoutePoint[] = photonData.features
            .filter((f: any) => f.geometry?.coordinates)
            .map((f: any) => {
              const p = f.properties || {};
              const title = [p.name, p.street, p.district || p.suburb, p.city || 'Hyderabad']
                .filter(Boolean)
                .join(', ');
              return {
                latitude: Number(f.geometry.coordinates[1].toFixed(5)),
                longitude: Number(f.geometry.coordinates[0].toFixed(5)),
                address: title || `${p.name || 'Location'}, Hyderabad`,
              };
            });

          const combined = [...matchedLandmarks];
          for (const item of photonResults) {
            if (!combined.some(c => calculateStraightLineDistance(c.latitude, c.longitude, item.latitude, item.longitude) < 0.2)) {
              combined.push(item);
            }
          }
          if (combined.length >= 3) {
            return combined.slice(0, 6);
          }
        }
      }
    } catch {
      // Photon fallback
    }

    // 3. Fallback to OpenStreetMap Nominatim with Hyderabad biasing
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query + ', Hyderabad'
      )}&limit=5&addressdetails=1`;

      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
        },
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        const data = await res.json();
        const nominatimResults: RoutePoint[] = data.map((item: any) => ({
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          address: item.display_name.split(',').slice(0, 3).join(','),
        }));

        const combined = [...matchedLandmarks];
        for (const nr of nominatimResults) {
          if (!combined.some(c => calculateStraightLineDistance(c.latitude, c.longitude, nr.latitude, nr.longitude) < 0.2)) {
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

  // Forward Geocode an address string to coordinates
  public async geocodeAddress(query: string): Promise<RoutePoint | null> {
    const clean = query.trim();
    if (!clean) return null;

    // Check if coordinates were entered in format "(17.43, 78.40)" or "17.43, 78.40"
    const coordMatch = clean.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= 15 && lat <= 20 && lng >= 76 && lng <= 82) {
        return { latitude: lat, longitude: lng, address: clean };
      }
    }

    const results = await this.searchAddress(clean);
    return results.length > 0 ? results[0] : null;
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

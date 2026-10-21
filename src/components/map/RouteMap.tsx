import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Compass } from 'lucide-react';
import { TripStop } from '../../types';

interface RouteMapProps {
  pickupCoords?: { latitude: number; longitude: number };
  destinationCoords?: { latitude: number; longitude: number };
  intermediateStops?: TripStop[];
  outboundPolyline?: [number, number][];
  returnPolyline?: [number, number][];
  isReturnTrip?: boolean;
  actualStartCoords?: { latitude: number; longitude: number };
  actualEndCoords?: { latitude: number; longitude: number };
  interactive?: boolean;
  activePinSelection?: 'pickup' | 'destination' | 'none' | string;
  onLocationSelect?: (type: string, coords: { latitude: number; longitude: number }) => void;
  height?: string;
}

// Custom clean SVG pin icons using L.divIcon
const createCustomPinIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="background-color: ${color}; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); border: 2px solid white; white-space: nowrap;">
          ${label}
        </div>
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${color};"></div>
      </div>
    `,
    iconSize: [60, 36],
    iconAnchor: [30, 36],
  });
};

export const RouteMap: React.FC<RouteMapProps> = ({
  pickupCoords,
  destinationCoords,
  intermediateStops = [],
  outboundPolyline = [],
  returnPolyline = [],
  isReturnTrip = false,
  actualStartCoords,
  actualEndCoords,
  interactive = false,
  activePinSelection = 'none',
  onLocationSelect,
  height = '320px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const defaultCenter: [number, number] = pickupCoords
        ? [pickupCoords.latitude, pickupCoords.longitude]
        : [17.4126, 78.4071]; // Hyderabad center

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 12,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      // OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      // Map cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Click Handler for Interactive Pin Selection
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!interactive || activePinSelection === 'none' || !onLocationSelect) return;
      onLocationSelect(activePinSelection, {
        latitude: Number(e.latlng.lat.toFixed(5)),
        longitude: Number(e.latlng.lng.toFixed(5)),
      });
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [interactive, activePinSelection, onLocationSelect]);

  // Redraw Markers and Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    const boundsPoints: [number, number][] = [];

    // 1. Planned Pickup Marker
    if (pickupCoords && pickupCoords.latitude && pickupCoords.longitude) {
      const pos: [number, number] = [pickupCoords.latitude, pickupCoords.longitude];
      boundsPoints.push(pos);
      const marker = L.marker(pos, {
        icon: createCustomPinIcon('#10b981', 'Pickup'),
        draggable: interactive && activePinSelection === 'pickup',
      });
      if (interactive && onLocationSelect) {
        marker.on('dragend', (e) => {
          const latlng = e.target.getLatLng();
          onLocationSelect('pickup', { latitude: latlng.lat, longitude: latlng.lng });
        });
      }
      marker.addTo(layerGroup);
    }

    // 2. Intermediate Stops
    intermediateStops.forEach((stop, idx) => {
      if (stop.latitude && stop.longitude) {
        const pos: [number, number] = [stop.latitude, stop.longitude];
        boundsPoints.push(pos);
        const isSelectedStop = activePinSelection === `stop-${idx}` || activePinSelection === `stop-${stop.id}`;
        const marker = L.marker(pos, {
          icon: createCustomPinIcon('#f59e0b', `Stop ${idx + 1}`),
          draggable: interactive && isSelectedStop,
        });
        if (interactive && onLocationSelect) {
          marker.on('dragend', (e) => {
            const latlng = e.target.getLatLng();
            onLocationSelect(`stop-${idx}`, { latitude: latlng.lat, longitude: latlng.lng });
          });
        }
        marker.addTo(layerGroup);
      }
    });

    // 3. Planned Destination Marker
    if (destinationCoords && destinationCoords.latitude && destinationCoords.longitude) {
      const pos: [number, number] = [destinationCoords.latitude, destinationCoords.longitude];
      boundsPoints.push(pos);
      const marker = L.marker(pos, {
        icon: createCustomPinIcon('#ef4444', 'Drop-off'),
        draggable: interactive && activePinSelection === 'destination',
      });
      if (interactive && onLocationSelect) {
        marker.on('dragend', (e) => {
          const latlng = e.target.getLatLng();
          onLocationSelect('destination', { latitude: latlng.lat, longitude: latlng.lng });
        });
      }
      marker.addTo(layerGroup);
    }

    // 4. Actual Recorded Start GPS Marker (if trip started)
    if (actualStartCoords && actualStartCoords.latitude && actualStartCoords.longitude) {
      const pos: [number, number] = [actualStartCoords.latitude, actualStartCoords.longitude];
      boundsPoints.push(pos);
      L.marker(pos, {
        icon: createCustomPinIcon('#3b82f6', 'Actual Start (GPS)'),
      }).addTo(layerGroup);
    }

    // 5. Actual Recorded End GPS Marker (if trip ended)
    if (actualEndCoords && actualEndCoords.latitude && actualEndCoords.longitude) {
      const pos: [number, number] = [actualEndCoords.latitude, actualEndCoords.longitude];
      boundsPoints.push(pos);
      L.marker(pos, {
        icon: createCustomPinIcon('#6366f1', 'Actual End (GPS)'),
      }).addTo(layerGroup);
    }

    // 6. Draw Outbound Road Route Polyline
    if (outboundPolyline.length > 0) {
      L.polyline(outboundPolyline, {
        color: '#2563eb',
        weight: 5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(layerGroup);
      outboundPolyline.forEach(p => boundsPoints.push(p));
    }

    // 7. Draw Return Road Route Polyline
    if (isReturnTrip && returnPolyline.length > 0) {
      L.polyline(returnPolyline, {
        color: '#7c3aed',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(layerGroup);
      returnPolyline.forEach(p => boundsPoints.push(p));
    }

    // Adjust Map View to Fit All Bounds
    if (boundsPoints.length > 1) {
      try {
        const bounds = L.latLngBounds(boundsPoints);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      } catch {}
    } else if (boundsPoints.length === 1) {
      map.setView(boundsPoints[0], 14);
    }
  }, [
    pickupCoords,
    destinationCoords,
    intermediateStops,
    outboundPolyline,
    returnPolyline,
    isReturnTrip,
    actualStartCoords,
    actualEndCoords,
    interactive,
    activePinSelection,
    onLocationSelect,
  ]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-inner z-0">
      <div ref={mapContainerRef} style={{ height, width: '100%' }} className="z-0" />

      {/* Interactive Helper Hint Badge */}
      {interactive && activePinSelection !== 'none' && (
        <div className="absolute top-3 left-3 z-[400] bg-slate-900/90 text-white backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-lg flex items-center gap-1.5 border border-white/20">
          <MapPin
            className={`w-3.5 h-3.5 ${
              activePinSelection === 'pickup'
                ? 'text-emerald-400'
                : activePinSelection === 'destination'
                ? 'text-red-400'
                : 'text-amber-400'
            }`}
          />
          <span>
            Click anywhere on the map to set{' '}
            {activePinSelection === 'pickup'
              ? 'Pickup Pin'
              : activePinSelection === 'destination'
              ? 'Destination Pin'
              : activePinSelection.startsWith('stop-')
              ? `Stop ${Number(activePinSelection.replace('stop-', '')) + 1} Pin`
              : 'Pin'}
          </span>
        </div>
      )}

      {/* Route Legend Overlay */}
      {(outboundPolyline.length > 0 || isReturnTrip) && (
        <div className="absolute bottom-2 left-2 z-[400] bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-700 shadow-md flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-blue-600 rounded-full inline-block"></span>
            <span>Outbound Route</span>
          </div>
          {isReturnTrip && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-purple-600 border-b border-dashed border-purple-600 inline-block"></span>
              <span>Return Route</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

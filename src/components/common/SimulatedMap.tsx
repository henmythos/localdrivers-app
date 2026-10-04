import React, { useState } from 'react';
import { MapPin, Navigation, Star, ShieldCheck, ChevronRight, Phone, X } from 'lucide-react';
import { Driver, UserLocation } from '../../types';

interface SimulatedMapProps {
  drivers: Driver[];
  userLocation: UserLocation;
  onSelectDriver: (driver: Driver) => void;
  onBookDriver?: (driver: Driver) => void;
}

export const SimulatedMap: React.FC<SimulatedMapProps> = ({
  drivers,
  userLocation,
  onSelectDriver,
  onBookDriver,
}) => {
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  // Map latitude/longitude to relative percentage coordinates inside our SVG map container
  // Center: Hyderabad Jubilee Hills (17.4126, 78.4071)
  const centerLat = userLocation.latitude;
  const centerLng = userLocation.longitude;

  const getRelativeXY = (lat: number, lng: number) => {
    // 0.05 lat/lng range equals 100% of map size
    const dx = (lng - centerLng) / 0.08;
    const dy = (centerLat - lat) / 0.08;

    const x = Math.max(12, Math.min(88, 50 + dx * 100));
    const y = Math.max(12, Math.min(88, 50 + dy * 100));
    return { x, y };
  };

  return (
    <div className="relative w-full h-[450px] sm:h-[540px] rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 shadow-xl select-none">
      
      {/* SVG Map Graphic Background (Stylized Dark Navigation Grid) */}
      <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Main Road Lines */}
        <path d="M -50 250 Q 300 200 800 350" stroke="#475569" strokeWidth="24" fill="none" opacity="0.6" />
        <path d="M -50 250 Q 300 200 800 350" stroke="#38bdf8" strokeWidth="4" fill="none" opacity="0.8" strokeDasharray="8 8" />

        <path d="M 400 -50 L 350 600" stroke="#475569" strokeWidth="18" fill="none" opacity="0.5" />
        <path d="M 150 -50 L 500 600" stroke="#334155" strokeWidth="12" fill="none" />
        <path d="M -50 100 L 800 150" stroke="#334155" strokeWidth="12" fill="none" />

        {/* Hyderabad Landmark Circles */}
        <circle cx="50%" cy="50%" r="140" fill="none" stroke="#0284c7" strokeWidth="1" strokeDasharray="6 6" opacity="0.4" />
        <circle cx="50%" cy="50%" r="240" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" opacity="0.2" />
      </svg>

      {/* Map Control Bar Overlay */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/80 text-white text-xs font-semibold flex items-center gap-2 shadow-lg pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>GPS Active: {userLocation.area}</span>
        </div>
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/80 text-emerald-400 text-xs font-bold shadow-lg pointer-events-auto">
          {drivers.length} Drivers Online
        </div>
      </div>

      {/* Customer Location Marker (Center) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center pointer-events-none">
        <div className="relative flex items-center justify-center">
          <span className="absolute w-12 h-12 rounded-full bg-brand-500/30 animate-ping-slow" />
          <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
            <Navigation className="w-5 h-5 fill-current" />
          </div>
        </div>
        <div className="mt-1 px-2.5 py-0.5 rounded-full bg-slate-900/90 text-white text-[10px] font-bold border border-slate-700 shadow-md whitespace-nowrap">
          Your Location
        </div>
      </div>

      {/* Driver Markers */}
      {drivers.map(driver => {
        const { x, y } = getRelativeXY(driver.latitude, driver.longitude);
        const isSelected = selectedDriver?.id === driver.id;

        return (
          <div
            key={driver.id}
            style={{ left: `${x}%`, top: `${y}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 z-30 cursor-pointer group ${
              isSelected ? 'scale-125 z-40' : 'hover:scale-110'
            }`}
            onClick={() => {
              setSelectedDriver(driver);
              onSelectDriver(driver);
            }}
          >
            <div className="relative">
              {/* Distance badge above marker */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900/95 text-slate-200 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-slate-700 shadow-md whitespace-nowrap flex items-center gap-1">
                <span>{driver.distanceKm} km</span>
                {driver.verificationBadge && <ShieldCheck className="w-3 h-3 text-emerald-400 inline" />}
              </div>

              {/* Marker Circle */}
              <div className={`w-10 h-10 rounded-full p-0.5 shadow-xl border-2 transition-colors ${
                isSelected 
                  ? 'border-brand-500 bg-brand-500 ring-4 ring-brand-500/30' 
                  : 'border-white bg-slate-800 hover:border-brand-400'
              }`}>
                <img
                  src={driver.photo}
                  alt={driver.name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>

              {/* Online Indicator */}
              {driver.isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
              )}
            </div>
          </div>
        );
      })}

      {/* Selected Driver Popup Drawer at bottom of map */}
      {selectedDriver && (
        <div className="absolute bottom-4 left-4 right-4 z-40 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={selectedDriver.photo}
                alt={selectedDriver.name}
                className="w-14 h-14 rounded-xl object-cover border-2 border-slate-200 shadow"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-slate-900 text-base">{selectedDriver.name}</h4>
                  {selectedDriver.verificationBadge && (
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                  <span className="flex items-center text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-current mr-0.5" />
                    {selectedDriver.rating}
                  </span>
                  <span>•</span>
                  <span>{selectedDriver.experienceYears} yrs exp</span>
                  <span>•</span>
                  <span className="font-semibold text-brand-700">{selectedDriver.distanceKm} km away</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {selectedDriver.services.slice(0, 3).map((srv, idx) => (
                    <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-full">
                      {srv}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedDriver(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <div>
              <span className="text-[11px] text-slate-500 block">Starting from</span>
              <span className="text-base font-extrabold text-slate-900">₹{selectedDriver.startingPrice}<span className="text-xs font-normal text-slate-500">/hr</span></span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectDriver(selectedDriver)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
              >
                View Profile
              </button>
              {onBookDriver && (
                <button
                  onClick={() => onBookDriver(selectedDriver)}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-600/20 transition-all flex items-center gap-1"
                >
                  Book Now
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Map Footer Info */}
      <div className="absolute bottom-3 left-4 text-[10px] text-slate-400 pointer-events-none hidden sm:block">
        Simulated Live Location Network • Hyderabad Metropolitan Area
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { MapPin, Navigation, X, Check, Search, Compass, Loader2 } from 'lucide-react';
import { UserLocation } from '../../types';
import { HYDERABAD_POPULAR_AREAS, locationService } from '../../services/location';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: UserLocation;
  onSelectLocation: (location: UserLocation) => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation,
}) => {
  const [customInput, setCustomInput] = useState('');
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUseGps = () => {
    setIsGpsLoading(true);
    setGpsError(null);

    if (!('geolocation' in navigator)) {
      setGpsError('Geolocation is not supported by your browser.');
      setIsGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const fetchedLocation = await locationService.reverseGeocode(
            pos.coords.latitude,
            pos.coords.longitude
          );
          onSelectLocation(fetchedLocation);
          onClose();
        } catch (e) {
          console.error('Failed to process GPS location:', e);
          onSelectLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            address: `GPS Location (${pos.coords.latitude.toFixed(4)}°, ${pos.coords.longitude.toFixed(4)}°)`,
            area: 'Near You',
            city: 'Hyderabad',
            isFallback: false,
          });
          onClose();
        } finally {
          setIsGpsLoading(false);
        }
      },
      (err) => {
        console.warn('GPS Error:', err);
        setGpsError('Could not fetch GPS position. Please check location permissions or select an area below.');
        setIsGpsLoading(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSelectArea = (area: typeof HYDERABAD_POPULAR_AREAS[0]) => {
    const newLoc: UserLocation = {
      latitude: area.lat,
      longitude: area.lng,
      address: area.address,
      area: area.area,
      city: 'Hyderabad',
      isFallback: false,
    };
    onSelectLocation(newLoc);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    const formattedArea = customInput.trim();
    const newLoc: UserLocation = {
      latitude: 17.4126, // Center Hyderabad default coords if search query
      longitude: 78.4071,
      address: `${formattedArea}, Hyderabad`,
      area: formattedArea,
      city: 'Hyderabad',
      isFallback: false,
    };

    onSelectLocation(newLoc);
    setCustomInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 fill-emerald-200" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">Your Search Location</h2>
              <p className="text-xs text-slate-500 font-medium">Select your pickup area in Hyderabad</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* Current Selected Location Banner */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                Currently Active
              </span>
              <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                {currentLocation.address}
              </p>
            </div>
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* GPS Auto Detection Button */}
          <div>
            <button
              onClick={handleUseGps}
              disabled={isGpsLoading}
              className="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-75 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-brand-600/25 flex items-center justify-center gap-2.5 transition-all"
            >
              {isGpsLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Fetching GPS & Reverse Geocoding...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 fill-current" />
                  <span>Use My Current Live Location (GPS)</span>
                </>
              )}
            </button>
            {gpsError && (
              <p className="text-[11px] text-red-600 font-medium mt-1.5 text-center px-2">
                {gpsError}
              </p>
            )}
          </div>

          {/* Custom Address Input */}
          <form onSubmit={handleCustomSubmit} className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 block">
              Type Custom Area or Street Name
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="e.g. Road No. 10 Banjara Hills, Financial District..."
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
              <button
                type="submit"
                disabled={!customInput.trim()}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
              >
                Set Location
              </button>
            </div>
          </form>

          {/* Popular Hyderabad Hubs */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Popular Hyderabad Areas
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">12 Key Hubs</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {HYDERABAD_POPULAR_AREAS.map((area) => {
                const isSelected = currentLocation.area.toLowerCase() === area.area.toLowerCase();
                return (
                  <button
                    key={area.name}
                    onClick={() => handleSelectArea(area)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-brand-50 border-brand-300 text-brand-900 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/80 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-xs">{area.name}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                      {area.address}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
          <p className="text-[11px] text-slate-500 font-medium">
            Driver distance & availability are calculated relative to your selected location.
          </p>
        </div>

      </div>
    </div>
  );
};

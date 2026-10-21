import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, X, Loader2, Navigation, Compass, Check } from 'lucide-react';
import { routingService, RoutePoint, HYDERABAD_LANDMARKS } from '../../services/routing';

interface LocationSearchInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelectLocation: (point: { latitude: number; longitude: number; address: string }) => void;
  placeholder?: string;
  dotColor?: 'emerald' | 'red' | 'amber';
  onUseGps?: () => void;
  isGpsLoading?: boolean;
  onToggleMapPin?: () => void;
  isSettingOnMap?: boolean;
  showQuickPicks?: boolean;
}

const POPULAR_QUICK_PICKS = [
  { name: 'RGIA Airport', query: 'Rajiv Gandhi International Airport (RGIA)' },
  { name: 'Jubilee Hills Rd 36', query: 'Road No. 36, Jubilee Hills' },
  { name: 'Cyber Towers', query: 'Cyber Towers, Hitec City' },
  { name: 'Inorbit Mall', query: 'Inorbit Mall, Madhapur' },
  { name: 'Gachibowli DLF', query: 'DLF Cyber City, Gachibowli' },
  { name: 'Secunderabad Stn', query: 'Secunderabad Railway Station' },
];

export const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  label,
  value,
  onChange,
  onSelectLocation,
  placeholder = 'Type address, landmark or area...',
  dotColor = 'emerald',
  onUseGps,
  isGpsLoading = false,
  onToggleMapPin,
  isSettingOnMap = false,
  showQuickPicks = false,
}) => {
  const [suggestions, setSuggestions] = useState<RoutePoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search-as-you-type
  useEffect(() => {
    if (!hasInteracted) return;
    const clean = value.trim();
    if (clean.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    let isCurrent = true;
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await routingService.searchAddress(clean);
        if (isCurrent) {
          setSuggestions(results);
          setIsOpen(results.length > 0);
        }
      } catch {
        if (isCurrent) setSuggestions([]);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }, 200);

    return () => {
      isCurrent = false;
      clearTimeout(timeoutId);
    };
  }, [value, hasInteracted]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: RoutePoint) => {
    onChange(item.address);
    onSelectLocation(item);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      } else if (value.trim()) {
        setIsLoading(true);
        const resolved = await routingService.geocodeAddress(value.trim());
        setIsLoading(false);
        if (resolved) {
          handleSelect(resolved);
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setIsOpen(false);
  };

  const dotClasses =
    dotColor === 'emerald'
      ? 'bg-emerald-500 ring-emerald-100'
      : dotColor === 'red'
      ? 'bg-red-500 ring-red-100'
      : 'bg-amber-500 ring-amber-100';

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Header with Label and Action Buttons */}
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${dotClasses} ring-2 inline-block`} />
          <span>{label}</span>
        </label>

        <div className="flex items-center gap-2">
          {onUseGps && (
            <button
              type="button"
              onClick={onUseGps}
              disabled={isGpsLoading}
              className="text-[11px] text-brand-600 hover:text-brand-800 font-bold flex items-center gap-1 bg-brand-50 hover:bg-brand-100 px-2 py-0.5 rounded-lg transition-colors disabled:opacity-50"
              title="Automatically detect current GPS coordinates"
            >
              {isGpsLoading ? (
                <Loader2 className="w-3 h-3 animate-spin text-brand-600" />
              ) : (
                <Compass className="w-3 h-3 text-brand-600" />
              )}
              <span>{isGpsLoading ? 'Locating...' : 'Auto GPS'}</span>
            </button>
          )}

          {onToggleMapPin && (
            <button
              type="button"
              onClick={onToggleMapPin}
              className={`text-[11px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg transition-all ${
                isSettingOnMap
                  ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-900'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Navigation className="w-3 h-3" />
              <span>{isSettingOnMap ? 'Tap Map' : 'Set on Map'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Input Field */}
      <div className="relative flex items-center">
        <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          type="text"
          value={value}
          onChange={e => {
            setHasInteracted(true);
            onChange(e.target.value);
          }}
          onFocus={() => {
            setHasInteracted(true);
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-sm transition-all"
        />

        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Quick Picks for One-Tap Selection */}
      {showQuickPicks && !value && (
        <div className="mt-1.5 flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Popular:</span>
          {POPULAR_QUICK_PICKS.map(qp => (
            <button
              key={qp.name}
              type="button"
              onClick={async () => {
                setHasInteracted(true);
                onChange(qp.query);
                setIsLoading(true);
                const point = await routingService.geocodeAddress(qp.query);
                setIsLoading(false);
                if (point) {
                  onSelectLocation(point);
                }
              }}
              className="shrink-0 px-2 py-0.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-600 rounded-lg text-[10px] font-bold transition-colors border border-slate-200"
            >
              {qp.name}
            </button>
          ))}
        </div>
      )}

      {/* Autocomplete Dropdown List */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-[500] max-h-60 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Suggested Locations</span>
            <span>{suggestions.length} places found</span>
          </div>
          {suggestions.map((item, idx) => {
            const parts = item.address.split(',');
            const primary = parts[0] || item.address;
            const secondary = parts.slice(1).join(',').trim();

            return (
              <button
                key={`${item.latitude}-${item.longitude}-${idx}`}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full px-3 py-2 text-left hover:bg-brand-50/70 flex items-start gap-2.5 transition-colors group"
              >
                <div className="p-1 bg-slate-100 group-hover:bg-brand-100 text-slate-500 group-hover:text-brand-600 rounded-lg shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 group-hover:text-brand-700 truncate">
                    {primary}
                  </div>
                  {secondary && (
                    <div className="text-[11px] text-slate-500 truncate font-medium">
                      {secondary}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Filter, Search, Map as MapIcon, List, Star, ShieldCheck, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Driver, FilterState, UserLocation } from '../types';
import { driversService } from '../services/drivers';
import { INITIAL_SERVICES } from '../services/database';
import { DriverCard } from '../components/driver/DriverCard';
import { SimulatedMap } from '../components/common/SimulatedMap';
import { BookingModal } from '../components/booking/BookingModal';

interface FindDriversPageProps {
  userLocation: UserLocation;
  onRequestLocation: () => void;
}

export const FindDriversPage: React.FC<FindDriversPageProps> = ({ userLocation, onRequestLocation }) => {
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([]);
  const [selectedDriverForBooking, setSelectedDriverForBooking] = useState<Driver | null>(null);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    service: 'All',
    maxDistance: 10,
    minExperience: 0,
    minRating: 0,
    availableOnly: false,
  });

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    const list = driversService.getApprovedDrivers();
    setAllDrivers(list);
  }, []);

  useEffect(() => {
    const result = driversService.filterDrivers(allDrivers, filters);
    setFilteredDrivers(result);
  }, [allDrivers, filters]);

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      service: 'All',
      maxDistance: 10,
      minExperience: 0,
      minRating: 0,
      availableOnly: false,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-12">
      
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Find Drivers Near You</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-brand-50 text-brand-700 border border-brand-200">
              {filteredDrivers.length} Found
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span>Search Area: <strong>{userLocation.area}, {userLocation.city}</strong></span>
            <button
              onClick={onRequestLocation}
              className="text-brand-600 hover:underline font-bold ml-1"
            >
              Update Location
            </button>
          </div>
        </div>

        {/* View Mode Toggle Button */}
        <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-2xl shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'map'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            MAP VIEW
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-4 h-4" />
            LIST VIEW
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft mb-6 space-y-4">
        
        {/* Top Search & Quick Service Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={e => setFilters({ ...filters, searchQuery: e.target.value })}
              placeholder="Search by driver name, area (e.g. Jubilee Hills, Banjara Hills)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setFilters({ ...filters, service: 'All' })}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                filters.service === 'All'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Services
            </button>
            {INITIAL_SERVICES.map(srv => (
              <button
                key={srv.id}
                onClick={() => setFilters({ ...filters, service: srv.title })}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  filters.service === srv.title
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {srv.title}
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Filters (Distance, Experience, Rating, Online) */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          
          {/* Distance Filter */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Max Distance: <span className="text-brand-600">{filters.maxDistance} km</span>
            </label>
            <input
              type="range"
              min="1"
              max="15"
              step="0.5"
              value={filters.maxDistance}
              onChange={e => setFilters({ ...filters, maxDistance: parseFloat(e.target.value) })}
              className="w-full accent-brand-600 cursor-pointer"
            />
          </div>

          {/* Min Experience */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Experience: <span className="text-brand-600">{filters.minExperience === 0 ? 'Any' : `${filters.minExperience}+ yrs`}</span>
            </label>
            <select
              value={filters.minExperience}
              onChange={e => setFilters({ ...filters, minExperience: parseInt(e.target.value) })}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
            >
              <option value="0">Any Experience</option>
              <option value="5">5+ Years</option>
              <option value="8">8+ Years</option>
              <option value="10">10+ Years</option>
            </select>
          </div>

          {/* Min Rating */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Rating: <span className="text-amber-500 font-extrabold">{filters.minRating === 0 ? 'Any' : `${filters.minRating} & above`}</span>
            </label>
            <select
              value={filters.minRating}
              onChange={e => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
            >
              <option value="0">Any Rating</option>
              <option value="4.5">4.5 Rating & above</option>
              <option value="4.8">4.8 Rating & above</option>
              <option value="4.9">4.9 Rating & above</option>
            </select>
          </div>

          {/* Online Toggle & Reset */}
          <div className="flex items-center justify-between gap-2 pt-4">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
              <input
                type="checkbox"
                checked={filters.availableOnly}
                onChange={e => setFilters({ ...filters, availableOnly: e.target.checked })}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 accent-brand-600"
              />
              <span>Online Only</span>
            </label>

            <button
              onClick={resetFilters}
              className="text-slate-400 hover:text-slate-600 flex items-center gap-1 font-semibold text-[11px]"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

        </div>
      </div>

      {/* VIEW RENDER */}
      {viewMode === 'map' ? (
        <div className="space-y-6">
          <SimulatedMap
            drivers={filteredDrivers}
            userLocation={userLocation}
            onSelectDriver={(d) => navigate(`/drivers/${d.id}`)}
            onBookDriver={(d) => setSelectedDriverForBooking(d)}
          />

          {/* Compact driver cards list under map */}
          <div>
            <h3 className="font-bold text-slate-900 text-lg mb-3">Nearby Drivers ({filteredDrivers.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDrivers.map(driver => (
                <DriverCard
                  key={driver.id}
                  driver={driver}
                  onSelect={(d) => navigate(`/drivers/${d.id}`)}
                  onBook={(d) => setSelectedDriverForBooking(d)}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* LIST VIEW ONLY */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDrivers.length > 0 ? (
            filteredDrivers.map(driver => (
              <DriverCard
                key={driver.id}
                driver={driver}
                onSelect={(d) => navigate(`/drivers/${d.id}`)}
                onBook={(d) => setSelectedDriverForBooking(d)}
              />
            ))
          ) : (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200">
              <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-lg">No Drivers Match Your Filters</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">Try relaxing your distance or rating filters.</p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Booking Modal */}
      {selectedDriverForBooking && (
        <BookingModal
          driver={selectedDriverForBooking}
          onClose={() => setSelectedDriverForBooking(null)}
          onBookingComplete={(b) => console.log('Booking completed:', b)}
        />
      )}
    </div>
  );
};

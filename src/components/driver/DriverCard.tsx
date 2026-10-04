import React from 'react';
import { Star, ShieldCheck, MapPin, Award, Languages, Car, ChevronRight } from 'lucide-react';
import { Driver } from '../../types';

interface DriverCardProps {
  driver: Driver;
  onSelect: (driver: Driver) => void;
  onBook: (driver: Driver) => void;
}

export const DriverCard: React.FC<DriverCardProps> = ({ driver, onSelect, onBook }) => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-soft hover:shadow-card transition-all duration-200 group flex flex-col justify-between">
      <div>
        {/* Top Info Header */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <img
              src={driver.photo}
              alt={driver.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-slate-100 shadow-sm group-hover:scale-105 transition-transform"
            />
            {driver.isOnline ? (
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500 text-white border-2 border-white shadow-sm">
                ONLINE
              </span>
            ) : (
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-400 text-white border-2 border-white">
                OFFLINE
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 
                  onClick={() => onSelect(driver)}
                  className="font-bold text-slate-900 text-base sm:text-lg truncate group-hover:text-brand-600 transition-colors cursor-pointer"
                >
                  {driver.name}
                </h3>
                {driver.verificationBadge && (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
              </div>
              <span className="text-[10px] font-black font-mono bg-brand-50 text-brand-900 px-2 py-0.5 rounded border border-brand-200 shrink-0" title="Unique Driver Code">
                #{driver.driverCode || 'A1B2C3'}
              </span>
            </div>

            {/* Rating & Trips */}
            <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
              <span className="inline-flex items-center text-amber-500 font-extrabold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                <Star className="w-3.5 h-3.5 fill-current mr-1" />
                {driver.rating}
              </span>
              <span className="text-slate-400">•</span>
              <span className="font-semibold text-slate-700">{driver.totalTrips.toLocaleString()} trips</span>
              <span className="text-slate-400">•</span>
              <span className="font-medium text-slate-600">{driver.experienceYears}+ yrs exp</span>
            </div>

            {/* Distance & Area */}
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
              <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              <span className="font-bold text-brand-700">{driver.distanceKm} km away</span>
              <span className="text-slate-400">({driver.area})</span>
            </div>
          </div>
        </div>

        {/* Services & Vehicle Categories */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
          {driver.services.map((service, idx) => (
            <span
              key={idx}
              className="text-xs bg-slate-100 text-slate-700 font-medium px-2.5 py-1 rounded-lg"
            >
              {service}
            </span>
          ))}
        </div>

        {/* Languages & Transmission */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Languages className="w-3.5 h-3.5 text-slate-400" />
            <span>{driver.languages.join(', ')}</span>
          </div>
          <div className="flex items-center gap-1 font-medium text-slate-700">
            <Car className="w-3.5 h-3.5 text-slate-400" />
            <span>{driver.vehicleCategories.slice(0, 2).join(', ')}</span>
          </div>
        </div>
      </div>

      {/* Pricing & CTA Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Starting at</span>
          <div className="text-lg font-black text-slate-900 leading-none">
            ₹{driver.startingPrice}
            <span className="text-xs font-normal text-slate-500 ml-0.5">/hr</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelect(driver)}
            className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Profile
          </button>
          <button
            onClick={() => onBook(driver)}
            className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition-all flex items-center gap-1"
          >
            Book Driver
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

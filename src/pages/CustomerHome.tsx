import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, ChevronDown, ChevronRight, Clock, Calendar, User, Car, 
  ShieldCheck, Star, Navigation, AlertTriangle, Headphones, Shield, Sparkles 
} from 'lucide-react';
import { Driver, UserLocation, ServiceCategory } from '../types';
import { driversService } from '../services/drivers';
import { dbService } from '../services/database';
import { DriverCard } from '../components/driver/DriverCard';
import { BookingModal } from '../components/booking/BookingModal';

interface CustomerHomeProps {
  userLocation: UserLocation;
  onRequestLocation: () => void;
}

export const CustomerHome: React.FC<CustomerHomeProps> = ({ userLocation, onRequestLocation }) => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [selectedDriverForBooking, setSelectedDriverForBooking] = useState<Driver | null>(null);
  const [preselectedService, setPreselectedService] = useState<any>(undefined);

  const loadData = () => {
    setDrivers(driversService.getApprovedDrivers());
    setServices(dbService.getServices());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = dbService.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  const handleSelectCategory = (serviceName: string) => {
    setPreselectedService(serviceName);
    const driver = drivers.find(d => d.services.includes(serviceName as any)) || drivers[0];
    if (driver) {
      setSelectedDriverForBooking(driver);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/60 pb-24 md:pb-12">
      
      {/* HERO SECTION WITH CHARMINAR BANNER */}
      <section className="relative bg-gradient-to-b from-[#e0f2fe] via-[#f0f9ff] to-slate-100 pt-4 pb-6 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          
          {/* Banner Graphic matching media_1791082708446.png */}
          <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200/60 bg-white">
            <img
              src="/charminar-banner.png"
              alt="Hyderabad Drivers at Your Service"
              className="w-full h-44 sm:h-56 md:h-64 object-cover object-right"
            />

            {/* Floating Banner Overlay for small screens */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent p-5 sm:p-8 flex flex-col justify-center max-w-lg">
              <h1 className="text-2xl sm:text-4xl font-black text-navy-900 leading-tight">
                Hyderabad
              </h1>
              <p className="text-lg sm:text-2xl font-bold text-navy-900 mt-0.5">
                Drivers at Your Service
              </p>

              <div className="mt-3 sm:mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-400 text-navy-900 font-extrabold text-xs shadow-sm self-start">
                <Clock className="w-4 h-4 fill-current stroke-none" />
                <span>24 Hours Available</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* MAIN CONTENT CONTAINER */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 -mt-2">
        
        {/* YOUR LOCATION SELECTOR CARD */}
        <div 
          onClick={onRequestLocation}
          className="bg-white rounded-2xl p-4 shadow-soft border border-slate-200/80 flex items-center justify-between cursor-pointer hover:border-brand-400 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-emerald-600 fill-emerald-100" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-slate-900 block">Your Location</span>
              <span className="text-xs text-slate-500 font-medium">{userLocation.address}</span>
            </div>
          </div>

          <ChevronDown className="w-5 h-5 text-slate-400" />
        </div>

        {/* "WHAT DO YOU NEED?" SECTION TITLE */}
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mb-3">
            What do you need?
          </h2>

          {/* 4 SERVICE CATEGORY CARDS MATCHING EXACT MOCKUP PALETTE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 1. DRIVER NOW (Light Sky Blue) */}
            <div
              onClick={() => handleSelectCategory('City Driver')}
              className="bg-cardBlue-bg border border-cardBlue-border rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative flex flex-col justify-between group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700 font-bold">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-navy-900 text-base group-hover:text-brand-600 transition-colors">
                      1. Driver Now
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">Book a driver for your trip</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>

              <div className="mt-4 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-cardBlue-text border border-blue-200 shadow-xs">
                  <Clock className="w-3.5 h-3.5" />
                  4H / 8H / 24H
                </span>
              </div>
            </div>

            {/* 2. HOURS & DAY (Light Mint Green) */}
            <div
              onClick={() => handleSelectCategory('Outstation Driver')}
              className="bg-cardGreen-bg border border-cardGreen-border rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative flex flex-col justify-between group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <Calendar className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-navy-900 text-base group-hover:text-emerald-700 transition-colors">
                      2. Hours & Day
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">Plan your ride in advance</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>

              <div className="mt-4 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-cardGreen-text border border-emerald-200 shadow-xs">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  Select Date & Time
                </span>
              </div>
            </div>

            {/* 3. PERMANENT DRIVER (Light Lavender) */}
            <div
              onClick={() => handleSelectCategory('Monthly Driver')}
              className="bg-cardPurple-bg border border-cardPurple-border rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative flex flex-col justify-between group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-navy-900 text-base group-hover:text-purple-700 transition-colors">
                      3. Permanent Driver
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">For your daily needs</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>

              <div className="mt-4 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-cardPurple-text border border-purple-200 shadow-xs">
                  ₹ {(services.find(s => s.title === 'Monthly Driver')?.startingPrice || 28000).toLocaleString('en-IN')} / month
                </span>
              </div>
            </div>

            {/* 4. CAR + DRIVER / SELF DRIVE (Light Peach/Orange) */}
            <div
              onClick={() => handleSelectCategory('VIP Driver')}
              className="bg-cardPeach-bg border border-cardPeach-border rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative flex flex-col justify-between group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700">
                    <Car className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-navy-900 text-base group-hover:text-orange-700 transition-colors">
                      4. Car + Driver / Self Drive
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">
                      Premium Cars • Location Tracking • SOS
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>

              <div className="mt-4 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-cardPeach-text border border-orange-200 shadow-xs">
                  <Car className="w-3.5 h-3.5 text-orange-600" />
                  BMW • Audi • Mercedes etc.
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* PREMIUM CAR SERVICE PROMO BANNER (DARK NAVY) */}
        <div className="bg-navy-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left z-10">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-navy-800 px-2.5 py-0.5 rounded">
              PREMIUM CAR SERVICE
            </span>
            <h3 className="text-xl font-black text-white">Top End Models Available</h3>
            <p className="text-xs text-sky-200 font-medium">
              BMW | Audi | Mercedes | Volvo | Jaguar
            </p>
          </div>

          <div className="flex items-center gap-4 z-10">
            <div className="bg-yellow-400 text-navy-900 p-3 rounded-2xl text-center shadow-lg shrink-0">
              <span className="text-[10px] font-extrabold uppercase block">
                {services.find(s => s.title === 'VIP Driver')?.minimumHours || 4} Hours Base
              </span>
              <span className="text-xl font-black block leading-none">
                ₹{services.find(s => s.title === 'VIP Driver')?.startingPrice || 1000}
              </span>
              <span className="text-[9px] font-bold text-navy-800 block mt-0.5">
                + ₹{services.find(s => s.title === 'VIP Driver')?.extraHourRate || 250} / Extra Hour
              </span>
            </div>
          </div>
        </div>

        {/* TRUST BADGES ROW (5 CIRCULAR BADGES) */}
        <div className="bg-white rounded-2xl p-4 shadow-soft border border-slate-200/80 grid grid-cols-5 gap-2 text-center">
          
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 leading-tight">Verified Drivers</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-1">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 leading-tight">Customer Ratings</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 leading-tight">Live Location (Optional)</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-1">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 leading-tight">SOS Emergency</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-1">
              <Headphones className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 leading-tight">24/7 Support</span>
          </div>

        </div>

        {/* NEARBY DRIVERS LIST SECTION */}
        <section className="pt-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-navy-900">Drivers Near You</h2>
            <button
              onClick={() => navigate('/find-drivers')}
              className="text-xs font-bold text-brand-600 hover:underline"
            >
              View Map ({drivers.length})
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drivers.slice(0, 4).map(driver => (
              <DriverCard
                key={driver.id}
                driver={driver}
                onSelect={(d) => navigate(`/drivers/${d.id}`)}
                onBook={(d) => setSelectedDriverForBooking(d)}
              />
            ))}
          </div>
        </section>

        {/* WEBSITE & PLAY STORE COMPLIANCE FOOTER */}
        <footer className="mt-12 pt-8 border-t border-slate-200 text-slate-600 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <img src="/logo.png" alt="Localdrivers Hyderabad" className="h-9 object-contain" />
              <p className="text-xs text-slate-500 max-w-sm">
                Hyderabad's trusted on-demand driver booking platform. Your Driver. Your Journey.
              </p>
              <p className="text-[11px] font-mono text-slate-500">
                Support: <a href="mailto:localdrivers.in@gmail.com" className="font-bold text-brand-600 hover:underline">localdrivers.in@gmail.com</a>
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-6 text-xs font-bold text-slate-700">
              <Link to="/about" className="hover:text-brand-600 transition-colors">About Us</Link>
              <Link to="/contact" className="hover:text-brand-600 transition-colors">Contact Support</Link>
              <Link to="/privacy" className="hover:text-brand-600 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-brand-600 transition-colors">Terms of Service</Link>
              <Link to="/cancellation" className="hover:text-brand-600 transition-colors">Cancellation Policy</Link>
              <Link to="/data-deletion" className="hover:text-red-600 transition-colors">Data Deletion</Link>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <span>© 2026 Localdrivers (localdrivers.in). All rights reserved.</span>
            <span>Jubilee Hills, Hyderabad, Telangana 500033</span>
          </div>
        </footer>

      </div>

      {/* BOOKING MODAL */}
      {selectedDriverForBooking && (
        <BookingModal
          driver={selectedDriverForBooking}
          preselectedService={preselectedService}
          onClose={() => {
            setSelectedDriverForBooking(null);
            setPreselectedService(undefined);
          }}
          onBookingComplete={(b) => console.log('Booking completed:', b)}
        />
      )}
    </div>
  );
};

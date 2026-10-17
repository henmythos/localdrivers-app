import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, ChevronDown, ChevronRight, Clock, Calendar, User, Car, 
  ShieldCheck, Star, Navigation, AlertTriangle, Headphones, Shield, Sparkles, Phone 
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
  const [activeFilterChip, setActiveFilterChip] = useState<'all' | 'top_rated' | 'nearby' | 'available'>('all');

  const loadData = () => {
    const rawDrivers = driversService.getApprovedDrivers();
    const sorted = driversService.filterDrivers(
      rawDrivers,
      {
        searchQuery: '',
        service: 'All',
        maxDistance: 30,
        minExperience: 0,
        minRating: 0,
        availableOnly: false,
      },
      userLocation
    );
    setDrivers(sorted);
    setServices(dbService.getServices());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = dbService.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [userLocation]);

  const handleSelectCategory = (serviceName: string) => {
    setPreselectedService(serviceName);
    const driver = drivers.find(d => d.services.includes(serviceName as any)) || drivers[0];
    if (driver) {
      setSelectedDriverForBooking(driver);
    }
  };

  const displayedDrivers = drivers.filter(d => {
    if (activeFilterChip === 'top_rated') return d.rating >= 4.8;
    if (activeFilterChip === 'nearby') return d.distanceKm <= 5.0;
    if (activeFilterChip === 'available') return d.isOnline;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-100/60 pb-24 md:pb-12">
      
      {/* HERO SECTION WITH CHARMINAR BANNER */}
      <section className="relative bg-gradient-to-b from-[#e0f2fe] via-[#f0f9ff] to-slate-100 pt-4 pb-6 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          
          {/* Banner Graphic matching Hyderabad theme */}
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
                      1. Driver Now (Hourly Travel)
                    </h3>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      Shopping, hospital visits, weddings & night parties
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>

              <div className="mt-4 pt-2 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-cardBlue-text border border-blue-200 shadow-xs">
                  <Clock className="w-3 h-3 text-sky-600" />
                  4 Hours (₹499)
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-cardBlue-text border border-blue-200 shadow-xs">
                  8 Hours (₹899)
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-cardBlue-text border border-blue-200 shadow-xs">
                  12 Hours (₹1,299)
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
                      2. Hours & Day (Scheduled & Outstation)
                    </h3>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      Vijayawada, Srisailam, Tirupati, Warangal trips
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>

              <div className="mt-4 pt-2 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-cardGreen-text border border-emerald-200 shadow-xs">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  ₹1,499/day + allowance • Round trip & One-way
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
                      3. Permanent Driver (Monthly Contract)
                    </h3>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      Corporate executives, elderly parents & school drop-offs
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>

              <div className="mt-4 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-cardPurple-text border border-purple-200 shadow-xs">
                  Fixed Rate: ₹28,000 / month
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
                      4. Car + Driver / Self Drive (Luxury Fleet)
                    </h3>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      Premium sedans and SUVs (Audi, BMW, Fortuner, Mercedes)
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>

              <div className="mt-4 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-cardPeach-text border border-orange-200 shadow-xs">
                  <Car className="w-3.5 h-3.5 text-orange-600" />
                  Luxury Sedans & SUVs with Driver
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* 5 TRUST & SAFETY BADGES (Section 4.1.3) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-soft border border-slate-200/80">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            
            <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1.5 shadow-xs">
                <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-xs font-black text-slate-900 leading-tight">100% Background Verified</span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5">Aadhaar & DL authenticated</span>
            </div>

            <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mb-1.5 shadow-xs">
                <Sparkles className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-xs font-black text-slate-900 leading-tight">Transparent Pricing</span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5">Zero surge pricing</span>
            </div>

            <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-1.5 shadow-xs">
                <span className="font-mono font-black text-xs">#ID</span>
              </div>
              <span className="text-xs font-black text-slate-900 leading-tight">6-Digit Driver Code</span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5">Tracking accountability</span>
            </div>

            <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mb-1.5 shadow-xs">
                <Headphones className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-xs font-black text-slate-900 leading-tight">Direct Phone Connection</span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5">Direct driver-owner calling</span>
            </div>

            <div className="col-span-2 sm:col-span-1 flex flex-col items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mb-1.5 shadow-xs">
                <Clock className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-xs font-black text-slate-900 leading-tight">15-Min Rapid Dispatch</span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5">Quick arrival across Hyd</span>
            </div>

          </div>
        </div>

        {/* NEARBY DRIVERS LIST SECTION WITH REAL-TIME FILTER CHIPS (Section 4.1.4) */}
        <section className="pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-black text-navy-900">Drivers Near You</h2>
              <p className="text-xs text-slate-500 font-medium">Verified professional drivers in Hyderabad</p>
            </div>
            <button
              onClick={() => navigate('/find-drivers')}
              className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              View All ({drivers.length})
            </button>
          </div>

          {/* REAL-TIME FILTER CHIPS (Section 4.1.4) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-3">
            {[
              { id: 'all', label: 'All Drivers' },
              { id: 'top_rated', label: 'Top Rated (4.8+)' },
              { id: 'nearby', label: 'Nearby (<5km)' },
              { id: 'available', label: 'Immediate Available' },
            ].map(chip => (
              <button
                key={chip.id}
                onClick={() => setActiveFilterChip(chip.id as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all shadow-xs ${
                  activeFilterChip === chip.id
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedDrivers.length > 0 ? (
              displayedDrivers.slice(0, 4).map(driver => (
                <DriverCard
                  key={driver.id}
                  driver={driver}
                  onSelect={(d) => navigate(`/drivers/${d.id}`)}
                  onBook={(d) => setSelectedDriverForBooking(d)}
                />
              ))
            ) : (
              <div className="col-span-full bg-white rounded-3xl p-6 sm:p-8 text-center border border-slate-200 shadow-sm space-y-4">
                <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Verified Driver Partners Launching Across Hyderabad
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    We are currently onboarding and background-verifying licensed drivers for Jubilee Hills, Banjara Hills, Gachibowli, Madhapur, and Cyberabad.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Link
                    to="/driver/register"
                    className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2"
                  >
                    <Car className="w-4 h-4 text-amber-400" />
                    <span>Drive With Us (Partner Register)</span>
                  </Link>
                  <a
                    href="tel:+918500274288"
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>24/7 Helpline: +91 85002 74288</span>
                  </a>
                </div>
              </div>
            )}
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
              <div className="text-[11px] font-mono text-slate-500 space-y-0.5">
                <p>
                  24/7 Helpline: <a href="tel:+918500274288" className="font-bold text-emerald-600 hover:underline">+91 85002 74288</a>
                </p>
                <p>
                  Support: <a href="mailto:localdrivers.in@gmail.com" className="font-bold text-brand-600 hover:underline">localdrivers.in@gmail.com</a>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-6 text-xs font-bold text-slate-700">
              <Link to="/about" className="hover:text-brand-600 transition-colors">About Us</Link>
              <Link to="/contact" className="hover:text-brand-600 transition-colors">Contact Support</Link>
              <Link to="/privacy" className="hover:text-brand-600 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-brand-600 transition-colors">Terms of Service</Link>
              <Link to="/cancellation" className="hover:text-brand-600 transition-colors">Cancellation Policy</Link>
              <Link to="/data-deletion" className="hover:text-red-600 transition-colors">Data Deletion</Link>
              <Link to="/admin/login" className="hover:text-purple-600 transition-colors flex items-center gap-1">Admin Portal</Link>
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

export default CustomerHome;

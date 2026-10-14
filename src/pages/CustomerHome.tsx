import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, ChevronRight, Clock, Calendar, Car, 
  ShieldCheck, Star, Navigation, Sparkles, CheckCircle2, Search, ArrowRight 
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
    } else {
      navigate('/find-drivers');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-16">
      
      {/* HERO SECTION */}
      <section className="bg-white border-b border-slate-200/80 pt-6 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Header Title & Tagline */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold border border-brand-200/80">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Hyderabad's On-Demand Chauffeur Network</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Hire a Professional Driver <br className="hidden sm:inline" />
              for Your Personal Car
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Safe, background-verified chauffeurs for hourly city errands, outstation road trips, daily office commutes, and luxury vehicle transit in Hyderabad.
            </p>
          </div>

          {/* QUICK PICKUP BAR (Uber / Urban Company Style) */}
          <div 
            onClick={onRequestLocation}
            className="bg-slate-50 hover:bg-slate-100/90 rounded-2xl p-3.5 sm:p-4 border border-slate-200 transition-all cursor-pointer flex items-center justify-between shadow-xs group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center shrink-0 text-brand-600">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Pickup Location (Hyderabad)
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 truncate block">
                  {userLocation.address || 'Road No. 36, Jubilee Hills, Hyderabad'}
                </span>
              </div>
            </div>

            <span className="text-xs font-bold text-brand-600 bg-white group-hover:bg-brand-50 px-3 py-1.5 rounded-xl border border-slate-200 group-hover:border-brand-200 transition-colors shrink-0 ml-2">
              Change Area
            </span>
          </div>

        </div>
      </section>

      {/* MAIN CONTAINER */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 mt-8">
        
        {/* SERVICE CATEGORIES (Clean, Enterprise Redesign) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Choose a Driver Package
              </h2>
              <p className="text-xs text-slate-500 font-medium">Tailored for your vehicle & trip duration</p>
            </div>
            <Link
              to="/services"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              All Packages <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 1. Hourly City Driver */}
            <div
              onClick={() => handleSelectCategory('City Driver')}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-brand-400 transition-all cursor-pointer flex flex-col justify-between group relative"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-brand-50 text-slate-800 group-hover:text-brand-600 flex items-center justify-center transition-colors">
                    <Car className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-brand-50 text-brand-700 border border-brand-200">
                    Most Popular
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base group-hover:text-brand-600 transition-colors">
                  Hourly City Driver
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  Local traffic, business meetings, shopping runs, and round-the-clock city commutes.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Starting At</span>
                  <span className="text-base font-black text-slate-900">₹299 <span className="text-xs font-normal text-slate-500">/ 2 Hrs</span></span>
                </div>
                <span className="text-xs font-bold text-brand-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Book Driver <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* 2. Outstation & Highway */}
            <div
              onClick={() => handleSelectCategory('Outstation Driver')}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer flex flex-col justify-between group relative"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-emerald-50 text-slate-800 group-hover:text-emerald-600 flex items-center justify-center transition-colors">
                    <Navigation className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Intercity
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
                  Outstation & Highway
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  Highway-certified chauffeurs trained for night driving, interstate trips, and multi-day tours.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Starting At</span>
                  <span className="text-base font-black text-slate-900">₹1,499 <span className="text-xs font-normal text-slate-500">/ 12 Hrs</span></span>
                </div>
                <span className="text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Plan Trip <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* 3. Monthly Permanent Chauffeur */}
            <div
              onClick={() => handleSelectCategory('Monthly Driver')}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-purple-400 transition-all cursor-pointer flex flex-col justify-between group relative"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-purple-50 text-slate-800 group-hover:text-purple-600 flex items-center justify-center transition-colors">
                    <Calendar className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                    Full-Time
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base group-hover:text-purple-700 transition-colors">
                  Monthly Dedicated Driver
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  Dedicated, permanent driver for senior family members, school runs, and executive office travel.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Starting At</span>
                  <span className="text-base font-black text-slate-900">₹28,000 <span className="text-xs font-normal text-slate-500">/ Month</span></span>
                </div>
                <span className="text-xs font-bold text-purple-700 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  View Plans <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* 4. Executive & Luxury Chauffeur */}
            <div
              onClick={() => handleSelectCategory('VIP Driver')}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-amber-400 transition-all cursor-pointer flex flex-col justify-between group relative"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-amber-50 text-slate-800 group-hover:text-amber-600 flex items-center justify-center transition-colors">
                    <Sparkles className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                    Premium Chauffeur
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base group-hover:text-amber-700 transition-colors">
                  Luxury & Executive Chauffeur
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  Professionally suited chauffeurs trained for premium automatics, Mercedes, BMW, Audi & luxury SUVs.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Starting At</span>
                  <span className="text-base font-black text-slate-900">₹1,000 <span className="text-xs font-normal text-slate-500">/ 4 Hrs</span></span>
                </div>
                <span className="text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Book Chauffeur <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* VALUE PROPOSITION CARDS (Clean Enterprise Section) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Why Hyderabad Trusts Localdrivers
            </h3>
            <p className="text-xs text-slate-500 font-medium">Built for safety, transparent rates, and reliability</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-extrabold text-slate-900">Verified Credentials</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Mandatory Admin KYC inspection of Aadhaar Card, Driving Licence, and background record.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-extrabold text-slate-900">15-Min Allocation</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Automated proximity dispatch algorithms connect you to the nearest online chauffeur.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Star className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-extrabold text-slate-900">Zero Surge Pricing</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Fixed, transparent hourly packages. No peak-hour surges or unexpected commission hikes.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Car className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-extrabold text-slate-900">Manual & Automatic</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Drivers skilled across hatchbacks, sedans, 4x4 SUVs, and dual-clutch automatic gearboxes.
              </p>
            </div>

          </div>
        </div>

        {/* NEARBY DRIVERS SECTION */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">Available Drivers Near You</h2>
              <p className="text-xs text-slate-500 font-medium">Sorted by distance from your current location</p>
            </div>
            <button
              onClick={() => navigate('/find-drivers')}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Browse All ({drivers.length}) <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {drivers.length > 0 ? (
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
          ) : (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-800">No Drivers Online in This Exact Radius</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You can expand your search radius up to 30 km or explore all registered chauffeurs across Hyderabad.
              </p>
              <button
                onClick={() => navigate('/find-drivers')}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
              >
                Open Discovery Search <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </section>

        {/* CLEAN ENTERPRISE FOOTER */}
        <footer className="mt-16 pt-10 border-t border-slate-200 text-slate-600 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <img src="/logo.png" alt="Localdrivers Hyderabad" className="h-9 object-contain" />
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Hyderabad's trusted on-demand chauffeur platform. Connecting vehicle owners with verified personal drivers.
              </p>
              <p className="text-[11px] font-mono text-slate-500">
                Support: <a href="mailto:localdrivers.in@gmail.com" className="font-bold text-brand-600 hover:underline">localdrivers.in@gmail.com</a>
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-8 text-xs font-bold text-slate-700">
              <Link to="/about" className="hover:text-brand-600 transition-colors">About Us</Link>
              <Link to="/contact" className="hover:text-brand-600 transition-colors">Contact Support</Link>
              <Link to="/privacy" className="hover:text-brand-600 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-brand-600 transition-colors">Terms of Service</Link>
              <Link to="/cancellation" className="hover:text-brand-600 transition-colors">Cancellation Policy</Link>
              <Link to="/data-deletion" className="hover:text-red-600 transition-colors">Data Deletion</Link>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
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

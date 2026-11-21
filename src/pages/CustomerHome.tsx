import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, ChevronDown, ChevronRight, Clock, Calendar, User, Car, 
  ShieldCheck, Star, Navigation, Sparkles, Briefcase, Plus, Trash2, 
  RotateCcw, CheckCircle2, Shield, Phone, ArrowRight, Compass
} from 'lucide-react';
import { Driver, UserLocation, ServiceCategory, TripStop } from '../types';
import { driversService } from '../services/drivers';
import { dbService } from '../services/database';
import { gpsService } from '../services/gps';
import { locationService } from '../services/location';
import { routingService, RouteResult } from '../services/routing';
import { DriverCard } from '../components/driver/DriverCard';
import { BookingModal } from '../components/booking/BookingModal';
import { LocationSearchInput } from '../components/booking/LocationSearchInput';
import { useAuth } from '../context/AuthContext';
import { GoogleAuthButton } from '../components/common/GoogleAuthButton';

interface CustomerHomeProps {
  userLocation: UserLocation;
  onRequestLocation: () => void;
}

export const CustomerHome: React.FC<CustomerHomeProps> = ({ userLocation, onRequestLocation }) => {
  const navigate = useNavigate();
  const { user, isSignedIn } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverForBooking, setSelectedDriverForBooking] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // BLUEPRINT CORE: TWO CHOICES ONLY (Now / In City vs For Later / OutStation)
  const [tripType, setTripType] = useState<'city' | 'outstation'>('city');
  const [activeFilterChip, setActiveFilterChip] = useState<'all' | 'top_rated' | 'nearby' | 'available'>('all');

  // RIDE PLANNER FORM STATE
  const todayStr = new Date().toISOString().split('T')[0];
  const [pickupLocation, setPickupLocation] = useState<string>(() => userLocation?.address || 'Road No. 36, Jubilee Hills, Hyderabad');
  const [pickupCoords, setPickupCoords] = useState<{ latitude: number; longitude: number }>(() => ({
    latitude: userLocation?.latitude || 17.4319,
    longitude: userLocation?.longitude || 78.4073,
  }));
  const [dropLocation, setDropLocation] = useState<string>('Inorbit Mall, Madhapur, Hyderabad');
  const [dropCoords, setDropCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: 17.4356,
    longitude: 78.3869,
  });
  const [pickupTime, setPickupTime] = useState<string>('Instant ASAP (Within 15 Mins)');
  const [tripDate, setTripDate] = useState<string>(todayStr);
  const [outstationDays, setOutstationDays] = useState<number>(1);
  const [vehicleType, setVehicleType] = useState<string>('Sedan');
  const [transmission, setTransmission] = useState<'Manual' | 'Automatic'>('Manual');
  const [vehicleModel, setVehicleModel] = useState<string>('');

  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);
  const [gpsSuccessMessage, setGpsSuccessMessage] = useState<string | null>(null);

  const recommendedSectionRef = useRef<HTMLDivElement>(null);

  // Load Drivers
  const loadData = async () => {
    try {
      const liveDrivers = await driversService.getApprovedDriversAsync();
      const sorted = driversService.filterDrivers(
        liveDrivers,
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
    } catch (err) {
      console.warn('[CustomerHome] Could not load live drivers:', err);
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = dbService.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [userLocation]);

  // Update pickup if userLocation changes initially and wasn't manually edited
  useEffect(() => {
    if (userLocation?.address) {
      setPickupLocation(userLocation.address);
      if (userLocation.latitude && userLocation.longitude) {
        setPickupCoords({ latitude: userLocation.latitude, longitude: userLocation.longitude });
      }
    }
  }, [userLocation]);

  // Handle GPS 1-Tap Fetch for Pickup Location
  const handleUseGps = async () => {
    setIsGpsLoading(true);
    setGpsSuccessMessage(null);
    try {
      const geo = await gpsService.captureEventLocation('Manual Refresh');
      if (geo.source === 'gps') {
        const resolved = await locationService.reverseGeocode(geo.latitude, geo.longitude);
        const resolvedAddr = resolved?.address || geo.address || `Current Location (${geo.latitude.toFixed(4)}, ${geo.longitude.toFixed(4)})`;
        setPickupCoords({ latitude: geo.latitude, longitude: geo.longitude });
        setPickupLocation(resolvedAddr);
        setGpsSuccessMessage('GPS Location Detected');
        setTimeout(() => setGpsSuccessMessage(null), 3500);
      } else {
        alert(geo.address || 'Unable to access high-accuracy GPS. Please enter your pickup address.');
      }
    } finally {
      setIsGpsLoading(false);
    }
  };

  // Submit Ride Planner -> Scroll to Recommended Drivers
  const handleSubmitPlanner = () => {
    if (recommendedSectionRef.current) {
      recommendedSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filter Drivers According to Blueprint Core Rule:
  // For 'city': Recommend drivers who are ready for daily hourly bookings (City Driver)
  // For 'outstation': Recommend drivers who are ready for outstation (Outstation Driver)
  const displayedDrivers = drivers.filter(d => {
    if (tripType === 'city' && !d.services.includes('City Driver')) return false;
    if (tripType === 'outstation' && !d.services.includes('Outstation Driver')) return false;
    if (activeFilterChip === 'top_rated') return d.rating >= 4.8;
    if (activeFilterChip === 'nearby') return d.distanceKm <= 5.0;
    if (activeFilterChip === 'available') return d.isOnline && d.currentWorkStatus !== 'on_trip';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-100/60 pb-24 md:pb-12">
      
      {/* HERO SECTION WITH CHARMINAR BANNER */}
      <section className="relative bg-gradient-to-b from-[#e0f2fe] via-[#f0f9ff] to-slate-100 pt-3 pb-5 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          
          {/* Banner Graphic matching Hyderabad theme */}
          <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200/60 bg-white">
            <img
              src="/charminar-banner.png"
              alt="Hyderabad Drivers at Your Service"
              className="w-full h-40 sm:h-52 md:h-60 object-cover object-right"
            />

            {/* Banner Content Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-transparent p-5 sm:p-7 flex flex-col justify-center max-w-lg">
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full self-start mb-1 border border-brand-200">
                Local Drivers Platform
              </span>
              <h1 className="text-2xl sm:text-4xl font-black text-navy-900 leading-tight">
                Hyderabad
              </h1>
              <p className="text-base sm:text-2xl font-bold text-navy-900 mt-0.5">
                Verified Drivers for Your Car
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400 text-navy-900 font-extrabold text-xs shadow-xs">
                  <Clock className="w-3.5 h-3.5 fill-current stroke-none" />
                  <span>24/7 Rapid Dispatch</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-xs border border-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>100% Aadhaar & DL Verified</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* MAIN CONTAINER */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 -mt-2">

        {/* TOP QUICK-ACTION NAVIGATION (Blueprint Plan: Become A Driver / Book Driver / Sign In) */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (recommendedSectionRef.current) {
                  recommendedSectionRef.current.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Car className="w-4 h-4 text-amber-300" />
              <span>Book Driver</span>
            </button>
            <Link
              to="/driver/register"
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-xs flex items-center gap-1.5 border border-slate-200 shadow-xs shrink-0 transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
              <span>Become a Driver</span>
            </Link>
            <Link
              to="/driver/login"
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center gap-1.5 border border-slate-200 shadow-xs shrink-0 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Driver Login</span>
            </Link>
          </div>

          <div className="shrink-0">
            {isSignedIn && user ? (
              <Link
                to="/customer/profile"
                className="px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 font-bold text-xs flex items-center gap-1.5 hover:bg-sky-100 transition-colors"
              >
                {user.imageUrl ? (
                  <img src={user.imageUrl} alt={user.fullName || 'User'} className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <User className="w-3.5 h-3.5 text-sky-700" />
                )}
                <span className="truncate max-w-[100px]">{user.firstName || 'Profile'}</span>
              </Link>
            ) : (
              <Link
                to="/customer/login"
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center gap-1.5 border border-slate-200 shadow-xs transition-colors"
              >
                <User className="w-3.5 h-3.5 text-brand-600" />
                <span>Customer Sign In</span>
              </Link>
            )}
          </div>
        </div>

        {/* CUSTOMER GOOGLE ACCOUNT BANNER */}
        {isSignedIn && user ? (
          <div className="bg-gradient-to-r from-sky-50 via-white to-blue-50 rounded-2xl p-3.5 border border-sky-200/80 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {user.imageUrl ? (
                <img src={user.imageUrl} alt={user.fullName || 'User'} className="w-9 h-9 rounded-full object-cover border border-sky-200 shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-brand-700" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-slate-900 truncate">
                    Welcome back, {user.firstName || user.fullName || 'Rider'}!
                  </span>
                  <span className="inline-block px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800">
                    Google Connected
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  Your ride receipts and trip history are active.
                </p>
              </div>
            </div>
            <Link
              to="/customer/profile"
              className="shrink-0 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
            >
              <span>My Profile</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-amber-50 via-white to-orange-50 rounded-2xl p-3.5 border border-amber-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Sign in with Google for Lifetime Ride History</p>
                <p className="text-[11px] text-slate-500">Auto-fill your details, view trip receipts, and book verified drivers faster.</p>
              </div>
            </div>
            <div className="shrink-0 max-w-xs w-full sm:w-auto">
              <GoogleAuthButton
                label="Sign In with Google"
                redirectUrl="/customer/profile"
                mode="auto"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0 cursor-pointer w-full"
              />
            </div>
          </div>
        )}

        {/* BLUEPRINT CORE: TWO CHOICES ONLY (Now / In City vs For Later / OutStation) */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
            Select Your Booking Flow
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Option 1: Now / In City */}
            <button
              type="button"
              onClick={() => setTripType('city')}
              className={`p-4 sm:p-5 rounded-3xl border-2 text-left transition-all relative overflow-hidden group cursor-pointer ${
                tripType === 'city'
                  ? 'border-brand-600 bg-gradient-to-br from-brand-600 to-sky-700 text-white shadow-lg ring-2 ring-brand-500/30'
                  : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1.5 ${
                    tripType === 'city' ? 'bg-white/20 text-yellow-300' : 'bg-sky-100 text-sky-800'
                  }`}>
                    <Clock className="w-3 h-3" />
                    <span>Instant Match (10-15 Min)</span>
                  </div>
                  <h3 className="text-xl font-black leading-tight">
                    Now / In City
                  </h3>
                  <p className={`text-xs mt-1 ${tripType === 'city' ? 'text-sky-100' : 'text-slate-500'}`}>
                    Daily hourly bookings for shopping, hospital visits, office & dining in Hyderabad.
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  tripType === 'city' ? 'bg-white/20 text-white' : 'bg-sky-50 text-brand-600'
                }`}>
                  <Car className="w-5 h-5" />
                </div>
              </div>

              <div className={`mt-4 pt-3 flex items-center justify-between border-t ${
                tripType === 'city' ? 'border-white/20' : 'border-slate-100'
              }`}>
                <div className="text-xs">
                  <span className={`font-black text-sm ${tripType === 'city' ? 'text-amber-300' : 'text-brand-700'}`}>
                    ₹200/hr
                  </span>
                  <span className={`text-[10px] ml-1 ${tripType === 'city' ? 'text-sky-200' : 'text-slate-400'}`}>
                    (Min 2 hrs = ₹400)
                  </span>
                </div>
                <span className={`text-[11px] font-extrabold flex items-center gap-1 ${
                  tripType === 'city' ? 'text-white' : 'text-brand-600'
                }`}>
                  <span>Select</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>

            {/* Option 2: For Later / OutStation */}
            <button
              type="button"
              onClick={() => setTripType('outstation')}
              className={`p-4 sm:p-5 rounded-3xl border-2 text-left transition-all relative overflow-hidden group cursor-pointer ${
                tripType === 'outstation'
                  ? 'border-indigo-600 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg ring-2 ring-indigo-500/30'
                  : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1.5 ${
                    tripType === 'outstation' ? 'bg-white/20 text-amber-300' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    <Calendar className="w-3 h-3" />
                    <span>Advance Outstation</span>
                  </div>
                  <h3 className="text-xl font-black leading-tight">
                    For Later / OutStation
                  </h3>
                  <p className={`text-xs mt-1 ${tripType === 'outstation' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Highway trips to Vijayawada, Srisailam, Warangal, Tirupati with experienced drivers.
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  tripType === 'outstation' ? 'bg-white/20 text-amber-300' : 'bg-indigo-50 text-indigo-600'
                }`}>
                  <MapPin className="w-5 h-5" />
                </div>
              </div>

              <div className={`mt-4 pt-3 flex items-center justify-between border-t ${
                tripType === 'outstation' ? 'border-white/20' : 'border-slate-100'
              }`}>
                <div className="text-xs">
                  <span className={`font-black text-sm ${tripType === 'outstation' ? 'text-amber-400' : 'text-indigo-700'}`}>
                    ₹1,500/day
                  </span>
                  <span className={`text-[10px] ml-1 ${tripType === 'outstation' ? 'text-slate-400' : 'text-slate-400'}`}>
                    + Driver Allowance
                  </span>
                </div>
                <span className={`text-[11px] font-extrabold flex items-center gap-1 ${
                  tripType === 'outstation' ? 'text-amber-300' : 'text-indigo-600'
                }`}>
                  <span>Select</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>

          </div>
        </div>

        {/* HANDY RIDE PLANNER WIDGET (Blueprint Flow: Locations -> Vehicle -> Estimated Fare -> Submit) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/90 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-600 block">
                {tripType === 'city' ? 'Now / In City Flow' : 'For Later / Outstation Flow'}
              </span>
              <h2 className="text-lg font-black text-slate-900">
                {tripType === 'city' ? 'Plan Your City Trip (Hourly)' : 'Plan Your Outstation Journey (Daily)'}
              </h2>
            </div>
            
            {/* Fare badge */}
            <div className="px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 self-start sm:self-auto flex items-center gap-1.5">
              <span className="text-xs font-bold text-amber-900">
                {tripType === 'city' ? 'Est. ₹200/hr (Min 2 hrs)' : 'Est. ₹1,500/day + Allowance'}
              </span>
            </div>
          </div>

          {/* Locations & Timing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Pickup Location with 1-Tap GPS Button */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Pickup Location & Time
                </label>
                <button
                  type="button"
                  onClick={handleUseGps}
                  disabled={isGpsLoading}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-black transition-colors cursor-pointer"
                  title="Detect GPS Location"
                >
                  <Navigation className={`w-3 h-3 text-emerald-600 ${isGpsLoading ? 'animate-spin' : ''}`} />
                  <span>{isGpsLoading ? 'Locating...' : 'Fetch GPS'}</span>
                </button>
              </div>

              {gpsSuccessMessage && (
                <div className="p-1.5 bg-emerald-50 rounded-xl text-[10px] font-extrabold text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{gpsSuccessMessage}</span>
                </div>
              )}

              <LocationSearchInput
                label="Pickup Address"
                value={pickupLocation}
                onChange={setPickupLocation}
                onSelectLocation={point => {
                  setPickupCoords({ latitude: point.latitude, longitude: point.longitude });
                  setPickupLocation(point.address);
                }}
                onUseGps={handleUseGps}
                isGpsLoading={isGpsLoading}
                dotColor="emerald"
                showQuickPicks={false}
                placeholder="Search pickup area, street, landmark..."
              />

              {/* Time Selector */}
              {tripType === 'city' ? (
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPickupTime('Instant ASAP (Within 15 Mins)')}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-[11px] font-extrabold border transition-all cursor-pointer truncate ${
                      pickupTime === 'Instant ASAP (Within 15 Mins)'
                        ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    ⚡ Instant (15 Mins)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickupTime('Today: +1 Hour')}
                    className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      pickupTime === 'Today: +1 Hour'
                        ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    +1 Hour
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Start Date</label>
                    <input
                      type="date"
                      value={tripDate}
                      onChange={e => setTripDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Trip Days</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setOutstationDays(d)}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                            outstationDays === d
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-black'
                              : 'border-slate-200 bg-slate-50 text-slate-700'
                          }`}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drop Location & Vehicle Details */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                {tripType === 'city' ? 'Drop Location' : 'Destination / Outstation City'}
              </label>

              <LocationSearchInput
                label="Drop-off Destination"
                value={dropLocation}
                onChange={setDropLocation}
                onSelectLocation={point => {
                  setDropCoords({ latitude: point.latitude, longitude: point.longitude });
                  setDropLocation(point.address);
                }}
                dotColor="red"
                showQuickPicks={false}
                placeholder={tripType === 'city' ? 'Search drop destination...' : 'e.g. Vijayawada, Srisailam, Warangal'}
              />

              {/* Vehicle Type & Gear Selector */}
              <div className="pt-1 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                  <span>Vehicle Type</span>
                  <span>Transmission</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 flex-1">
                    {['Hatchback', 'Sedan', 'SUV'].map(vCat => (
                      <button
                        key={vCat}
                        type="button"
                        onClick={() => setVehicleType(vCat)}
                        className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          vehicleType === vCat
                            ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {vCat}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {['Manual', 'Automatic'].map(gear => (
                      <button
                        key={gear}
                        type="button"
                        onClick={() => setTransmission(gear as any)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          transmission === gear
                            ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {gear}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  value={vehicleModel}
                  onChange={e => setVehicleModel(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs placeholder:text-slate-400"
                  placeholder="Car Model (Optional: e.g. Swift, City, Creta, Innova)"
                />
              </div>

            </div>

          </div>

          {/* Transparent Rate & Submit Button */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              <span className="font-extrabold text-slate-900 block">
                {tripType === 'city' ? 'City Hourly Fare: ₹200 / hr' : 'Outstation Fare: ₹1,500 / day'}
              </span>
              <span className="text-[11px] text-slate-500">
                Zero surge pricing • Cash payment directly to driver after ride completion
              </span>
            </div>

            <button
              type="button"
              onClick={handleSubmitPlanner}
              className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{tripType === 'city' ? 'Recommend Drivers for Hourly Bookings' : 'Recommend Drivers for Outstation'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 5 TRUST & SAFETY BADGES */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-soft border border-slate-200/80">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            
            <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1 shadow-xs">
                <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-xs font-black text-slate-900 leading-tight">100% Verified</span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5">Aadhaar & DL verified</span>
            </div>

            <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mb-1 shadow-xs">
                <Sparkles className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-xs font-black text-slate-900 leading-tight">Transparent Pricing</span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5">Zero surge charges</span>
            </div>

            <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-1 shadow-xs">
                <span className="font-mono font-black text-xs">#OTP</span>
              </div>
              <span className="text-xs font-black text-slate-900 leading-tight">Virtual Pickup OTP</span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5">6-Digit 1AB2C3 code</span>
            </div>

            <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mb-1 shadow-xs">
                <Phone className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-xs font-black text-slate-900 leading-tight">Direct Calling</span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5">Direct driver phone</span>
            </div>

            <div className="col-span-2 sm:col-span-1 flex flex-col items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mb-1 shadow-xs">
                <Clock className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-xs font-black text-slate-900 leading-tight">15-Min Arrival</span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5">Across Hyderabad</span>
            </div>

          </div>
        </div>

        {/* RECOMMENDED DRIVERS SECTION (Blueprint: "Recommend Drivers Who are ready for Daily hourly bookings / outstation") */}
        <section ref={recommendedSectionRef} id="recommended-drivers" className="pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-navy-900">
                  {tripType === 'city'
                    ? 'Recommended Drivers (Daily Hourly Bookings)'
                    : 'Recommended Drivers (Outstation Journeys)'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-brand-50 text-brand-700 border border-brand-200">
                  {displayedDrivers.length} Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Rule 4 Fair Rotation • Rule 8 Verified Living Areas across Hyderabad
              </p>
            </div>

            <Link
              to="/find-drivers"
              className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View All Drivers ({drivers.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* FILTER CHIPS */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-3">
            {[
              { id: 'all', label: 'All Recommended' },
              { id: 'top_rated', label: 'Top Rated (4.8+)' },
              { id: 'nearby', label: 'Nearby (<5km)' },
              { id: 'available', label: 'Immediate Available' },
            ].map(chip => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setActiveFilterChip(chip.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all shadow-xs cursor-pointer ${
                  activeFilterChip === chip.id
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* DRIVER CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedDrivers.length > 0 ? (
              displayedDrivers.map(driver => (
                <div
                  key={driver.id}
                  className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <img
                        src={driver.photo}
                        alt={driver.name}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-brand-100 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-black text-slate-900 text-base truncate">{driver.name}</h3>
                          {driver.verificationBadge && (
                            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                          )}
                        </div>

                        {/* Driver Living Area (Rule 8: Kachiguda, Attapur, Secunderabad, Shamshabad) */}
                        <div className="flex items-center gap-1 text-xs text-brand-700 font-bold mt-0.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-brand-600" />
                          <span className="truncate">Living Area: {driver.livingArea || driver.area || 'Hyderabad'}</span>
                        </div>

                        {/* Rating & Trips */}
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-0.5 text-amber-600 font-black">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {driver.rating}
                          </span>
                          <span>•</span>
                          <span>{driver.totalTrips} completed trips</span>
                          <span>•</span>
                          <span>{driver.experienceYears}y exp</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 shrink-0 border border-slate-200">
                      #{driver.driverCode}
                    </span>
                  </div>

                  {/* Pricing & Booking CTA */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Starting Rate</span>
                      <span className="text-lg font-black text-slate-900">
                        {tripType === 'city' ? `₹${driver.startingPrice || 200}/hr` : '₹1,500/day'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/drivers/${driver.id}`}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      >
                        Profile
                      </Link>
                      <button
                        type="button"
                        onClick={() => setSelectedDriverForBooking(driver)}
                        className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                      >
                        <Car className="w-3.5 h-3.5" />
                        <span>Book Driver</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm space-y-3">
                <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-900">
                  No Drivers Matching Current Filter
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try switching between "Now / In City" and "For Later / Outstation", or reset the filter chips above.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveFilterChip('all')}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                >
                  Show All Drivers
                </button>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* AUTHORITATIVE STREAMLINED BOOKING MODAL */}
      {selectedDriverForBooking && (
        <BookingModal
          driver={selectedDriverForBooking}
          preselectedService={tripType === 'outstation' ? 'Outstation Driver' : 'City Driver'}
          initialUserLocation={userLocation}
          initialPickup={pickupLocation}
          initialDrop={dropLocation}
          initialPickupCoords={pickupCoords}
          initialDropCoords={dropCoords}
          initialVehicleType={vehicleType}
          initialTransmission={transmission}
          initialVehicleModel={vehicleModel}
          initialDate={tripDate}
          initialTime={pickupTime}
          onClose={() => setSelectedDriverForBooking(null)}
          onBookingComplete={(booking) => {
            setSelectedDriverForBooking(null);
            navigate(`/bookings/${booking.id}`);
          }}
        />
      )}

    </div>
  );
};

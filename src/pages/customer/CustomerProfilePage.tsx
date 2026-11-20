import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, Mail, Phone, MapPin, Calendar, Clock, ShieldCheck, 
  Car, ArrowRight, CheckCircle2, ChevronRight, AlertCircle, 
  LogOut, Edit3, Save, RefreshCw, Star 
} from 'lucide-react';
import { useUser, useClerk, SignInButton } from '@clerk/react';
import { customerService } from '../../services/customer';
import { bookingsService } from '../../services/bookings';
import { CustomerProfile, Booking } from '../../types';

export const CustomerProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load profile and customer bookings
  useEffect(() => {
    if (!isLoaded) return;

    const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
    const storedPhone = localStorage.getItem('localdrivers_verified_customer_phone') || '';
    if (storedPhone) setPhoneNumber(storedPhone);

    if (isSignedIn && email) {
      // Sync customer profile with backend
      customerService.syncCustomerProfileAsync({
        email,
        name: user.fullName || user.firstName || 'Customer',
        phone: storedPhone || user.primaryPhoneNumber?.phoneNumber || '',
        avatarUrl: user.imageUrl || '',
        clerkId: user.id,
      }).then(res => {
        if (res.customer) {
          setProfile(res.customer);
          if (res.customer.phone) {
            setPhoneNumber(res.customer.phone);
          }
        }
      }).catch(() => {});

      // Fetch bookings linked to this email
      bookingsService.getBookingsByCustomerEmailAsync(email).then(bkgs => {
        if (bkgs && bkgs.length > 0) {
          setRecentBookings(bkgs);
        } else if (storedPhone) {
          bookingsService.getBookingsByCustomerPhoneAsync(storedPhone).then(pbkgs => {
            setRecentBookings(pbkgs || []);
          });
        }
      }).finally(() => {
        setIsLoading(false);
      });
    } else {
      // Check cached profile or local storage for guest
      const cached = customerService.getCachedCustomerProfile();
      if (cached) setProfile(cached);
      if (storedPhone) {
        bookingsService.getBookingsByCustomerPhoneAsync(storedPhone).then(pbkgs => {
          setRecentBookings(pbkgs || []);
        }).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    }
  }, [isLoaded, isSignedIn, user]);

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = phoneNumber.replace(/\D/g, '').slice(-10);
    if (clean.length < 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    const email = user?.primaryEmailAddress?.emailAddress || profile?.email || '';
    if (email) {
      await customerService.updateCustomerProfileAsync({
        email,
        phone: clean,
      });
    }

    localStorage.setItem('localdrivers_verified_customer_phone', clean);
    setIsSaving(false);
    setIsEditingPhone(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Loading your customer profile...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-100">
            <User className="w-8 h-8 text-brand-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Customer Profile</h1>
          <p className="text-xs text-slate-500 mb-6">
            Sign in with Google to maintain your customer profile, view live trip receipts, and quickly book drivers.
          </p>

          <SignInButton mode="modal">
            <button className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2.5 transition-all shadow-md">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>
          </SignInButton>

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
            <Link to="/find-drivers" className="hover:text-brand-600">Find Drivers</Link>
            <span>•</span>
            <Link to="/bookings" className="hover:text-brand-600">View by Phone</Link>
          </div>
        </div>
      </div>
    );
  }

  const email = user?.primaryEmailAddress?.emailAddress || profile?.email || '';
  const displayName = user?.fullName || profile?.name || 'Customer';
  const avatar = user?.imageUrl || profile?.avatarUrl;

  const totalTrips = profile?.totalBookings || recentBookings.length;
  const completedTrips = recentBookings.filter(b => b.status === 'Completed').length;
  const totalSpent = profile?.totalSpent || recentBookings.reduce((sum, b) => b.status === 'Completed' ? sum + (b.finalFare || b.estimatedFare) : sum, 0);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 pb-24 md:pb-12">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Profile Card Header */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-soft">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {avatar ? (
                <img
                  src={avatar}
                  alt={displayName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-brand-500/30 shadow-xs"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-brand-50 border-2 border-brand-200 flex items-center justify-center">
                  <User className="w-8 h-8 text-brand-600" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900">{displayName}</h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Verified Rider
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{email}</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Member since {profile?.joined || profile?.createdAt?.split('T')[0] || '2026'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <Link
                to="/find-drivers"
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Car className="w-4 h-4" />
                <span>Book Driver</span>
              </Link>
              <button
                onClick={() => signOut(() => navigate('/'))}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Contact Details & Driver Pickup Phone */}
          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Phone Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-brand-600" />
                  Driver Contact Phone
                </span>
                {!isEditingPhone && (
                  <button
                    onClick={() => setIsEditingPhone(true)}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {isEditingPhone ? (
                <form onSubmit={handleSavePhone} className="flex items-center gap-2 mt-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">+91</span>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="9876543210"
                      className="w-full pl-11 pr-3 py-1.5 text-xs font-bold rounded-xl border border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" />
                    <span>{isSaving ? '...' : 'Save'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingPhone(false)}
                    className="px-2.5 py-1.5 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <p className="text-sm font-extrabold text-slate-800">
                  {phoneNumber ? `+91 ${phoneNumber}` : 'No phone number linked yet'}
                </p>
              )}
              {saveSuccess && (
                <p className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Phone number updated successfully!
                </p>
              )}
              <p className="text-[11px] text-slate-400 mt-1">
                Drivers receive this phone number upon accepting your booking to contact you for pickup.
              </p>
            </div>

            {/* City & Account Security */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <MapPin className="w-3.5 h-3.5 text-brand-600" />
                Primary Operating City
              </span>
              <p className="text-sm font-extrabold text-slate-800">Hyderabad, Telangana</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Your rides and invoices are secured with Google authentication.
              </p>
            </div>
          </div>
        </div>

        {/* Lifetime Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Bookings</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{totalTrips}</span>
            <span className="text-[10px] text-slate-400">Lifetime trips</span>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">{completedTrips}</span>
            <span className="text-[10px] text-slate-400">Successfully ended</span>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Spent</span>
            <span className="text-2xl font-black text-brand-600 mt-1 block">₹{totalSpent}</span>
            <span className="text-[10px] text-slate-400">Includes taxes & fees</span>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Rides</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">
              {recentBookings.filter(b => ['Pending', 'Accepted', 'Driver Arriving', 'In Progress'].includes(b.status)).length}
            </span>
            <span className="text-[10px] text-slate-400">In-progress or waiting</span>
          </div>
        </div>

        {/* Customer Ride History & Receipts */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">Your Booking History</h2>
              <p className="text-xs text-slate-500">All rides and digital receipts associated with your Google account</p>
            </div>
            <Link
              to="/bookings"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <div className="p-8 text-center">
              <Car className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No bookings yet</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                When you hire a driver for your car, your trip receipts and live status will appear here.
              </p>
              <Link
                to="/find-drivers"
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-brand-700"
              >
                <span>Find Nearby Drivers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentBookings.slice(0, 5).map(b => (
                <div
                  key={b.id}
                  onClick={() => navigate(`/bookings/${b.id}`)}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <img
                      src={b.driverPhoto || '/default-driver.png'}
                      alt={b.driverName}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">{b.driverName}</span>
                        <span className="text-[10px] font-bold text-slate-400">({b.driverCode || 'Driver'})</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          b.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          b.status === 'Cancelled' ? 'bg-red-50 text-red-700 border border-red-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 truncate mt-0.5">
                        {b.pickupLocation} → {b.destinationLocation}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{b.serviceTitle}</span>
                        <span>•</span>
                        <span>{b.date} {b.time}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <span className="text-sm font-black text-slate-900">
                      ₹{b.finalFare || b.estimatedFare}
                    </span>
                    <span className="text-[11px] font-bold text-brand-600 flex items-center gap-0.5 hover:underline">
                      View Ride Details
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

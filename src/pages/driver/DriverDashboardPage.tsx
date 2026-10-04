import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Power, ShieldCheck, Star, Calendar, Clock, MapPin, Navigation, 
  CheckCircle2, XCircle, LogOut, AlertTriangle, CreditCard, ExternalLink, RefreshCw,
  Phone, Lock, Car, MessageSquare
} from 'lucide-react';
import { Driver, Booking } from '../../types';
import { authService } from '../../services/auth';
import { driversService } from '../../services/drivers';
import { bookingsService } from '../../services/bookings';
import { dbService } from '../../services/database';

export const DriverDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [driverBookings, setDriverBookings] = useState<Booking[]>([]);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  const loadData = () => {
    const state = authService.getAuthState();
    if (!state.isDriverAuthenticated || !state.driver) {
      navigate('/driver/login');
      return;
    }
    const currentDriver = driversService.getDriverById(state.driver.id) || state.driver;
    setDriver(currentDriver);
    setDriverBookings(bookingsService.getDriverBookings(currentDriver.id));
  };

  useEffect(() => {
    loadData();
    const unsubscribe = dbService.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  if (!driver) return null;

  const pendingRequests = driverBookings.filter(b => b.status === 'Pending');
  const activeBookings = driverBookings.filter(b => b.status === 'Accepted' || b.status === 'Driver Arriving');
  const completedTrips = driverBookings.filter(b => b.status === 'Completed');

  const totalEarnings = completedTrips.reduce((acc, curr) => acc + curr.estimatedFare, 3200);
  const pendingFee = driver.pendingCommissionFee || 0;
  const isHold = driver.isHold || pendingFee > 0 || driver.status === 'Hold' || driver.status === 'Payment Due';

  const handleToggleOnline = () => {
    if (isHold) {
      alert('Your profile is currently on Hold / Payment Due. Please pay the ₹50 platform fee to go Online.');
      return;
    }
    const updated = driversService.toggleOnline(driver.id, !driver.isOnline);
    if (updated) setDriver(updated);
  };

  const handleAcceptRequest = (bookingId: string) => {
    if (isHold) {
      alert('Your profile is on Hold. Please pay the ₹50 platform fee to accept new bookings.');
      return;
    }
    bookingsService.updateStatus(bookingId, 'Accepted');
    loadData();
  };

  const handleRejectRequest = (bookingId: string) => {
    bookingsService.updateStatus(bookingId, 'Cancelled');
    loadData();
  };

  const handleCompleteRide = (bookingId: string) => {
    bookingsService.updateStatus(bookingId, 'Completed');
    loadData();
  };

  const handlePayCommission = () => {
    const updated = driversService.payCommissionFee(driver.id, pendingFee || 50);
    if (updated) {
      setDriver(updated);
      setPaymentSuccessMsg('✓ Payment Received! ₹50 fee paid. Your profile is now Active and Online for customer search.');
      setTimeout(() => setPaymentSuccessMsg(null), 5000);
      loadData();
    }
  };

  const handleLogout = () => {
    authService.logoutDriver();
    navigate('/driver/login');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
      
      {/* Top Banner & Online Toggle */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={driver.photo}
              alt={driver.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">Good day, {driver.name}</h1>
                <span className="px-2.5 py-1 rounded-full text-xs font-black font-mono bg-brand-100 text-brand-900 border border-brand-300" title="Your Official 6-Digit Driver Code">
                  Code: #{driver.driverCode || 'A1B2C3'}
                </span>
                {driver.verificationBadge && (
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-1">
                {isHold ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-200">
                    PROFILE ON HOLD (₹{pendingFee > 0 ? pendingFee : 50} Fee Due)
                  </span>
                ) : driver.isOnline ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    ONLINE & ACTIVE IN SEARCH
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">
                    OFFLINE
                  </span>
                )}
                <span className="text-xs text-slate-500">• {driver.area}, {driver.city}</span>
              </div>
            </div>
          </div>

          {/* ONLINE / OFFLINE TOGGLE */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleOnline}
              disabled={isHold}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold shadow-md transition-all ${
                isHold
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : driver.isOnline
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-800 hover:bg-slate-900 text-slate-200'
              }`}
            >
              <Power className={`w-4 h-4 ${driver.isOnline && !isHold ? 'animate-pulse' : ''}`} />
              <span>{isHold ? 'ON HOLD' : driver.isOnline ? 'ONLINE (Active)' : 'OFFLINE'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {paymentSuccessMsg && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-900 text-xs font-extrabold rounded-2xl border border-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{paymentSuccessMsg}</span>
        </div>
      )}

      {/* PLATFORM COMMISSION PAYMENT DUE ALERT CARD (MISSING ORDERS URGENCY BANNER) */}
      {isHold && (
        <div className="bg-gradient-to-r from-red-600 via-amber-600 to-orange-600 text-white rounded-3xl p-6 shadow-xl mb-8 relative overflow-hidden border-2 border-amber-300/40">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 animate-bounce">
                <AlertTriangle className="w-7 h-7 text-yellow-300" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-yellow-200 bg-red-950/60 px-2.5 py-0.5 rounded border border-yellow-400/40">
                  ⚠️ YOU ARE MISSING RIDE ORDERS!
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1 leading-tight">
                  You are missing orders! Pay last ride fee to get more orders.
                </h3>
                <p className="text-xs text-amber-50 mt-1 max-w-xl leading-relaxed font-medium">
                  Your profile is currently paused on Hold. Pay your last ride fee (<strong>₹{pendingFee || 50}</strong>) using your personal payment link below to go Online instantly and start accepting new customer bookings!
                </p>

                {/* Display Admin Payment Link URL */}
                <div className="mt-3 bg-slate-900/60 border border-amber-300/40 p-2.5 rounded-xl font-mono text-[11px] text-amber-200 flex items-center gap-2 max-w-md overflow-x-auto shadow-inner">
                  <ExternalLink className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span className="truncate font-bold">
                    {driver.paymentLinkUrl || `https://pay.localdrivers.in/upi?amount=${pendingFee || 50}&driver=${driver.driverCode || driver.id}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-2.5 w-full md:w-auto shrink-0">
              {/* OPEN ADMIN PAYMENT LINK */}
              <a
                href={driver.paymentLinkUrl || `https://pay.localdrivers.in/upi?amount=${pendingFee || 50}&driver=${driver.driverCode || driver.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 border border-yellow-300"
              >
                <CreditCard className="w-4 h-4 text-slate-950" />
                Pay Last Ride Fee (₹{pendingFee || 50}) & Get Orders
              </a>

              {/* VERIFY & UNHOLD PROFILE */}
              <button
                onClick={handlePayCommission}
                className="px-5 py-3.5 bg-slate-950 hover:bg-slate-900 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 border border-slate-700"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Verify Fee & Go Online
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Performance Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Today's Earnings</span>
          <div className="text-2xl font-black text-slate-900 mt-1 flex items-center">
            ₹{totalEarnings.toLocaleString()}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Driver Rating</span>
          <div className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-1">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            {driver.rating}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Completed Trips</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {driver.totalTrips + completedTrips.length}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Pending Fee Due</span>
          <div className={`text-2xl font-black mt-1 ${pendingFee > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            ₹{pendingFee}
          </div>
        </div>

      </div>

      {/* ACTIVE & CONFIRMED BOOKINGS (AFTER ACCEPTANCE) */}
      {activeBookings.length > 0 && (
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <span>Active Confirmed Trips (In-Progress)</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                Phone Unlocked
              </span>
            </h3>
            <span className="text-xs font-bold text-slate-500">Call & Navigation Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeBookings.map(b => {
              const cleanDigits = (b.customerPhone || '').replace(/\D/g, '');
              const whatsappUrl = `https://wa.me/91${cleanDigits.slice(-10)}`;

              return (
                <div key={b.id} className="bg-white rounded-3xl p-6 border-2 border-emerald-500/80 shadow-xl space-y-4 relative overflow-hidden">
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-xs text-brand-700">{b.id}</span>
                      <h4 className="font-black text-slate-900 text-lg mt-0.5">{b.customerName}</h4>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Fare Amount</span>
                      <span className="text-xl font-black text-emerald-600">₹{b.estimatedFare}</span>
                    </div>
                  </div>

                  {/* UNLOCKED CUSTOMER PHONE & DIRECT CONTACT BUTTONS */}
                  <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-emerald-800 block">
                        Verified Customer Phone (Unlocked)
                      </span>
                      <span className="text-sm font-black font-mono text-slate-900 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-4 h-4 text-emerald-600" />
                        {b.customerPhone}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`tel:${b.customerPhone}`}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Call Now
                      </a>
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        WhatsApp
                      </a>
                    </div>
                  </div>

                  {/* ROUTE & VEHICLE DETAILS */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                      <span className="font-bold text-slate-900">Pickup Location: <span className="font-normal text-slate-700">{b.pickupLocation}</span></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Navigation className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="font-bold text-slate-900">Destination: <span className="font-normal text-slate-700">{b.destinationLocation}</span></span>
                    </div>
                    
                    {b.notes && (
                      <div className="flex items-start gap-2 pt-2 border-t border-slate-200/60">
                        <Car className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                        <span className="font-bold text-slate-900">Car / Vehicle Notes: <span className="font-normal text-slate-700 italic">"{b.notes}"</span></span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>Date: <strong>{b.date}</strong></span>
                      <span>Reporting: <strong>{b.time}</strong></span>
                      <span>Service: <strong>{b.serviceTitle}</strong></span>
                    </div>
                  </div>

                  {/* COMPLETE RIDE BUTTON */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleCompleteRide(b.id)}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Complete Ride & Collect ₹{b.estimatedFare}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PENDING BOOKING REQUESTS SECTION (BEFORE ACCEPTANCE) */}
      <div className="space-y-6 mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <span>Pending Customer Requests</span>
            {pendingRequests.length > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-brand-600 animate-ping" />
            )}
          </h2>
          <span className="text-xs font-bold text-slate-500">Real-time Dispatch</span>
        </div>

        {pendingRequests.length > 0 ? (
          <div className="space-y-4">
            {pendingRequests.map(req => {
              // Mask customer phone number before driver accepts
              const cleanDigits = (req.customerPhone || '').replace(/\D/g, '');
              const maskedPhone = cleanDigits.length >= 10
                ? `+91 ${cleanDigits.slice(-10, -6)}* *****`
                : '+91 ***** *****';

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-3xl p-6 border-2 border-brand-500/60 shadow-xl relative overflow-hidden space-y-4"
                >
                  <div className="absolute top-0 right-0 bg-brand-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                    NEW DISPATCH REQUEST
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="font-mono font-bold text-xs text-brand-700">{req.id}</span>
                      <h3 className="font-black text-slate-900 text-lg mt-0.5">{req.customerName}</h3>
                      
                      {/* MASKED PHONE NOTICE BEFORE ACCEPTANCE */}
                      <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/80 text-xs font-mono font-bold">
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Mobile: {maskedPhone}</span>
                        <span className="text-[10px] text-amber-700 font-sans font-normal ml-1">
                          (Hidden until accepted)
                        </span>
                      </div>
                    </div>

                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Estimated Fare</span>
                      <span className="text-2xl font-black text-emerald-600">₹{req.estimatedFare}</span>
                    </div>
                  </div>

                  {/* ROUTE & VEHICLE DETAILS ("FROM WHERE TO WHERE & WHICH CAR") */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
                    
                    {/* FROM WHERE */}
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900 uppercase text-[10px] block text-brand-700">Pickup Location (From Where):</span>
                        <span className="font-semibold text-slate-800 text-xs">{req.pickupLocation}</span>
                      </div>
                    </div>

                    {/* TO WHERE */}
                    <div className="flex items-start gap-2">
                      <Navigation className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900 uppercase text-[10px] block text-emerald-700">Destination (To Where):</span>
                        <span className="font-semibold text-slate-800 text-xs">{req.destinationLocation}</span>
                      </div>
                    </div>

                    {/* WHICH CAR HE NEEDS TO DRIVE */}
                    <div className="flex items-start gap-2 pt-2 border-t border-slate-200/60 bg-purple-50/60 p-3 rounded-xl border-purple-100">
                      <Car className="w-4.5 h-4.5 text-purple-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold text-purple-900 uppercase text-[10px] block">
                          Vehicle / Car Details (Which Car To Drive):
                        </span>
                        <span className="font-bold text-slate-800">
                          {req.notes ? req.notes : `Customer Personal Vehicle (${req.serviceTitle})`}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-slate-600 pt-2 border-t border-slate-200/60 text-[11px]">
                      <span>Date: <strong className="text-slate-900">{req.date}</strong></span>
                      <span>Reporting Time: <strong className="text-slate-900">{req.time}</strong></span>
                      <span>Category: <strong className="text-brand-700">{req.serviceTitle}</strong></span>
                    </div>
                  </div>

                  {/* PRIVACY NOTICE & ACCEPT / REJECT ACTION BUTTONS */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                    <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Accepting this ride will immediately reveal customer phone number & call link.</span>
                    </p>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRejectRequest(req.id)}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4 text-slate-500" />
                        Reject
                      </button>

                      <button
                        onClick={() => handleAcceptRequest(req.id)}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Accept & Reveal Phone
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="font-bold text-slate-800 text-base">No Pending Requests</h4>
            <p className="text-xs text-slate-500 mt-1">You're all caught up! New requests will pop up here instantly.</p>
          </div>
        )}
      </div>

    </div>
  );
};

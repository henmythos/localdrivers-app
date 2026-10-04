import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Power, ShieldCheck, Star, Calendar, Clock, MapPin, Navigation, 
  CheckCircle2, XCircle, LogOut, AlertTriangle, CreditCard, ExternalLink, RefreshCw 
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

      {/* PLATFORM COMMISSION PAYMENT DUE ALERT CARD (CRITICAL BUSINESS FLOW) */}
      {isHold && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white rounded-3xl p-6 shadow-xl mb-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
                <AlertTriangle className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-100 bg-amber-900/40 px-2 py-0.5 rounded">
                  PROFILE PAUSED • ACTION REQUIRED
                </span>
                <h3 className="text-xl font-black text-white mt-1">
                  Pay ₹{pendingFee || 50} Platform Commission Fee to Get Next Booking
                </h3>
                <p className="text-xs text-amber-50 mt-1 max-w-xl leading-relaxed">
                  You completed a trip. Based on our <strong>3-5% platform commission structure</strong> (e.g. ₹500–₹1,000 → ₹40 fee, ₹1,000 → ₹50 fee, ₹2,000 → ₹100 fee), pay ₹{pendingFee || 50} to activate your profile online for your next customer booking.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-2.5 w-full md:w-auto shrink-0">
              <button
                onClick={handlePayCommission}
                className="px-6 py-3.5 bg-white text-slate-900 hover:bg-slate-100 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4 text-amber-600" />
                Pay ₹{pendingFee || 50} & Activate Profile
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

      {/* ACTIVE & CONFIRMED BOOKINGS */}
      {activeBookings.length > 0 && (
        <div className="space-y-4 mb-8">
          <h3 className="font-black text-slate-900 text-lg">Active Confirmed Trips (In-Progress)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeBookings.map(b => (
              <div key={b.id} className="bg-white rounded-3xl p-5 border-2 border-emerald-200 shadow-soft">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono font-bold text-xs text-brand-700">{b.id}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    ACCEPTED
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-base">{b.customerName}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{b.pickupLocation} → {b.destinationLocation}</p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Fare Amount</span>
                    <span className="text-lg font-black text-slate-900">₹{b.estimatedFare}</span>
                  </div>

                  <button
                    onClick={() => handleCompleteRide(b.id)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Complete Ride & Collect ₹{b.estimatedFare}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PENDING BOOKING REQUESTS SECTION */}
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
            {pendingRequests.map(req => (
              <div
                key={req.id}
                className="bg-white rounded-3xl p-6 border-2 border-brand-500/60 shadow-xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-brand-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                  NEW DISPATCH REQUEST
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <span className="font-mono font-bold text-xs text-brand-700">{req.id}</span>
                    <h3 className="font-black text-slate-900 text-lg mt-0.5">{req.customerName}</h3>
                    <p className="text-xs text-slate-500">{req.customerPhone}</p>
                  </div>

                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Estimated Fare</span>
                    <span className="text-2xl font-black text-emerald-600">₹{req.estimatedFare}</span>
                  </div>
                </div>

                {/* Pickup & Destination */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs mb-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span className="font-bold text-slate-900">Pickup: <span className="font-normal text-slate-700">{req.pickupLocation}</span></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Navigation className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-bold text-slate-900">Destination: <span className="font-normal text-slate-700">{req.destinationLocation}</span></span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-500 pt-1">
                    <span>Date: <strong>{req.date}</strong></span>
                    <span>Reporting: <strong>{req.time}</strong></span>
                    <span>Service: <strong>{req.serviceTitle}</strong></span>
                  </div>
                </div>

                {/* ACCEPT / REJECT ACTION BUTTONS */}
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => handleRejectRequest(req.id)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4 text-slate-500" />
                    Reject Request
                  </button>

                  <button
                    onClick={() => handleAcceptRequest(req.id)}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Accept Booking Request
                  </button>
                </div>
              </div>
            ))}
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

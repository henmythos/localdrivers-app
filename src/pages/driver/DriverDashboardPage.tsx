import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Power, ShieldCheck, Star, Calendar, Clock, MapPin, Navigation, 
  CheckCircle2, XCircle, LogOut, AlertTriangle, CreditCard, ExternalLink, RefreshCw,
  Phone, Lock, Car, MessageSquare, Play, Square, Compass, X, Bell, Volume2
} from 'lucide-react';
import { Driver, Booking } from '../../types';
import { authService } from '../../services/auth';
import { driversService } from '../../services/drivers';
import { bookingsService } from '../../services/bookings';
import { dbService } from '../../services/database';
import { gpsService } from '../../services/gps';
import { billingService } from '../../services/billing';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

// Synthesize pleasant, loud attention chime for incoming customer dispatches using Web Audio API
function playDispatchAlertSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const t = ctx.currentTime;
    // Tone 1: 880Hz (A5)
    const o1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    o1.type = 'triangle';
    o1.frequency.setValueAtTime(880, t);
    g1.gain.setValueAtTime(0.5, t);
    g1.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
    o1.connect(g1);
    g1.connect(ctx.destination);
    o1.start(t);
    o1.stop(t + 0.25);

    // Tone 2: 1175Hz (D6)
    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(1174.66, t + 0.18);
    g2.gain.setValueAtTime(0.6, t + 0.18);
    g2.gain.exponentialRampToValueAtTime(0.01, t + 0.7);
    o2.connect(g2);
    g2.connect(ctx.destination);
    o2.start(t + 0.18);
    o2.stop(t + 0.7);

    // Tone 3: 1396.9Hz (F6)
    const o3 = ctx.createOscillator();
    const g3 = ctx.createGain();
    o3.type = 'sine';
    o3.frequency.setValueAtTime(1396.91, t + 0.35);
    g3.gain.setValueAtTime(0.4, t + 0.35);
    g3.gain.exponentialRampToValueAtTime(0.001, t + 0.95);
    o3.connect(g3);
    g3.connect(ctx.destination);
    o3.start(t + 0.35);
    o3.stop(t + 0.95);
  } catch (e) {
    console.warn('[Driver Alert Sound] Audio synthesis note:', e);
  }
}

// Trigger multi-sensory notification: audio chime + device vibration + system notification
function triggerDeviceAlert(booking: Booking) {
  playDispatchAlertSound();

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([300, 150, 300, 150, 450]);
    } catch {}
  }

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(`New Ride Request: ₹${booking.estimatedFare}`, {
        body: `Service: ${booking.serviceTitle}\nPickup: ${booking.pickupLocation}`,
        icon: '/favicon.ico',
        tag: `ld-booking-${booking.id}`,
      });
    } catch {}
  }
}

export const DriverDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [driverBookings, setDriverBookings] = useState<Booking[]>([]);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());
  const [isProcessingActionId, setIsProcessingActionId] = useState<string | null>(null);
  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(true);

  // Track known pending requests to avoid repetitive chime looping
  const prevPendingIdsRef = useRef<Set<string>>(new Set());

  // Trip Start & End Modals State
  const [startTripBooking, setStartTripBooking] = useState<Booking | null>(null);
  const [odometerStartInput, setOdometerStartInput] = useState('');
  const [isStartingTrip, setIsStartingTrip] = useState(false);

  const [endTripBooking, setEndTripBooking] = useState<Booking | null>(null);
  const [odometerEndInput, setOdometerEndInput] = useState('');
  const [isEndingTrip, setIsEndingTrip] = useState(false);

  useBodyScrollLock(
    !!startTripBooking || !!endTripBooking,
    () => {
      if (endTripBooking) setEndTripBooking(null);
      else if (startTripBooking) setStartTripBooking(null);
    }
  );

  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [availabilitySuccessMsg, setAvailabilitySuccessMsg] = useState<string | null>(null);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState<boolean>(false);

  const loadData = async () => {
    const state = authService.getAuthState();
    if (!state.isDriverAuthenticated || !state.driver) {
      navigate('/driver/login');
      return;
    }
    const currentDriver = driversService.getDriverById(state.driver.id) || state.driver;
    setDriver(currentDriver);

    // Initial local read for fast instant render
    const local = bookingsService.getDriverBookings(currentDriver.id);
    setDriverBookings(local);

    // Live authoritative fetch from server
    try {
      const [freshDriver, freshBookings] = await Promise.all([
        driversService.getDriverByIdAsync(state.driver.id).catch(() => null),
        bookingsService.getDriverBookingsAsync(currentDriver.id).catch(() => null)
      ]);

      if (freshDriver) {
        setDriver(freshDriver);
      }

      if (freshBookings && Array.isArray(freshBookings)) {
        setDriverBookings(freshBookings);

        // Detect newly arrived pending requests
        const pending = freshBookings.filter(b => b.status === 'Pending');
        pending.forEach(req => {
          if (!prevPendingIdsRef.current.has(req.id)) {
            triggerDeviceAlert(req);
          }
        });
        prevPendingIdsRef.current = new Set(pending.map(b => b.id));
      }
    } catch (err) {
      console.warn('[DriverDashboard] Background state sync note:', err);
    }
  };

  useEffect(() => {
    loadData();

    // Ask notification permission if not yet decided
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    const unsubscribe = dbService.subscribe(() => {
      loadData();
    });

    // 1-second clock tick
    const clockTimer = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);

    // 3-second live server polling for rapid customer dispatch detection
    const pollTimer = setInterval(() => {
      const state = authService.getAuthState();
      if (state.driver?.id) {
        bookingsService.getDriverBookingsAsync(state.driver.id).then(freshBookings => {
          if (freshBookings && Array.isArray(freshBookings)) {
            setDriverBookings(freshBookings);
            const pending = freshBookings.filter(b => b.status === 'Pending');
            pending.forEach(req => {
              if (!prevPendingIdsRef.current.has(req.id)) {
                triggerDeviceAlert(req);
              }
            });
            prevPendingIdsRef.current = new Set(pending.map(b => b.id));
          }
        }).catch(() => {});
      }
    }, 3000);

    return () => {
      unsubscribe();
      clearInterval(clockTimer);
      clearInterval(pollTimer);
    };
  }, []);

  // Automatic 60-second timeout: automatically pass to next online driver if unaccepted
  useEffect(() => {
    if (!driver) return;
    const pending = driverBookings.filter(b => b.status === 'Pending');
    if (pending.length === 0) return;
    pending.forEach(req => {
      const assignedTime = new Date(req.assignedAt || req.createdAt).getTime();
      const elapsedSeconds = Math.floor((nowTimestamp - assignedTime) / 1000);
      if (elapsedSeconds >= 60) {
        bookingsService.passToNextDriverAsync(req.id).then(() => {
          loadData();
        }).catch(() => {});
      }
    });
  }, [nowTimestamp, driverBookings, driver]);

  if (!driver) return null;

  const pendingRequests = driverBookings.filter(b => b.status === 'Pending');
  const activeBookings = driverBookings.filter(b => b.status === 'Accepted' || b.status === 'Driver Arriving' || b.status === 'In Progress');
  const completedTrips = driverBookings.filter(b => b.status === 'Completed');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCompletedTrips = completedTrips.filter(b => {
    const tripDate = b.tripCompletedAt || b.updatedAt || b.createdAt;
    return tripDate && new Date(tripDate).toISOString().split('T')[0] === todayStr;
  });
  const todayEarnings = todayCompletedTrips.reduce((acc, curr) => acc + (curr.finalFare || curr.estimatedFare || 0), 0);
  const totalEarnings = completedTrips.reduce((acc, curr) => acc + (curr.finalFare || curr.estimatedFare || 0), 0);
  const pendingFee = driver.pendingCommissionFee || 0;
  const isHold = driver.isHold || pendingFee > 0 || driver.status === 'Hold' || driver.status === 'Payment Due';

  const handleToggleOnline = async () => {
    if (isHold) {
      setAvailabilityError('Your profile is currently on Hold / Payment Due. Please settle the outstanding platform fee to go Online.');
      setTimeout(() => setAvailabilityError(null), 5000);
      return;
    }

    if (driver.status === 'Pending' || driver.status === 'Rejected') {
      setAvailabilityError(`Cannot go online while driver profile is ${driver.status}. Admin verification approval is required.`);
      setTimeout(() => setAvailabilityError(null), 5000);
      return;
    }

    const nextState = !driver.isOnline;
    setIsTogglingAvailability(true);
    setAvailabilityError(null);
    setAvailabilitySuccessMsg(null);

    try {
      let geo = undefined;
      if (nextState) {
        try {
          geo = await gpsService.captureEventLocation('Driver Online');
        } catch {}
      }

      // Persist to server database first
      const res = await driversService.toggleOnlineAsync(driver.id, nextState, geo);

      if (res.success && res.driver) {
        setDriver(res.driver);
        setAvailabilitySuccessMsg(res.message || (nextState ? 'You are now Online and visible in customer search!' : 'You are now Offline.'));
        setTimeout(() => setAvailabilitySuccessMsg(null), 4000);
      } else {
        throw new Error(res.error || 'Server rejected availability update.');
      }
    } catch (err: any) {
      console.error('[Driver Dashboard] Availability toggle error:', err);
      setAvailabilityError(err.message || 'Failed to update online status on server. Your saved state was restored.');
      setTimeout(() => setAvailabilityError(null), 5000);
      // Re-fetch authoritative state from server
      driversService.getDriverByIdAsync(driver.id).then(fresh => {
        if (fresh) setDriver(fresh);
      });
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  const handleAcceptRequest = async (bookingId: string) => {
    if (isHold) {
      alert('Your profile is on Hold. Please settle your platform fee to accept new bookings.');
      return;
    }
    setIsProcessingActionId(bookingId);
    try {
      const res = await bookingsService.acceptBookingAsync(bookingId);
      if (res.success) {
        await loadData();
      } else {
        alert(res.error || 'Unable to accept booking. It may have expired or been assigned to another driver.');
        await loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Error accepting booking.');
    } finally {
      setIsProcessingActionId(null);
    }
  };

  const handleRejectRequest = async (bookingId: string) => {
    setIsProcessingActionId(bookingId);
    try {
      await bookingsService.passToNextDriverAsync(bookingId);
      await loadData();
    } catch (err: any) {
      console.error('Error passing booking:', err);
    } finally {
      setIsProcessingActionId(null);
    }
  };

  // Start Trip Action (Captures Start GPS & Starts Authoritative Timer)
  const handleConfirmStartTrip = async () => {
    if (!startTripBooking) return;
    setIsStartingTrip(true);

    const startLocation = await gpsService.captureEventLocation('Trip Start');
    const odoVal = odometerStartInput.trim() ? Number(odometerStartInput.trim()) : undefined;

    await bookingsService.startTripAsync(startTripBooking.id, startLocation, odoVal);
    setIsStartingTrip(false);
    setStartTripBooking(null);
    setOdometerStartInput('');
    loadData();
  };

  // End Trip Action (Captures End GPS & Finalizes Authoritative Billing)
  const handleConfirmEndTrip = async () => {
    if (!endTripBooking) return;
    setIsEndingTrip(true);

    const endLocation = await gpsService.captureEventLocation('Trip End');
    const odoVal = odometerEndInput.trim() ? Number(odometerEndInput.trim()) : undefined;

    await bookingsService.completeTripAsync(endTripBooking.id, endLocation, 'driver', odoVal);
    setIsEndingTrip(false);
    setEndTripBooking(null);
    setOdometerEndInput('');
    loadData();
  };

  const handlePayCommission = () => {
    const updated = driversService.payCommissionFee(driver.id, pendingFee || 50);
    if (updated) {
      setDriver(updated);
      setPaymentSuccessMsg('Payment Received. Platform fee settled. Your profile is now Active and Online for customer search.');
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

              {driver.lastKnownLocation?.address && (
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Compass className="w-3 h-3 text-brand-600 shrink-0" />
                  <span>Last Location: {driver.lastKnownLocation.address}</span>
                </div>
              )}
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

      {/* PLATFORM FEE PAYMENT DUE CARD */}
      {isHold && (
        <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-amber-400/80 mb-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300">
                <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                  <span>Action Required • Account Paused</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                  Outstanding Platform Fee: ₹{pendingFee || 50}
                </h3>
                <p className="text-xs text-slate-600 max-w-xl leading-relaxed font-medium">
                  Your driver profile is paused for customer discovery. Settle your last trip platform fee to reactivate your online status and resume receiving automated ride dispatches.
                </p>

                {/* Secure UPI Payment Link */}
                <div className="mt-2 bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-mono text-[11px] text-slate-700 flex items-center gap-2 max-w-md overflow-x-auto">
                  <ExternalLink className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                  <span className="truncate font-semibold">
                    {driver.paymentLinkUrl || `https://pay.localdrivers.in/upi?amount=${pendingFee || 50}&driver=${driver.driverCode || driver.id}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-2.5 w-full md:w-auto shrink-0">
              {/* OPEN UPI APP OR PAYMENT LINK */}
              <a
                href={`upi://pay?pa=8500274288@upi&pn=Localdrivers%20Hyderabad&am=${pendingFee || 50}&cu=INR&tn=Driver%20${driver.driverCode || driver.id}%20Platform%20Fee`}
                className="px-5 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4 text-white" />
                Pay via UPI App (₹{pendingFee || 50})
              </a>

              {/* VERIFY & UNHOLD PROFILE */}
              <button
                onClick={handlePayCommission}
                className="px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Verify Payment & Go Online
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
            <span>₹{todayEarnings}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Completed Trips</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {driver.totalTrips + completedTrips.length}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Driver Rating</span>
          <div className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-1.5">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <span>{driver.rating}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Active Jobs</span>
          <div className="text-2xl font-black text-brand-600 mt-1">
            {activeBookings.length}
          </div>
        </div>
      </div>

      {/* 24/7 HELPLINE BANNER */}
      <div className="mb-6 bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Phone className="w-4 h-4 text-emerald-400" />
          <span>24/7 Driver Support & Dispatch Desk: Road No. 36, Jubilee Hills</span>
        </div>
        <a
          href="tel:+918500274288"
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-colors flex items-center gap-1.5"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Driver Helpline: 85002 74288</span>
        </a>
      </div>

      {/* ACTIVE & CONFIRMED BOOKINGS (START TRIP / IN PROGRESS / COMPLETE) */}
      {activeBookings.length > 0 && (
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <span>Active Confirmed Trips</span>
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
              const isTripActive = b.status === 'In Progress';
              const liveBilling = billingService.calculateTripCharges(b, nowTimestamp);

              return (
                <div key={b.id} className="bg-white rounded-3xl p-6 border-2 border-emerald-500/80 shadow-xl space-y-4 relative overflow-hidden">
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-xs text-brand-700">{b.id}</span>
                      <h4 className="font-black text-slate-900 text-lg mt-0.5">{b.customerName}</h4>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        {isTripActive ? 'Provisional Total' : 'Estimated Fare'}
                      </span>
                      <span className="text-xl font-black text-emerald-600">
                        ₹{isTripActive ? liveBilling.totalEstimatedOrFinal : b.estimatedFare}
                      </span>
                    </div>
                  </div>

                  {/* LIVE TIMER CARD IF IN PROGRESS */}
                  {isTripActive && (
                    <div className="p-4 bg-brand-50/80 border-2 border-brand-500 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase text-brand-800 tracking-wider block">
                            Live Authoritative Trip Timer
                          </span>
                          <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">
                            {liveBilling.formattedElapsed}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold text-brand-900 block">
                            {liveBilling.billableHours} Billable Hours
                          </span>
                          <span className="text-[10px] text-slate-500">
                            @ ₹{b.pricingSnapshot?.baseHourlyRate || 200}/hr
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-brand-900 font-semibold bg-brand-100/70 p-2 rounded-xl border border-brand-200">
                        Timer continues continuously during destination waiting, overnight stays, and return travel until ride completion.
                      </div>

                      {b.tripStartLocation?.address && (
                        <div className="pt-1 text-[11px] text-slate-600 font-medium">
                          Start GPS: {b.tripStartLocation.address}
                        </div>
                      )}
                    </div>
                  )}

                  {/* UNLOCKED CUSTOMER PHONE & DIRECT CONTACT BUTTONS */}
                  <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-emerald-800 block">
                        Customer Mobile (Direct Call)
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
                      <span className="font-bold text-slate-900">Pickup: <span className="font-normal text-slate-700">{b.pickupLocation}</span></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Navigation className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="font-bold text-slate-900">Destination: <span className="font-normal text-slate-700">{b.destinationLocation}</span></span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-700 pt-2 border-t border-slate-200/60 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Expected Duration:</span>
                        <strong className="text-slate-900">{b.expectedTotalDurationHours || b.durationHours || 2} Hours</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Destination Waiting:</span>
                        <strong className="text-amber-900">{b.expectedWaitingHours !== undefined ? `${b.expectedWaitingHours} Hours` : '0 Hours'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Road Route:</span>
                        <strong className="text-slate-900">{b.estimatedDistanceKm || 10} km {b.isReturnTrip ? '(Round)' : ''}</strong>
                      </div>
                    </div>

                    {b.notes && (
                      <div className="pt-1 text-[11px] text-slate-600 italic">
                        "{b.notes}"
                      </div>
                    )}
                  </div>

                  {/* ACTION CONTROLS: START TRIP vs COMPLETE TRIP */}
                  <div className="pt-2">
                    {!isTripActive ? (
                      <button
                        onClick={() => setStartTripBooking(b)}
                        className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        Start Trip (Record GPS & Start Timer)
                      </button>
                    ) : (
                      <button
                        onClick={() => setEndTripBooking(b)}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Square className="w-4 h-4 fill-white" />
                        Complete Ride & Finalize Bill
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PENDING BOOKING REQUESTS SECTION */}
      <div className="space-y-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <span>Pending Customer Requests</span>
              {pendingRequests.length > 0 && (
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              )}
            </h2>
            <span className="text-xs font-bold text-slate-500">• Real-time Dispatch</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playDispatchAlertSound();
                if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
              }}
              className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-800 text-xs font-bold rounded-xl border border-brand-200 transition-colors flex items-center gap-1.5"
              title="Test dispatch alert sound"
            >
              <Volume2 className="w-3.5 h-3.5 text-brand-600" />
              <span>Test Chime</span>
            </button>
            <button
              onClick={() => loadData()}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
              title="Refresh requests"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* HIGH-ATTENTION ALERT BANNER WHEN RIDE IS WAITING */}
        {pendingRequests.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-emerald-500 via-brand-600 to-emerald-600 text-white rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-white animate-bounce" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider block">
                  🚨 New Customer Ride Dispatch Available!
                </span>
                <span className="text-[11px] text-white/90 font-medium">
                  Respond before the 60-second dispatch window passes to another driver.
                </span>
              </div>
            </div>
            <span className="px-3 py-1 bg-white/20 rounded-full font-mono font-black text-xs shrink-0">
              {pendingRequests.length} Waiting
            </span>
          </div>
        )}

        {pendingRequests.length > 0 ? (
          <div className="space-y-4">
            {pendingRequests.map(req => {
              const cleanDigits = (req.customerPhone || '').replace(/\D/g, '');
              const maskedPhone = cleanDigits.length >= 10
                ? `+91 ${cleanDigits.slice(-10, -6)}* *****`
                : '+91 ***** *****';

              const assignedTime = new Date(req.assignedAt || req.createdAt).getTime();
              const elapsedSeconds = Math.floor((nowTimestamp - assignedTime) / 1000);
              const remainingSec = Math.max(0, 60 - elapsedSeconds);
              const progressPct = Math.min(100, Math.max(0, (remainingSec / 60) * 100));
              const isProcessing = isProcessingActionId === req.id;

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-3xl p-6 border-2 border-brand-500/80 shadow-2xl relative overflow-hidden space-y-4 ring-4 ring-brand-100"
                >
                  {/* COUNTDOWN PROGRESS BAR */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-slate-100">
                    <div
                      className={`h-full transition-all duration-1000 ease-linear ${
                        remainingSec > 30
                          ? 'bg-emerald-500'
                          : remainingSec > 15
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-brand-700 bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-200">
                          {req.id}
                        </span>
                        <span className="text-xs font-extrabold text-slate-800">
                          {req.serviceTitle}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mt-1">{req.customerName}</h3>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-2xl font-black text-emerald-600">₹{req.estimatedFare}</div>
                      <span className="text-[11px] font-bold text-slate-500 block">
                        Estimated road: {req.estimatedDistanceKm || 10} km
                      </span>
                    </div>
                  </div>

                  <div className="bg-amber-50/70 border border-amber-200/80 p-3 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-900">
                      <Lock className="w-4 h-4 text-amber-600" />
                      <span>Customer Phone: {maskedPhone}</span>
                    </div>
                    <span className="text-[10px] text-amber-800 font-bold">Unlocks on Accept</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs text-slate-700">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                      <span><strong>Pickup:</strong> {req.pickupLocation}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Navigation className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Drop-off:</strong> {req.destinationLocation}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 pt-1.5 border-t border-slate-200 text-[11px]">
                      <span>Service Duration: <strong className="text-slate-900">{req.expectedTotalDurationHours || req.durationHours || 2} Hours</strong></span>
                      <span>Waiting: <strong className="text-amber-900">{req.expectedWaitingHours !== undefined ? `${req.expectedWaitingHours} Hours` : '0 Hours'}</strong></span>
                      {req.isReturnTrip && <span className="font-bold text-purple-700">Round Trip</span>}
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => handleRejectRequest(req.id)}
                      disabled={isProcessing}
                      className="py-3 px-4 rounded-xl border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? 'Processing...' : 'Decline / Pass'}
                    </button>
                    <button
                      onClick={() => handleAcceptRequest(req.id)}
                      disabled={isProcessing}
                      className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isProcessing ? 'Accepting...' : `Accept Booking (${remainingSec}s)`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Dispatch Radar Active
            </span>
            <p className="text-sm font-bold text-slate-800">
              No pending customer requests currently in your zone.
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Stay Online with GPS enabled. New customer bookings in Hyderabad will alert you automatically with audio & vibration notifications.
            </p>
          </div>
        )}
      </div>

      {/* START TRIP MODAL */}
      {startTripBooking && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setStartTripBooking(null);
          }}
          className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto modal-overlay-container overscroll-contain animate-in fade-in"
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative my-auto overscroll-contain max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
              <Play className="w-6 h-6 fill-brand-600" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900">Start Driver Service</h3>
              <p className="text-xs text-slate-500 mt-1">
                Have you arrived and boarded the customer's vehicle?
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1 text-slate-700">
              <div><strong>Customer:</strong> {startTripBooking.customerName}</div>
              <div><strong>Pickup:</strong> {startTripBooking.pickupLocation}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Optional Starting Odometer Reading (km)
              </label>
              <input
                type="number"
                value={odometerStartInput}
                onChange={e => setOdometerStartInput(e.target.value)}
                placeholder="e.g. 45150"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Recommended for highway & outstation distance verification.
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStartTripBooking(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isStartingTrip}
                onClick={handleConfirmStartTrip}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold shadow-md disabled:opacity-50"
              >
                {isStartingTrip ? 'Capturing GPS...' : 'Confirm & Start Trip'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* END TRIP MODAL */}
      {endTripBooking && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setEndTripBooking(null);
          }}
          className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto modal-overlay-container overscroll-contain animate-in fade-in"
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative my-auto overscroll-contain max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <Square className="w-6 h-6 fill-emerald-600" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900">Complete Trip & Finalize</h3>
              <p className="text-xs text-slate-500 mt-1">
                Service ended with customer. Record final GPS and duration.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Optional Final Odometer Reading (km)
              </label>
              <input
                type="number"
                value={odometerEndInput}
                onChange={e => setOdometerEndInput(e.target.value)}
                placeholder="e.g. 45280"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEndTripBooking(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Continue Ride
              </button>
              <button
                type="button"
                disabled={isEndingTrip}
                onClick={handleConfirmEndTrip}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md disabled:opacity-50"
              >
                {isEndingTrip ? 'Recording GPS...' : 'Complete & Collect Fare'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

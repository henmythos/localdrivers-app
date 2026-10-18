import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Clock, MapPin, Navigation, Phone, 
  ShieldCheck, CheckCircle2, AlertCircle, Car, ShieldAlert, 
  Hash, Lock, Search, AlertTriangle, Play, Square, RotateCcw, 
  HelpCircle, Receipt, ExternalLink, Compass, X 
} from 'lucide-react';
import { Booking } from '../types';
import { bookingsService } from '../services/bookings';
import { dbService } from '../services/database';
import { authService } from '../services/auth';
import { billingService, formatDuration } from '../services/billing';
import { gpsService } from '../services/gps';
import { RouteMap } from '../components/map/RouteMap';
import { ReportDriverModal } from '../components/common/ReportDriverModal';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

export const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Security Access Verification State
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [verifyPhone, setVerifyPhone] = useState('');
  const [authError, setAuthError] = useState('');

  // End Trip Confirmation Modal State
  const [showEndTripModal, setShowEndTripModal] = useState(false);
  const [odometerInput, setOdometerInput] = useState('');
  const [isEndingTrip, setIsEndingTrip] = useState(false);

  // Dispute Modal State
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  useBodyScrollLock(showEndTripModal || showDisputeModal, () => {
    setShowEndTripModal(false);
    setShowDisputeModal(false);
  });

  const [nowTimestamp, setNowTimestamp] = useState(Date.now());

  const loadBooking = async () => {
    if (id) {
      const live = await bookingsService.getBookingByIdAsync(id);
      if (live) {
        setBooking(live);
        checkAuthorization(live);
        return;
      }
      const found = bookingsService.getBookingById(id);
      if (found) {
        setBooking(found);
        checkAuthorization(found);
      }
    }
  };

  const checkAuthorization = (targetBooking: Booking) => {
    const authState = authService.getAuthState();

    // 1. Admin is always authorized
    if (authState.isAdminAuthenticated) {
      setIsAuthorized(true);
      return;
    }

    // 2. Assigned driver is authorized
    if (authState.isDriverAuthenticated && authState.driver && authState.driver.id === targetBooking.driverId) {
      setIsAuthorized(true);
      return;
    }

    // 3. Customer verified phone matches booking phone
    const savedPhone = localStorage.getItem('localdrivers_verified_customer_phone');
    if (savedPhone) {
      const savedDigits = savedPhone.replace(/\D/g, '');
      const bDigits = targetBooking.customerPhone.replace(/\D/g, '');
      if (savedDigits.length >= 10 && (bDigits.endsWith(savedDigits) || savedDigits.endsWith(bDigits))) {
        setIsAuthorized(true);
        return;
      }
    }

    setIsAuthorized(false);
  };

  useEffect(() => {
    loadBooking();
    const unsubscribe = dbService.subscribe(() => {
      loadBooking();
    });
    const interval = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [id]);

  // Auto-pass if still pending after 20s
  useEffect(() => {
    if (booking && booking.status === 'Pending') {
      const assignedTime = new Date(booking.assignedAt || booking.createdAt).getTime();
      const elapsedSeconds = Math.floor((nowTimestamp - assignedTime) / 1000);
      if (elapsedSeconds >= 20) {
        bookingsService.passToNextDriver(booking.id);
      }
    }
  }, [nowTimestamp, booking]);

  const handleAuthorizePhone = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!booking) return;

    const inputDigits = verifyPhone.replace(/\D/g, '');
    const bookingDigits = booking.customerPhone.replace(/\D/g, '');

    if (!inputDigits || inputDigits.length < 10) {
      setAuthError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (bookingDigits.endsWith(inputDigits) || inputDigits.endsWith(bookingDigits)) {
      localStorage.setItem('localdrivers_verified_customer_phone', inputDigits);
      setIsAuthorized(true);
    } else {
      setAuthError('Mobile number does not match this booking record');
    }
  };

  // Customer End Trip Action
  const handleEndTripSubmit = async () => {
    if (!booking) return;
    setIsEndingTrip(true);

    try {
      // Capture end GPS location
      const endLocation = await gpsService.captureEventLocation('Trip End');
      const odometerVal = odometerInput.trim() ? Number(odometerInput.trim()) : undefined;

      await bookingsService.completeTripAsync(booking.id, endLocation, 'customer', odometerVal);
      loadBooking();
    } catch (err) {
      console.error('Failed to complete trip:', err);
    } finally {
      setIsEndingTrip(false);
      setShowEndTripModal(false);
    }
  };

  // Customer Dispute Submit
  const handleDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !disputeReason.trim()) return;
    bookingsService.raiseDispute(booking.id, disputeReason.trim());
    setShowDisputeModal(false);
    setDisputeReason('');
  };

  if (!booking) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Booking Request Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">Invalid booking identifier.</p>
        <Link to="/bookings" className="px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md">
          Back to Bookings
        </Link>
      </div>
    );
  }

  // Security Access Barrier Page
  if (!isAuthorized) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-2xl text-center space-y-6">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-red-100">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-900">Protected Booking Record</h1>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              To protect customer privacy & route security, enter the <strong>10-digit Customer Mobile Number</strong> associated with Booking <strong className="font-mono text-brand-700">#{booking.id}</strong>.
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthorizePhone} className="space-y-4">
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                required
                value={verifyPhone}
                onChange={e => setVerifyPhone(e.target.value)}
                placeholder="Enter Customer Mobile Number"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 text-xs font-mono font-bold"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Verify Mobile & View Booking Details
            </button>
          </form>

          <div className="pt-2">
            <Link to="/bookings" className="text-xs font-bold text-slate-500 hover:text-slate-800">
              Return to My Bookings Hub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Live Timer Calculation
  const isTripActive = booking.status === 'In Progress';
  const liveBilling = billingService.calculateTripCharges(booking, nowTimestamp);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
      
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to my bookings
        </button>

        <button
          onClick={() => setShowReportModal(true)}
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full border border-red-200 transition-colors"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Report Driver ({booking.driverCode || 'A1B2C3'})
        </button>
      </div>

      {/* ACTIVE TRIP IN-APP REMINDER BANNER */}
      {isTripActive && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500 text-amber-950 border-2 border-amber-600 shadow-lg flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <span className="font-black text-sm block">Trip Is Currently Active</span>
              <p className="text-xs font-semibold text-amber-900 leading-tight">
                Your driver trip is active. If your service is complete, please tap End Trip to finalize trip duration and charges.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowEndTripModal(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shrink-0 shadow-md transition-all flex items-center gap-1.5"
          >
            <Square className="w-3.5 h-3.5 fill-red-400 text-red-400" />
            End Trip
          </button>
        </div>
      )}

      {/* Main Status Header */}
      <div className="bg-gradient-to-r from-slate-900 to-brand-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-brand-300 font-bold uppercase tracking-wider block mb-1">
              Booking Details
            </span>
            <h1 className="text-2xl sm:text-3xl font-black font-mono">{booking.id}</h1>
            <p className="text-xs text-slate-300 mt-1">
              Requested Service: <strong>{booking.serviceTitle}</strong>
            </p>
          </div>

          <div>
            {booking.status === 'Pending' && (() => {
              const assignedTime = new Date(booking.assignedAt || booking.createdAt).getTime();
              const remainingSec = Math.max(0, 20 - Math.floor((nowTimestamp - assignedTime) / 1000));
              return (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-400 text-amber-950 flex items-center gap-2 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-amber-950 animate-ping" />
                  Connecting Driver ({remainingSec}s)
                </span>
              );
            })()}
            {booking.status === 'Accepted' && (
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-500 text-white flex items-center gap-2 shadow-md">
                <CheckCircle2 className="w-4 h-4" />
                Driver Assigned
              </span>
            )}
            {booking.status === 'In Progress' && (
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-400 text-emerald-950 flex items-center gap-2 shadow-md animate-pulse">
                <Play className="w-3.5 h-3.5 fill-current" />
                Trip In Progress
              </span>
            )}
            {booking.status === 'Completed' && (
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30">
                Trip Completed
              </span>
            )}
            {booking.status === 'Disputed' && (
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-red-500 text-white flex items-center gap-2 shadow-md">
                <AlertTriangle className="w-4 h-4" />
                Under Dispute Review
              </span>
            )}
          </div>
        </div>
      </div>

      {/* LIVE TRIP TIMER & CHARGES (Active Trip or Completed Summary) */}
      {(isTripActive || booking.status === 'Completed') && (
        <div className="bg-white rounded-3xl p-6 border-2 border-brand-500 shadow-md mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200 inline-block mb-1">
                {isTripActive ? 'Authoritative Server Trip Timer' : 'Final Trip Duration & Charges'}
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono text-slate-900 tracking-tight mt-1">
                {liveBilling.formattedElapsed}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Started: {booking.tripStartedAt ? new Date(booking.tripStartedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Pending'}
                {booking.tripStartLocation?.address && (
                  <span className="block text-[11px] text-slate-600 font-medium mt-0.5">
                    Start Location: {booking.tripStartLocation.address}
                  </span>
                )}
              </p>
            </div>

            <div className="text-left sm:text-right bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold block">
                {isTripActive ? 'Provisional Amount:' : 'Final Billed Total:'}
              </span>
              <span className="text-2xl font-black text-brand-700">
                ₹{liveBilling.totalEstimatedOrFinal}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {liveBilling.billableHours} billable hours @ ₹{booking.pricingSnapshot?.baseHourlyRate || 200}/hr
              </span>
            </div>
          </div>

          {/* Action buttons and Timer Notice */}
          {isTripActive && (
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-[11px] text-slate-600 font-medium leading-tight">
                  Timer runs continuously from the server start time through driving, destination waiting, overnight stays, and return travel. The timer does not pause when the driver reaches your destination.
                </p>
                <p className="text-[10px] text-slate-400">
                  Authoritative timestamp-based billing. Closing or refreshing your browser will not reset this duration.
                </p>
              </div>

              <button
                onClick={() => setShowEndTripModal(true)}
                className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <Square className="w-4 h-4 fill-white text-white" />
                End Trip & Finalize Bill
              </button>
            </div>
          )}
        </div>
      )}

      {/* PLANNED TRIP DURATION, DESTINATION WAITING & ROUTE SPECIFICATION */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft mb-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Planned Duration & Service Schedule</h3>
            <p className="text-xs text-slate-500">Customer-selected trip parameters and transparent fare basis</p>
          </div>
          <span className="text-xs font-black text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200 uppercase">
            {booking.billingMethod || 'Hourly'} Billing
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Expected Duration</span>
            <span className="text-base font-black text-slate-900">
              {booking.expectedTotalDurationHours || booking.durationHours || 2} Hours
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Total job period</span>
          </div>

          <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/80">
            <span className="text-amber-800 font-bold block text-[10px] uppercase">Destination Waiting</span>
            <span className="text-base font-black text-amber-950">
              {booking.expectedWaitingHours !== undefined ? `${booking.expectedWaitingHours} Hours` : '0 Hours'}
            </span>
            <span className="text-[10px] text-amber-800/80 block mt-0.5">Driver waits at venue</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Driving Time</span>
            <span className="text-base font-black text-slate-900">
              {booking.expectedDrivingMinutes 
                ? `${Math.floor(booking.expectedDrivingMinutes / 60)}h ${booking.expectedDrivingMinutes % 60}m`
                : (booking.estimatedDurationMinutes ? `${Math.round(booking.estimatedDurationMinutes)} mins` : 'Road route')}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {booking.isReturnTrip ? 'Outbound + Return' : 'Outbound only'}
            </span>
          </div>

          <div className="p-3 bg-brand-50/50 rounded-2xl border border-brand-200">
            <span className="text-brand-800 font-bold block text-[10px] uppercase">Estimated Fare</span>
            <span className="text-base font-black text-brand-700">
              ₹{booking.estimatedFare}
            </span>
            <span className="text-[10px] text-brand-800/80 block mt-0.5">Subject to actual duration</span>
          </div>
        </div>

        <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
          <div className="flex items-center justify-between">
            <span><strong>Return Schedule:</strong> {booking.returnJourneyOption === 'after_waiting' ? 'Return after waiting at destination' : booking.returnJourneyOption === 'same_day' ? 'Return on the same day' : booking.returnJourneyOption === 'different_date' ? 'Return on a different date / overnight stay' : (booking.isReturnTrip ? 'Round Trip' : 'One-way service only')}</span>
            <span className="font-mono text-slate-500">{booking.date} at {booking.time}</span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 leading-relaxed">
            Your estimated fare includes your planned driving and service duration, including the waiting time you selected. The final amount may change according to the actual trip duration and the pricing rules for your booking.
          </p>
        </div>
      </div>

      {/* PLANNED ROUTE MAP & DISTANCE DETAILS */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-extrabold text-slate-900 text-base">Road Route & Location Map</h3>
          <span className="text-xs font-black text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
            {booking.estimatedDistanceKm || 10} km Road Route
          </span>
        </div>

        <RouteMap
          pickupCoords={booking.pickupCoords}
          destinationCoords={booking.destinationCoords}
          intermediateStops={booking.intermediateStops}
          outboundPolyline={booking.routePolyline}
          isReturnTrip={booking.isReturnTrip}
          actualStartCoords={booking.tripStartLocation?.latitude ? { latitude: booking.tripStartLocation.latitude, longitude: booking.tripStartLocation.longitude } : undefined}
          actualEndCoords={booking.tripEndLocation?.latitude ? { latitude: booking.tripEndLocation.latitude, longitude: booking.tripEndLocation.longitude } : undefined}
          interactive={false}
          height="250px"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium block">Pickup:</span>
            <span className="font-bold text-slate-900">{booking.pickupLocation}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium block">Destination:</span>
            <span className="font-bold text-slate-900">{booking.destinationLocation}</span>
            {booking.isReturnTrip && (
              <span className="text-[10px] text-purple-700 font-bold block mt-0.5">
                Includes Return Route back to Pickup
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Driver Card Info */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft mb-6">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-slate-900 text-base">Assigned Driver</h3>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black font-mono bg-brand-100 text-brand-900 border border-brand-300">
            <Hash className="w-3.5 h-3.5 text-brand-700" />
            Code: #{booking.driverCode || 'A1B2C3'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={booking.driverPhoto}
              alt={booking.driverName}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-slate-900 text-base">{booking.driverName}</h4>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Verified Professional Driver</p>
              {booking.status === 'Pending' ? (
                <div className="mt-1.5 flex flex-col gap-1">
                  <span className="text-[11px] font-mono font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/80 inline-flex items-center gap-1.5 self-start">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    Mobile: +91 9876* ***** (Hidden until driver accepts)
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Driver contact number & call button will unlock as soon as {booking.driverName} accepts your ride.
                  </span>
                </div>
              ) : (
                <div className="mt-1.5 flex items-center gap-2">
                  <a
                    href={`tel:${booking.driverPhone}`}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call Driver ({booking.driverPhone})
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FINAL ITEMIZED BILL (If Completed) */}
      {booking.status === 'Completed' && (
        <div className="bg-white rounded-3xl p-6 border border-emerald-200 bg-emerald-50/20 shadow-soft mb-6">
          <div className="flex items-center gap-2 mb-4 border-b border-emerald-100 pb-3">
            <Receipt className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="font-black text-slate-900 text-base">Final Itemized Bill</h3>
              <p className="text-xs text-slate-500">Authoritative calculation based on locked pricing snapshot</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Planned Duration:</span>
              <span className="font-semibold text-slate-800">
                {booking.expectedTotalDurationHours || booking.durationHours || 2} hrs (Wait: {booking.expectedWaitingHours ?? 0} hrs)
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span>Actual Elapsed Duration:</span>
              <span className="font-semibold text-slate-800 font-mono">
                {formatDuration(booking.elapsedSeconds || 0)}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span>Billable Duration:</span>
              <span className="font-bold text-slate-900">
                {booking.billableHours || liveBilling.billableHours} hrs (@ ₹{booking.pricingSnapshot?.baseHourlyRate || 200}/hr)
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span>Time-based Charge:</span>
              <span className="font-bold text-slate-900">₹{booking.timeBasedCharge || liveBilling.timeBasedCharge}</span>
            </div>

            {(booking.distanceBasedCharge || 0) > 0 && (
              <div className="flex justify-between items-center text-slate-600">
                <span>Distance Extra Charge:</span>
                <span className="font-bold text-slate-900">₹{booking.distanceBasedCharge}</span>
              </div>
            )}

            {(booking.nightCharges || 0) > 0 && (
              <div className="flex justify-between items-center text-slate-600">
                <span>Night Driving Allowance:</span>
                <span className="font-bold text-slate-900">₹{booking.nightCharges}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black">
              <span className="text-slate-900">Total Final Fare:</span>
              <span className="text-xl text-emerald-700">₹{booking.finalFare || liveBilling.totalEstimatedOrFinal}</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Distance Record: {booking.distanceSource === 'odometer' ? 'Verified by Odometer' : 'Estimated road-route'}
            </span>
            <button
              onClick={() => setShowDisputeModal(true)}
              className="text-xs font-bold text-red-600 hover:text-red-700 underline"
            >
              Dispute Bill / Report Issue
            </button>
          </div>
        </div>
      )}

      {/* DISPUTE STATUS BANNER */}
      {booking.status === 'Disputed' && (
        <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-red-900 text-xs mb-6 space-y-1">
          <span className="font-black flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Dispute Flagged for Administration Review
          </span>
          <p className="text-red-800">
            Reason: {booking.disputeReason || 'Customer reported a billing or trip discrepancy.'}
          </p>
          <p className="text-[11px] text-red-700">
            Our 24/7 Operations team at Jubilee Hills will review the server timestamps and contact both parties.
          </p>
        </div>
      )}

      {/* END TRIP CONFIRMATION MODAL */}
      {showEndTripModal && createPortal(
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEndTripModal(false);
          }}
          className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto overscroll-contain"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[92vh] flex flex-col overflow-y-auto overscroll-contain animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shrink-0">
              <Square className="w-6 h-6 fill-red-600" />
            </div>

            <div className="text-center shrink-0">
              <h3 className="text-lg font-black text-slate-900">End Driver Service?</h3>
              <p className="text-xs text-slate-500 mt-1">
                This will finalize the trip timer and calculate the final bill.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Elapsed Time:</span>
                <span className="font-mono font-bold text-slate-900">{liveBilling.formattedElapsed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Provisional Bill:</span>
                <span className="font-extrabold text-brand-700">₹{liveBilling.totalEstimatedOrFinal}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Optional Final Odometer Reading (km)
              </label>
              <input
                type="number"
                value={odometerInput}
                onChange={e => setOdometerInput(e.target.value)}
                placeholder="e.g. 45280"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Provide if verified actual kilometers are required for billing.
              </span>
            </div>

            <div className="flex gap-2 pt-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowEndTripModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Continue Trip
              </button>
              <button
                type="button"
                disabled={isEndingTrip}
                onClick={handleEndTripSubmit}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-md disabled:opacity-50"
              >
                {isEndingTrip ? 'Recording GPS...' : 'Confirm & End Trip'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* DISPUTE MODAL */}
      {showDisputeModal && createPortal(
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDisputeModal(false);
          }}
          className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto overscroll-contain"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[92vh] flex flex-col overflow-y-auto overscroll-contain animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <h3 className="font-black text-slate-900 text-base">Raise Billing Dispute</h3>
              <button onClick={() => setShowDisputeModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDisputeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reason for Dispute
                </label>
                <textarea
                  required
                  rows={3}
                  value={disputeReason}
                  onChange={e => setDisputeReason(e.target.value)}
                  placeholder="Explain discrepancy regarding hours, route, or driver charges..."
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl"
                >
                  Submit Dispute
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* REPORT DRIVER MODAL */}
      {showReportModal && (
        <ReportDriverModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          driverId={booking.driverId}
          driverName={booking.driverName}
          driverCode={booking.driverCode || 'A1B2C3'}
          bookingId={booking.id}
        />
      )}

    </div>
  );
};

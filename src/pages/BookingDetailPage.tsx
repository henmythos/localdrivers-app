import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Clock, MapPin, Navigation, Phone, 
  ShieldCheck, CheckCircle2, AlertCircle, Car, ShieldAlert, Hash, Lock, Search 
} from 'lucide-react';
import { Booking } from '../types';
import { bookingsService } from '../services/bookings';
import { dbService } from '../services/database';
import { authService } from '../services/auth';
import { ReportDriverModal } from '../components/common/ReportDriverModal';

export const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Security Access Verification State
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [verifyPhone, setVerifyPhone] = useState('');
  const [authError, setAuthError] = useState('');

  const loadBooking = () => {
    if (id) {
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
    return () => unsubscribe();
  }, [id]);

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
              ← Return to My Bookings Hub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Timeline Step Status
  const getTimelineSteps = () => {
    const isAccepted = booking.status === 'Accepted' || booking.status === 'Driver Arriving' || booking.status === 'Completed';
    const isArriving = booking.status === 'Driver Arriving' || booking.status === 'Completed';
    const isCompleted = booking.status === 'Completed';

    return [
      { label: 'Booking Created', desc: 'Request submitted by customer', done: true, time: booking.createdAt.substring(11, 16) },
      { label: 'Driver Confirmation', desc: `${booking.driverName} confirmation`, done: isAccepted },
      { label: 'Driver Dispatch', desc: 'Driver en route to pickup location', done: isArriving },
      { label: 'Trip Completion', desc: 'End of trip & billing finalization', done: isCompleted },
    ];
  };

  const steps = getTimelineSteps();

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

      {/* Main Status Header */}
      <div className="bg-gradient-to-r from-slate-900 to-brand-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-brand-300 font-bold uppercase tracking-wider block mb-1">
              Booking Details
            </span>
            <h1 className="text-2xl sm:text-3xl font-black font-mono">{booking.id}</h1>
            <p className="text-xs text-slate-300 mt-1">Requested Service: <strong>{booking.serviceTitle}</strong></p>
          </div>

          <div>
            {booking.status === 'Pending' && (
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-400 text-amber-950 flex items-center gap-2 shadow-md">
                <span className="w-2 h-2 rounded-full bg-amber-950 animate-ping" />
                Waiting for Driver Accept
              </span>
            )}
            {booking.status === 'Accepted' && (
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-400 text-emerald-950 flex items-center gap-2 shadow-md">
                <CheckCircle2 className="w-4 h-4 text-emerald-950" />
                Driver Confirmed
              </span>
            )}
            {booking.status === 'Completed' && (
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30">
                Completed
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
                    🔒 Driver contact number & call button will unlock as soon as {booking.driverName} accepts your ride.
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

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Estimated Amount</span>
            <span className="text-2xl font-black text-slate-900">₹{booking.estimatedFare}</span>
          </div>
        </div>
      </div>

      {/* Live Timeline */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft mb-6">
        <h3 className="font-extrabold text-slate-900 text-base mb-6">Trip Status Timeline</h3>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {steps.map((step, idx) => (
            <div key={idx} className="relative flex items-start gap-4">
              <div className={`absolute -left-6 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                step.done
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'bg-white border-slate-300'
              }`}>
                {step.done && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>

              <div>
                <h5 className={`font-bold text-sm ${step.done ? 'text-slate-900' : 'text-slate-400'}`}>
                  {step.label}
                </h5>
                <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Route & Trip Details */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft space-y-4">
        <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3">Route Information</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase block mb-1">Pickup Location</span>
            <div className="flex items-start gap-2 font-medium text-slate-800">
              <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
              <span>{booking.pickupLocation}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase block mb-1">Destination</span>
            <div className="flex items-start gap-2 font-medium text-slate-800">
              <Navigation className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{booking.destinationLocation}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase block mb-1">Scheduled Date & Time</span>
            <div className="flex items-center gap-2 font-medium text-slate-800">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{booking.date} at {booking.time}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase block mb-1">Customer Details</span>
            <span className="font-bold text-slate-900 block">{booking.customerName}</span>
            <span className="text-slate-500 font-medium font-mono text-xs">
              {booking.status === 'Pending' && authService.getAuthState().isDriverAuthenticated
                ? '🔒 +91 9988* ***** (Hidden until ride accepted)'
                : booking.customerPhone}
            </span>
          </div>
        </div>

        {booking.notes && (
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 font-bold uppercase block mb-1">Special Notes</span>
            <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              "{booking.notes}"
            </p>
          </div>
        )}
      </div>

      {/* Report Driver Modal */}
      <ReportDriverModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        initialDriverCode={booking.driverCode}
        initialDriverName={booking.driverName}
      />
    </div>
  );
};

export default BookingDetailPage;

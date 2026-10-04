import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, MapPin, Clock, Navigation, Phone, ShieldCheck, ChevronRight, 
  RefreshCw, Car, Lock, Search, LogOut, CheckCircle2, ShieldAlert 
} from 'lucide-react';
import { Booking, BookingStatus } from '../types';
import { bookingsService } from '../services/bookings';
import { dbService } from '../services/database';

export const BookingsPage: React.FC = () => {
  const [customerPhone, setCustomerPhone] = useState<string>(
    localStorage.getItem('localdrivers_verified_customer_phone') || ''
  );
  const [inputPhone, setInputPhone] = useState<string>('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string>('');

  const loadBookings = (phoneToUse?: string) => {
    const targetPhone = phoneToUse !== undefined ? phoneToUse : customerPhone;
    if (targetPhone.trim().length >= 10) {
      const found = bookingsService.getBookingsByCustomerPhone(targetPhone);
      setBookings(found);
    } else {
      setBookings(bookingsService.getCustomerBookings());
    }
  };

  useEffect(() => {
    loadBookings();
    const unsubscribe = dbService.subscribe(() => {
      loadBookings();
    });
    return () => unsubscribe();
  }, [customerPhone]);

  const handleVerifyPhone = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const clean = inputPhone.replace(/\D/g, '');
    if (!clean || clean.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    localStorage.setItem('localdrivers_verified_customer_phone', clean);
    setCustomerPhone(clean);
    loadBookings(clean);
  };

  const handleClearSession = () => {
    localStorage.removeItem('localdrivers_verified_customer_phone');
    setCustomerPhone('');
    setInputPhone('');
    setBookings([]);
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Waiting for Driver Accept
          </span>
        );
      case 'Accepted':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Driver Confirmed
          </span>
        );
      case 'Driver Arriving':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            Driver En Route
          </span>
        );
      case 'Completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Trip Completed
          </span>
        );
      case 'Cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Customer Booking Hub</h1>
          <p className="text-xs text-slate-500 mt-1">
            Protected personal trip history and real-time dispatch tracker
          </p>
        </div>

        {customerPhone && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadBookings()}
              className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold"
              title="Refresh status"
            >
              <RefreshCw className="w-4 h-4 text-brand-600" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={handleClearSession}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Lock Session
            </button>
          </div>
        )}
      </div>

      {/* SECURE LOOKUP GUARD FORM (If Phone Not Verified) */}
      {!customerPhone ? (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-2xl max-w-lg mx-auto text-center space-y-6">
          <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-brand-100">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-900">Protected Booking History</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              For security & privacy, enter your registered <strong>10-digit Mobile Number</strong> to unlock your personal booking history and track active rides.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleVerifyPhone} className="space-y-4">
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                required
                value={inputPhone}
                onChange={e => setInputPhone(e.target.value)}
                placeholder="Enter 10-digit Mobile Number (e.g. 9988776655)"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 text-xs font-mono font-bold"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-black text-xs rounded-xl shadow-lg shadow-brand-600/25 transition-all flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              Unlock & Access My Private Bookings
            </button>
          </form>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-left text-[11px] text-slate-500 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Your phone number is used solely to fetch your specific booking records. No public exposure of customer data.
            </span>
          </div>
        </div>
      ) : (
        /* VERIFIED BOOKINGS LIST */
        <div className="space-y-6">
          
          {/* Active Session Banner */}
          <div className="p-4 bg-brand-50/70 border border-brand-200 rounded-2xl flex items-center justify-between text-xs text-brand-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
              <span>
                Verified Customer Session: <strong className="font-mono text-brand-900">{customerPhone}</strong>
              </span>
            </div>
            <span className="text-[10px] font-bold text-brand-700 bg-brand-200/60 px-2 py-0.5 rounded uppercase">
              {bookings.length} {bookings.length === 1 ? 'Booking' : 'Bookings'}
            </span>
          </div>

          {bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map(booking => (
                <div
                  key={booking.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-soft hover:shadow-card transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-base text-brand-700">{booking.id}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                        {booking.serviceTitle}
                      </span>
                    </div>

                    {getStatusBadge(booking.status)}
                  </div>

                  {/* Driver & Details */}
                  <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    
                    <div className="flex items-center gap-3">
                      <img
                        src={booking.driverPhoto}
                        alt={booking.driverName}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-sm"
                      />
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Assigned Driver</span>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-900 text-sm">{booking.driverName}</span>
                          <span className="text-[10px] font-bold font-mono bg-brand-50 text-brand-900 px-1 rounded border border-brand-200">
                            #{booking.driverCode || 'A1B2C3'}
                          </span>
                        </div>
                        <a
                          href={`tel:${booking.driverPhone}`}
                          className="text-xs text-brand-600 font-semibold block hover:underline mt-0.5"
                        >
                          {booking.driverPhone}
                        </a>
                      </div>
                    </div>

                    {/* Locations */}
                    <div className="space-y-1.5 text-xs sm:col-span-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                        <span className="text-slate-700 font-medium"><strong>Pickup:</strong> {booking.pickupLocation}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Navigation className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-slate-700 font-medium"><strong>Destination:</strong> {booking.destinationLocation}</span>
                      </div>
                    </div>

                  </div>

                  {/* Footer info */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-4 text-slate-500">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {booking.date}
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {booking.time}
                      </span>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Fare Estimate</span>
                        <span className="text-lg font-black text-slate-900">₹{booking.estimatedFare}</span>
                      </div>

                      <Link
                        to={`/bookings/${booking.id}`}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-lg">No Bookings Found for {customerPhone}</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active or completed booking requests match this mobile number.
              </p>
              <Link
                to="/find-drivers"
                className="inline-block px-6 py-3 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Find & Book Drivers Near You
              </Link>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default BookingsPage;

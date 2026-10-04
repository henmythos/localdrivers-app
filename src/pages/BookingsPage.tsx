import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Navigation, Phone, ShieldCheck, ChevronRight, RefreshCw, Car } from 'lucide-react';
import { Booking, BookingStatus } from '../types';
import { bookingsService } from '../services/bookings';
import { dbService } from '../services/database';

export const BookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);

  const loadBookings = () => {
    setBookings(bookingsService.getCustomerBookings());
  };

  useEffect(() => {
    loadBookings();
    // Subscribe to live database updates (e.g., when a driver accepts a booking!)
    const unsubscribe = dbService.subscribe(() => {
      loadBookings();
    });
    return () => unsubscribe();
  }, []);

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Waiting for Driver
          </span>
        );
      case 'Accepted':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Driver Accepted
          </span>
        );
      case 'Driver Arriving':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            Driver On The Way
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
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">My Bookings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track active requests and trip history (Saved locally on your device)
          </p>
        </div>

        <button
          onClick={loadBookings}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs font-bold"
          title="Refresh booking status"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Refresh Status</span>
        </button>
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
                    <span className="font-bold text-slate-900 text-sm">{booking.driverName}</span>
                    <a
                      href={`tel:${booking.driverPhone}`}
                      className="text-xs text-brand-600 font-semibold block hover:underline"
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
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
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
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-lg">No Bookings Found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-5">You haven't requested any drivers yet.</p>
          <Link
            to="/find-drivers"
            className="px-6 py-3 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md"
          >
            Find & Book Drivers Near You
          </Link>
        </div>
      )}
    </div>
  );
};

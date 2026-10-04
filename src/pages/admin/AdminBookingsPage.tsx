import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Phone, Search, Filter, ShieldCheck, MapPin, Navigation, Calendar } from 'lucide-react';
import { Booking } from '../../types';
import { bookingsService } from '../../services/bookings';
import { dbService } from '../../services/database';

export const AdminBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [mobileSearch, setMobileSearch] = useState('');

  const load = () => {
    setBookings(bookingsService.getAllBookings());
  };

  useEffect(() => {
    load();
    const unsubscribe = dbService.subscribe(() => load());
    return () => unsubscribe();
  }, []);

  // Filter bookings by mobile number or booking ID or name
  const filteredBookings = bookings.filter(b => {
    if (!mobileSearch.trim()) return true;
    const query = mobileSearch.trim().toLowerCase().replace(/\s+/g, '');
    const custPhone = (b.customerPhone || '').replace(/\s+/g, '').toLowerCase();
    const drvPhone = (b.driverPhone || '').replace(/\s+/g, '').toLowerCase();
    const custName = (b.customerName || '').toLowerCase();
    const drvName = (b.driverName || '').toLowerCase();
    const bookingId = (b.id || '').toLowerCase();

    return (
      custPhone.includes(query) ||
      drvPhone.includes(query) ||
      custName.includes(query) ||
      drvName.includes(query) ||
      bookingId.includes(query)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
      
      <button
        onClick={() => navigate('/admin/dashboard')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Admin Dashboard
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Admin Booking & Mobile Tracker</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track customer and driver booking history by entering any mobile number
          </p>
        </div>
      </div>

      {/* MOBILE NUMBER SEARCH & TRACKING BAR */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-soft mb-6 space-y-3">
        <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
          Track Bookings by Mobile Number
        </label>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Phone className="w-4 h-4 text-brand-600 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={mobileSearch}
              onChange={e => setMobileSearch(e.target.value)}
              placeholder="Enter Customer or Driver Mobile Number (e.g. +91 99887 76655)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {mobileSearch && (
            <button
              onClick={() => setMobileSearch('')}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors shrink-0"
            >
              Clear Search
            </button>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[11px] text-slate-500 font-medium">Quick Demo Filters:</span>
          <button
            onClick={() => setMobileSearch('+91 99887 76655')}
            className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-[11px] border border-purple-200"
          >
            Priya Sharma (+91 99887 76655)
          </button>
          <button
            onClick={() => setMobileSearch('+91 98765 43210')}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] border border-emerald-200"
          >
            Ravi Kumar (+91 98765 43210)
          </button>
        </div>
      </div>

      {/* BOOKINGS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Booking ID</th>
                <th className="p-4">Customer & Phone</th>
                <th className="p-4">Driver & Phone</th>
                <th className="p-4">Service</th>
                <th className="p-4">Pickup & Destination</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Fare</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.length > 0 ? (
                filteredBookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-black text-brand-700">{b.id}</td>
                    
                    {/* Customer */}
                    <td className="p-4">
                      <span className="font-bold text-slate-900 block">{b.customerName}</span>
                      <a
                        href={`tel:${b.customerPhone}`}
                        className="text-xs font-extrabold text-purple-700 hover:underline inline-flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3 text-purple-600" />
                        {b.customerPhone}
                      </a>
                    </td>

                    {/* Driver */}
                    <td className="p-4">
                      <span className="font-bold text-slate-900 block">{b.driverName}</span>
                      <a
                        href={`tel:${b.driverPhone}`}
                        className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3 text-emerald-600" />
                        {b.driverPhone}
                      </a>
                    </td>

                    <td className="p-4 font-semibold text-slate-800">{b.serviceTitle}</td>
                    
                    {/* Route */}
                    <td className="p-4 max-w-xs text-slate-600 truncate">
                      <div className="font-medium text-slate-900 truncate">From: {b.pickupLocation}</div>
                      <div className="text-slate-500 truncate">To: {b.destinationLocation}</div>
                    </td>

                    <td className="p-4 text-slate-600 font-medium">{b.date} at {b.time}</td>
                    
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        b.status === 'Accepted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'Pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {b.status}
                      </span>
                    </td>

                    <td className="p-4 text-right font-black text-slate-900">₹{b.estimatedFare}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500 font-medium">
                    No bookings found matching mobile number <strong className="text-slate-900">"{mobileSearch}"</strong>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

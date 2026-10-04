import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, CheckSquare, ShieldCheck, Calendar, CheckCircle2, 
  UserCheck, AlertCircle, ChevronRight, LogOut, Grid, Settings 
} from 'lucide-react';
import { Driver, Booking } from '../../types';
import { authService } from '../../services/auth';
import { driversService } from '../../services/drivers';
import { bookingsService } from '../../services/bookings';
import { dbService } from '../../services/database';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const loadData = () => {
    const state = authService.getAuthState();
    if (!state.isAdminAuthenticated) {
      navigate('/admin/login');
      return;
    }
    setDrivers(driversService.getAllDrivers());
    setBookings(bookingsService.getAllBookings());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = dbService.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  const pendingDrivers = drivers.filter(d => d.status === 'Pending');
  const approvedDrivers = drivers.filter(d => d.status === 'Approved');
  const activeBookings = bookings.filter(b => b.status === 'Pending' || b.status === 'Accepted' || b.status === 'Driver Arriving');
  const completedBookings = bookings.filter(b => b.status === 'Completed');

  const handleLogout = () => {
    authService.logoutAdmin();
    navigate('/admin/login');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Admin Operations Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Platform telemetry, driver partner approvals & booking overview
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
        >
          <LogOut className="w-4 h-4" />
          Logout Admin
        </button>
      </div>

      {/* Stats Cards (6 metrics requested) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Drivers</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{drivers.length}</div>
        </div>

        <Link to="/admin/drivers/pending" className="bg-purple-50 p-4 rounded-2xl border border-purple-200 shadow-soft hover:shadow-card transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-purple-700 font-extrabold uppercase tracking-wider block">Pending Approvals</span>
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
          </div>
          <div className="text-2xl font-black text-purple-900 mt-1 flex items-center justify-between">
            <span>{pendingDrivers.length}</span>
            <ChevronRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Approved Drivers</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{approvedDrivers.length}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Active Bookings</span>
          <div className="text-2xl font-black text-brand-600 mt-1">{activeBookings.length}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Completed Bookings</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{completedBookings.length}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Customers</span>
          <div className="text-2xl font-black text-slate-900 mt-1">1,480+</div>
        </div>

      </div>

      {/* QUICK PENDING APPROVAL ALERT BANNER */}
      {pendingDrivers.length > 0 && (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center shrink-0">
              <CheckSquare className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-lg">
                {pendingDrivers.length} Driver Applications Awaiting Verification
              </h3>
              <p className="text-xs text-purple-200 mt-0.5">
                Review and approve new partners to expand customer availability in Hyderabad.
              </p>
            </div>
          </div>

          <Link
            to="/admin/drivers/pending"
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all shrink-0"
          >
            Review Applications Now
          </Link>
        </div>
      )}

      {/* Recent Drivers & Bookings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Approved Drivers */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-slate-900 text-lg">Active Driver Roster</h3>
            <Link to="/admin/drivers" className="text-xs font-bold text-brand-600 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {approvedDrivers.slice(0, 5).map(driver => (
              <div key={driver.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={driver.photo} alt={driver.name} className="w-10 h-10 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{driver.name}</h4>
                    <span className="text-[11px] text-slate-500">{driver.area} • {driver.experienceYears} yrs exp</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-amber-500 block">{driver.rating} ★</span>
                  <span className="text-[10px] text-emerald-600 font-bold">{driver.totalTrips} trips</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live System Bookings */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-slate-900 text-lg">Recent Platform Bookings</h3>
            <Link to="/admin/bookings" className="text-xs font-bold text-brand-600 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {bookings.slice(0, 5).map(b => (
              <div key={b.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-brand-700">{b.id}</span>
                    <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                      {b.serviceTitle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">Customer: {b.customerName} → Driver: {b.driverName}</p>
                </div>

                <div className="text-right">
                  <span className="font-black text-slate-900 text-xs block">₹{b.estimatedFare}</span>
                  <span className="text-[10px] font-bold text-slate-500">{b.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

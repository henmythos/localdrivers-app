import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Menu, X, Shield, User, MapPin, Compass, ShieldAlert, Mail } from 'lucide-react';
import { UserLocation } from '../../types';
import { ReportDriverModal } from './ReportDriverModal';

interface HeaderProps {
  userLocation: UserLocation;
  onRequestLocation: () => void;
}

export const Header: React.FC<HeaderProps> = ({ userLocation, onRequestLocation }) => {
  const location = useLocation();
  const path = location.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const isDriver = path.startsWith('/driver');
  const isAdmin = path.startsWith('/admin');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Official Brand Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="LOCAL DRIVERS - Safe • Reliable • Always"
            className="h-10 sm:h-11 object-contain"
          />
        </Link>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          
          {/* Report Driver & Support Button (Desktop) */}
          <button
            onClick={() => setReportModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-200 transition-colors"
            title="Report Driver to localdrivers.in@gmail.com"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Report Driver</span>
          </button>

          {/* Notification Bell */}
          <button
            className="relative p-2 text-slate-700 hover:text-navy-900 rounded-full hover:bg-slate-100 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {/* Quick Portal Switcher (Desktop) */}
          <div className="hidden md:flex items-center gap-2 ml-2">
            {!isDriver && !isAdmin && (
              <>
                <Link
                  to="/find-drivers"
                  className="text-xs font-bold text-slate-700 hover:text-brand-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Find Drivers
                </Link>
                <Link
                  to="/driver/login"
                  className="flex items-center gap-1 text-xs font-bold text-navy-900 bg-yellow-400 hover:bg-yellow-500 px-3.5 py-1.5 rounded-full shadow-sm transition-colors"
                >
                  <User className="w-3.5 h-3.5" />
                  Driver Portal
                </Link>
                <Link
                  to="/admin/login"
                  className="flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3.5 py-1.5 rounded-full border border-purple-200 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </Link>
              </>
            )}

            {isDriver && (
              <Link
                to="/"
                className="text-xs font-bold text-slate-700 hover:text-brand-600 px-3 py-1.5 rounded-lg bg-slate-100"
              >
                ← Customer Mode
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/"
                className="text-xs font-bold text-slate-700 hover:text-brand-600 px-3 py-1.5 rounded-lg bg-slate-100"
              >
                ← Customer Mode
              </Link>
            )}
          </div>

          {/* Hamburger Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 hover:text-navy-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <button
            onClick={onRequestLocation}
            className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Location: {userLocation.area}, {userLocation.city}</span>
            </div>
            <span className="text-brand-600 text-[10px] uppercase">Update</span>
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setReportModalOpen(true);
            }}
            className="w-full p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-extrabold text-red-700 text-center flex items-center justify-center gap-2"
          >
            <ShieldAlert className="w-4 h-4 text-red-600" />
            Report Driver Code / Support (localdrivers.in@gmail.com)
          </button>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Link
              to="/find-drivers"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 bg-slate-100 rounded-xl text-xs font-bold text-slate-800 text-center"
            >
              Find Drivers
            </Link>
            <Link
              to="/bookings"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 bg-slate-100 rounded-xl text-xs font-bold text-slate-800 text-center"
            >
              My Bookings
            </Link>
            <Link
              to="/driver/login"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 bg-yellow-400 rounded-xl text-xs font-bold text-navy-900 text-center col-span-2 flex items-center justify-center gap-1.5"
            >
              <User className="w-4 h-4" />
              Driver Partner Portal
            </Link>
            <Link
              to="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs font-bold text-purple-800 text-center col-span-2 flex items-center justify-center gap-1.5"
            >
              <Shield className="w-4 h-4 text-purple-600" />
              Admin Operation Portal
            </Link>
          </div>
        </div>
      )}

      {/* Global Report Driver Modal */}
      <ReportDriverModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </header>
  );
};

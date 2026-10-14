import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Menu, X, Shield, User, MapPin, ChevronDown, HelpCircle, Briefcase, Car } from 'lucide-react';
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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo & Interactive Location Selector */}
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img
              src="/logo.png"
              alt="LOCAL DRIVERS"
              className="h-9 sm:h-10 object-contain"
            />
          </Link>

          {/* Quick Location Badge (Desktop & Tablet) */}
          <button
            onClick={onRequestLocation}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200 text-slate-800 transition-colors text-xs font-semibold max-w-[240px]"
            title="Change Location"
          >
            <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span className="truncate">{userLocation.area || 'Hyderabad'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>
        </div>

        {/* Right Navigation & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Consumer Desktop Navigation */}
          {!isDriver && !isAdmin && (
            <div className="hidden md:flex items-center gap-1 text-xs font-bold text-slate-700">
              <Link
                to="/find-drivers"
                className="px-3.5 py-2 rounded-xl hover:text-brand-600 hover:bg-slate-100 transition-colors"
              >
                Find Drivers
              </Link>
              <Link
                to="/bookings"
                className="px-3.5 py-2 rounded-xl hover:text-brand-600 hover:bg-slate-100 transition-colors"
              >
                My Bookings
              </Link>
              <Link
                to="/services"
                className="px-3.5 py-2 rounded-xl hover:text-brand-600 hover:bg-slate-100 transition-colors"
              >
                Services
              </Link>

              <button
                onClick={() => setReportModalOpen(true)}
                className="px-3 py-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1.5 font-medium"
              >
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>Help</span>
              </button>

              <div className="h-4 w-px bg-slate-200 mx-1" />

              {/* Professional Drive Partner CTA */}
              <Link
                to="/driver/register"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-colors border border-slate-200"
              >
                <Car className="w-3.5 h-3.5 text-slate-700" />
                <span>Drive with Us</span>
              </Link>
            </div>
          )}

          {/* Mode Switchers for Driver / Admin Modes */}
          {isDriver && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                Driver Mode
              </span>
              <Link
                to="/"
                className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-100"
              >
                Switch to Rider
              </Link>
            </div>
          )}

          {isAdmin && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                Admin Console
              </span>
              <Link
                to="/"
                className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-100"
              >
                Exit to Rider
              </Link>
            </div>
          )}

          {/* Notification Bell */}
          <button
            onClick={() => {}}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-600 ring-2 ring-white" />
          </button>

          {/* Hamburger Menu Toggle (Mobile) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 hover:text-navy-900 rounded-xl hover:bg-slate-100 transition-colors md:hidden"
            aria-label="Open menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-150">
          {/* Location button inside drawer */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onRequestLocation();
            }}
            className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
              <div className="text-left truncate">
                <span className="block text-[10px] uppercase tracking-wider text-slate-400">Search Area</span>
                <span className="font-extrabold text-slate-900 truncate block">{userLocation.address || 'Hyderabad'}</span>
              </div>
            </div>
            <span className="text-brand-600 text-xs font-extrabold uppercase shrink-0">Change</span>
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-bold">
            <Link
              to="/find-drivers"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-800 text-center border border-slate-100"
            >
              Find Drivers
            </Link>
            <Link
              to="/bookings"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-800 text-center border border-slate-100"
            >
              My Bookings
            </Link>
            <Link
              to="/services"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-800 text-center border border-slate-100"
            >
              Services
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setReportModalOpen(true);
              }}
              className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-800 text-center border border-slate-100"
            >
              Help & Support
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <Link
              to="/driver/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full p-3 bg-slate-900 text-white rounded-xl text-xs font-extrabold text-center flex items-center justify-center gap-2 shadow-sm"
            >
              <Car className="w-4 h-4 text-amber-400" />
              <span>Drive with Us (Partner Register)</span>
            </Link>

            <div className="flex items-center justify-between px-1 text-[11px] text-slate-400 pt-1">
              <Link
                to="/driver/login"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-slate-700 font-semibold"
              >
                Driver Sign In
              </Link>
              <Link
                to="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-slate-700 font-semibold"
              >
                Admin Console
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Global Report / Support Modal */}
      <ReportDriverModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </header>
  );
};

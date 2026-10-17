import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import { Home, Calendar, Search, User, CheckSquare, X, Car, Shield, Phone, HelpCircle, ChevronRight } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  useBodyScrollLock(accountSheetOpen, () => setAccountSheetOpen(false));

  // Do not render bottom navigation on authentication, registration, or onboarding pages
  // to avoid overlapping forms, keyboards, document uploads, and submit buttons.
  const isAuthOrOnboarding = 
    path === '/driver/login' || 
    path === '/driver/register' || 
    path === '/admin/login';

  if (isAuthOrOnboarding) {
    return null;
  }

  const isDriver = path.startsWith('/driver');
  const isAdmin = path.startsWith('/admin');

  if (isAdmin) {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-navy-900 text-white border-t border-slate-800 shadow-2xl px-2 py-1 pb-safe">
        <div className="flex justify-around items-center h-14">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-1 text-xs font-medium transition-colors ${
                isActive ? 'text-yellow-400 font-bold' : 'text-slate-400'
              }`
            }
          >
            <Home className="w-5 h-5 mb-0.5" />
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/drivers/pending"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-1 text-xs font-medium transition-colors ${
                isActive ? 'text-yellow-400 font-bold' : 'text-slate-400'
              }`
            }
          >
            <CheckSquare className="w-5 h-5 mb-0.5" />
            Approvals
          </NavLink>
          <NavLink
            to="/admin/drivers"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-1 text-xs font-medium transition-colors ${
                isActive ? 'text-yellow-400 font-bold' : 'text-slate-400'
              }`
            }
          >
            <User className="w-5 h-5 mb-0.5" />
            Drivers
          </NavLink>
          <NavLink
            to="/admin/bookings"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-1 text-xs font-medium transition-colors ${
                isActive ? 'text-yellow-400 font-bold' : 'text-slate-400'
              }`
            }
          >
            <Calendar className="w-5 h-5 mb-0.5" />
            Bookings
          </NavLink>
        </div>
      </nav>
    );
  }

  if (isDriver) {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-xl px-2 py-1 pb-safe">
        <div className="flex justify-around items-center h-14">
          <NavLink
            to="/driver/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-1 text-[11px] font-medium transition-colors ${
                isActive ? 'text-brand-600 font-bold' : 'text-slate-500'
              }`
            }
          >
            <Home className="w-5 h-5 mb-0.5" />
            Home
          </NavLink>
          <NavLink
            to="/driver/requests"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-1 text-[11px] font-medium transition-colors ${
                isActive ? 'text-brand-600 font-bold' : 'text-slate-500'
              }`
            }
          >
            <Calendar className="w-5 h-5 mb-0.5" />
            Requests
          </NavLink>
          <NavLink
            to="/driver/profile"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-1 text-[11px] font-medium transition-colors ${
                isActive ? 'text-brand-600 font-bold' : 'text-slate-500'
              }`
            }
          >
            <User className="w-5 h-5 mb-0.5" />
            Profile
          </NavLink>
        </div>
      </nav>
    );
  }

  const savedPhone = localStorage.getItem('localdrivers_verified_customer_phone');
  const savedName = localStorage.getItem('localdrivers_customer_name');

  return (
    <>
      {/* Consumer Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-3 py-1 pb-safe">
        <div className="flex justify-around items-center h-14">
          
          {/* Home */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-1 text-[11px] font-semibold transition-colors ${
                isActive ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <Home className="w-5 h-5 mb-0.5" />
            Home
          </NavLink>

          {/* Find Drivers */}
          <NavLink
            to="/find-drivers"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-1 text-[11px] font-semibold transition-colors ${
                isActive ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <Search className="w-5 h-5 mb-0.5" />
            Drivers
          </NavLink>

          {/* Bookings / Activity */}
          <NavLink
            to="/bookings"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-1 text-[11px] font-semibold transition-colors ${
                isActive ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <Calendar className="w-5 h-5 mb-0.5" />
            Activity
          </NavLink>

          {/* Account Drawer Trigger */}
          <button
            onClick={() => setAccountSheetOpen(true)}
            className="flex flex-col items-center justify-center w-full py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <User className="w-5 h-5 mb-0.5" />
            Account
          </button>

        </div>
      </nav>

      {/* Modern Customer Account Sheet (Slide-Up) */}
      {accountSheetOpen && (
        <div
          onClick={() => setAccountSheetOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150 modal-overlay-container overscroll-contain"
        >
          <div
            className="bg-white rounded-t-3xl p-6 shadow-2xl border-t border-slate-200 max-h-[85vh] overflow-y-auto overscroll-contain space-y-5 animate-in slide-in-from-bottom duration-200 pb-safe"
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 font-black text-lg">
                  {savedName ? savedName[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {savedName || 'Localdrivers User'}
                  </h3>
                  <span className="text-xs text-slate-500 font-medium font-mono">
                    {savedPhone || 'Hyderabad Rider'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setAccountSheetOpen(false)}
                className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Account Quick Links */}
            <div className="space-y-1 text-xs font-bold text-slate-800">
              <Link
                to="/bookings"
                onClick={() => setAccountSheetOpen(false)}
                className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-brand-600" />
                  <span>My Booking History</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/services"
                onClick={() => setAccountSheetOpen(false)}
                className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Car className="w-4 h-4 text-emerald-600" />
                  <span>All Driver Rental Packages</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/contact"
                onClick={() => setAccountSheetOpen(false)}
                className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-4 h-4 text-purple-600" />
                  <span>Help, Safety & Support</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>

            {/* Driver Partner Callout Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white space-y-2.5 shadow-sm">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                  Drive with Localdrivers
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                Own commercial driving experience? Join our platform and earn with flexible hours and verified riders.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Link
                  to="/driver/register"
                  onClick={() => setAccountSheetOpen(false)}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-colors"
                >
                  Partner Register
                </Link>
                <Link
                  to="/driver/login"
                  onClick={() => setAccountSheetOpen(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  Driver Sign In
                </Link>
              </div>
            </div>

            {/* Footer Legal & Version */}
            <div className="pt-2 text-[11px] text-slate-400 text-center space-x-3">
              <Link to="/privacy" onClick={() => setAccountSheetOpen(false)} className="hover:underline">Privacy</Link>
              <span>•</span>
              <Link to="/terms" onClick={() => setAccountSheetOpen(false)} className="hover:underline">Terms</Link>
              <span>•</span>
              <Link to="/cancellation" onClick={() => setAccountSheetOpen(false)} className="hover:underline">Refunds</Link>
              <span>•</span>
              <Link to="/admin/login" onClick={() => setAccountSheetOpen(false)} className="hover:text-slate-600">Admin</Link>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, Plus, Wallet, User, CheckSquare } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const isDriver = path.startsWith('/driver');
  const isAdmin = path.startsWith('/admin');

  if (isAdmin) {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-navy-900 text-white border-t border-slate-800 shadow-2xl px-2 py-1">
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-xl px-2 py-1">
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

  // Customer Mobile Navigation matching mockup (Home, Bookings, Book Now FAB, Wallet, Profile)
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 shadow-2xl px-2 py-1">
      <div className="flex justify-around items-center h-14 relative">
        
        {/* 1. Home */}
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

        {/* 2. Bookings */}
        <NavLink
          to="/bookings"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full py-1 text-[11px] font-semibold transition-colors ${
              isActive ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          Bookings
        </NavLink>

        {/* 3. Center Elevated Circular FAB: Book Now */}
        <div className="flex flex-col items-center justify-center w-full relative">
          <button
            onClick={() => navigate('/find-drivers')}
            className="w-12 h-12 rounded-full bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center shadow-floating border-4 border-white transform -translate-y-3 transition-transform active:scale-95"
            title="Book Now"
          >
            <Plus className="w-7 h-7 stroke-[3]" />
          </button>
          <span className="text-[10px] font-extrabold text-brand-600 -mt-2">Book Now</span>
        </div>

        {/* 4. Wallet */}
        <button
          onClick={() => navigate('/bookings')}
          className="flex flex-col items-center justify-center w-full py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
        >
          <Wallet className="w-5 h-5 mb-0.5" />
          Wallet
        </button>

        {/* 5. Profile */}
        <button
          onClick={() => navigate('/driver/login')}
          className="flex flex-col items-center justify-center w-full py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
        >
          <User className="w-5 h-5 mb-0.5" />
          Profile
        </button>

      </div>
    </nav>
  );
};

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Car, Lock, Phone, ArrowRight, ShieldCheck, Sparkles, UserPlus } from 'lucide-react';
import { authService } from '../../services/auth';

export const DriverLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('Please enter your Mobile Number (User ID)');
      return;
    }

    const res = authService.loginDriver(identifier, password || identifier);
    if (res.success) {
      navigate('/driver/dashboard');
    } else {
      setError(res.error || 'Login failed');
    }
  };

  const handleDemoLogin = (phone: string) => {
    const res = authService.loginDriver(phone, phone);
    if (res.success) {
      navigate('/driver/dashboard');
    } else {
      setError(res.error || 'Demo login failed');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200/80 shadow-2xl space-y-6">
        
        {/* Header Branding */}
        <div className="text-center">
          <div className="w-14 h-14 bg-gradient-to-tr from-brand-700 to-brand-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-brand-500/30">
            <Car className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Driver Partner Login</h1>
          <p className="text-xs text-slate-500 mt-1">
            Log in using your registered <strong>Mobile Number</strong> as BOTH User ID and Password.
          </p>
        </div>

        {/* Credentials Notice Box */}
        <div className="p-3.5 bg-brand-50 border border-brand-200 rounded-2xl text-xs text-brand-900 flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Mobile Number Authentication:</span>
            <span>Your Mobile Number (e.g. <code>9876543210</code>) is your User ID and Password.</span>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Mobile Number (User ID) *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 text-xs font-medium font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Password (Mobile Number) *
              </label>
              <span className="text-[10px] font-bold text-slate-400">Same as Mobile Number</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 text-xs font-medium font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
          >
            Sign In to Driver Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Register CTA */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
          <p className="text-xs text-slate-600 font-medium">New to Localdrivers Hyderabad?</p>
          <Link
            to="/driver/register"
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <UserPlus className="w-4 h-4 text-brand-400" />
            Register as New Driver Partner
          </Link>
        </div>

        {/* Quick Demo Login Buttons */}
        <div className="pt-2 border-t border-slate-100 text-center space-y-2">
          <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
            Quick Live Demo Login
          </span>
          <button
            onClick={() => handleDemoLogin('9876543210')}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            Login as Ravi Kumar (98765 43210)
          </button>
        </div>

        <div className="text-center pt-2">
          <Link to="/" className="text-xs font-bold text-slate-500 hover:text-slate-800">
            ← Return to Customer Portal
          </Link>
        </div>

      </div>
    </div>
  );
};

export default DriverLoginPage;

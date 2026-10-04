import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { authService } from '../../services/auth';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('Ranjith.ceo');
  const [password, setPassword] = useState('ranjith@2026');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = authService.loginAdmin(username, password);
    if (res.success) {
      navigate('/admin/dashboard');
    } else {
      setError(res.error || 'Admin login failed');
    }
  };

  const handleDemoAdminLogin = () => {
    const res = authService.loginAdmin('Ranjith.ceo', 'ranjith@2026');
    if (res.success) {
      navigate('/admin/dashboard');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200/80 shadow-2xl">
        
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-purple-700 to-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-purple-600/30">
            <Shield className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Admin Control Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            Platform operations, driver approvals & booking dispatch control
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Admin User ID
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Ranjith.ceo"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 text-xs font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
          >
            Access Admin Console
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* DEMO ADMIN LOGIN BUTTON */}
        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100">
            <span className="text-[11px] font-bold text-purple-900 block mb-1">
              Live CEO Admin Credentials:
            </span>
            <div className="text-xs font-mono text-slate-700 bg-white p-2 rounded-xl border border-purple-200 mb-2">
              User ID: <strong>Ranjith.ceo</strong> | Password: <strong>ranjith@2026</strong>
            </div>
            <button
              onClick={handleDemoAdminLogin}
              className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Login as Ranjith.ceo
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs font-bold text-slate-500 hover:text-slate-800">
            ← Return to Customer Portal
          </Link>
        </div>

      </div>
    </div>
  );
};

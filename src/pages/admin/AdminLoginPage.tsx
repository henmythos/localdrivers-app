import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, User, ArrowRight, Loader2, CheckCircle2, AlertTriangle, LogIn } from 'lucide-react';
import { authService } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import { GoogleAuthButton } from '../../components/common/GoogleAuthButton';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoaded: isUserLoaded, isSignedIn, getToken, signOut } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLegacyForm, setShowLegacyForm] = useState(false);

  const adminEmail = 'localdrivers.in@gmail.com';
  const currentUserEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const isAuthorizedAdmin = isSignedIn && currentUserEmail === adminEmail;

  // Auto-connect Clerk admin when signed in with the authorized account
  useEffect(() => {
    if (!isUserLoaded) return;

    if (isAuthorizedAdmin) {
      let isMounted = true;
      (async () => {
        try {
          setIsLoading(true);
          const token = (await getToken()) || '';
          const res = await authService.loginAdminWithFirebase(token);
          if (res.success && isMounted) {
            navigate('/admin/dashboard');
          } else if (isMounted) {
            setError(res.error || 'Failed to authenticate admin session.');
          }
        } catch (err: any) {
          if (isMounted) {
            setError(err.message || 'Firebase admin authentication error.');
          }
        } finally {
          if (isMounted) setIsLoading(false);
        }
      })();

      return () => {
        isMounted = false;
      };
    }
  }, [isUserLoaded, isAuthorizedAdmin, getToken, navigate]);

  const handleManualClerkAdminLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      const token = (await getToken()) || '';
      const res = await authService.loginAdminWithFirebase(token);
      if (res.success) {
        navigate('/admin/dashboard');
      } else {
        setError(res.error || 'Failed to authenticate admin session.');
      }
    } catch (err: any) {
      setError(err.message || 'Firebase admin authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLegacyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter Admin User ID');
      return;
    }

    if (!password.trim()) {
      setError('Please enter Password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.loginAdmin(username, password);
      if (res.success) {
        navigate('/admin/dashboard');
      } else {
        setError(res.error || 'Invalid Admin User ID or Password');
      }
    } catch (err: any) {
      setError(err.message || 'Admin login connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200/80 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 bg-gradient-to-tr from-purple-700 to-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-purple-600/30">
            <Shield className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Admin Operations Portal</h1>
          <p className="text-xs text-slate-500 mt-1">
            Sign in with Google using authorized administrator account: <br />
            <strong className="text-purple-700">{adminEmail}</strong>
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {/* Primary Google Sign-In Flow */}
        <div className="space-y-4">
          {isSignedIn ? (
            isAuthorizedAdmin ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-emerald-800 font-extrabold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Authorized as {currentUserEmail}</span>
                </div>
                <p className="text-xs text-emerald-700">Connecting to Admin Console...</p>
                <button
                  onClick={handleManualClerkAdminLogin}
                  disabled={isLoading}
                  className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading Console...
                    </>
                  ) : (
                    <>
                      Enter Admin Console
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 text-center">
                <div className="flex items-center justify-center gap-2 text-amber-900 font-extrabold text-xs">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>Unauthorized Account</span>
                </div>
                <p className="text-xs text-amber-800">
                  Signed in as <strong>{currentUserEmail}</strong>.<br />
                  Only <strong>{adminEmail}</strong> is authorized for administrator access.
                </p>
                <button
                  onClick={() => signOut()}
                  className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-lg shadow-2xs cursor-pointer"
                >
                  Switch Google Account
                </button>
              </div>
            )
          ) : (
            <GoogleAuthButton
              label="Sign in with Google"
              redirectUrl="/admin/login"
              className="w-full py-3.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer"
            />
          )}
        </div>

        {/* Legacy Credentials Accordion Fallback */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowLegacyForm(!showLegacyForm)}
            className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 w-full text-center"
          >
            {showLegacyForm ? 'Hide legacy admin login' : 'Or use legacy admin credentials'}
          </button>

          {showLegacyForm && (
            <form onSubmit={handleLegacyLogin} className="space-y-3 mt-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Admin User ID
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter Admin User ID"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 text-xs font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Sign in with User ID'}
              </button>
            </form>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 text-center">
          <Link to="/" className="text-xs font-bold text-slate-500 hover:text-slate-800">
            ← Return to Customer Portal
          </Link>
        </div>

      </div>
    </div>
  );
};

export default AdminLoginPage;

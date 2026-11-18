import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Car, Lock, Phone, ArrowRight, ShieldCheck, UserPlus, Loader2, MessageSquare, CheckCircle2, AlertTriangle, LogOut, Clock } from 'lucide-react';
import { useUser, useAuth, useClerk, SignInButton, Show } from '@clerk/react';
import { authService } from '../../services/auth';

export const DriverLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoaded: isClerkLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();

  const googleEmail = user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() || '';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showLegacyForm, setShowLegacyForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingGoogle, setIsCheckingGoogle] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'pending' | 'rejected' | 'not_registered' | 'error';
    text: string;
    driverCode?: string;
    phone?: string;
  } | null>(null);

  // Automatically authenticate or check onboarding status when signed in with Google
  useEffect(() => {
    if (!isClerkLoaded) return;

    if (!isSignedIn || !user) {
      setIsCheckingGoogle(false);
      return;
    }

    let isMounted = true;
    (async () => {
      setIsCheckingGoogle(true);
      setError('');
      setStatusMessage(null);
      try {
        const token = await getToken();
        if (!token || !isMounted) return;

        const res = await authService.loginDriverWithClerk(token);
        if (!isMounted) return;

        if (res.success && res.driver) {
          navigate('/driver/dashboard');
        } else if (res.status === 'NotRegistered') {
          setStatusMessage({
            type: 'not_registered',
            text: res.error || 'No driver onboarding profile found for this Google account yet.',
          });
        } else if (res.status === 'Pending') {
          setStatusMessage({
            type: 'pending',
            text: res.error || 'Your driver application is currently under review by Admin. Once approved, you can access the Driver Dashboard.',
            driverCode: res.driverCode,
            phone: res.phone,
          });
        } else if (res.status === 'Rejected') {
          setStatusMessage({
            type: 'rejected',
            text: res.error || 'Your driver application was not approved. Please update your documents and re-submit.',
            driverCode: res.driverCode,
          });
        } else {
          setStatusMessage({
            type: 'error',
            text: res.error || 'Unable to sign in with Google. Please retry.',
          });
        }
      } catch (err: any) {
        if (isMounted) {
          setStatusMessage({
            type: 'error',
            text: err.message || 'Google driver authentication failed. Please retry.',
          });
        }
      } finally {
        if (isMounted) setIsCheckingGoogle(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isClerkLoaded, isSignedIn, user, getToken, navigate]);

  const handleLegacyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMessage(null);

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      setError('Please enter your Mobile Number (User ID)');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.loginDriver(cleanInput, password || cleanInput);
      if (res.success && res.driver) {
        navigate('/driver/dashboard');
      } else if (res.status === 'Pending') {
        setStatusMessage({
          type: 'pending',
          text: res.error || 'Your application is currently under review by Admin. Once approved, you will be able to log in.',
          driverCode: res.driverCode,
          phone: cleanInput,
        });
      } else if (res.status === 'Rejected') {
        setStatusMessage({
          type: 'rejected',
          text: res.error || 'Your driver application was not approved.',
          driverCode: res.driverCode,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Invalid credentials or login failed. Please retry.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Login connection failed. Please check your internet connection.',
      });
    } finally {
      setIsLoading(false);
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
            Sign in with the <strong>Google account</strong> you used for driver onboarding.
          </p>
        </div>

        {/* Status: Checking Google Session */}
        {isCheckingGoogle && (
          <div className="p-4 bg-brand-50 border border-brand-200 rounded-2xl text-center space-y-2">
            <Loader2 className="w-6 h-6 text-brand-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-brand-900">
              Checking driver profile for {googleEmail}...
            </p>
          </div>
        )}

        {/* Status: Signed in with Google, but Onboarding NOT completed yet */}
        {statusMessage && statusMessage.type === 'not_registered' && (
          <div className="p-4 bg-brand-50 border border-brand-200 rounded-2xl space-y-3 animate-in fade-in">
            <div className="flex items-start gap-2.5 text-xs text-brand-900">
              <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-black text-brand-950">Google Account Verified</strong>
                <span className="text-brand-800 block mt-0.5">
                  Signed in as <strong className="font-mono">{googleEmail}</strong>. Please complete your Driver Onboarding & KYC documents to submit for Admin approval.
                </span>
              </div>
            </div>
            <Link
              to="/driver/register"
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              Start Driver Onboarding
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Switch Google Account
            </button>
          </div>
        )}

        {/* Status: Pending Admin Approval */}
        {statusMessage && statusMessage.type === 'pending' && (
          <div className="p-4 bg-amber-50 text-amber-900 text-xs font-semibold rounded-2xl border border-amber-300 space-y-3 animate-in fade-in">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-950 font-black mb-0.5">Pending Admin Approval</strong>
                <span>{statusMessage.text}</span>
                {statusMessage.driverCode && (
                  <div className="mt-1.5 inline-block font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-amber-200 text-amber-900">
                    Code: {statusMessage.driverCode}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-amber-200/60 space-y-2">
              <a
                href={`https://wa.me/918500274288?text=Hello%20Localdrivers%20Admin,%20please%20approve%20my%20driver%20application.%20${googleEmail ? `Google:%20${encodeURIComponent(googleEmail)}%20` : ''}${statusMessage.phone ? `Mobile:%20${encodeURIComponent(statusMessage.phone)}%20` : ''}${statusMessage.driverCode ? `(Code:%20${encodeURIComponent(statusMessage.driverCode)})` : ''}.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-emerald-200" />
                Request Fast-Track Approval via WhatsApp
              </a>

              <a
                href="tel:+918500274288"
                className="w-full py-2 bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-amber-700" />
                Call Support: +91 85002 74288
              </a>

              {isSignedIn && (
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="w-full py-2 bg-white/80 hover:bg-white border border-amber-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Switch Google Account
                </button>
              )}
            </div>
          </div>
        )}

        {/* Status: Rejected */}
        {statusMessage && statusMessage.type === 'rejected' && (
          <div className="p-4 bg-red-50 text-red-900 text-xs font-semibold rounded-2xl border border-red-200 space-y-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-black text-red-950">Application Needs Revision</strong>
                <span className="text-red-800">{statusMessage.text}</span>
              </div>
            </div>
            <Link
              to="/driver/register"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Update Documents & Re-submit
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {statusMessage && statusMessage.type === 'error' && (
          <div className="p-3.5 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200 animate-in fade-in">
            {statusMessage.text}
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {/* Primary Clerk Google Sign-In CTA */}
        <Show when="signed-out">
          <div className="space-y-3">
            <SignInButton mode="modal">
              <button
                type="button"
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </button>
            </SignInButton>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
              <span>
                Driver partners sign up with Google first, complete onboarding & KYC, and log in here once Admin approves their profile.
              </span>
            </div>
          </div>
        </Show>

        {/* Register CTA */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
          <p className="text-xs text-slate-600 font-medium">New to Localdrivers Hyderabad?</p>
          <Link
            to="/driver/register"
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <UserPlus className="w-4 h-4 text-brand-400" />
            Sign Up with Google & Start Onboarding
          </Link>
        </div>

        {/* Legacy Mobile Login Fallback Accordion */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowLegacyForm(!showLegacyForm)}
            className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 w-full text-center"
          >
            {showLegacyForm ? 'Hide mobile number login' : 'Existing driver? Sign in with Mobile Number'}
          </button>

          {showLegacyForm && (
            <form onSubmit={handleLegacyLogin} className="space-y-4 mt-4 pt-4 border-t border-slate-100">
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
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 text-xs font-medium font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying Credentials...
                  </>
                ) : (
                  <>
                    Sign In with Mobile Number
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="text-center pt-2 border-t border-slate-100">
          <Link to="/" className="text-xs font-bold text-slate-500 hover:text-slate-800">
            ← Return to Customer Portal
          </Link>
        </div>

      </div>
    </div>
  );
};

export default DriverLoginPage;

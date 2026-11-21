import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, Car, Clock, Receipt, CheckCircle2, 
  ArrowLeft, Users, Star, PhoneCall 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GoogleAuthButton } from '../../components/common/GoogleAuthButton';

export const CustomerLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate('/customer/profile');
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-slate-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-3">
              <Car className="w-8 h-8 text-brand-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Customer Sign In</h1>
            <p className="text-xs text-slate-500 mt-1">
              Sign in with your Google account to manage your rides, profile, and trip records
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <Receipt className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-800">Trip Receipts & Invoices</p>
                <p className="text-[11px] text-slate-500">Access your complete history of trips and payment receipts anytime.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-800">Instant Booking Experience</p>
                <p className="text-[11px] text-slate-500">Pre-fill your contact details and book verified drivers in seconds.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-800">Verified Customer Profile</p>
                <p className="text-[11px] text-slate-500">Secure OTP generation and live driver tracking across all devices.</p>
              </div>
            </div>
          </div>

          <GoogleAuthButton
            label="Continue with Google"
            redirectUrl="/customer/profile"
            mode="auto"
          />

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <Link to="/find-drivers" className="hover:text-brand-600">
              Browse Drivers
            </Link>
            <span>•</span>
            <Link to="/driver/register" className="hover:text-slate-900 font-bold">
              Become a Driver Partner
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

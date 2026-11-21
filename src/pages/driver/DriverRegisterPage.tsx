import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, MapPin, Briefcase, Globe, Car, ShieldCheck, CheckCircle2, ArrowRight, Camera, FileText, Lock, UploadCloud, Loader2, MessageSquare, Mail, AlertTriangle, LogOut, Clock } from 'lucide-react';
import { useUser, useAuth, useClerk } from '@clerk/react';
import { GoogleAuthButton } from '../../components/common/GoogleAuthButton';
import { driversService } from '../../services/drivers';
import { authService } from '../../services/auth';
import { CameraCaptureModal } from '../../components/driver/CameraCaptureModal';
import { compressFileToDataUrl, compressDataUrl } from '../../utils/imageCompressor';

const AVAILABLE_SERVICES = [
  'City Driver',
  'Outstation Driver',
  'Monthly Driver',
  'Personal Driver',
  'VIP Driver',
  'Escort Driver',
];

const VEHICLE_CATEGORIES = ['Manual', 'Automatic', 'Sedan', 'SUV', 'Luxury'];

const LANGUAGES = ['Telugu', 'Hindi', 'English', 'Urdu', 'Tamil', 'Kannada'];

export const DriverRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoaded: isClerkLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();

  const googleEmail = user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() || '';
  const googleName = user?.fullName?.trim() || '';

  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [existingDriverStatus, setExistingDriverStatus] = useState<{
    status: 'Approved' | 'Pending' | 'Rejected';
    driverCode?: string;
    driverName?: string;
    phone?: string;
    rejectionReason?: string;
  } | null>(null);
  const [allowResubmit, setAllowResubmit] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    area: 'Jubilee Hills',
    livingArea: 'Jubilee Hills',
    outstationNoticeDays: 1,
    experienceYears: 5,
    description: '',
  });

  const [selectedServices, setSelectedServices] = useState<string[]>(['City Driver']);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>(['Manual', 'Automatic']);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['Telugu', 'Hindi']);

  // Document Uploads State
  const [photoSelfieUrl, setPhotoSelfieUrl] = useState<string>('');
  const [aadhaarFrontUrl, setAadhaarFrontUrl] = useState<string>('');
  const [aadhaarBackUrl, setAadhaarBackUrl] = useState<string>('');
  const [licenseFrontUrl, setLicenseFrontUrl] = useState<string>('');
  const [licenseBackUrl, setLicenseBackUrl] = useState<string>('');

  // Live Camera Modal State
  const [activeCameraModal, setActiveCameraModal] = useState<{
    docTitle: string;
    docType: 'selfie' | 'document';
    targetSetter: (val: string) => void;
  } | null>(null);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [submittedPhone, setSubmittedPhone] = useState('');
  const [submittedCode, setSubmittedCode] = useState('');

  // Sync Google account details & check if driver already submitted onboarding
  useEffect(() => {
    if (!isClerkLoaded) return;

    if (!isSignedIn || !user) {
      setExistingDriverStatus(null);
      setAllowResubmit(false);
      setIsCheckingStatus(false);
      return;
    }

    setFormData(prev => ({
      ...prev,
      email: googleEmail || prev.email,
      name: prev.name || googleName,
    }));

    let isMounted = true;
    (async () => {
      setIsCheckingStatus(true);
      try {
        const token = await getToken();
        if (!token || !isMounted) return;
        const res = await authService.loginDriverWithClerk(token);
        if (!isMounted) return;

        if (res.success && res.driver) {
          setExistingDriverStatus({
            status: 'Approved',
            driverCode: res.driver.driverCode,
            driverName: res.driver.name,
            phone: res.driver.phone,
          });
        } else if (res.status === 'Pending') {
          setExistingDriverStatus({
            status: 'Pending',
            driverCode: res.driverCode,
            driverName: res.driverName,
            phone: res.phone,
          });
        } else if (res.status === 'Rejected') {
          setExistingDriverStatus({
            status: 'Rejected',
            driverCode: res.driverCode,
            driverName: res.driverName,
            rejectionReason: res.rejectionReason,
          });
        } else {
          setExistingDriverStatus(null);
        }
      } catch {
        if (isMounted) setExistingDriverStatus(null);
      } finally {
        if (isMounted) setIsCheckingStatus(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isClerkLoaded, isSignedIn, user, googleEmail, googleName, getToken]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setUrl: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressFileToDataUrl(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.78 });
        setUrl(compressed);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const toggleSelection = (list: string[], item: string, setList: (val: string[]) => void) => {
    if (list.includes(item)) {
      if (list.length > 1) {
        setList(list.filter(i => i !== item));
      }
    } else {
      setList([...list, item]);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');

    if (!isSignedIn || !googleEmail) {
      setError('Google Sign-Up is required before submitting your driver onboarding application.');
      return;
    }

    if (!formData.name.trim()) {
      setError('Please enter your full name');
      return;
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!photoSelfieUrl) {
      setError('Please upload or capture your Profile Photo Selfie');
      return;
    }

    if (!aadhaarFrontUrl) {
      setError('Please upload or capture the Front side of your Aadhaar Card');
      return;
    }

    if (!aadhaarBackUrl) {
      setError('Please upload or capture the Back side of your Aadhaar Card');
      return;
    }

    if (!licenseFrontUrl) {
      setError('Please upload or capture the Front side of your Driving Licence');
      return;
    }

    if (!licenseBackUrl) {
      setError('Please upload or capture the Back side of your Driving Licence');
      return;
    }

    setIsSubmitting(true);
    try {
      // Pre-compress all 5 document images to ensure payload remains ultra-light (< 600 KB total)
      const [cPhoto, cAadhF, cAadhB, cLicF, cLicB] = await Promise.all([
        compressDataUrl(photoSelfieUrl, { maxWidth: 1000, maxHeight: 1000, quality: 0.72 }),
        compressDataUrl(aadhaarFrontUrl, { maxWidth: 1000, maxHeight: 1000, quality: 0.72 }),
        compressDataUrl(aadhaarBackUrl, { maxWidth: 1000, maxHeight: 1000, quality: 0.72 }),
        compressDataUrl(licenseFrontUrl, { maxWidth: 1000, maxHeight: 1000, quality: 0.72 }),
        compressDataUrl(licenseBackUrl, { maxWidth: 1000, maxHeight: 1000, quality: 0.72 }),
      ]);

      const documents = [
        { id: `doc-photo-${Date.now()}`, type: 'Profile Photo Selfie' as const, status: 'Under Review' as const, url: cPhoto, uploadedAt: new Date().toISOString() },
        { id: `doc-aadh-f-${Date.now()}`, type: 'Aadhaar Card (Front)' as const, status: 'Under Review' as const, url: cAadhF, uploadedAt: new Date().toISOString() },
        { id: `doc-aadh-b-${Date.now()}`, type: 'Aadhaar Card (Back)' as const, status: 'Under Review' as const, url: cAadhB, uploadedAt: new Date().toISOString() },
        { id: `doc-lic-f-${Date.now()}`, type: 'Driving Licence (Front)' as const, status: 'Under Review' as const, url: cLicF, uploadedAt: new Date().toISOString() },
        { id: `doc-lic-b-${Date.now()}`, type: 'Driving Licence (Back)' as const, status: 'Under Review' as const, url: cLicB, uploadedAt: new Date().toISOString() },
      ];

      const clerkToken = (await getToken()) || undefined;

      const res = await driversService.registerDriverAsync({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: googleEmail,
        clerkToken,
        photo: cPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
        rating: 5.0,
        totalTrips: 0,
        startingPrice: 299,
        distanceKm: 2.5,
        latitude: 17.4126,
        longitude: 78.4071,
        area: formData.area.trim() || 'Hyderabad',
        livingArea: formData.livingArea.trim() || formData.area.trim() || 'Hyderabad',
        outstationNoticeDays: Number(formData.outstationNoticeDays) || 1,
        city: 'Hyderabad',
        experienceYears: Number(formData.experienceYears) || 1,
        languages: selectedLanguages,
        services: selectedServices as any,
        vehicleCategories: selectedVehicles as any,
        description: formData.description.trim() || 'Professional driver registered on Localdrivers platform.',
        documents,
      });

      if (!res.success) {
        setError(
          res.error ||
          "We couldn't submit your driver application right now. Your information has not been confirmed as submitted. Please try again shortly."
        );
        setIsSubmitting(false);
        return;
      }

      setSubmittedPhone(formData.phone.trim());
      setSubmittedCode(res.driverCode || '');
      setAllowResubmit(false);
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('[Registration Submission Error]', err);
      setError(
        "We couldn't submit your driver application right now. Your information has not been confirmed as submitted. Please try again shortly."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper: 3-Step Visual Progress Bar
  const renderStepProgress = (activeStep: 1 | 2 | 3) => (
    <div className="grid grid-cols-3 gap-2 pt-2">
      {[
        { num: 1, label: 'Google Sign-Up' },
        { num: 2, label: 'Driver Onboarding' },
        { num: 3, label: 'Admin Approval' },
      ].map(step => {
        const isCompleted = activeStep > step.num;
        const isCurrent = activeStep === step.num;
        return (
          <div
            key={step.num}
            className={`p-2.5 rounded-2xl border text-center transition-all ${
              isCompleted
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : isCurrent
                ? 'bg-brand-50 border-brand-300 text-brand-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider">
              {isCompleted ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <span>Step {step.num}</span>
              )}
            </div>
            <div className="text-[11px] font-bold mt-0.5 truncate">{step.label}</div>
          </div>
        );
      })}
    </div>
  );

  // State 0: Checking Google auth or existing driver status
  if (!isClerkLoaded || isCheckingStatus) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 shadow-2xl text-center space-y-4">
          <Loader2 className="w-10 h-10 text-brand-600 animate-spin mx-auto" />
          <h2 className="text-lg font-black text-slate-900">Checking Account Status...</h2>
          <p className="text-xs text-slate-500">
            Verifying your Google account and driver onboarding status.
          </p>
        </div>
      </div>
    );
  }

  // State 1: NOT signed in with Google -> Mandatory Step 1 Gate (No direct signup allowed)
  if (!isSignedIn || !user) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-10">
        <div className="bg-white rounded-3xl p-6 sm:p-9 max-w-lg w-full border border-slate-200/80 shadow-2xl space-y-6">
          <div className="text-center">
            <div className="w-14 h-14 bg-gradient-to-tr from-brand-700 to-brand-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-brand-500/30">
              <Car className="w-8 h-8 stroke-[2.2]" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Driver Partner Sign-Up</h1>
            <p className="text-xs text-slate-500 mt-1">
              Sign up with your Google account first to begin driver onboarding and KYC verification.
            </p>
          </div>

          {renderStepProgress(1)}

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs text-slate-700">
            <div className="font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
              <span>How Driver Onboarding Works</span>
            </div>
            <ol className="space-y-2 text-[11px] text-slate-600 list-decimal list-inside">
              <li>
                <strong className="text-slate-800">Step 1 — Google Sign-Up:</strong> Verify your identity using your Google account.
              </li>
              <li>
                <strong className="text-slate-800">Step 2 — Onboarding & KYC:</strong> Fill in your driving details and upload Selfie, Aadhaar Card, and Driving Licence.
              </li>
              <li>
                <strong className="text-slate-800">Step 3 — Admin Approval:</strong> Submit your profile for Admin review. Once approved, sign in with Google to receive rides!
              </li>
            </ol>
          </div>

          <GoogleAuthButton
            label="Continue with Google to Start Onboarding"
            redirectUrl="/driver/register"
            mode="signup"
            className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-brand-500/20 transition-all flex items-center justify-center gap-3 cursor-pointer"
          />

          <div className="text-center pt-3 border-t border-slate-100 space-y-2">
            <p className="text-xs text-slate-500">
              Already registered & approved?{' '}
              <Link to="/driver/login" className="font-extrabold text-brand-600 hover:underline">
                Driver Partner Login
              </Link>
            </p>
            <div>
              <Link to="/" className="text-xs font-bold text-slate-400 hover:text-slate-700">
                ← Return to Customer Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Signed in with Google & Already Approved!
  if (existingDriverStatus?.status === 'Approved') {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-3xl p-8 max-w-lg w-full border border-emerald-200 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Driver Account Approved!</h1>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Welcome back, <strong>{existingDriverStatus.driverName || googleName}</strong>! Your Google account (<strong>{googleEmail}</strong>) is already verified and active.
            </p>
          </div>
          {existingDriverStatus.driverCode && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs font-bold text-emerald-900">
              <span>Driver Partner Code:</span>
              <span className="font-mono bg-white px-2.5 py-0.5 rounded border border-emerald-200">
                {existingDriverStatus.driverCode}
              </span>
            </div>
          )}
          <div className="space-y-2.5">
            <button
              onClick={() => navigate('/driver/dashboard')}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              Open Driver Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => signOut()}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Switch Google Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 3: Submitted OR Already Pending Admin Approval
  if (isSubmitted || (existingDriverStatus?.status === 'Pending' && !allowResubmit)) {
    const activePhone = submittedPhone || existingDriverStatus?.phone || formData.phone;
    const activeCode = submittedCode || existingDriverStatus?.driverCode || '';
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-3xl p-8 max-w-lg w-full border border-emerald-200 shadow-2xl text-center space-y-6">
          {renderStepProgress(3)}

          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            {isSubmitted ? (
              <CheckCircle2 className="w-10 h-10 stroke-[2.5] text-emerald-600" />
            ) : (
              <Clock className="w-10 h-10 stroke-[2.2]" />
            )}
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-900">
              {isSubmitted ? 'Onboarding Submitted!' : 'Pending Admin Approval'}
            </h1>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Your driver partner profile is submitted and currently awaiting verification review by{' '}
              <span className="font-bold text-slate-800">Localdrivers Admin</span>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2.5">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Application Summary
            </div>
            <div className="text-xs font-bold text-slate-800 flex justify-between items-center gap-2">
              <span>Google Account:</span>
              <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 truncate max-w-[210px]">
                {googleEmail}
              </span>
            </div>
            {activeCode && (
              <div className="text-xs font-bold text-slate-800 flex justify-between items-center">
                <span>Driver Partner Code:</span>
                <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {activeCode}
                </span>
              </div>
            )}
            {activePhone && (
              <div className="text-xs font-bold text-slate-800 flex justify-between items-center">
                <span>Registered Mobile:</span>
                <span className="font-mono text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                  {activePhone}
                </span>
              </div>
            )}
            <p className="text-[11px] text-slate-500 italic mt-1">
              Admin review typically completes within 2–4 hours. Once approved, simply sign in with your Google account to access the Driver Dashboard.
            </p>
          </div>

          {/* Action Buttons: Fast-Track WhatsApp + Login */}
          <div className="space-y-2 pt-1">
            <a
              href={`https://wa.me/918500274288?text=Hello%20Localdrivers%20Admin,%20I%20have%20submitted%20my%20driver%20partner%20onboarding%20application.%20Google:%20${encodeURIComponent(googleEmail)}%20${activePhone ? `Mobile:%20${encodeURIComponent(activePhone)}%20` : ''}${activeCode ? `Code:%20${encodeURIComponent(activeCode)}` : ''}.%20Please%20verify%20and%20approve%20my%20profile.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-emerald-200" />
              Fast-Track Approval on WhatsApp
            </a>

            <button
              onClick={() => navigate('/driver/login')}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              Go to Driver Partner Login
              <ArrowRight className="w-4 h-4" />
            </button>

            {!isSubmitted && (
              <button
                type="button"
                onClick={() => setAllowResubmit(true)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Update / Re-submit Onboarding Documents
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-2xl space-y-8">
        
        {/* Header */}
        <div className="text-center pb-6 border-b border-slate-100 space-y-4">
          <div>
            <div className="w-14 h-14 bg-gradient-to-tr from-brand-700 to-brand-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-brand-500/30">
              <Car className="w-8 h-8 stroke-[2.2]" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Driver Partner Onboarding</h1>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Complete your profile and upload KYC documents below to submit for Admin approval.
            </p>
          </div>
          {renderStepProgress(2)}
        </div>

        {/* Verified Google Identity Banner */}
        <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-emerald-900 block">Google Account Verified (Step 1 Complete)</span>
              <span className="text-emerald-800 font-mono text-[11px] truncate block">{googleEmail}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            className="text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-lg shrink-0 self-start sm:self-auto"
          >
            Switch Google Account
          </button>
        </div>

        {/* Rejection Notice Banner (if previously rejected) */}
        {existingDriverStatus?.status === 'Rejected' && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block">Previous Application Needs Updates</span>
              <span className="text-amber-800">
                {existingDriverStatus.rejectionReason || 'Your previous application was not approved.'} Please upload clear, valid documents and re-submit for Admin review.
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-brand-600" />
              Personal Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Anand Varma"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mobile Number (WhatsApp / Calls) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 98765 88101"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 text-xs font-medium font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Verified Google Account Email (Linked Login)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  readOnly
                  value={googleEmail}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50/40 text-slate-700 text-xs font-semibold font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Home Living Area / Neighbourhood (Hyderabad) *
                </label>
                <div className="relative mb-2">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={formData.livingArea}
                    onChange={e => setFormData({ ...formData, livingArea: e.target.value, area: e.target.value })}
                    placeholder="e.g. Attapur, Kachiguda, Secunderabad, Shamshabad"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 text-xs font-medium"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Attapur', 'Kachiguda', 'Secunderabad', 'Shamshabad',
                    'Madhapur', 'Gachibowli', 'Kukatpally', 'Banjara Hills',
                    'Jubilee Hills', 'Mehdipatnam'
                  ].map(locality => (
                    <button
                      type="button"
                      key={locality}
                      onClick={() => setFormData({ ...formData, livingArea: locality, area: locality })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                        formData.livingArea === locality
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {locality}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Used by dispatch radar to calculate customer proximity without leaking your private address.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Experience (Years) *
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="number"
                      min="1"
                      max="40"
                      required
                      value={formData.experienceYears}
                      onChange={e => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Outstation Advance Notice Required
                  </label>
                  <select
                    value={formData.outstationNoticeDays}
                    onChange={e => setFormData({ ...formData, outstationNoticeDays: Number(e.target.value) })}
                    className="w-full px-3 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 text-xs font-medium bg-white"
                  >
                    <option value={0}>Same Day (Instant Outstation)</option>
                    <option value={1}>1 Day in Advance (Standard)</option>
                    <option value={2}>2 Days in Advance</option>
                    <option value={3}>3 Days in Advance</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Services Offered */}
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Car className="w-4 h-4 text-brand-600" />
              Services Offered
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AVAILABLE_SERVICES.map(srv => {
                const active = selectedServices.includes(srv);
                return (
                  <button
                    type="button"
                    key={srv}
                    onClick={() => toggleSelection(selectedServices, srv, setSelectedServices)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                      active
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{srv}</span>
                    {active && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Vehicle Capabilities */}
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Car className="w-4 h-4 text-brand-600" />
              Vehicles Experienced With
            </h2>
            <div className="flex flex-wrap gap-2">
              {VEHICLE_CATEGORIES.map(v => {
                const active = selectedVehicles.includes(v);
                return (
                  <button
                    type="button"
                    key={v}
                    onClick={() => toggleSelection(selectedVehicles, v, setSelectedVehicles)}
                    className={`py-2 px-4 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      active
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{v}</span>
                    {active && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Languages Spoken */}
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand-600" />
              Languages Spoken
            </h2>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(lang => {
                const active = selectedLanguages.includes(lang);
                return (
                  <button
                    type="button"
                    key={lang}
                    onClick={() => toggleSelection(selectedLanguages, lang, setSelectedLanguages)}
                    className={`py-2 px-3.5 rounded-xl text-xs font-bold border transition-all ${
                      active
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Mandatory Document Uploads (KYC Verification) */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                Mandatory KYC Document Verification (Two Sides Required)
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Profile selfie is displayed on your driver card. Aadhaar Card (Front & Back) and Driving Licence (Front & Back) are stored securely on Cloudflare R2 and inspected ONLY by Admin.
              </p>
            </div>

            <div className="space-y-4">
              
              {/* 1. Profile Photo Selfie */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-brand-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-brand-600" />
                      Profile Photo Selfie *
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Live front selfie photo shown to customers on booking</p>
                  </div>
                  <span className="text-[9px] font-extrabold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full shrink-0">
                    Public Visible
                  </span>
                </div>

                {photoSelfieUrl ? (
                  <div className="relative group max-w-xs">
                    <img src={photoSelfieUrl} alt="Selfie preview" className="w-full h-36 object-cover rounded-xl border border-slate-200" />
                    <button
                      type="button"
                      onClick={() => setPhotoSelfieUrl('')}
                      className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-sm transition-colors"
                    >
                      Change Photo
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md">
                    <button
                      type="button"
                      onClick={() => setActiveCameraModal({
                        docTitle: 'Profile Photo Selfie',
                        docType: 'selfie',
                        targetSetter: setPhotoSelfieUrl,
                      })}
                      className="py-3 px-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      Capture Live Selfie
                    </button>

                    <label className="border border-dashed border-slate-300 hover:border-brand-400 bg-white rounded-xl py-3 px-3 flex items-center justify-center gap-1.5 cursor-pointer text-center transition-colors">
                      <UploadCloud className="w-4 h-4 text-slate-500" />
                      <span className="text-[11px] font-bold text-slate-700">Choose from Gallery</span>
                      <input type="file" accept="image/*" onChange={e => handleFileUpload(e, setPhotoSelfieUrl)} className="hidden" />
                    </label>
                  </div>
                )}
              </div>

              {/* 2. Aadhaar Card (Two Sides: Front & Back) */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-purple-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block">
                        Aadhaar Card Verification (Two Sides Required) *
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Upload or capture clear photos of both Front (Photo/DOB) and Back (Address) sides
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] font-extrabold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full shrink-0 self-start sm:self-auto">
                    Admin Only
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Aadhaar Front */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-purple-600" />
                        Aadhaar - Front Side *
                      </span>
                      {aadhaarFrontUrl && (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      )}
                    </div>

                    {aadhaarFrontUrl ? (
                      <div className="relative group">
                        <img src={aadhaarFrontUrl} alt="Aadhaar Front preview" className="w-full h-32 object-cover rounded-xl border border-slate-200" />
                        <button
                          type="button"
                          onClick={() => setAadhaarFrontUrl('')}
                          className="absolute top-1.5 right-1.5 bg-slate-900/80 hover:bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm transition-colors"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setActiveCameraModal({
                            docTitle: 'Aadhaar Card (Front Side)',
                            docType: 'document',
                            targetSetter: setAadhaarFrontUrl,
                          })}
                          className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Camera className="w-4 h-4" />
                          Capture Front Camera
                        </button>

                        <label className="border border-dashed border-slate-300 hover:border-purple-400 bg-slate-50 rounded-xl py-2 px-3 flex items-center justify-center gap-1.5 cursor-pointer text-center transition-colors">
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-[11px] font-bold text-slate-700">Choose Front File</span>
                          <input type="file" accept="image/*,.pdf" onChange={e => handleFileUpload(e, setAadhaarFrontUrl)} className="hidden" />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Aadhaar Back */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-purple-600" />
                        Aadhaar - Back Side *
                      </span>
                      {aadhaarBackUrl && (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      )}
                    </div>

                    {aadhaarBackUrl ? (
                      <div className="relative group">
                        <img src={aadhaarBackUrl} alt="Aadhaar Back preview" className="w-full h-32 object-cover rounded-xl border border-slate-200" />
                        <button
                          type="button"
                          onClick={() => setAadhaarBackUrl('')}
                          className="absolute top-1.5 right-1.5 bg-slate-900/80 hover:bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm transition-colors"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setActiveCameraModal({
                            docTitle: 'Aadhaar Card (Back Side)',
                            docType: 'document',
                            targetSetter: setAadhaarBackUrl,
                          })}
                          className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Camera className="w-4 h-4" />
                          Capture Back Camera
                        </button>

                        <label className="border border-dashed border-slate-300 hover:border-purple-400 bg-slate-50 rounded-xl py-2 px-3 flex items-center justify-center gap-1.5 cursor-pointer text-center transition-colors">
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-[11px] font-bold text-slate-700">Choose Back File</span>
                          <input type="file" accept="image/*,.pdf" onChange={e => handleFileUpload(e, setAadhaarBackUrl)} className="hidden" />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Driving Licence (Two Sides: Front & Back) */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block">
                        Driving Licence (DL) Verification (Two Sides Required) *
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Upload or capture clear photos of both Front (DL No & Validity) and Back (Vehicle Classes) sides
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full shrink-0 self-start sm:self-auto">
                    Admin Only
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* DL Front */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        DL - Front Side *
                      </span>
                      {licenseFrontUrl && (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      )}
                    </div>

                    {licenseFrontUrl ? (
                      <div className="relative group">
                        <img src={licenseFrontUrl} alt="DL Front preview" className="w-full h-32 object-cover rounded-xl border border-slate-200" />
                        <button
                          type="button"
                          onClick={() => setLicenseFrontUrl('')}
                          className="absolute top-1.5 right-1.5 bg-slate-900/80 hover:bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm transition-colors"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setActiveCameraModal({
                            docTitle: 'Driving Licence (Front Side)',
                            docType: 'document',
                            targetSetter: setLicenseFrontUrl,
                          })}
                          className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Camera className="w-4 h-4" />
                          Capture Front Camera
                        </button>

                        <label className="border border-dashed border-slate-300 hover:border-emerald-400 bg-slate-50 rounded-xl py-2 px-3 flex items-center justify-center gap-1.5 cursor-pointer text-center transition-colors">
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-[11px] font-bold text-slate-700">Choose Front File</span>
                          <input type="file" accept="image/*,.pdf" onChange={e => handleFileUpload(e, setLicenseFrontUrl)} className="hidden" />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* DL Back */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        DL - Back Side *
                      </span>
                      {licenseBackUrl && (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      )}
                    </div>

                    {licenseBackUrl ? (
                      <div className="relative group">
                        <img src={licenseBackUrl} alt="DL Back preview" className="w-full h-32 object-cover rounded-xl border border-slate-200" />
                        <button
                          type="button"
                          onClick={() => setLicenseBackUrl('')}
                          className="absolute top-1.5 right-1.5 bg-slate-900/80 hover:bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm transition-colors"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setActiveCameraModal({
                            docTitle: 'Driving Licence (Back Side)',
                            docType: 'document',
                            targetSetter: setLicenseBackUrl,
                          })}
                          className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Camera className="w-4 h-4" />
                          Capture Back Camera
                        </button>

                        <label className="border border-dashed border-slate-300 hover:border-emerald-400 bg-slate-50 rounded-xl py-2 px-3 flex items-center justify-center gap-1.5 cursor-pointer text-center transition-colors">
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-[11px] font-bold text-slate-700">Choose Back File</span>
                          <input type="file" accept="image/*,.pdf" onChange={e => handleFileUpload(e, setLicenseBackUrl)} className="hidden" />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Section 6: Brief Profile Summary */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Profile Summary & Driving Experience
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Non-smoker punctual chauffeur with experience in luxury automatic cars, highway outstation routes across AP/Telangana..."
              className="w-full p-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 text-xs font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-brand-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Application to Database...
              </>
            ) : (
              <>
                Submit Application for Admin Approval
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Already approved?{' '}
            <Link to="/driver/login" className="font-extrabold text-brand-600 hover:underline">
              Driver Partner Login (Google Sign-In)
            </Link>
          </p>
        </div>

      </div>

      {/* Full Screen Live Camera Capture Modal */}
      {activeCameraModal && (
        <CameraCaptureModal
          isOpen={!!activeCameraModal}
          docTitle={activeCameraModal.docTitle}
          docType={activeCameraModal.docType}
          onClose={() => setActiveCameraModal(null)}
          onCapture={async (imageDataUrl) => {
            const compressed = await compressDataUrl(imageDataUrl, { maxWidth: 1200, maxHeight: 1200, quality: 0.78 });
            activeCameraModal.targetSetter(compressed);
            setActiveCameraModal(null);
          }}
        />
      )}
    </div>
  );
};

export default DriverRegisterPage;

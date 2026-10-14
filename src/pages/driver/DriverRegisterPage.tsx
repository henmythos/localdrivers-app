import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, MapPin, Briefcase, Globe, Car, ShieldCheck, CheckCircle2, ArrowRight, Camera, FileText, Lock, UploadCloud, Eye } from 'lucide-react';
import { driversService } from '../../services/drivers';
import { CameraCaptureModal } from '../../components/driver/CameraCaptureModal';

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

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    area: 'Jubilee Hills',
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setUrl: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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

    driversService.registerDriver({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      area: formData.area.trim() || 'Hyderabad',
      city: 'Hyderabad',
      experienceYears: Number(formData.experienceYears) || 1,
      languages: selectedLanguages,
      services: selectedServices,
      vehicleCategories: selectedVehicles,
      description: formData.description.trim() || 'Professional driver registered on Localdrivers platform.',
      photoUrl: photoSelfieUrl,
      aadhaarFrontUrl: aadhaarFrontUrl,
      aadhaarBackUrl: aadhaarBackUrl,
      licenseFrontUrl: licenseFrontUrl,
      licenseBackUrl: licenseBackUrl,
    });

    setSubmittedPhone(formData.phone.trim());
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-3xl p-8 max-w-lg w-full border border-emerald-200 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-900">Application Submitted!</h1>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Your driver partner profile has been registered and is now under verification review by 
              <span className="font-bold text-slate-800"> the platform verification team</span>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Login Credentials Notice
            </div>
            <div className="text-xs font-bold text-slate-800 flex justify-between items-center">
              <span>User ID (Mobile):</span>
              <span className="font-mono text-brand-700 bg-brand-50 px-2 py-1 rounded border border-brand-200">
                {submittedPhone}
              </span>
            </div>
            <div className="text-xs font-bold text-slate-800 flex justify-between items-center">
              <span>Password (Mobile):</span>
              <span className="font-mono text-brand-700 bg-brand-50 px-2 py-1 rounded border border-brand-200">
                {submittedPhone}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 italic mt-1">
              Once your documents are verified and approved, your profile will be active for customer bookings.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigate('/driver/login')}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              Go to Driver Partner Login
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-2xl space-y-8">
        
        {/* Header */}
        <div className="text-center pb-6 border-b border-slate-100">
          <div className="w-14 h-14 bg-gradient-to-tr from-brand-700 to-brand-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-brand-500/30">
            <Car className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Become a Driver Partner</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Join Hyderabad's premier on-demand driver platform. Flexible hours, direct client connections, transparent low 3-5% platform fee.
          </p>
        </div>

        {/* Credentials Notice Card */}
        <div className="p-4 bg-brand-50/70 border border-brand-200/80 rounded-2xl flex items-start gap-3 text-xs text-brand-900">
          <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold block">Important Authentication Rule:</span>
            <span className="text-brand-800">
              Your <strong>Mobile Number</strong> will serve as BOTH your <strong>User ID</strong> and <strong>Password</strong> for logging into the Driver Dashboard after Admin approval.
            </span>
          </div>
        </div>

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
                  Mobile Number (User ID & Password) *
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Primary Area in Hyderabad *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={formData.area}
                    onChange={e => setFormData({ ...formData, area: e.target.value })}
                    placeholder="e.g. Jubilee Hills, Banjara Hills, Gachibowli"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 text-xs font-medium"
                  />
                </div>
              </div>

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
            className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-brand-500/20 transition-colors flex items-center justify-center gap-2"
          >
            Submit Application for Admin Approval
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Already registered?{' '}
            <Link to="/driver/login" className="font-extrabold text-brand-600 hover:underline">
              Sign In with your Mobile Number
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
          onCapture={(imageDataUrl) => {
            activeCameraModal.targetSetter(imageDataUrl);
            setActiveCameraModal(null);
          }}
        />
      )}
    </div>
  );
};

export default DriverRegisterPage;

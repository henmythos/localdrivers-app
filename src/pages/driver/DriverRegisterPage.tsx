import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, MapPin, Briefcase, Globe, Car, ShieldCheck, CheckCircle2, ArrowRight, Camera, FileText, Lock, UploadCloud, Eye } from 'lucide-react';
import { driversService } from '../../services/drivers';

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
  const [aadhaarUrl, setAadhaarUrl] = useState<string>('');
  const [licenseUrl, setLicenseUrl] = useState<string>('');

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
      setError('Please upload your Profile Photo Selfie');
      return;
    }

    if (!aadhaarUrl) {
      setError('Please upload your Aadhaar Card document for Admin KYC verification');
      return;
    }

    if (!licenseUrl) {
      setError('Please upload your Driving Licence (DL) document for Admin verification');
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
      aadhaarUrl: aadhaarUrl,
      licenseUrl: licenseUrl,
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
              <span className="font-bold text-slate-800"> Admin (Ranjith.ceo)</span>.
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
              Once Admin approves your documents in the dashboard, your profile will be active for customer searches.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <button
              onClick={() => navigate('/driver/login')}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              Go to Driver Partner Login
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/admin/drivers/pending"
              className="block text-center text-xs font-bold text-slate-500 hover:text-brand-600"
            >
              View Admin Approvals Queue (Ranjith.ceo Demo)
            </Link>
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
                Mandatory Document Verification (Cloudflare R2 Storage)
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Profile selfie is displayed on your driver card. Aadhaar and DL are stored securely in Cloudflare R2 and viewed ONLY by Admin for verification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* 1. Profile Photo Selfie */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-brand-300 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-brand-600" />
                      Profile Selfie *
                    </span>
                    <span className="text-[9px] font-extrabold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                      Public Visible
                    </span>
                  </div>

                  {photoSelfieUrl ? (
                    <div className="relative group">
                      <img src={photoSelfieUrl} alt="Selfie preview" className="w-full h-28 object-cover rounded-xl border border-slate-200" />
                      <button
                        type="button"
                        onClick={() => setPhotoSelfieUrl('')}
                        className="absolute top-1.5 right-1.5 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-300 hover:border-brand-500 bg-white rounded-xl h-28 flex flex-col items-center justify-center cursor-pointer transition-colors p-2 text-center">
                      <UploadCloud className="w-6 h-6 text-brand-500 mb-1" />
                      <span className="text-[11px] font-extrabold text-slate-700">Upload Selfie Photo</span>
                      <span className="text-[9px] text-slate-400">JPG, PNG (Max 5MB)</span>
                      <input type="file" accept="image/*" onChange={e => handleFileUpload(e, setPhotoSelfieUrl)} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              {/* 2. Aadhaar Card Document */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-purple-300 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-purple-600" />
                      Aadhaar Card *
                    </span>
                    <span className="text-[9px] font-extrabold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                      Admin Only
                    </span>
                  </div>

                  {aadhaarUrl ? (
                    <div className="relative group">
                      <img src={aadhaarUrl} alt="Aadhaar preview" className="w-full h-28 object-cover rounded-xl border border-slate-200" />
                      <button
                        type="button"
                        onClick={() => setAadhaarUrl('')}
                        className="absolute top-1.5 right-1.5 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-300 hover:border-purple-500 bg-white rounded-xl h-28 flex flex-col items-center justify-center cursor-pointer transition-colors p-2 text-center">
                      <FileText className="w-6 h-6 text-purple-500 mb-1" />
                      <span className="text-[11px] font-extrabold text-slate-700">Upload Aadhaar Card</span>
                      <span className="text-[9px] text-slate-400">Private Admin KYC</span>
                      <input type="file" accept="image/*,.pdf" onChange={e => handleFileUpload(e, setAadhaarUrl)} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              {/* 3. Driving Licence (DL) Document */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      Driving Licence *
                    </span>
                    <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                      Admin Only
                    </span>
                  </div>

                  {licenseUrl ? (
                    <div className="relative group">
                      <img src={licenseUrl} alt="DL preview" className="w-full h-28 object-cover rounded-xl border border-slate-200" />
                      <button
                        type="button"
                        onClick={() => setLicenseUrl('')}
                        className="absolute top-1.5 right-1.5 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-white rounded-xl h-28 flex flex-col items-center justify-center cursor-pointer transition-colors p-2 text-center">
                      <FileText className="w-6 h-6 text-emerald-500 mb-1" />
                      <span className="text-[11px] font-extrabold text-slate-700">Upload Driving Licence</span>
                      <span className="text-[9px] text-slate-400">Private Admin Verification</span>
                      <input type="file" accept="image/*,.pdf" onChange={e => handleFileUpload(e, setLicenseUrl)} className="hidden" />
                    </label>
                  )}
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
    </div>
  );
};

export default DriverRegisterPage;

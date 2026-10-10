import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Mail, Lock, FileText, UserCheck } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
      
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Home
      </Link>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-soft space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-100 pb-6">
          <div className="flex items-center gap-2 text-brand-600 font-extrabold text-xs uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" />
            Official Compliance Policy
          </div>
          <h1 className="text-3xl font-black text-slate-900">Privacy Policy</h1>
          <p className="text-xs text-slate-500 mt-1">
            Last Updated: October 4, 2026 | Effective for website <strong>localdrivers.in</strong> and Mobile App.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
          
          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-brand-600" />
              1. Overview & Scope
            </h2>
            <p>
              Localdrivers ("we", "our", "us"), operating at <strong>localdrivers.in</strong> and via our Android Mobile App, is committed to safeguarding the privacy of our customers and driver partners. This Privacy Policy details how we collect, store, and protect your personal information when using our on-demand driver booking platform in Hyderabad.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-600" />
              2. Information We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Customer Information:</strong> Full Name, Mobile Number, Pickup and Destination Locations, Booking dates/times, and optional special notes. No login account is required for customers.</li>
              <li><strong>Driver Partner Information:</strong> Full Name, Mobile Number (User ID & Password), Driving Licence details, Aadhaar Card KYC records, Profile Selfie photo, Operating localities, and vehicle experience categories.</li>
              <li><strong>Device & Geolocation Data:</strong> Optional GPS location data used exclusively to show nearby Hyderabad drivers and compute trip distances.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-brand-600" />
              3. How We Use Your Information
            </h2>
            <p>
              We collect information strictly for facilitating direct connection between vehicle owners and verified drivers, processing platform fee payments, verifying driver credentials, and addressing customer service inquiries at <strong>localdrivers.in@gmail.com</strong>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              4. Data Protection & Zero Third-Party Selling
            </h2>
            <p>
              We do NOT sell, rent, or trade customer or driver personal data to third-party advertisers. All data is encrypted in transit and stored securely on cloud infrastructure complying with Indian Information Technology regulations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-brand-600" />
              5. Contact & Privacy Inquiries
            </h2>
            <p>
              If you have any questions regarding this Privacy Policy or wish to exercise data access/deletion rights, please contact our Compliance Officer at:
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs font-bold text-slate-800 space-y-1">
              <p>Email: localdrivers.in@gmail.com</p>
              <p>Website: https://localdrivers.in</p>
              <p>Location: Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033</p>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicyPage;

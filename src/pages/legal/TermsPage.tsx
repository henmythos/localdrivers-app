import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, ShieldCheck, CreditCard, Scale, AlertCircle } from 'lucide-react';

export const TermsPage: React.FC = () => {
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
            <FileText className="w-4 h-4" />
            Terms of Service & Usage
          </div>
          <h1 className="text-3xl font-black text-slate-900">Terms & Conditions</h1>
          <p className="text-xs text-slate-500 mt-1">
            Effective Date: October 4, 2026 | Website <strong>localdrivers.in</strong> & Mobile App
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
          
          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-brand-600" />
              1. Platform Relationship & Model
            </h2>
            <p>
              Localdrivers operates as an on-demand marketplace connecting vehicle owners ("Customers") with independent professional driver partners ("Drivers") across Hyderabad. Localdrivers does not own vehicles nor employ drivers directly; all drivers operate as independent service providers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-600" />
              2. Fares & Platform Commission Structure
            </h2>
            <p>
              Rides are priced transparently based on service type (City, Outstation, Monthly, VIP, Escort). Upon trip completion, drivers pay a tiered 3–5% platform commission fee (Under ₹500 to ₹25, ₹500–₹999 to ₹40, ₹1000–₹1999 to ₹50, ₹2000+ to 5%/₹100). Profile visibility remains on Hold until the platform fee is cleared.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              3. Verification & Driver Conduct
            </h2>
            <p>
              All driver partners must possess a valid Indian Commercial/Transport Driving Licence and undergo identity and background check validation by Admin (Ranjith.ceo). Drivers are required to maintain strict professionalism, non-smoking standards, and traffic safety compliance.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-brand-600" />
              4. Support & Dispute Resolution
            </h2>
            <p>
              Any issues, code reports, or disputes must be submitted to <strong>localdrivers.in@gmail.com</strong> providing the unique 6-digit Driver Code (e.g. <code>A1B2C3</code>). Escalation tickets are reviewed within 2 hours by our support team.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
};

export default TermsPage;

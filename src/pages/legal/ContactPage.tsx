import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ArrowLeft, Send, CheckCircle2, ShieldAlert, Hash, Clock } from 'lucide-react';
import { ReportDriverModal } from '../../components/common/ReportDriverModal';

export const ContactPage: React.FC = () => {
  const [reportModalOpen, setReportModalOpen] = useState(false);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
      
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Home
      </Link>

      <div className="space-y-8">
        
        {/* Header Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <span className="text-xs font-bold text-brand-400 uppercase tracking-wider block mb-2">
              Localdrivers Support Hub
            </span>
            <h1 className="text-3xl sm:text-4xl font-black">Contact & Support</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Have a query, ride issue, or need to report a driver partner using their 6-digit code? Our Hyderabad customer care team is at your service 24/7.
            </p>
          </div>
        </div>

        {/* Contact Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-soft text-center space-y-3">
            <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Official Email</span>
              <a href="mailto:localdrivers.in@gmail.com" className="font-mono text-xs font-black text-slate-900 hover:text-brand-600">
                localdrivers.in@gmail.com
              </a>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-soft text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">24/7 Phone Line</span>
              <a href="tel:+919876543210" className="font-mono text-xs font-black text-slate-900 hover:text-emerald-600">
                +91 98765 43210
              </a>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-soft text-center space-y-3">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Hyderabad HQ</span>
              <p className="text-xs font-bold text-slate-900">
                Road No. 36, Jubilee Hills, Hyderabad 500033
              </p>
            </div>
          </div>

        </div>

        {/* Report Driver Escalation Box */}
        <div className="bg-red-50 border border-red-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              Report a Driver using 6-Digit Code
            </h3>
            <p className="text-xs text-slate-600">
              Report driver misconduct, safety breaches, or fare disputes directly to <strong>localdrivers.in@gmail.com</strong>.
            </p>
          </div>

          <button
            onClick={() => setReportModalOpen(true)}
            className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-red-600/25 transition-all shrink-0 flex items-center gap-2"
          >
            <Hash className="w-4 h-4" />
            Report Driver Code (#A1B2C3)
          </button>
        </div>

      </div>

      <ReportDriverModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />

    </div>
  );
};

export default ContactPage;

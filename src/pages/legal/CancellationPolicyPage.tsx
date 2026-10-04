import React from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const CancellationPolicyPage: React.FC = () => {
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
            <RefreshCw className="w-4 h-4" />
            Customer & Driver Policy
          </div>
          <h1 className="text-3xl font-black text-slate-900">Cancellation & Refund Policy</h1>
          <p className="text-xs text-slate-500 mt-1">
            Effective Date: October 4, 2026 | Website <strong>localdrivers.in</strong> & Mobile App
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
          
          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              1. Customer Booking Cancellation
            </h2>
            <p>
              Customers can cancel a pending or confirmed booking request at any time prior to driver arrival with <strong>zero cancellation fee</strong>. Since customer payment is made directly to the driver upon ride completion, no advance booking deposits are held by the platform.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-brand-600" />
              2. Platform Commission Refund for Drivers
            </h2>
            <p>
              Driver partners pay a 3–5% platform commission fee upon completing a ride. In the event of a duplicate payment or billing discrepancy, driver partners can submit a refund request to <strong>localdrivers.in@gmail.com</strong> providing their unique 6-digit Driver Code (e.g. <code>A1B2C3</code>). Refunds are processed back to the driver's UPI account within 24 to 48 hours.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
};

export default CancellationPolicyPage;

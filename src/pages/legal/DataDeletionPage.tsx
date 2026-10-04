import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ArrowLeft, Mail, Phone, ShieldCheck, CheckCircle2, Send } from 'lucide-react';

export const DataDeletionPage: React.FC = () => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [userRole, setUserRole] = useState<'Driver Partner' | 'Customer'>('Driver Partner');
  const [driverCode, setDriverCode] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`[Data Deletion Request] Role: ${userRole} - Mobile: ${mobileNumber}`);
    const body = encodeURIComponent(
      `Account & Data Deletion Request\n` +
      `----------------------------------------\n` +
      `User Role: ${userRole}\n` +
      `Mobile Number: ${mobileNumber}\n` +
      `Driver Code (If Applicable): ${driverCode || 'N/A'}\n` +
      `Reason: ${reason || 'User requested account closure'}\n` +
      `----------------------------------------\n` +
      `Please purge all personal records associated with this mobile number.`
    );
    window.open(`mailto:localdrivers.in@gmail.com?subject=${subject}&body=${body}`, '_blank');
    setSubmitted(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
      
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
          <div className="flex items-center gap-2 text-red-600 font-extrabold text-xs uppercase tracking-wider mb-2">
            <Trash2 className="w-4 h-4" />
            Google Play Console Compliance
          </div>
          <h1 className="text-3xl font-black text-slate-900">Account & Data Deletion Request</h1>
          <p className="text-xs text-slate-500 mt-1">
            In accordance with Google Play Store Data Safety & Privacy Policy, users can request full deletion of their account and associated data.
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6 text-xs sm:text-sm">
            
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 space-y-2 text-xs leading-relaxed">
              <span className="font-bold text-slate-900 block">What Data Will Be Purged:</span>
              <ul className="list-disc pl-5 space-y-1">
                <li>Driver Profile, Registered Mobile Number, Licence records & Police Verification documents.</li>
                <li>Customer booking history linked to your mobile phone number.</li>
                <li>All profile status entries and cached tokens.</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Your Role *</label>
                <select
                  value={userRole}
                  onChange={e => setUserRole(e.target.value as any)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="Driver Partner">Driver Partner</option>
                  <option value="Customer">Customer</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Registered Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={e => setMobileNumber(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs font-mono font-medium focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {userRole === 'Driver Partner' && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">6-Digit Driver Code (e.g. A1B2C3)</label>
                <input
                  type="text"
                  value={driverCode}
                  onChange={e => setDriverCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A1B2C3"
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-brand-500"
                />
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Reason for Deletion Request (Optional)</label>
              <textarea
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Let us know why you wish to delete your account..."
                className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Submit Account Deletion Request to localdrivers.in@gmail.com
            </button>
          </form>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Deletion Request Dispatched!</h2>
            <p className="text-xs text-slate-600">
              Your account deletion request for <strong className="font-mono text-slate-800">{mobileNumber}</strong> has been sent to our Data Officer at:
            </p>
            <div className="inline-block px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-800 font-mono">
              localdrivers.in@gmail.com
            </div>
            <p className="text-xs text-slate-500 italic">
              All personal records will be purged within 48 hours of verification.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default DataDeletionPage;

import React, { useState, useEffect } from 'react';
import { ShieldAlert, X, Mail, Phone, CheckCircle2, Send, AlertTriangle, UserCheck, Hash } from 'lucide-react';

interface ReportDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDriverCode?: string;
  initialDriverName?: string;
}

export const ReportDriverModal: React.FC<ReportDriverModalProps> = ({
  isOpen,
  onClose,
  initialDriverCode = '',
  initialDriverName = '',
}) => {
  const [driverCode, setDriverCode] = useState(initialDriverCode);
  const [driverName, setDriverName] = useState(initialDriverName);
  const [category, setCategory] = useState<'Report Driver' | 'General Query' | 'Payment Issue' | 'Safety Concern'>('Report Driver');
  const [issueType, setIssueType] = useState('Behavior & Professionalism');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');

  useEffect(() => {
    if (initialDriverCode) setDriverCode(initialDriverCode);
    if (initialDriverName) setDriverName(initialDriverName);
  }, [initialDriverCode, initialDriverName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `REP-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    setTicketId(id);

    // Create mailto link targeting localdrivers.in@gmail.com
    const subject = encodeURIComponent(`[${category}] Driver Code: ${driverCode.toUpperCase()} - Ticket ${id}`);
    const body = encodeURIComponent(
      `Support Query / Driver Report Summary\n` +
      `----------------------------------------\n` +
      `Ticket ID: ${id}\n` +
      `Category: ${category}\n` +
      `Issue Type: ${issueType}\n` +
      `Driver Code (6-digit): ${driverCode.toUpperCase()}\n` +
      `Driver Name: ${driverName || 'N/A'}\n` +
      `Customer Name: ${customerName}\n` +
      `Customer Phone: ${customerPhone}\n\n` +
      `Description & Details:\n${details}\n` +
      `----------------------------------------\n` +
      `Sent via Localdrivers Platform`
    );

    // Trigger mailto link silently or window opening
    window.open(`mailto:localdrivers.in@gmail.com?subject=${subject}&body=${body}`, '_blank');
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setDetails('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div className="text-center pb-2">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-red-100">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Report Driver & Raise Query</h2>
              <p className="text-xs text-slate-500 mt-1">
                Direct Escalation to <strong className="text-slate-800">localdrivers.in@gmail.com</strong>
              </p>
            </div>

            {/* Official Support Email Notice */}
            <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                <span>Official Support Email:</span>
              </div>
              <a
                href="mailto:localdrivers.in@gmail.com"
                className="font-mono text-brand-300 font-bold hover:underline"
              >
                localdrivers.in@gmail.com
              </a>
            </div>

            {/* Category Selectors */}
            <div className="grid grid-cols-2 gap-2">
              {(['Report Driver', 'General Query', 'Payment Issue', 'Safety Concern'] as const).map(cat => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-left ${
                    category === cat
                      ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* 6-Digit Driver Code Input */}
            <div className="p-3.5 bg-brand-50/70 border border-brand-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-brand-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-brand-600" />
                  Driver Unique 6-Digit Code *
                </label>
                <span className="text-[10px] font-bold text-brand-700 bg-brand-200/60 px-2 py-0.5 rounded">
                  Format: A1B2C3 / A2C4X5 / G2Z4N8
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={driverCode}
                    onChange={e => setDriverCode(e.target.value.toUpperCase())}
                    placeholder="e.g. A1B2C3 or G2Z4N8"
                    className="w-full px-3 py-2.5 rounded-xl border border-brand-300 focus:ring-2 focus:ring-brand-500 text-xs font-black font-mono tracking-widest text-brand-900 bg-white"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={driverName}
                    onChange={e => setDriverName(e.target.value)}
                    placeholder="Driver Name (Optional)"
                    className="w-full px-3 py-2.5 rounded-xl border border-brand-300 focus:ring-2 focus:ring-brand-500 text-xs font-medium bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Issue Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Specific Issue Type *
              </label>
              <select
                value={issueType}
                onChange={e => setIssueType(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="Behavior & Professionalism">Behavior & Professionalism</option>
                <option value="Rash Driving / Safety Breach">Rash Driving / Safety Breach</option>
                <option value="Overcharging / Fare Dispute">Overcharging / Fare Dispute</option>
                <option value="Late Arrival / No Show">Late Arrival / No Show</option>
                <option value="Vehicle Damage / Hygiene Issue">Vehicle Damage / Hygiene Issue</option>
                <option value="General Query or Assistance">General Query or Assistance</option>
              </select>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 9988776655"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium font-mono focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Issue Description & Details *</label>
              <textarea
                required
                rows={3}
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Describe what happened, location, date/time, and any relevant details..."
                className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Submit Escalation to localdrivers.in@gmail.com
            </button>
          </form>
        ) : (
          <div className="text-center py-6 space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900">Report & Query Registered!</h2>
              <p className="text-xs text-slate-600 mt-2">
                Your report against Driver Code <strong className="font-mono text-brand-700">{driverCode.toUpperCase()}</strong> has been submitted to Admin team at:
              </p>
              <div className="mt-2 inline-block px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-800 font-mono">
                localdrivers.in@gmail.com
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Ticket Reference ID:</span>
                <span className="font-mono font-bold text-slate-800">{ticketId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Driver Code:</span>
                <span className="font-mono font-bold text-brand-700">{driverCode.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Response SLA:</span>
                <span className="font-bold text-emerald-700">Within 2 Hours</span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors"
            >
              Done & Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ReportDriverModal;

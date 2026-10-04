import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, XCircle, ArrowLeft, ShieldCheck, Clock, 
  FileText, Phone, MapPin, Eye, Sparkles 
} from 'lucide-react';
import { Driver } from '../../types';
import { driversService } from '../../services/drivers';
import { dbService } from '../../services/database';

export const AdminPendingDriversPage: React.FC = () => {
  const navigate = useNavigate();
  const [pendingDrivers, setPendingDrivers] = useState<Driver[]>([]);
  const [selectedDriverForView, setSelectedDriverForView] = useState<Driver | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const loadPending = () => {
    setPendingDrivers(driversService.getPendingDrivers());
  };

  useEffect(() => {
    loadPending();
    const unsubscribe = dbService.subscribe(() => {
      loadPending();
    });
    return () => unsubscribe();
  }, []);

  const handleApprove = (driver: Driver) => {
    const res = driversService.approveDriver(driver.id);
    if (res) {
      setActionSuccessMessage(`Approved ${driver.name}! Driver is now active & listed for customer bookings.`);
      loadPending();
      if (selectedDriverForView?.id === driver.id) setSelectedDriverForView(null);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    }
  };

  const handleReject = (driver: Driver) => {
    const res = driversService.rejectDriver(driver.id);
    if (res) {
      setActionSuccessMessage(`Rejected ${driver.name}'s application.`);
      loadPending();
      if (selectedDriverForView?.id === driver.id) setSelectedDriverForView(null);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Pending Driver Approvals</h1>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
              {pendingDrivers.length} Pending
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review partner document credentials and grant approval for customer booking visibility.
          </p>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-900 text-xs font-extrabold rounded-2xl border border-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {pendingDrivers.length > 0 ? (
        <div className="space-y-6">
          {pendingDrivers.map(driver => (
            <div
              key={driver.id}
              className="bg-white rounded-3xl p-6 border-2 border-purple-200/80 shadow-soft hover:shadow-card transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                
                {/* Left Photo & Profile Info */}
                <div className="flex items-start gap-4">
                  <img
                    src={driver.photo}
                    alt={driver.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-100 shadow-sm shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-lg">{driver.name}</h3>
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        Pending Verification
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {driver.phone}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {driver.area}, {driver.city}
                      </span>
                      <span>•</span>
                      <span className="font-bold text-slate-700">{driver.experienceYears} Years Exp</span>
                    </div>

                    <p className="text-xs text-slate-500 italic mt-2">
                      "{driver.description}"
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {driver.services.map((srv, idx) => (
                        <span key={idx} className="text-[10px] bg-purple-50 text-purple-700 font-bold px-2.5 py-1 rounded-lg border border-purple-100">
                          {srv}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Document Status & APPROVE / REJECT ACTIONS */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shrink-0 space-y-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Submitted Documents</span>
                  <div className="space-y-1.5 text-xs">
                    {driver.documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between gap-4 font-medium text-slate-700">
                        <span>{doc.type}</span>
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                          {doc.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
                    <button
                      onClick={() => handleReject(driver)}
                      className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
                    >
                      <XCircle className="w-4 h-4 text-red-600" />
                      Reject
                    </button>

                    <button
                      onClick={() => handleApprove(driver)}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve Driver
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-lg">All Driver Applications Processed</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">No pending approvals at this time.</p>
          <Link to="/admin/drivers" className="px-5 py-2.5 bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md">
            View Approved Driver List
          </Link>
        </div>
      )}

    </div>
  );
};

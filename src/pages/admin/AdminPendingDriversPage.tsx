import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, XCircle, ArrowLeft, ShieldCheck, Clock, 
  FileText, Phone, MapPin, Eye, Sparkles, Lock, Maximize2, X,
  Loader2, RefreshCw, AlertCircle
} from 'lucide-react';
import { Driver } from '../../types';
import { driversService } from '../../services/drivers';
import { dbService } from '../../services/database';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

export const AdminPendingDriversPage: React.FC = () => {
  const navigate = useNavigate();
  const [pendingDrivers, setPendingDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [selectedDriverForView, setSelectedDriverForView] = useState<Driver | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  useBodyScrollLock(!!lightboxImageUrl, () => setLightboxImageUrl(null));

  const loadPending = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const liveDrivers = await driversService.getPendingDriversAsync();
      setPendingDrivers(liveDrivers);
    } catch (err: any) {
      console.error('[Admin Pending Page Error]', err);
      setApiError('Unable to connect to live driver approval API. Please check network connection.');
      setPendingDrivers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
    const unsubscribe = dbService.subscribe(() => {
      // In-browser events also trigger refresh
      loadPending();
    });
    return () => unsubscribe();
  }, []);

  const handleApprove = async (driver: Driver) => {
    setIsProcessingId(driver.id);
    try {
      const res = await driversService.approveDriverAsync(driver.id);
      if (res) {
        setActionSuccessMessage(`Approved ${driver.name}! Driver is now active & listed for customer bookings.`);
      } else {
        setActionSuccessMessage(`Driver ${driver.name} approved.`);
      }
      await loadPending();
      if (selectedDriverForView?.id === driver.id) setSelectedDriverForView(null);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err: any) {
      setApiError(`Failed to approve ${driver.name}: ${err.message}`);
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleReject = async (driver: Driver) => {
    const reason = window.prompt(`Enter rejection reason for ${driver.name}:`, 'Document verification could not be completed');
    if (reason === null) return; // User cancelled

    setIsProcessingId(driver.id);
    try {
      const res = await driversService.rejectDriverAsync(driver.id, reason);
      if (res) {
        setActionSuccessMessage(`Rejected ${driver.name}'s application.`);
      } else {
        setActionSuccessMessage(`Application for ${driver.name} marked rejected.`);
      }
      await loadPending();
      if (selectedDriverForView?.id === driver.id) setSelectedDriverForView(null);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err: any) {
      setApiError(`Failed to reject ${driver.name}: ${err.message}`);
    } finally {
      setIsProcessingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
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
            Authoritative queue of driver partner applications awaiting KYC verification.
          </p>
        </div>

        <button
          onClick={loadPending}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-all self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-600' : ''}`} />
          Refresh Queue
        </button>
      </div>

      {actionSuccessMessage && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-900 text-xs font-extrabold rounded-2xl border border-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {apiError && (
        <div className="mb-6 p-4 bg-red-50 text-red-900 text-xs font-bold rounded-2xl border border-red-200 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{apiError}</span>
          </div>
          <button
            onClick={loadPending}
            className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="py-24 text-center bg-white rounded-3xl border border-slate-200 shadow-soft">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-3" />
          <h3 className="font-extrabold text-slate-800 text-base">Retrieving Real Registrations...</h3>
          <p className="text-xs text-slate-500 mt-1">Querying database for pending driver verification records</p>
        </div>
      ) : pendingDrivers.length > 0 ? (
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
                    src={driver.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                    alt={driver.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-100 shadow-sm shrink-0 cursor-pointer"
                    onClick={() => driver.photo && setLightboxImageUrl(driver.photo)}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-lg">{driver.name}</h3>
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        Pending Verification
                      </span>
                      {driver.driverCode && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {driver.driverCode}
                        </span>
                      )}
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
                      "{driver.description || 'Driver registration pending review'}"
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {driver.services?.map((srv, idx) => (
                        <span key={idx} className="text-[10px] bg-purple-50 text-purple-700 font-bold px-2.5 py-1 rounded-lg border border-purple-100">
                          {srv}
                        </span>
                      ))}
                      {driver.vehicleCategories?.map((veh, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                          {veh}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Document Status & APPROVE / REJECT ACTIONS */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shrink-0 space-y-3 lg:w-80">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase">Submitted Documents</span>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-purple-600" /> Private Admin View
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {driver.documents && driver.documents.length > 0 ? (
                      driver.documents.map((doc, idx) => (
                        <div key={doc.id || idx} className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 overflow-hidden">
                            {doc.url ? (
                              <img 
                                src={doc.url} 
                                alt={doc.type} 
                                className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0 cursor-pointer"
                                onClick={() => setLightboxImageUrl(doc.url!)}
                              />
                            ) : (
                              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span className="font-semibold text-slate-800 truncate text-[11px]">{doc.type}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              doc.status === 'Verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {doc.status}
                            </span>
                            {doc.url && (
                              <button
                                onClick={() => setLightboxImageUrl(doc.url!)}
                                className="p-1 hover:bg-slate-100 rounded text-slate-500"
                                title="Inspect Full Document"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-400 text-[11px] italic p-2 bg-white rounded-xl">No documents uploaded</div>
                    )}
                  </div>

                  {/* Approve / Reject Action Buttons */}
                  <div className="pt-2 flex items-center gap-2 border-t border-slate-200">
                    <button
                      onClick={() => handleReject(driver)}
                      disabled={isProcessingId === driver.id}
                      className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {isProcessingId === driver.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      Reject
                    </button>

                    <button
                      onClick={() => handleApprove(driver)}
                      disabled={isProcessingId === driver.id}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isProcessingId === driver.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Approve Driver
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 shadow-soft">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="font-extrabold text-slate-800 text-lg">No Pending Driver Approvals</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            All driver partner registrations have been reviewed. Genuine applicant registrations will appear here instantly.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={loadPending}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
            >
              Check Again
            </button>
            <Link to="/admin/drivers" className="px-5 py-2 bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md hover:bg-purple-800">
              View Approved Driver List
            </Link>
          </div>
        </div>
      )}

      {/* FULL-SIZE IMAGE LIGHTBOX MODAL */}
      {lightboxImageUrl && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxImageUrl(null);
          }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 modal-overlay-container overscroll-contain"
        >
          <button
            onClick={() => setLightboxImageUrl(null)}
            className="absolute top-4 right-4 text-white hover:text-slate-300 p-2 font-bold z-10"
            aria-label="Close Preview"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={lightboxImageUrl}
            alt="Full resolution document preview"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body
      )}

    </div>
  );
};

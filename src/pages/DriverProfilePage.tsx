import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Star, ShieldCheck, MapPin, Award, Languages, Car, 
  Calendar, CheckCircle2, ChevronRight, Hash, ShieldAlert, Phone,
  Loader2, UserX, CheckCircle, XCircle, PauseCircle, PlayCircle, Lock, Eye, Maximize2, X 
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { Driver, Review, Booking } from '../types';
import { driversService } from '../services/drivers';
import { dbService } from '../services/database';
import { authService } from '../services/auth';
import { BookingModal } from '../components/booking/BookingModal';
import { ReportDriverModal } from '../components/common/ReportDriverModal';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

export const DriverProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [driver, setDriver] = useState<Driver | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  const authState = authService.getAuthState();
  const isAdmin = authState.isAdminAuthenticated;

  useBodyScrollLock(!!lightboxImageUrl, () => setLightboxImageUrl(null));

  const loadDriver = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const found = await driversService.getDriverByIdAsync(id);
      if (found) {
        setDriver(found);
        setReviews(dbService.getReviewsForDriver(found.id));
      } else {
        setDriver(null);
      }
    } catch (err: any) {
      console.error('[DriverProfilePage] Error fetching driver:', err);
      setDriver(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDriver();
    const unsubscribe = dbService.subscribe(() => {
      // Refresh local reviews or state
      if (id) {
        const local = dbService.getDriverById(id);
        if (local) setDriver((prev: Driver | null) => prev ? { ...prev, ...local } : local);
      }
    });
    return () => unsubscribe();
  }, [id]);

  const handleAdminApprove = async () => {
    if (!driver) return;
    const ok = await driversService.approveDriverAsync(driver.id);
    if (ok) {
      setActionMsg(`Approved driver ${driver.name}. Status updated to Approved.`);
      loadDriver();
      setTimeout(() => setActionMsg(null), 4000);
    }
  };

  const handleAdminReject = async () => {
    if (!driver) return;
    const reason = window.prompt(`Enter rejection reason for ${driver.name}:`, 'Document verification could not be completed');
    if (reason === null) return;
    const ok = await driversService.rejectDriverAsync(driver.id, reason);
    if (ok) {
      setActionMsg(`Driver ${driver.name} marked Rejected.`);
      loadDriver();
      setTimeout(() => setActionMsg(null), 4000);
    }
  };

  const handleAdminToggleHold = () => {
    if (!driver) return;
    const isCurrentlyHold = driver.isHold || driver.status === 'Hold' || driver.status === 'Payment Due';
    if (isCurrentlyHold) {
      driversService.toggleHold(driver.id, false);
      setActionMsg(`Released hold on ${driver.name}.`);
    } else {
      driversService.toggleHold(driver.id, true);
      setActionMsg(`Placed ${driver.name} on Hold.`);
    }
    loadDriver();
    setTimeout(() => setActionMsg(null), 4000);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-28 text-center">
        <Loader2 className="w-10 h-10 text-brand-600 animate-spin mx-auto mb-3" />
        <h2 className="text-base font-extrabold text-slate-800">Loading Driver Profile...</h2>
        <p className="text-xs text-slate-500 mt-1">Fetching verified partner information from database</p>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-400">
          <UserX className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800">Driver Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            The driver profile ({id}) could not be retrieved from the database. It may have been removed or does not exist.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            Go Back
          </button>
          {isAdmin ? (
            <Link
              to="/admin/drivers"
              className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors"
            >
              Back to Admin Roster
            </Link>
          ) : (
            <Link
              to="/find-drivers"
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors"
            >
              Browse Available Drivers
            </Link>
          )}
        </div>
      </div>
    );
  }

  const isCurrentlyHold = driver.isHold || driver.status === 'Hold' || driver.status === 'Payment Due';
  const isOnTrip = driver.currentWorkStatus === 'on_trip';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
      
      {/* AUTHORIZED ADMINISTRATOR CONSOLE BANNER */}
      {isAdmin && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-900 to-slate-900 text-white rounded-3xl shadow-lg border border-purple-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded">
                  Admin Console View
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                  driver.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-300' :
                  driver.status === 'Pending' ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'
                }`}>
                  Status: {driver.status}
                </span>
                {isOnTrip && (
                  <span className="text-[10px] font-extrabold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                    Active On Ride
                  </span>
                )}
              </div>
              <p className="text-xs text-purple-200 mt-1">
                Driver ID: <strong className="font-mono text-white">{driver.id}</strong> • Phone: <strong className="text-white">{driver.phone}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {driver.status === 'Pending' && (
              <>
                <button
                  onClick={handleAdminApprove}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Approve Driver
                </button>
                <button
                  onClick={handleAdminReject}
                  className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  Reject
                </button>
              </>
            )}

            <button
              onClick={handleAdminToggleHold}
              className={`px-3 py-1.5 font-bold text-xs rounded-xl transition-colors flex items-center gap-1 ${
                isCurrentlyHold
                  ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
              }`}
            >
              {isCurrentlyHold ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
              <span>{isCurrentlyHold ? 'Release Hold' : 'Put on Hold'}</span>
            </button>

            <Link
              to="/admin/drivers"
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-colors"
            >
              All Drivers
            </Link>
          </div>
        </div>
      )}

      {actionMsg && (
        <div className="mb-6 p-4 bg-slate-900 text-white text-xs font-bold rounded-2xl shadow-lg flex items-center justify-between animate-in fade-in">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg(null)} className="text-slate-400 hover:text-white font-bold text-xs">Close</button>
        </div>
      )}

      {/* Back Button */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Report Driver Button */}
        <button
          onClick={() => setShowReportModal(true)}
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full border border-red-200 transition-colors"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Report Driver (#{driver.driverCode || 'Code'})
        </button>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative shrink-0">
              <img
                src={driver.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                alt={driver.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-slate-100 shadow-md cursor-pointer"
                onClick={() => driver.photo && setLightboxImageUrl(driver.photo)}
              />
              {isOnTrip ? (
                <span className="absolute bottom-1 right-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white border-2 border-white shadow-sm">
                  ON A TRIP
                </span>
              ) : driver.isOnline ? (
                <span className="absolute bottom-1 right-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white border-2 border-white shadow-sm">
                  ONLINE NOW
                </span>
              ) : (
                <span className="absolute bottom-1 right-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-400 text-white border-2 border-white">
                  OFFLINE
                </span>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{driver.name}</h1>
                
                {/* 6-Digit Driver Code Badge */}
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black font-mono bg-brand-100 text-brand-900 border border-brand-300 shadow-sm" title="Unique Driver Code">
                  <Hash className="w-3.5 h-3.5 text-brand-700" />
                  Code: #{driver.driverCode || 'A1B2C3'}
                </span>

                {driver.verificationBadge && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Verified Professional
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-2 font-medium">
                <span className="flex items-center text-amber-500 font-extrabold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <Star className="w-4 h-4 fill-current mr-1" />
                  {driver.rating} ({reviews.length > 0 ? `${reviews.length} reviews` : 'Top Rated'})
                </span>
                <span>•</span>
                <span className="font-bold text-slate-800">{driver.totalTrips.toLocaleString()} trips completed</span>
                <span>•</span>
                <span className="font-semibold text-slate-700">{driver.experienceYears}+ years experience</span>
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                <span>Base location: <strong>{driver.area}, {driver.city}</strong> ({driver.distanceKm} km from you)</span>
              </div>
            </div>
          </div>

          {/* Pricing & CTA */}
          <div className="w-full md:w-auto bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 flex md:flex-col items-center justify-between gap-4 shrink-0">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Starting Price</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                ₹{driver.startingPrice}<span className="text-xs font-normal text-slate-500">/hr</span>
              </div>
            </div>

            <button
              onClick={() => setShowBookingModal(true)}
              className="w-full sm:w-auto px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-brand-600/25 transition-all flex items-center justify-center gap-2"
            >
              Book This Driver
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Grid: Driver Overview & Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Details & Services */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Professional Summary */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft">
            <h3 className="font-black text-slate-900 text-lg mb-3">Professional Summary</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {driver.description}
            </p>
          </div>

          {/* Services Offered */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft">
            <h3 className="font-black text-slate-900 text-lg mb-4">Services Offered</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {driver.services.map((service: any, idx: number) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedService(service);
                    setShowBookingModal(true);
                  }}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-brand-400 hover:bg-brand-50/40 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-brand-600" />
                    <span className="font-bold text-slate-800 text-xs sm:text-sm group-hover:text-brand-700">
                      {service}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-brand-600 group-hover:underline">
                    Book
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Reviews */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-900 text-lg">Customer Reviews</h3>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{driver.rating} Rating</span>
              </span>
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((rev: Review) => (
                  <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{rev.customerName}</span>
                        <div className="flex items-center text-amber-500">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">{rev.date}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No reviews written yet for this driver.</p>
            )}
          </div>

        </div>

        {/* Right Column: Driver Specs & Verified Credentials */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft space-y-4">
            <h3 className="font-black text-slate-900 text-base border-b border-slate-100 pb-3">
              Driver Credentials
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Languages className="w-4 h-4 text-slate-400" />
                  Languages
                </span>
                <span className="font-bold text-slate-800">{driver.languages.join(', ')}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Car className="w-4 h-4 text-slate-400" />
                  Vehicle Types
                </span>
                <span className="font-bold text-slate-800">{driver.vehicleCategories.join(', ')}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Member Since
                </span>
                <span className="font-bold text-slate-800">{driver.joinedDate}</span>
              </div>
            </div>
          </div>

          {/* Document Verification & Admin KYC Inspector */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-sm">Background Verification</h4>
              </div>
              {isAdmin && (
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded border border-purple-700/60 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Admin View
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs pt-1">
              {(driver.documents && driver.documents.length > 0) ? (
                driver.documents.map((doc: any, idx: number) => (
                  <div key={doc.id || idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {isAdmin && doc.url ? (
                        <img
                          src={doc.url}
                          alt={doc.type}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-600 shrink-0 cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => setLightboxImageUrl(doc.url!)}
                          title="Click to inspect full image"
                        />
                      ) : null}
                      <span className="text-slate-200 font-medium truncate text-xs">{doc.type}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        doc.status === 'Verified'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : doc.status === 'Rejected'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {doc.status}
                      </span>
                      {isAdmin && doc.url && (
                        <button
                          onClick={() => setLightboxImageUrl(doc.url!)}
                          className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                          title="Inspect Document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-slate-800/60 rounded-xl text-center text-xs text-slate-400 italic">
                  Aadhaar & Driving Licence background verification complete.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          driver={driver}
          preselectedService={selectedService}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedService(undefined);
          }}
          onBookingComplete={(b: Booking) => console.log('Booking done:', b)}
        />
      )}

      {/* Report Driver Modal */}
      <ReportDriverModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        initialDriverCode={driver.driverCode}
        initialDriverName={driver.name}
      />

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

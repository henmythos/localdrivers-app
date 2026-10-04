import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Star, ShieldCheck, MapPin, Award, Languages, Car, Calendar, 
  Phone, ArrowLeft, CheckCircle2, ChevronRight, MessageSquare, ShieldAlert, Hash 
} from 'lucide-react';
import { Driver, Review } from '../types';
import { driversService } from '../services/drivers';
import { dbService } from '../services/database';
import { BookingModal } from '../components/booking/BookingModal';
import { ReportDriverModal } from '../components/common/ReportDriverModal';

export const DriverProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [driver, setDriver] = useState<Driver | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(undefined);

  useEffect(() => {
    if (id) {
      const found = driversService.getDriverById(id);
      if (found) {
        setDriver(found);
        setReviews(dbService.getReviewsForDriver(found.id));
      }
    }
  }, [id]);

  if (!driver) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Driver Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">The driver profile you are looking for does not exist.</p>
        <Link to="/find-drivers" className="px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md">
          Back to Drivers
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
      
      {/* Back Button */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to search
        </button>

        {/* Report Driver Button */}
        <button
          onClick={() => setShowReportModal(true)}
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full border border-red-200 transition-colors"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Report Driver ({driver.driverCode || 'Code'})
        </button>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative shrink-0">
              <img
                src={driver.photo}
                alt={driver.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-slate-100 shadow-md"
              />
              {driver.isOnline ? (
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
              {driver.services.map((service, idx) => (
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
              <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                {driver.rating} ★ Rating
              </span>
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map(rev => (
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

          {/* Document Verification Badges */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h4 className="font-bold text-sm">Background Verification</h4>
            </div>

            <div className="space-y-2 text-xs pt-1">
              {driver.documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-800/90 border border-slate-700">
                  <span className="text-slate-300 font-medium">{doc.type}</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {doc.status}
                  </span>
                </div>
              ))}
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
          onBookingComplete={(b) => console.log('Booking done:', b)}
        />
      )}

      {/* Report Driver Modal */}
      <ReportDriverModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        initialDriverCode={driver.driverCode}
        initialDriverName={driver.name}
      />
    </div>
  );
};

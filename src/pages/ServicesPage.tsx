import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, MapPin, Calendar, UserCheck, Crown, Shield, 
  CheckCircle2, ArrowRight, ShieldCheck, Sparkles 
} from 'lucide-react';
import { INITIAL_SERVICES, INITIAL_DRIVERS } from '../services/database';
import { BookingModal } from '../components/booking/BookingModal';
import { Driver } from '../types';

export const ServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDriverForBooking, setSelectedDriverForBooking] = useState<Driver | null>(null);

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Car': return <Car className="w-8 h-8 text-brand-600" />;
      case 'MapPin': return <MapPin className="w-8 h-8 text-brand-600" />;
      case 'Calendar': return <Calendar className="w-8 h-8 text-brand-600" />;
      case 'UserCheck': return <UserCheck className="w-8 h-8 text-brand-600" />;
      case 'Crown': return <Crown className="w-8 h-8 text-brand-600" />;
      case 'ShieldCheck': return <Shield className="w-8 h-8 text-brand-600" />;
      default: return <Car className="w-8 h-8 text-brand-600" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 md:pb-12">
      
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          Services Catalog
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3">
          Driver Rental Services in Hyderabad
        </h1>
        <p className="text-sm text-slate-600 mt-3 leading-relaxed">
          Book trusted, verified professional drivers for every travel need — from quick city errands and long outstation road trips to monthly executive chauffeurs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {INITIAL_SERVICES.map(srv => (
          <div
            key={srv.id}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft hover:shadow-card transition-all duration-200 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {getServiceIcon(srv.icon)}
                </div>
                {srv.badge && (
                  <span className="text-xs font-extrabold uppercase tracking-wider bg-brand-100 text-brand-700 px-3 py-1 rounded-full">
                    {srv.badge}
                  </span>
                )}
              </div>

              <h3 className="font-black text-slate-900 text-xl group-hover:text-brand-600 transition-colors">
                {srv.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                "{srv.shortDescription}"
              </p>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                {srv.fullDescription}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Starting from</span>
                <span className="text-lg font-black text-slate-900">
                  ₹{srv.startingPrice}
                  <span className="text-xs font-normal text-slate-500">
                    {srv.title === 'Monthly Driver' ? '/month' : '/trip'}
                  </span>
                </span>
              </div>

              <button
                onClick={() => {
                  const driver = INITIAL_DRIVERS.find(d => d.services.includes(srv.title)) || INITIAL_DRIVERS[0];
                  setSelectedService(srv.title);
                  setSelectedDriverForBooking(driver);
                }}
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
              >
                Book {srv.title.split(' ')[0]}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedDriverForBooking && (
        <BookingModal
          driver={selectedDriverForBooking}
          preselectedService={selectedService}
          onClose={() => {
            setSelectedDriverForBooking(null);
            setSelectedService(null);
          }}
          onBookingComplete={(b) => console.log('Booking complete:', b)}
        />
      )}
    </div>
  );
};

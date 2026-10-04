import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Car, ShieldCheck, MapPin, Award, Users, CheckCircle2 } from 'lucide-react';

export const AboutPage: React.FC = () => {
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
        <div className="border-b border-slate-100 pb-6 text-center">
          <img src="/logo.png" alt="Localdrivers Hyderabad" className="h-12 mx-auto mb-3 object-contain" />
          <h1 className="text-3xl font-black text-slate-900">Your Driver. Your Journey.</h1>
          <p className="text-xs text-slate-500 mt-2 max-w-xl mx-auto">
            Hyderabad's trusted on-demand driver booking platform connecting vehicle owners with 100% background-verified professional drivers.
          </p>
        </div>

        {/* Story & Mission */}
        <div className="space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-600" />
              Our Mission
            </h2>
            <p>
              Founded with a mission to simplify urban commuting and long-distance road trips across Telangana and Andhra Pradesh, Localdrivers provides safe, punctual, and highly trained drivers for your personal vehicle. Whether you need a city driver for daily errands, an outstation driver for weekend family trips, or a monthly dedicated chauffeur for executive travel, we allocate vetted drivers within 15 minutes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              The Localdrivers Trust Promise
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="font-extrabold text-slate-900 block">100% Background Verified</span>
                <span className="text-xs text-slate-500">Every driver passes police verification and licence authentication.</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="font-extrabold text-slate-900 block">Transparent 3-5% Fee</span>
                <span className="text-xs text-slate-500">Fair commissions ensuring driver satisfaction and zero hidden charges.</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="font-extrabold text-slate-900 block">Unique 6-Digit Driver Code</span>
                <span className="text-xs text-slate-500">Every driver carries a tracking code (e.g. A1B2C3) for safety audit.</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="font-extrabold text-slate-900 block">Direct Phone Contact</span>
                <span className="text-xs text-slate-500">Instant direct call connection between customer and driver.</span>
              </div>
            </div>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Leadership & Headquarters
            </h2>
            <p>
              Localdrivers is led by <strong>Admin Ranjith (CEO)</strong> and headquartered in Jubilee Hills, Hyderabad.
            </p>
            <div className="p-4 bg-slate-900 text-white rounded-2xl text-xs space-y-1 font-mono">
              <p>Portal: https://localdrivers.in</p>
              <p>Email: localdrivers.in@gmail.com</p>
              <p>Address: Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033</p>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
};

export default AboutPage;

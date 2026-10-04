import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Grid, Car } from 'lucide-react';
import { INITIAL_SERVICES } from '../../services/database';

export const AdminServicesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
      <button
        onClick={() => navigate('/admin/dashboard')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Admin Dashboard
      </button>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Service Categories Management</h1>
        <p className="text-xs text-slate-500 mt-1">Configure service pricing & fleet offerings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {INITIAL_SERVICES.map(srv => (
          <div key={srv.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-soft">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-extrabold text-slate-900 text-base">{srv.title}</h3>
              <span className="text-xs font-black text-brand-700">₹{srv.startingPrice}</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">{srv.fullDescription}</p>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
              Active in Hyderabad
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

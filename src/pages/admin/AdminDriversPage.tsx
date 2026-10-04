import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Filter, ShieldCheck, Star, 
  CheckCircle2, XCircle, ChevronRight, Eye, PauseCircle, PlayCircle, CreditCard 
} from 'lucide-react';
import { Driver, DriverStatus } from '../../types';
import { driversService } from '../../services/drivers';
import { dbService } from '../../services/database';

export const AdminDriversPage: React.FC = () => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const loadDrivers = () => {
    setDrivers(driversService.getAllDrivers());
  };

  useEffect(() => {
    loadDrivers();
    const unsubscribe = dbService.subscribe(() => loadDrivers());
    return () => unsubscribe();
  }, []);

  const handleToggleHold = (driver: Driver) => {
    const isCurrentlyHold = driver.isHold || driver.status === 'Hold' || driver.status === 'Payment Due';
    if (isCurrentlyHold) {
      driversService.payCommissionFee(driver.id, 50);
      driversService.toggleHold(driver.id, false);
      setActionMsg(`✓ Released ${driver.name}'s profile. Driver is now active online in customer search.`);
    } else {
      driversService.toggleHold(driver.id, true);
      setActionMsg(`Paused ${driver.name}'s profile on Hold. Driver is hidden from customer search.`);
    }
    loadDrivers();
    setTimeout(() => setActionMsg(null), 4000);
  };

  const filtered = drivers.filter(d => {
    if (statusFilter === 'Hold') return d.isHold || d.status === 'Hold' || d.status === 'Payment Due';
    if (statusFilter !== 'All' && d.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        (d.driverCode && d.driverCode.toLowerCase().includes(q)) ||
        d.phone.includes(q) ||
        d.city.toLowerCase().includes(q) ||
        d.area.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
      
      <button
        onClick={() => navigate('/admin/dashboard')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Admin Dashboard
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Partner Driver Roster & Profile Hold</h1>
          <p className="text-xs text-slate-500 mt-1">
            Control online visibility, hold/release profiles, and process platform commission fees
          </p>
        </div>

        <Link
          to="/admin/drivers/pending"
          className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors"
        >
          View Pending Approvals ({drivers.filter(d => d.status === 'Pending').length})
        </Link>
      </div>

      {actionMsg && (
        <div className="mb-6 p-4 bg-slate-900 text-white text-xs font-bold rounded-2xl shadow-lg flex items-center justify-between animate-in fade-in">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg(null)} className="text-slate-400 hover:text-white font-mono">✕</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by driver name or location..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {['All', 'Approved', 'Hold', 'Pending', 'Rejected'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                statusFilter === status
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Driver</th>
                <th className="p-4">City / Area</th>
                <th className="p-4">Experience</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Commission Due</th>
                <th className="p-4">Visibility Status</th>
                <th className="p-4 text-right">Hold / Release Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(driver => {
                const isCurrentlyHold = driver.isHold || driver.status === 'Hold' || driver.status === 'Payment Due';

                return (
                  <tr key={driver.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={driver.photo} alt={driver.name} className="w-10 h-10 rounded-xl object-cover" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{driver.name}</span>
                            <span className="text-[10px] font-black font-mono bg-brand-100 text-brand-900 px-1.5 py-0.5 rounded border border-brand-300">
                              #{driver.driverCode || 'A1B2C3'}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">{driver.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-700">{driver.area}, {driver.city}</td>
                    <td className="p-4 font-medium text-slate-700">{driver.experienceYears} Yrs</td>
                    <td className="p-4 font-bold text-amber-500">{driver.rating} ★</td>
                    
                    <td className="p-4">
                      {driver.pendingCommissionFee && driver.pendingCommissionFee > 0 ? (
                        <span className="font-black text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          ₹{driver.pendingCommissionFee} Due
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">Cleared (₹0)</span>
                      )}
                    </td>

                    <td className="p-4">
                      {isCurrentlyHold ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                          ON HOLD (Hidden)
                        </span>
                      ) : driver.status === 'Approved' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          APPROVED & ONLINE
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">
                          {driver.status}
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleHold(driver)}
                          className={`px-3 py-1.5 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1 ${
                            isCurrentlyHold
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                          }`}
                        >
                          {isCurrentlyHold ? (
                            <>
                              <PlayCircle className="w-3.5 h-3.5" />
                              Release Profile
                            </>
                          ) : (
                            <>
                              <PauseCircle className="w-3.5 h-3.5" />
                              Put on Hold
                            </>
                          )}
                        </button>

                        <Link
                          to={`/drivers/${driver.id}`}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

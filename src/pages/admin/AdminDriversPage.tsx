import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Filter, ShieldCheck, Star, 
  CheckCircle2, XCircle, ChevronRight, Eye, PauseCircle, PlayCircle, CreditCard, Link2, ExternalLink, X, Save,
  FileText, Lock, Maximize2, Download, Camera, Check
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

  // Payment Link Editing Modal State
  const [selectedDriverForPayment, setSelectedDriverForPayment] = useState<Driver | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(50);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [putOnHold, setPutOnHold] = useState<boolean>(true);

  const loadDrivers = () => {
    setDrivers(driversService.getAllDrivers());
  };

  useEffect(() => {
    loadDrivers();
    const unsubscribe = dbService.subscribe(() => loadDrivers());
    return () => unsubscribe();
  }, []);

  const handleOpenPaymentModal = (driver: Driver) => {
    setSelectedDriverForPayment(driver);
    setPaymentAmount(driver.pendingCommissionFee || 50);
    setPaymentUrl(
      driver.paymentLinkUrl || 
      `https://pay.localdrivers.in/upi?amount=${driver.pendingCommissionFee || 50}&driver=${driver.driverCode || driver.id}`
    );
    setPutOnHold(driver.isHold || driver.status === 'Hold' || driver.status === 'Payment Due' || true);
  };

  const handleSavePaymentLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverForPayment) return;

    dbService.updateDriverProfile(selectedDriverForPayment.id, {
      pendingCommissionFee: paymentAmount,
      paymentLinkUrl: paymentUrl,
      isHold: putOnHold,
      status: putOnHold ? 'Payment Due' : selectedDriverForPayment.status,
    });

    setActionMsg(`✓ Saved custom payment link & ₹${paymentAmount} fee for ${selectedDriverForPayment.name}. Reflected on driver dashboard.`);
    setSelectedDriverForPayment(null);
    loadDrivers();
    setTimeout(() => setActionMsg(null), 5000);
  };

  const handleToggleHold = (driver: Driver) => {
    const isCurrentlyHold = driver.isHold || driver.status === 'Hold' || driver.status === 'Payment Due';
    if (isCurrentlyHold) {
      driversService.payCommissionFee(driver.id, driver.pendingCommissionFee || 50);
      driversService.toggleHold(driver.id, false);
      setActionMsg(`✓ Released ${driver.name}'s profile. Driver is now active online in customer search.`);
    } else {
      driversService.toggleHold(driver.id, true);
      setActionMsg(`Paused ${driver.name}'s profile on Hold. Driver is hidden from customer search.`);
    }
    loadDrivers();
    setTimeout(() => setActionMsg(null), 4000);
  };

  // Document Review Modal State
  const [selectedDriverForDocs, setSelectedDriverForDocs] = useState<Driver | null>(null);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  const handleUpdateDocStatus = (driverId: string, docId: string, newStatus: 'Verified' | 'Rejected' | 'Under Review') => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;

    const updatedDocs = driver.documents.map(doc => 
      doc.id === docId ? { ...doc, status: newStatus } : doc
    );

    const allVerified = updatedDocs.every(doc => doc.status === 'Verified');

    dbService.updateDriverProfile(driverId, {
      documents: updatedDocs,
      verificationBadge: allVerified,
      status: allVerified ? 'Approved' : driver.status
    });

    setActionMsg(`Updated document status to ${newStatus} for ${driver.name}.`);
    loadDrivers();
    if (selectedDriverForDocs?.id === driverId) {
      const refreshed = dbService.getDriverById(driverId);
      if (refreshed) setSelectedDriverForDocs(refreshed);
    }
  };

  const handleApproveAllDocs = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;

    const updatedDocs = driver.documents.map(doc => ({ ...doc, status: 'Verified' as const }));

    dbService.updateDriverProfile(driverId, {
      documents: updatedDocs,
      verificationBadge: true,
      status: 'Approved',
      isHold: false
    });

    setActionMsg(`✓ Approved all documents & activated driver ${driver.name} (#${driver.driverCode}).`);
    loadDrivers();
    if (selectedDriverForDocs?.id === driverId) {
      const refreshed = dbService.getDriverById(driverId);
      if (refreshed) setSelectedDriverForDocs(refreshed);
    }
  };

  const filtered = drivers.filter(d => {
    if (statusFilter === 'Hold') return d.isHold || d.status === 'Hold' || d.status === 'Payment Due';
    if (statusFilter !== 'All' && d.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.id.toLowerCase().includes(q) ||
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
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Partner Driver Roster & Payment Links</h1>
          <p className="text-xs text-slate-500 mt-1">
            Send custom payment links to driver dashboards for unholding accounts & platform commission clearance
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
            placeholder="Search by driver name, code (#A1B2C3), or area..."
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

      {/* Driver Table */}
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
                <th className="p-4">Payment Link</th>
                <th className="p-4">Visibility Status</th>
                <th className="p-4 text-right">Actions</th>
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
                      {driver.paymentLinkUrl ? (
                        <a
                          href={driver.paymentLinkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:underline font-mono"
                        >
                          <Link2 className="w-3 h-3" />
                          Link Set
                        </a>
                      ) : (
                        <span className="text-slate-400 font-medium">Default UPI</span>
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
                        {/* INSPECT DOCS / KYC BUTTON */}
                        <button
                          onClick={() => setSelectedDriverForDocs(driver)}
                          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs rounded-xl border border-purple-200 transition-colors flex items-center gap-1"
                          title="Inspect Aadhaar, DL, and Profile Selfie documents"
                        >
                          <FileText className="w-3.5 h-3.5 text-purple-600" />
                          Inspect Docs
                        </button>

                        {/* SET PAYMENT LINK BUTTON */}
                        <button
                          onClick={() => handleOpenPaymentModal(driver)}
                          className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-800 font-bold text-xs rounded-xl border border-brand-200 transition-colors flex items-center gap-1"
                          title="Generate or edit payment link for driver dashboard"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-brand-600" />
                          Payment Link
                        </button>

                        {/* HOLD / UNHOLD TOGGLE */}
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
                              Unhold Profile
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

      {/* ADMIN PAYMENT LINK GENERATOR MODAL */}
      {selectedDriverForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 p-6 relative">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedDriverForPayment.photo}
                  alt={selectedDriverForPayment.name}
                  className="w-10 h-10 rounded-xl object-cover"
                />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{selectedDriverForPayment.name}</h3>
                  <span className="text-xs font-mono font-bold text-brand-700">
                    Code: #{selectedDriverForPayment.driverCode || 'A1B2C3'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedDriverForPayment(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePaymentLink} className="space-y-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Commission / Unhold Fee Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Custom Payment Link URL (UPI / Gateway Link)
                </label>
                <input
                  type="url"
                  required
                  value={paymentUrl}
                  onChange={(e) => setPaymentUrl(e.target.value)}
                  placeholder="e.g. https://pay.localdrivers.in/upi?amount=50"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-brand-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  This exact URL will be sent to <strong>{selectedDriverForPayment.name}'s Dashboard</strong> for unholding the account.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPaymentUrl(`https://pay.localdrivers.in/upi?amount=${paymentAmount}&driver=${selectedDriverForPayment.driverCode || selectedDriverForPayment.id}`)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg"
                >
                  Standard UPI Gateway
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentUrl(`upi://pay?pa=localdrivers@upi&pn=LocalDrivers&am=${paymentAmount}`)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg"
                >
                  GPay / PhonePe Deep Link
                </button>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <input
                  type="checkbox"
                  id="putHoldCheck"
                  checked={putOnHold}
                  onChange={(e) => setPutOnHold(e.target.checked)}
                  className="w-4 h-4 rounded accent-brand-600 cursor-pointer"
                />
                <label htmlFor="putHoldCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Keep Driver Profile on Hold until Payment is Cleared
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDriverForPayment(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Save & Update Driver Dashboard
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ADMIN DOCUMENT INSPECTOR MODAL */}
      {selectedDriverForDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 relative">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-4">
                <img
                  src={selectedDriverForDocs.photo}
                  alt={selectedDriverForDocs.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-extrabold text-slate-900 text-xl">{selectedDriverForDocs.name}</h2>
                    <span className="text-xs font-mono font-black bg-brand-100 text-brand-900 px-2 py-0.5 rounded border border-brand-300">
                      #{selectedDriverForDocs.driverCode || selectedDriverForDocs.id}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>ID: <strong className="font-mono text-slate-700">{selectedDriverForDocs.id}</strong></span>
                    <span>•</span>
                    <span>Phone: <strong className="text-slate-800">{selectedDriverForDocs.phone}</strong></span>
                    <span>•</span>
                    <span>Area: <strong className="text-slate-800">{selectedDriverForDocs.area}, {selectedDriverForDocs.city}</strong></span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedDriverForDocs(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Privacy Guarantee Note */}
            <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl mb-6 flex items-start gap-3 text-xs text-purple-900">
              <Lock className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block">Admin Security & Privacy Guarantee:</span>
                <span>
                  Aadhaar Card & Driving License documents are strictly confidential and stored securely on Cloudflare R2. They are accessible <strong>ONLY</strong> to Admin within this console and are never visible publicly. Profile selfie photo is displayed on the public driver profile.
                </span>
              </div>
            </div>

            {/* Documents Grid */}
            <div className="space-y-6">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Submitted Documents ({selectedDriverForDocs.documents.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedDriverForDocs.documents.map((doc) => (
                  <div key={doc.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-extrabold text-slate-800">{doc.type}</span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          doc.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' :
                          doc.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {doc.status}
                        </span>
                      </div>

                      {doc.url ? (
                        <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-200 h-36">
                          <img src={doc.url} alt={doc.type} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              onClick={() => setLightboxImageUrl(doc.url || null)}
                              className="p-2 bg-white text-slate-900 rounded-xl font-bold text-xs shadow-lg flex items-center gap-1"
                            >
                              <Maximize2 className="w-4 h-4" />
                              Inspect Full Image
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="h-36 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs font-medium">
                          No file uploaded
                        </div>
                      )}
                    </div>

                    {/* Action buttons per document */}
                    <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateDocStatus(selectedDriverForDocs.id, doc.id, 'Verified')}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-1 ${
                          doc.status === 'Verified'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        Verify
                      </button>
                      <button
                        onClick={() => handleUpdateDocStatus(selectedDriverForDocs.id, doc.id, 'Rejected')}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-1 ${
                          doc.status === 'Rejected'
                            ? 'bg-red-600 text-white'
                            : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Driver verification status: <strong className="text-slate-800">{selectedDriverForDocs.status}</strong>
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedDriverForDocs(null)}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleApproveAllDocs(selectedDriverForDocs.id)}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve All Docs & Activate Driver
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* FULL-SIZE IMAGE LIGHTBOX MODAL */}
      {lightboxImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <button
            onClick={() => setLightboxImageUrl(null)}
            className="absolute top-4 right-4 text-white hover:text-slate-300 p-2 font-bold"
          >
            <X className="w-8 h-8" />
          </button>
          <img src={lightboxImageUrl} alt="Full resolution document preview" className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" />
        </div>
      )}

    </div>
  );
};

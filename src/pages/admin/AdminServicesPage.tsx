import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Car, MapPin, Calendar, UserCheck, Crown, ShieldCheck, 
  DollarSign, Clock, Moon, Save, RotateCcw, CheckCircle2, AlertCircle, 
  Calculator, Sparkles, SlidersHorizontal 
} from 'lucide-react';
import { ServiceCategory, ServiceType, AdminPricingConfig } from '../../types';
import { dbService } from '../../services/database';
import { authService } from '../../services/auth';
import { bookingsService } from '../../services/bookings';
import { DEFAULT_ADMIN_PRICING_CONFIG } from '../../services/billing';

export const AdminServicesPage: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'services' | 'billing_policy'>('services');
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [pricingConfig, setPricingConfig] = useState<AdminPricingConfig>(DEFAULT_ADMIN_PRICING_CONFIG);
  const [editingService, setEditingService] = useState<ServiceCategory | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live Fare Calculator Test state in Admin Console
  const [simServiceTitle, setSimServiceTitle] = useState<ServiceType>('City Driver');
  const [simHours, setSimHours] = useState<number>(4);
  const [simIsNight, setSimIsNight] = useState<boolean>(false);

  const loadData = () => {
    const auth = authService.getAuthState();
    if (!auth.isAdminAuthenticated) {
      navigate('/admin/login');
      return;
    }
    setServices(dbService.getServices());
    setPricingConfig(bookingsService.getPricingConfig());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = dbService.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUpdateServiceField = (id: string, field: keyof ServiceCategory, value: any) => {
    setServices(prev =>
      prev.map(s => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleSaveService = (service: ServiceCategory) => {
    dbService.updateServiceCategory(service);
    showToast(`Updated pricing & rates for ${service.title}`);
    if (editingService?.id === service.id) {
      setEditingService(null);
    }
  };

  const handleSaveAll = () => {
    services.forEach(s => dbService.updateServiceCategory(s));
    showToast('All site-wide hourly charges & rates saved successfully!');
  };

  const handleResetDefaults = () => {
    if (window.confirm('Are you sure you want to reset all service pricing to standard factory defaults?')) {
      const reset = dbService.resetServicesToDefaults();
      setServices(reset);
      showToast('Reset all services to default factory rate cards');
    }
  };

  const handleUpdatePricingConfigField = <K extends keyof AdminPricingConfig>(field: K, value: AdminPricingConfig[K]) => {
    setPricingConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSavePricingConfig = () => {
    bookingsService.updatePricingConfig(pricingConfig);
    showToast('Updated global trip timer and hourly billing policy.');
  };

  const handleResetPricingConfig = () => {
    if (window.confirm('Reset trip timer and hourly billing rules to standard defaults?')) {
      const def = bookingsService.updatePricingConfig(DEFAULT_ADMIN_PRICING_CONFIG);
      setPricingConfig(def);
      showToast('Reset trip pricing rules to standard defaults.');
    }
  };

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Car': return <Car className="w-6 h-6 text-brand-600" />;
      case 'MapPin': return <MapPin className="w-6 h-6 text-emerald-600" />;
      case 'Calendar': return <Calendar className="w-6 h-6 text-purple-600" />;
      case 'UserCheck': return <UserCheck className="w-6 h-6 text-blue-600" />;
      case 'Crown': return <Crown className="w-6 h-6 text-amber-500" />;
      case 'ShieldCheck': return <ShieldCheck className="w-6 h-6 text-indigo-600" />;
      default: return <Car className="w-6 h-6 text-brand-600" />;
    }
  };

  // Compute test fare in simulator
  const activeSimService = services.find(s => s.title === simServiceTitle) || services[0];
  const calculateSimFare = () => {
    if (!activeSimService) return 0;
    const basePrice = Number(activeSimService.startingPrice) || 0;
    const minHrs = Number(activeSimService.minimumHours) || 2;
    const extraHrs = Math.max(0, simHours - minHrs);
    const extraRate = Number(activeSimService.extraHourRate) || 0;
    const nightCharge = simIsNight ? (Number(activeSimService.nightAllowance) || 0) : 0;

    return basePrice + (extraHrs * extraRate) + nightCharge;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={() => navigate('/admin/dashboard')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Admin Dashboard
      </button>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded border border-brand-200">
              Admin Rates Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            Site-Wide Hourly Charges & Service Pricing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure hourly rates, rounding rules, 24-hour packages, outstation limits, and live drive categories
          </p>
        </div>

        {activeTab === 'services' ? (
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleResetDefaults}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              Reset Defaults
            </button>

            <button
              onClick={handleSaveAll}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Save All Rates
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleResetPricingConfig}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              Reset Defaults
            </button>

            <button
              onClick={handleSavePricingConfig}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Save Billing Rules
            </button>
          </div>
        )}
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-8 pb-px">
        <button
          onClick={() => setActiveTab('services')}
          className={`px-5 py-3 text-xs font-black border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'services'
              ? 'border-brand-600 text-brand-700 bg-brand-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Car className="w-4 h-4" />
          Service Rate Cards ({services.length})
        </button>

        <button
          onClick={() => setActiveTab('billing_policy')}
          className={`px-5 py-3 text-xs font-black border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'billing_policy'
              ? 'border-brand-600 text-brand-700 bg-brand-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          Trip Timer, Distance & Hourly Billing Rules
        </button>
      </div>

      {/* TAB 1: SERVICE RATE CARDS */}
      {activeTab === 'services' && (
        <>
          {/* LIVE FARE ESTIMATOR SIMULATOR CARD FOR ADMIN */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl mb-8 border border-brand-800/40">
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-brand-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Live Pricing Test Simulator</h3>
              <p className="text-[11px] text-brand-200">Test how custom customer trip durations calculate in real time</p>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">
            Real-time Fare Sync
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          
          <div>
            <label className="text-[10px] font-bold text-slate-300 uppercase block mb-1">Drive Category</label>
            <select
              value={simServiceTitle}
              onChange={(e) => setSimServiceTitle(e.target.value as ServiceType)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-brand-400"
            >
              {services.map(s => (
                <option key={s.id} value={s.title}>{s.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-300 uppercase block mb-1">Duration (Hours)</label>
            <input
              type="number"
              min="1"
              max="24"
              value={simHours}
              onChange={(e) => setSimHours(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-brand-400"
            />
          </div>

          <div className="flex items-center gap-2 pt-4">
            <input
              type="checkbox"
              id="simNight"
              checked={simIsNight}
              onChange={(e) => setSimIsNight(e.target.checked)}
              className="w-4 h-4 rounded accent-brand-500 cursor-pointer"
            />
            <label htmlFor="simNight" className="text-xs font-bold text-slate-200 cursor-pointer flex items-center gap-1">
              <Moon className="w-3.5 h-3.5 text-purple-400" />
              Night Trip (10 PM - 6 AM)
            </label>
          </div>

          <div className="bg-white/10 rounded-2xl p-3 border border-white/10 text-right">
            <span className="text-[10px] text-brand-200 font-bold uppercase block">Simulated Fare</span>
            <span className="text-2xl font-black text-amber-400">
              ₹{calculateSimFare()}
            </span>
            <span className="text-[9px] text-slate-300 block">
              Base ₹{activeSimService?.startingPrice} ({activeSimService?.minimumHours}h min) + Extra Rate ₹{activeSimService?.extraHourRate}/h
            </span>
          </div>

        </div>
      </div>

      {/* SERVICE PRICING CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(srv => {
          const isEditing = editingService?.id === srv.id;

          return (
            <div
              key={srv.id}
              className={`bg-white rounded-3xl p-6 border shadow-soft transition-all duration-200 flex flex-col justify-between ${
                srv.isActive ? 'border-slate-200' : 'border-red-200 bg-red-50/20'
              }`}
            >
              <div>
                
                {/* Header Row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                      {getServiceIcon(srv.icon)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-lg">{srv.title}</h3>
                      <span className="text-[11px] text-slate-400 font-bold block">
                        Min. {srv.minimumHours || 2} Hours Package
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={srv.isActive}
                        onChange={(e) => {
                          handleUpdateServiceField(srv.id, 'isActive', e.target.checked);
                          dbService.updateServiceCategory({ ...srv, isActive: e.target.checked });
                          showToast(`${srv.title} ${e.target.checked ? 'Enabled' : 'Disabled'}`);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                    <span className={`text-[9px] font-black uppercase tracking-wider ${srv.isActive ? 'text-emerald-700' : 'text-red-600'}`}>
                      {srv.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {/* Badge Input */}
                <div className="mb-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={srv.badge || ''}
                    placeholder="e.g. Popular, Premium, Top Rated"
                    onChange={(e) => handleUpdateServiceField(srv.id, 'badge', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-500"
                  />
                </div>

                {/* Hourly & Base Pricing Fields */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 mb-4">
                  
                  {/* Starting Base Rate */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block">Base Package Rate</span>
                      <span className="text-[10px] text-slate-500">Starting fare for first {srv.minimumHours} hrs</span>
                    </div>
                    <div className="relative w-28">
                      <span className="absolute left-2.5 top-1.5 text-xs font-black text-slate-400">₹</span>
                      <input
                        type="number"
                        value={srv.startingPrice}
                        onChange={(e) => handleUpdateServiceField(srv.id, 'startingPrice', Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-6 pr-2 py-1.5 text-xs font-black text-slate-900 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  {/* Extra Hourly Charge */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block">Extra Hourly Charge</span>
                      <span className="text-[10px] text-slate-500">Hourly rate beyond min package</span>
                    </div>
                    <div className="relative w-28">
                      <span className="absolute left-2.5 top-1.5 text-xs font-black text-slate-400">₹</span>
                      <input
                        type="number"
                        value={srv.extraHourRate}
                        onChange={(e) => handleUpdateServiceField(srv.id, 'extraHourRate', Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-6 pr-2 py-1.5 text-xs font-black text-slate-900 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  {/* Night Allowance Charge */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                        <Moon className="w-3 h-3 text-purple-600" />
                        Night Allowance
                      </span>
                      <span className="text-[10px] text-slate-500">Charge for 10 PM - 6 AM rides</span>
                    </div>
                    <div className="relative w-28">
                      <span className="absolute left-2.5 top-1.5 text-xs font-black text-slate-400">₹</span>
                      <input
                        type="number"
                        value={srv.nightAllowance}
                        onChange={(e) => handleUpdateServiceField(srv.id, 'nightAllowance', Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-6 pr-2 py-1.5 text-xs font-black text-slate-900 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  {/* Minimum Package Hours */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block">Minimum Package Hours</span>
                      <span className="text-[10px] text-slate-500">Base included hours</span>
                    </div>
                    <div className="relative w-28">
                      <input
                        type="number"
                        value={srv.minimumHours}
                        onChange={(e) => handleUpdateServiceField(srv.id, 'minimumHours', Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-900 focus:outline-none focus:border-brand-500 text-right"
                      />
                    </div>
                  </div>

                  {/* Optional Outstation per km charge */}
                  {srv.title === 'Outstation Driver' && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 block">Outstation Per Km Rate</span>
                        <span className="text-[10px] text-slate-500">Distance rate for highway trips</span>
                      </div>
                      <div className="relative w-28">
                        <span className="absolute left-2.5 top-1.5 text-xs font-black text-slate-400">₹</span>
                        <input
                          type="number"
                          value={srv.outstationPerKmRate || 12}
                          onChange={(e) => handleUpdateServiceField(srv.id, 'outstationPerKmRate', Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-xl pl-6 pr-2 py-1.5 text-xs font-black text-slate-900 focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>
                  )}

                </div>

                {/* Short & Full Descriptions */}
                <div className="space-y-2 mb-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Short Summary</label>
                    <input
                      type="text"
                      value={srv.shortDescription}
                      onChange={(e) => handleUpdateServiceField(srv.id, 'shortDescription', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Full Customer Description</label>
                    <textarea
                      rows={2}
                      value={srv.fullDescription}
                      onChange={(e) => handleUpdateServiceField(srv.id, 'fullDescription', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 font-bold block">Current Display</span>
                  <span className="text-sm font-black text-slate-900">
                    ₹{srv.startingPrice} <span className="text-[10px] font-normal text-slate-500">/ base</span>
                  </span>
                </div>

                <button
                  onClick={() => handleSaveService(srv)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save {srv.title.split(' ')[0]} Rates
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </>
  )}

  {/* TAB 2: TRIP TIMER, DISTANCE & HOURLY BILLING RULES */}
  {activeTab === 'billing_policy' && (
    <div className="space-y-8 animate-in fade-in">
      
      {/* SNAPSHOT POLICY ASSURANCE BANNER */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-blue-700/40">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base">Policy Snapshot Guarantee</h3>
            <p className="text-xs text-blue-200 mt-1 leading-relaxed">
              When a customer confirms a booking, an authoritative snapshot of these billing parameters is permanently frozen with the trip record. Modifying rates below will strictly apply to new trips, protecting active or historical trips from arbitrary price shifts.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SECTION 1: HOURLY DRIVER RENTAL & ROUNDING RULES */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Hourly Driver Rental & Rounding</h3>
              <p className="text-xs text-slate-500">Hourly billing rules and partial-hour calculation policy</p>
            </div>
          </div>

          {/* Hourly Rental Rate */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-extrabold text-slate-900 block">Hourly Driver Rental Rate</label>
              <span className="text-[11px] text-slate-500">Standard rate per billable hour</span>
            </div>
            <div className="relative w-36">
              <span className="absolute left-3 top-2 text-xs font-black text-slate-400">₹</span>
              <input
                type="number"
                min="50"
                value={pricingConfig.hourlyRate}
                onChange={(e) => handleUpdatePricingConfigField('hourlyRate', Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Minimum Billable Hours */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-extrabold text-slate-900 block">Minimum Billable Hours</label>
              <span className="text-[11px] text-slate-500">Minimum hours charged for any active ride</span>
            </div>
            <div className="w-36">
              <input
                type="number"
                min="1"
                max="24"
                value={pricingConfig.minimumHours}
                onChange={(e) => handleUpdatePricingConfigField('minimumHours', Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Minimum Booking Duration */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-extrabold text-slate-900 block">Minimum Booking Duration</label>
              <span className="text-[11px] text-slate-500">Minimum driver commitment required</span>
            </div>
            <div className="w-36">
              <input
                type="number"
                min="1"
                max="24"
                value={pricingConfig.minimumBookingDurationHours}
                onChange={(e) => handleUpdatePricingConfigField('minimumBookingDurationHours', Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Partial-Hour Rounding Rule */}
          <div>
            <label className="text-xs font-extrabold text-slate-900 block mb-1">Partial-Hour Rounding Rule</label>
            <span className="text-[11px] text-slate-500 block mb-2">Controls how extra elapsed minutes are rounded into billable hours</span>
            <select
              value={pricingConfig.partialHourRule}
              onChange={(e) => handleUpdatePricingConfigField('partialHourRule', e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-brand-500"
            >
              <option value="ceil_hour">Every started hour counts as a full hour (e.g. 12h 30m = 13 hrs)</option>
              <option value="15_min_block">15-minute billing block (e.g. 12h 10m = 12.25 hrs, 12h 30m = 12.5 hrs)</option>
              <option value="exact_fraction">Exact fractional minutes (e.g. 12h 30m = 12.5 hrs)</option>
            </select>
          </div>

          {/* Rounding Rule Explanation Box */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600">
            <span className="font-bold text-slate-800 block mb-1">Example Calculation:</span>
            {pricingConfig.partialHourRule === 'ceil_hour' && (
              <p>A trip lasting 12 hours and 30 minutes will be billed as 13 full hours at ₹{pricingConfig.hourlyRate}/hr = ₹{(13 * pricingConfig.hourlyRate).toLocaleString('en-IN')}.</p>
            )}
            {pricingConfig.partialHourRule === '15_min_block' && (
              <p>A trip lasting 12 hours and 10 minutes will round up to 12.25 hours at ₹{pricingConfig.hourlyRate}/hr = ₹{(12.25 * pricingConfig.hourlyRate).toLocaleString('en-IN')}.</p>
            )}
            {pricingConfig.partialHourRule === 'exact_fraction' && (
              <p>A trip lasting 12 hours and 30 minutes will be billed as exactly 12.5 hours at ₹{pricingConfig.hourlyRate}/hr = ₹{(12.5 * pricingConfig.hourlyRate).toLocaleString('en-IN')}.</p>
            )}
          </div>
        </div>

        {/* SECTION 2: 24-HOUR DAILY & MULTI-DAY PACKAGES */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">24-Hour Daily & Multi-Day Packages</h3>
              <p className="text-xs text-slate-500">Full day rates and multi-day discounts</p>
            </div>
          </div>

          {/* Daily 24h Package Rate */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-extrabold text-slate-900 block">24-Hour Day Rental Package Rate</label>
              <span className="text-[11px] text-slate-500">Flat rate for full 24-hour job duration</span>
            </div>
            <div className="relative w-36">
              <span className="absolute left-3 top-2 text-xs font-black text-slate-400">₹</span>
              <input
                type="number"
                min="500"
                value={pricingConfig.dailyRate24h}
                onChange={(e) => handleUpdatePricingConfigField('dailyRate24h', Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Multi-Day Discount */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-extrabold text-slate-900 block">Multi-Day Booking Discount</label>
              <span className="text-[11px] text-slate-500">Percentage off daily rate for trips &gt; 1 day</span>
            </div>
            <div className="relative w-36">
              <input
                type="number"
                min="0"
                max="50"
                value={pricingConfig.multiDayDiscountPercent}
                onChange={(e) => handleUpdatePricingConfigField('multiDayDiscountPercent', Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-7 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-brand-500"
              />
              <span className="absolute right-3 top-2 text-xs font-black text-slate-400">%</span>
            </div>
          </div>

          <div className="p-3.5 bg-purple-50/50 rounded-2xl border border-purple-100 text-xs text-purple-900">
            <span className="font-bold block mb-1">Multi-Day Package Example:</span>
            <p>
              A 3-day booking charges ₹{pricingConfig.dailyRate24h}/day with a {pricingConfig.multiDayDiscountPercent}% multi-day discount = ₹{Math.round(3 * pricingConfig.dailyRate24h * (1 - pricingConfig.multiDayDiscountPercent / 100)).toLocaleString('en-IN')}.
            </p>
          </div>
        </div>

        {/* SECTION 3: OUTSTATION PRICING RULES & KILOMETERS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Outstation Pricing Rules & Distance</h3>
              <p className="text-xs text-slate-500">Daily outstation rates and included road kilometers</p>
            </div>
          </div>

          {/* Outstation Rate Per Day */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-extrabold text-slate-900 block">Outstation Daily Rate</label>
              <span className="text-[11px] text-slate-500">Base day rate for intercity and outstation trips</span>
            </div>
            <div className="relative w-36">
              <span className="absolute left-3 top-2 text-xs font-black text-slate-400">₹</span>
              <input
                type="number"
                min="500"
                value={pricingConfig.outstationRatePerDay}
                onChange={(e) => handleUpdatePricingConfigField('outstationRatePerDay', Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Included Km Per Day */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-extrabold text-slate-900 block">Included Km Per Day</label>
              <span className="text-[11px] text-slate-500">Complimentary road distance per outstation day</span>
            </div>
            <div className="relative w-36">
              <input
                type="number"
                min="50"
                value={pricingConfig.outstationIncludedKmPerDay}
                onChange={(e) => handleUpdatePricingConfigField('outstationIncludedKmPerDay', Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-brand-500"
              />
              <span className="absolute right-3 top-2 text-xs font-black text-slate-400">km</span>
            </div>
          </div>

          {/* Additional Km Rate */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-extrabold text-slate-900 block">Additional Kilometer Rate</label>
              <span className="text-[11px] text-slate-500">Per km charge beyond included quota</span>
            </div>
            <div className="relative w-36">
              <span className="absolute left-3 top-2 text-xs font-black text-slate-400">₹</span>
              <input
                type="number"
                min="1"
                value={pricingConfig.outstationExtraKmRate}
                onChange={(e) => handleUpdatePricingConfigField('outstationExtraKmRate', Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-10 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-brand-500"
              />
              <span className="absolute right-3 top-2 text-xs font-black text-slate-400">/km</span>
            </div>
          </div>
        </div>

        {/* SECTION 4: OPERATIONAL SETTINGS & ALLOWANCES */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Allowances & Operations</h3>
              <p className="text-xs text-slate-500">Night travel, waiting fees, and reminder thresholds</p>
            </div>
          </div>

          {/* Night Allowance */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-extrabold text-slate-900 block">Night Allowance</label>
              <span className="text-[11px] text-slate-500">Applied for service between 10:00 PM and 06:00 AM</span>
            </div>
            <div className="relative w-36">
              <span className="absolute left-3 top-2 text-xs font-black text-slate-400">₹</span>
              <input
                type="number"
                min="0"
                value={pricingConfig.nightAllowance}
                onChange={(e) => handleUpdatePricingConfigField('nightAllowance', Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Waiting Charge */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-extrabold text-slate-900 block">Waiting Charge Per Hour</label>
              <span className="text-[11px] text-slate-500">Overtime or standstill waiting compensation</span>
            </div>
            <div className="relative w-36">
              <span className="absolute left-3 top-2 text-xs font-black text-slate-400">₹</span>
              <input
                type="number"
                min="0"
                value={pricingConfig.waitingChargePerHour}
                onChange={(e) => handleUpdatePricingConfigField('waitingChargePerHour', Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Active Trip Reminder Interval */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-extrabold text-slate-900 block">Active Trip Reminder Interval</label>
              <span className="text-[11px] text-slate-500">Minutes between customer completion reminders</span>
            </div>
            <div className="relative w-36">
              <input
                type="number"
                min="10"
                max="360"
                value={pricingConfig.reminderIntervalMinutes}
                onChange={(e) => handleUpdatePricingConfigField('reminderIntervalMinutes', Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-brand-500"
              />
              <span className="absolute right-3 top-2 text-xs font-black text-slate-400">min</span>
            </div>
          </div>

          {/* Location Freshness Limit */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-extrabold text-slate-900 block">Location Freshness Limit</label>
              <span className="text-[11px] text-slate-500">Max minutes before driver GPS is marked stale</span>
            </div>
            <div className="relative w-36">
              <input
                type="number"
                min="5"
                max="180"
                value={pricingConfig.locationFreshnessMinutes}
                onChange={(e) => handleUpdatePricingConfigField('locationFreshnessMinutes', Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-brand-500"
              />
              <span className="absolute right-3 top-2 text-xs font-black text-slate-400">min</span>
            </div>
          </div>
        </div>

      </div>

      {/* Action Row */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          onClick={handleResetPricingConfig}
          className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-2 border border-slate-200"
        >
          <RotateCcw className="w-4 h-4 text-slate-500" />
          Reset Defaults
        </button>

        <button
          onClick={handleSavePricingConfig}
          className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Trip Timer & Billing Rules
        </button>
      </div>

    </div>
  )}

</div>
);
};

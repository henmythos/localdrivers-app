import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Phone, Search, Filter, ShieldCheck, MapPin, Navigation, 
  Calendar, CheckCircle2, XCircle, RefreshCw, Eye, Download, FileText, 
  Edit, AlertTriangle, Clock, Compass, AlertOctagon, RotateCcw, X, 
  Check, ChevronDown, Award, Car, Save
} from 'lucide-react';
import { Booking, BookingStatus, ServiceType, TripAuditRecord } from '../../types';
import { bookingsService } from '../../services/bookings';
import { dbService } from '../../services/database';
import { authService } from '../../services/auth';
import { RouteMap } from '../../components/map/RouteMap';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

export const AdminBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [mobileSearch, setMobileSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [serviceFilter, setServiceFilter] = useState<string>('All');
  const [durationFilter, setDurationFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Modals state
  const [inspectingBooking, setInspectingBooking] = useState<Booking | null>(null);
  const [correctingBooking, setCorrectingBooking] = useState<Booking | null>(null);

  useBodyScrollLock(
    !!inspectingBooking || !!correctingBooking,
    () => {
      if (correctingBooking) setCorrectingBooking(null);
      else if (inspectingBooking) setInspectingBooking(null);
    }
  );

  // Manual correction form state
  const [correctionFare, setCorrectionFare] = useState<number>(0);
  const [correctionBillableHours, setCorrectionBillableHours] = useState<number>(0);
  const [correctionKm, setCorrectionKm] = useState<number>(0);
  const [correctionStatus, setCorrectionStatus] = useState<BookingStatus>('Completed');
  const [correctionReason, setCorrectionReason] = useState<string>('');
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  const load = () => {
    setBookings(bookingsService.getAllBookings());
  };

  useEffect(() => {
    load();
    const unsubscribe = dbService.subscribe(() => load());
    return () => unsubscribe();
  }, []);

  const handleReassign = (bookingId: string) => {
    const updated = bookingsService.passToNextDriver(bookingId);
    if (updated) {
      setActionMsg(`Booking ${bookingId} re-assigned to ${updated.driverName} (#${updated.driverCode}).`);
      setTimeout(() => setActionMsg(null), 4000);
      load();
    }
  };

  const handleUpdateStatus = (bookingId: string, status: BookingStatus) => {
    const updated = bookingsService.updateStatus(bookingId, status);
    if (updated) {
      setActionMsg(`Booking ${bookingId} marked as ${status}.`);
      setTimeout(() => setActionMsg(null), 4000);
      load();
    }
  };

  // Open correction modal
  const handleOpenCorrection = (b: Booking) => {
    setCorrectingBooking(b);
    setCorrectionFare(b.finalFare || b.estimatedFare || 0);
    setCorrectionBillableHours(b.billableHours || b.durationHours || 2);
    setCorrectionKm(b.actualTraveledKm || b.estimatedDistanceKm || 0);
    setCorrectionStatus(b.status);
    setCorrectionReason('');
    setCorrectionError(null);
  };

  // Submit administrative correction
  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctingBooking) return;

    if (!correctionReason.trim()) {
      setCorrectionError('A mandatory administrative reason is required to log this change.');
      return;
    }

    const adminEmail = authService.getAuthState().adminEmail || 'admin@localdrivers.in';
    const changes: Partial<Booking> = {
      finalFare: Number(correctionFare),
      billableHours: Number(correctionBillableHours),
      actualTraveledKm: Number(correctionKm),
      status: correctionStatus,
      distanceSource: 'odometer',
      distanceVerified: true,
      disputeFlag: correctionStatus === 'Disputed',
    };

    const updated = bookingsService.adminCorrectTrip(
      correctingBooking.id,
      changes,
      adminEmail,
      correctionReason.trim()
    );

    if (updated) {
      setActionMsg(`Administrative correction saved for booking ${correctingBooking.id}.`);
      setTimeout(() => setActionMsg(null), 4000);
      setCorrectingBooking(null);
      if (inspectingBooking && inspectingBooking.id === correctingBooking.id) {
        setInspectingBooking(updated);
      }
      load();
    }
  };

  // Helper to compute duration in hours for filtering
  const getBookingDurationHours = (b: Booking): number => {
    if (b.tripStartedAt && b.tripCompletedAt) {
      return (new Date(b.tripCompletedAt).getTime() - new Date(b.tripStartedAt).getTime()) / 3600000;
    }
    if (b.tripStartedAt) {
      return (Date.now() - new Date(b.tripStartedAt).getTime()) / 3600000;
    }
    return b.durationHours || 2;
  };

  // Filter bookings
  const filteredBookings = bookings.filter(b => {
    // Status filter
    if (statusFilter !== 'All') {
      if (statusFilter === 'Disputed') {
        if (b.status !== 'Disputed' && !b.disputeFlag) return false;
      } else if (b.status !== statusFilter) {
        return false;
      }
    }

    // Service filter
    if (serviceFilter !== 'All' && b.serviceTitle !== serviceFilter) {
      return false;
    }

    // Date filter
    if (dateFilter) {
      const bDate = b.date || (b.createdAt ? b.createdAt.split('T')[0] : '');
      if (bDate !== dateFilter) return false;
    }

    // Duration filter
    if (durationFilter !== 'All') {
      const hrs = getBookingDurationHours(b);
      if (durationFilter === '< 4h' && hrs >= 4) return false;
      if (durationFilter === '4-12h' && (hrs < 4 || hrs >= 12)) return false;
      if (durationFilter === '12-24h' && (hrs < 12 || hrs >= 24)) return false;
      if (durationFilter === '24h+' && hrs < 24) return false;
    }

    // Search query filter
    if (!mobileSearch.trim()) return true;
    const query = mobileSearch.trim().toLowerCase().replace(/\s+/g, '');
    const custPhone = (b.customerPhone || '').replace(/\s+/g, '').toLowerCase();
    const drvPhone = (b.driverPhone || '').replace(/\s+/g, '').toLowerCase();
    const custName = (b.customerName || '').toLowerCase();
    const drvName = (b.driverName || '').toLowerCase();
    const drvCode = (b.driverCode || '').toLowerCase();
    const bookingId = (b.id || '').toLowerCase();
    const pickup = (b.pickupLocation || '').toLowerCase();
    const dest = (b.destinationLocation || '').toLowerCase();

    return (
      custPhone.includes(query) ||
      drvPhone.includes(query) ||
      custName.includes(query) ||
      drvName.includes(query) ||
      drvCode.includes(query) ||
      bookingId.includes(query) ||
      pickup.includes(query) ||
      dest.includes(query)
    );
  });

  // Export CSV Report
  const handleExportCsv = () => {
    if (filteredBookings.length === 0) {
      alert('No booking records to export with the current filter selection.');
      return;
    }

    const headers = [
      'Booking ID',
      'Trip Status',
      'Dispute Flag',
      'Dispute Reason',
      'Customer Name',
      'Customer Phone',
      'Driver Name',
      'Driver Code',
      'Driver Phone',
      'Service Title',
      'Pickup Location',
      'Destination Location',
      'Is Return Trip',
      'Intermediate Stops Count',
      'Estimated Outbound Road Km',
      'Estimated Return Road Km',
      'Total Estimated Road Km',
      'Customer Expected Waiting Hours',
      'Expected Total Service Duration Hours',
      'Return Journey Schedule',
      'Billing Method',
      'Estimated Driving Minutes',
      'Estimated Time Based Charge (INR)',
      'Estimated Distance Based Charge (INR)',
      'Estimated Total Fare (INR)',
      'Actual Traveled Km',
      'Distance Source',
      'Distance Verified',
      'Trip Started At (UTC)',
      'Trip Completed At (UTC)',
      'Actual Billable Hours',
      'Hourly Rate Snapshot (INR)',
      'Final Time Based Charge (INR)',
      'Final Distance Based Charge (INR)',
      'Night Charges (INR)',
      'Final Fare (INR)',
      'Customer Completed',
      'Driver Completed',
      'Audit Records Count',
      'Created At (UTC)',
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = filteredBookings.map(b => [
      escapeCsv(b.id),
      escapeCsv(b.status),
      escapeCsv(b.disputeFlag ? 'Yes' : 'No'),
      escapeCsv(b.disputeReason || ''),
      escapeCsv(b.customerName),
      escapeCsv(b.customerPhone),
      escapeCsv(b.driverName),
      escapeCsv(b.driverCode || ''),
      escapeCsv(b.driverPhone),
      escapeCsv(b.serviceTitle),
      escapeCsv(b.pickupLocation),
      escapeCsv(b.destinationLocation),
      escapeCsv(b.isReturnTrip ? 'Yes' : 'No'),
      escapeCsv(b.stops?.length || 0),
      escapeCsv(b.estimatedOutboundDistanceKm || b.estimatedDistanceKm || 0),
      escapeCsv(b.estimatedReturnDistanceKm || 0),
      escapeCsv(b.estimatedDistanceKm || 0),
      escapeCsv(b.expectedWaitingHours ?? 0),
      escapeCsv(b.expectedTotalDurationHours || b.durationHours || 2),
      escapeCsv(b.returnJourneyOption || (b.isReturnTrip ? 'Round Trip' : 'One Way')),
      escapeCsv(b.billingMethod || 'hourly'),
      escapeCsv(b.expectedDrivingMinutes || b.estimatedDurationMinutes || 0),
      escapeCsv(b.estimatedTimeBasedCharge !== undefined ? b.estimatedTimeBasedCharge : (b.estimatedFare || 0)),
      escapeCsv(b.estimatedDistanceBasedCharge || 0),
      escapeCsv(b.estimatedFare || 0),
      escapeCsv(b.actualTraveledKm !== undefined ? b.actualTraveledKm : ''),
      escapeCsv(b.distanceSource || 'estimated_only'),
      escapeCsv(b.distanceVerified ? 'Yes' : 'No'),
      escapeCsv(b.tripStartedAt || ''),
      escapeCsv(b.tripCompletedAt || ''),
      escapeCsv(b.billableHours !== undefined ? b.billableHours : (b.durationHours || 2)),
      escapeCsv(b.pricingSnapshot?.hourlyRate || 200),
      escapeCsv(b.timeBasedCharge !== undefined ? b.timeBasedCharge : ''),
      escapeCsv(b.distanceBasedCharge !== undefined ? b.distanceBasedCharge : ''),
      escapeCsv(b.nightCharges !== undefined ? b.nightCharges : ''),
      escapeCsv(b.finalFare || b.estimatedFare || 0),
      escapeCsv(b.customerCompleted ? 'Yes' : 'No'),
      escapeCsv(b.driverCompleted ? 'Yes' : 'No'),
      escapeCsv(b.auditHistory?.length || 0),
      escapeCsv(b.createdAt || ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `localdrivers_trips_report_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setStatusFilter('All');
    setServiceFilter('All');
    setDurationFilter('All');
    setDateFilter('');
    setMobileSearch('');
  };

  // Status counts for quick stats
  const countInProgress = bookings.filter(b => b.status === 'In Progress').length;
  const countCompleted = bookings.filter(b => b.status === 'Completed').length;
  const countDisputed = bookings.filter(b => b.status === 'Disputed' || b.disputeFlag).length;
  const countOdometerVerified = bookings.filter(b => b.distanceVerified && b.distanceSource === 'odometer').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
      
      {/* Back button */}
      <button
        onClick={() => navigate('/admin/dashboard')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Admin Dashboard
      </button>

      {/* Header with Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded border border-brand-200">
              Trip Management & Audit
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            Trip Monitoring, Timers & Billing Records
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit road distances, server-authoritative timestamps, pricing snapshots, and dispute logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Export CSV Report ({filteredBookings.length})
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="mb-6 p-4 bg-slate-900 text-white text-xs font-bold rounded-2xl shadow-lg flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionMsg}</span>
          </div>
          <button onClick={() => setActionMsg(null)} className="text-slate-400 hover:text-white font-bold text-xs">Close</button>
        </div>
      )}

      {/* METRIC PILLS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Bookings</span>
          <div className="text-xl font-black text-slate-900 mt-1">{bookings.length}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-amber-800 font-extrabold uppercase tracking-wider block">In Progress</span>
            {countInProgress > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
          </div>
          <div className="text-xl font-black text-amber-700 mt-1">{countInProgress}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-soft">
          <span className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider block">Completed</span>
          <div className="text-xl font-black text-emerald-700 mt-1">{countCompleted}</div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-soft ${
          countDisputed > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${
              countDisputed > 0 ? 'text-red-700' : 'text-slate-400'
            }`}>
              Disputed Trips
            </span>
            {countDisputed > 0 && <AlertTriangle className="w-3.5 h-3.5 text-red-600" />}
          </div>
          <div className={`text-xl font-black mt-1 ${
            countDisputed > 0 ? 'text-red-600' : 'text-slate-900'
          }`}>
            {countDisputed}
          </div>
        </div>
      </div>

      {/* FILTERS PANEL */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft mb-6 space-y-4">
        
        {/* Search input */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={mobileSearch}
              onChange={e => setMobileSearch(e.target.value)}
              placeholder="Search by Mobile, Booking ID (#LD-2026-0001), Driver Code (#A1B2C3), Name or Location..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          {/* Reset Filters button */}
          {(mobileSearch || statusFilter !== 'All' || serviceFilter !== 'All' || durationFilter !== 'All' || dateFilter) && (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors shrink-0 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              Reset Filters
            </button>
          )}
        </div>

        {/* Secondary filters row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100">
          
          {/* Service Filter */}
          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Service Category</label>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-500"
            >
              <option value="All">All Services</option>
              <option value="City Driver">City Driver</option>
              <option value="Outstation Round Trip">Outstation Round Trip</option>
              <option value="One-Way Drop">One-Way Drop</option>
              <option value="Monthly Chauffeur">Monthly Chauffeur</option>
              <option value="Valet & Event Driver">Valet & Event Driver</option>
              <option value="Luxury Car Chauffeur">Luxury Car Chauffeur</option>
            </select>
          </div>

          {/* Duration Filter */}
          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Trip Duration</label>
            <select
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-500"
            >
              <option value="All">All Durations</option>
              <option value="< 4h">Short Trip (&lt; 4 Hours)</option>
              <option value="4-12h">Half-Day (4 – 12 Hours)</option>
              <option value="12-24h">Full-Day (12 – 24 Hours)</option>
              <option value="24h+">Multi-Day / Overnight (24+ Hours)</option>
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Booking Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-500"
            />
          </div>

        </div>

        {/* STATUS FILTER PILLS */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100">
          {['All', 'Pending', 'Accepted', 'In Progress', 'Completed', 'Disputed', 'Cancelled'].map(status => {
            const count = status === 'All' 
              ? bookings.length 
              : status === 'Disputed'
              ? countDisputed
              : bookings.filter(b => b.status === status).length;

            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 ${
                  statusFilter === status
                    ? status === 'Disputed'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-slate-900 text-white'
                    : status === 'Disputed' && count > 0
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{status}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === status ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* BOOKINGS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Booking ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Assigned Driver</th>
                <th className="p-4">Service & Route</th>
                <th className="p-4">Road Distance</th>
                <th className="p-4">Timestamps & Duration</th>
                <th className="p-4">Status</th>
                <th className="p-4">Fare</th>
                <th className="p-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.length > 0 ? (
                filteredBookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Booking ID & return badge */}
                    <td className="p-4 align-top">
                      <span className="font-mono font-black text-brand-700 block">{b.id}</span>
                      {b.isReturnTrip && (
                        <span className="mt-1 inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded">
                          Return Trip
                        </span>
                      )}
                      {b.auditHistory && b.auditHistory.length > 0 && (
                        <span className="mt-1 block text-[9px] font-bold text-amber-700">
                          {b.auditHistory.length} audit record(s)
                        </span>
                      )}
                    </td>
                    
                    {/* Customer */}
                    <td className="p-4 align-top">
                      <span className="font-bold text-slate-900 block">{b.customerName}</span>
                      <a
                        href={`tel:${b.customerPhone}`}
                        className="text-xs font-extrabold text-purple-700 hover:underline inline-flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3 text-purple-600" />
                        {b.customerPhone}
                      </a>
                    </td>

                    {/* Driver */}
                    <td className="p-4 align-top">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{b.driverName}</span>
                        <span className="text-[10px] font-mono font-bold bg-brand-50 text-brand-800 px-1 rounded">
                          #{b.driverCode || 'A1B2C3'}
                        </span>
                      </div>
                      <a
                        href={`tel:${b.driverPhone}`}
                        className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3 text-emerald-600" />
                        {b.driverPhone}
                      </a>
                    </td>

                    {/* Service & Route */}
                    <td className="p-4 align-top max-w-xs">
                      <span className="font-extrabold text-slate-900 block">{b.serviceTitle}</span>
                      <div className="text-[11px] text-slate-600 truncate mt-0.5">
                        <span className="font-semibold text-slate-800">From:</span> {b.pickupLocation}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        <span className="font-semibold text-slate-800">To:</span> {b.destinationLocation}
                      </div>
                      {b.stops && b.stops.length > 0 && (
                        <span className="text-[10px] font-bold text-indigo-600 block mt-0.5">
                          + {b.stops.length} intermediate stop(s)
                        </span>
                      )}
                    </td>

                    {/* Distance (Estimated vs Actual) */}
                    <td className="p-4 align-top">
                      <div className="font-black text-slate-900">
                        {b.estimatedDistanceKm ? `${b.estimatedDistanceKm.toFixed(1)} km` : 'N/A'}
                        <span className="text-[10px] font-normal text-slate-400 block">road estimate</span>
                      </div>
                      
                      {b.actualTraveledKm !== undefined ? (
                        <div className="mt-1">
                          <span className="text-xs font-bold text-emerald-700">
                            {b.actualTraveledKm.toFixed(1)} km actual
                          </span>
                          <span className="text-[9px] uppercase px-1 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded ml-1 font-bold">
                            {b.distanceSource || 'odometer'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                          Source: estimated
                        </span>
                      )}
                    </td>

                    {/* Timing & Duration */}
                    <td className="p-4 align-top text-slate-600">
                      <div className="font-medium text-slate-900">{b.date} at {b.time}</div>
                      <div className="text-[10px] text-slate-700 font-bold mt-0.5">
                        Planned: {b.expectedTotalDurationHours || b.durationHours || 2}h (Wait: {b.expectedWaitingHours ?? 0}h)
                      </div>
                      {b.tripStartedAt && (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Start: {new Date(b.tripStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      {b.tripCompletedAt && (
                        <div className="text-[10px] text-slate-500">
                          End: {new Date(b.tripCompletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      {b.billableHours !== undefined && (
                        <div className="text-[10px] font-bold text-brand-700 mt-0.5">
                          Billable: {b.billableHours.toFixed(1)} hrs
                        </div>
                      )}
                    </td>
                    
                    {/* Status */}
                    <td className="p-4 align-top">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 ${
                        b.status === 'In Progress'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : b.status === 'Accepted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'Pending'
                          ? 'bg-purple-100 text-purple-800'
                          : b.status === 'Completed'
                          ? 'bg-blue-100 text-blue-800'
                          : b.status === 'Disputed' || b.disputeFlag
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {b.status === 'In Progress' && <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />}
                        {b.disputeFlag && <AlertTriangle className="w-3 h-3 text-red-600" />}
                        {b.status}
                      </span>
                    </td>

                    {/* Fare */}
                    <td className="p-4 align-top font-black text-slate-900">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">
                          {b.finalFare ? 'Final Fare' : 'Estimated Fare'}
                        </span>
                        <span className="text-sm font-black text-slate-900">₹{b.finalFare || b.estimatedFare}</span>
                      </div>
                      {b.finalFare && b.finalFare !== b.estimatedFare && (
                        <span className="text-[10px] font-medium text-slate-400 block">
                          Est: ₹{b.estimatedFare}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 align-top text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Inspect & Audit Modal trigger */}
                        <button
                          onClick={() => setInspectingBooking(b)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
                          title="Audit Trip Metadata & Pricing Snapshot"
                        >
                          <FileText className="w-3 h-3 text-slate-600" />
                          Audit
                        </button>

                        {/* Admin Manual Correction */}
                        <button
                          onClick={() => handleOpenCorrection(b)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
                          title="Administrative Manual Correction with Mandatory Reason"
                        >
                          <Edit className="w-3 h-3 text-amber-700" />
                          Correct
                        </button>

                        {/* Pass Next Driver if Pending */}
                        {b.status === 'Pending' && (
                          <button
                            onClick={() => handleReassign(b.id)}
                            className="p-1 text-slate-400 hover:text-amber-700 rounded-lg transition-colors"
                            title="Re-assign to Next Available Online Driver"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Protected Customer View */}
                        <Link
                          to={`/bookings/${b.id}`}
                          className="p-1 text-slate-400 hover:text-slate-800 rounded-lg transition-colors"
                          title="View Live Protected Ride Portal"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-500 font-medium">
                    No bookings found matching filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. INSPECT TRIP & AUDIT MODAL */}
      {inspectingBooking && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectingBooking(null);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start md:items-center justify-center p-3 sm:p-4 overflow-y-auto modal-overlay-container overscroll-contain animate-in fade-in"
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto overscroll-contain shadow-2xl border border-slate-200 relative my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    Trip Audit & Telemetry Record
                  </h3>
                  <span className="text-xs font-mono font-bold text-brand-700">{inspectingBooking.id}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenCorrection(inspectingBooking)}
                  className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5 text-amber-700" />
                  Manual Correction
                </button>
                <button
                  onClick={() => setInspectingBooking(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              
              {/* DISPUTE BANNER IF ACTIVE */}
              {(inspectingBooking.status === 'Disputed' || inspectingBooking.disputeFlag) && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-red-900 text-sm">Dispute Reported on Trip</h4>
                    <p className="text-xs text-red-700 mt-0.5">
                      {inspectingBooking.disputeReason || 'Customer or driver flagged a discrepancy in duration, route, or pricing.'}
                    </p>
                  </div>
                </div>
              )}

              {/* ROUTE MAP PREVIEW */}
              {inspectingBooking.pickupCoords && inspectingBooking.destinationCoords && (
                <div className="rounded-2xl overflow-hidden border border-slate-200">
                  <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>OpenStreetMap Road Route & Event GPS Locations</span>
                    <span className="text-[10px] text-slate-500 font-normal">Blue: Outbound | Purple: Return</span>
                  </div>
                  <RouteMap
                    pickupCoords={inspectingBooking.pickupCoords}
                    destinationCoords={inspectingBooking.destinationCoords}
                    intermediateStops={inspectingBooking.stops || []}
                    outboundPolyline={inspectingBooking.outboundPolyline || []}
                    returnPolyline={inspectingBooking.returnPolyline || []}
                    isReturnTrip={inspectingBooking.isReturnTrip}
                    actualStartCoords={inspectingBooking.tripStartLocation}
                    actualEndCoords={inspectingBooking.tripEndLocation}
                    interactive={false}
                    height="260px"
                  />
                </div>
              )}

              {/* GRID 1: PLANNED ROUTE VS EVENT-BASED GPS LOCATIONS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Planned Route */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-600" />
                    Planned Road Route
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="font-bold text-slate-700 block">Pickup Address:</span>
                      <span className="text-slate-600">{inspectingBooking.pickupLocation}</span>
                      {inspectingBooking.pickupCoords && (
                        <span className="text-[10px] font-mono text-slate-400 block">
                          Lat: {inspectingBooking.pickupCoords.latitude.toFixed(5)}, Lng: {inspectingBooking.pickupCoords.longitude.toFixed(5)}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 block">Destination Address:</span>
                      <span className="text-slate-600">{inspectingBooking.destinationLocation}</span>
                      {inspectingBooking.destinationCoords && (
                        <span className="text-[10px] font-mono text-slate-400 block">
                          Lat: {inspectingBooking.destinationCoords.latitude.toFixed(5)}, Lng: {inspectingBooking.destinationCoords.longitude.toFixed(5)}
                        </span>
                      )}
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-slate-700">Estimated Road Distance:</span>
                      <span className="font-black text-slate-900">{inspectingBooking.estimatedDistanceKm?.toFixed(1) || 'N/A'} km</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">Return Trip Planned:</span>
                      <span className="font-bold text-purple-700">{inspectingBooking.isReturnTrip ? 'Yes (Outbound + Return)' : 'No (One Way)'}</span>
                    </div>
                  </div>
                </div>

                {/* Event-Based Recorded GPS */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-emerald-600" />
                    Event-Captured GPS Locations
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="font-bold text-slate-700 block">Trip Start GPS:</span>
                      {inspectingBooking.tripStartLocation ? (
                        <div>
                          <span className="text-slate-600">{inspectingBooking.tripStartLocation.address || 'Location captured'}</span>
                          <span className="text-[10px] font-mono text-slate-400 block">
                            Lat: {inspectingBooking.tripStartLocation.latitude.toFixed(5)}, Lng: {inspectingBooking.tripStartLocation.longitude.toFixed(5)} (Acc: ±{inspectingBooking.tripStartLocation.accuracy?.toFixed(0) || 10}m)
                          </span>
                        </div>
                      ) : (
                        <span className="text-amber-700 font-medium">GPS unavailable at start (Permission denied or offline)</span>
                      )}
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 block">Trip End GPS:</span>
                      {inspectingBooking.tripEndLocation ? (
                        <div>
                          <span className="text-slate-600">{inspectingBooking.tripEndLocation.address || 'Location captured'}</span>
                          <span className="text-[10px] font-mono text-slate-400 block">
                            Lat: {inspectingBooking.tripEndLocation.latitude.toFixed(5)}, Lng: {inspectingBooking.tripEndLocation.longitude.toFixed(5)} (Acc: ±{inspectingBooking.tripEndLocation.accuracy?.toFixed(0) || 10}m)
                          </span>
                        </div>
                      ) : (
                        <span className="text-amber-700 font-medium">GPS unavailable at end (Permission denied or offline)</span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-slate-700">Distance Source:</span>
                      <span className="font-extrabold text-slate-900 uppercase">{inspectingBooking.distanceSource || 'estimated_only'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">Actual Distance:</span>
                      <span className="font-black text-emerald-700">
                        {inspectingBooking.actualTraveledKm !== undefined ? `${inspectingBooking.actualTraveledKm.toFixed(1)} km (Verified)` : 'Not recorded (Estimated only)'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* GRID 2: SERVER TIMESTAMPS & AUTHORITATIVE DURATION */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Authoritative Timestamps & Duration
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Trip Started At (Server UTC)</span>
                    <span className="font-mono font-bold text-slate-800">
                      {inspectingBooking.tripStartedAt ? new Date(inspectingBooking.tripStartedAt).toISOString() : 'Not started yet'}
                    </span>
                    {inspectingBooking.tripStartedAt && (
                      <span className="text-[10px] text-slate-500 block">
                        Local: {new Date(inspectingBooking.tripStartedAt).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Trip Completed At (Server UTC)</span>
                    <span className="font-mono font-bold text-slate-800">
                      {inspectingBooking.tripCompletedAt ? new Date(inspectingBooking.tripCompletedAt).toISOString() : 'Active / In Progress'}
                    </span>
                    {inspectingBooking.tripCompletedAt && (
                      <span className="text-[10px] text-slate-500 block">
                        Local: {new Date(inspectingBooking.tripCompletedAt).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Billable Hours & Rounding</span>
                    <span className="text-base font-black text-brand-700 block">
                      {inspectingBooking.billableHours !== undefined ? `${inspectingBooking.billableHours.toFixed(1)} Hours` : `${inspectingBooking.durationHours || 2} Hours (Est)`}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Rule: {inspectingBooking.pricingSnapshot?.partialHourRule || 'ceil_hour'}
                    </span>
                  </div>
                </div>
              </div>

              {/* GRID 2.5: CUSTOMER-SELECTED DURATION, WAITING TIME & ESTIMATED FARE AUDIT */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-600" />
                  Customer Duration & Destination Waiting Specifications
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Expected Service Duration</span>
                    <span className="font-black text-slate-900 text-sm">
                      {inspectingBooking.expectedTotalDurationHours || inspectingBooking.durationHours || 2} Hours
                    </span>
                    <span className="text-[10px] text-slate-500 block">Total rental period</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-amber-200 bg-amber-50/30">
                    <span className="text-[10px] font-bold text-amber-800 block uppercase">Destination Waiting</span>
                    <span className="font-black text-amber-950 text-sm">
                      {inspectingBooking.expectedWaitingHours !== undefined ? `${inspectingBooking.expectedWaitingHours} Hours` : '0 Hours'}
                    </span>
                    <span className="text-[10px] text-amber-800/80 block">At customer venue</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Driving Time</span>
                    <span className="font-extrabold text-slate-900">
                      {inspectingBooking.expectedDrivingMinutes 
                        ? `${Math.floor(inspectingBooking.expectedDrivingMinutes / 60)}h ${inspectingBooking.expectedDrivingMinutes % 60}m`
                        : (inspectingBooking.estimatedDurationMinutes ? `${Math.round(inspectingBooking.estimatedDurationMinutes)} mins` : 'N/A')}
                    </span>
                    <span className="text-[10px] text-slate-500 block">{inspectingBooking.isReturnTrip ? 'Round trip driving' : 'One way'}</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Billing Method</span>
                    <span className="font-extrabold text-slate-900 uppercase">
                      {inspectingBooking.billingMethod || 'Hourly'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Configured policy</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-700">Return Journey Schedule: </span>
                    <span className="text-slate-900 font-semibold">
                      {inspectingBooking.returnJourneyOption === 'after_waiting' ? 'Return after waiting at destination' : inspectingBooking.returnJourneyOption === 'same_day' ? 'Return on the same day' : inspectingBooking.returnJourneyOption === 'different_date' ? 'Return on a different date / overnight stay' : (inspectingBooking.isReturnTrip ? 'Round Trip' : 'One-way drop only')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 font-medium text-[11px]">Estimated Pre-Trip Fare: </span>
                    <span className="font-black text-brand-700">₹{inspectingBooking.estimatedFare}</span>
                  </div>
                </div>
              </div>

              {/* GRID 3: SAVED PRICING POLICY SNAPSHOT & ITEMIZED BILL */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  Locked Pricing Snapshot & Itemized Bill
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block">Base Hourly Rate</span>
                    <span className="font-extrabold text-slate-900">₹{inspectingBooking.pricingSnapshot?.hourlyRate || 200}/hr</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block">Time Charges</span>
                    <span className="font-extrabold text-slate-900">₹{inspectingBooking.timeBasedCharge || inspectingBooking.estimatedFare || 0}</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block">Distance Charges</span>
                    <span className="font-extrabold text-slate-900">₹{inspectingBooking.distanceBasedCharge || 0}</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block">Final Bill Amount</span>
                    <span className="font-black text-emerald-600 text-base">₹{inspectingBooking.finalFare || inspectingBooking.estimatedFare}</span>
                  </div>
                </div>
              </div>

              {/* CHRONOLOGICAL AUDIT HISTORY TABLE */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  Administrative Audit History Log
                </h4>

                {inspectingBooking.auditHistory && inspectingBooking.auditHistory.length > 0 ? (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-3">Timestamp (UTC)</th>
                          <th className="p-3">Admin Email</th>
                          <th className="p-3">Mandatory Reason</th>
                          <th className="p-3">Changes Recorded</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {inspectingBooking.auditHistory.map(audit => (
                          <tr key={audit.id}>
                            <td className="p-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                              {new Date(audit.timestamp).toLocaleString()}
                            </td>
                            <td className="p-3 font-semibold text-slate-900 whitespace-nowrap">
                              {audit.adminEmail}
                            </td>
                            <td className="p-3 font-medium text-slate-800">
                              {audit.reason}
                            </td>
                            <td className="p-3 font-mono text-[10px] text-slate-500 max-w-xs truncate">
                              {audit.changes}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                    No administrative manual modifications have been made to this trip record.
                  </p>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-3xl">
              <button
                onClick={() => setInspectingBooking(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors"
              >
                Close Audit View
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* 2. ADMIN MANUAL CORRECTION MODAL */}
      {correctingBooking && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setCorrectingBooking(null);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start md:items-center justify-center p-3 sm:p-4 overflow-y-auto modal-overlay-container overscroll-contain animate-in fade-in"
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden relative my-auto overscroll-contain max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header */}
            <div className="bg-amber-500 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Edit className="w-5 h-5 text-white" />
                <div>
                  <h3 className="font-black text-white text-base">Administrative Trip Correction</h3>
                  <span className="text-xs font-mono font-bold text-amber-100">{correctingBooking.id}</span>
                </div>
              </div>
              <button
                onClick={() => setCorrectingBooking(null)}
                className="p-1.5 text-amber-200 hover:text-white rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveCorrection} className="p-6 space-y-4">
              
              {correctionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{correctionError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Final Fare */}
                <div>
                  <label className="text-xs font-extrabold text-slate-900 block mb-1">Final Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={correctionFare}
                    onChange={(e) => setCorrectionFare(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>

                {/* Billable Hours */}
                <div>
                  <label className="text-xs font-extrabold text-slate-900 block mb-1">Billable Hours</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.5"
                    max="720"
                    value={correctionBillableHours}
                    onChange={(e) => setCorrectionBillableHours(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Traveled Kilometers */}
                <div>
                  <label className="text-xs font-extrabold text-slate-900 block mb-1">Actual Traveled Km</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={correctionKm}
                    onChange={(e) => setCorrectionKm(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>

                {/* Trip Status */}
                <div>
                  <label className="text-xs font-extrabold text-slate-900 block mb-1">Trip Status</label>
                  <select
                    value={correctionStatus}
                    onChange={(e) => setCorrectionStatus(e.target.value as BookingStatus)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-brand-500"
                  >
                    <option value="Accepted">Accepted</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Disputed">Disputed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Mandatory Reason */}
              <div>
                <label className="text-xs font-extrabold text-slate-900 block mb-1">
                  Mandatory Reason for Administrative Correction <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Corrected trip billable hours from 13.5 to 12.0 due to verified driver delayed arrival in traffic."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:border-brand-500"
                  required
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  This note will be permanently sealed in the audit trail with your admin email and timestamp.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCorrectingBooking(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save & Seal Audit Record
                </button>
              </div>

            </form>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

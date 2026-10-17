import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  X, CheckCircle2, Calendar, Clock, MapPin, Navigation, 
  Car, ShieldCheck, ArrowRight, ArrowLeft, Star, Plus, Trash2, 
  RotateCcw, Compass, Map, ExternalLink, Hourglass, Info, AlertCircle 
} from 'lucide-react';
import { Driver, ServiceType, Booking, TripStop, AdminPricingConfig } from '../../types';
import { bookingsService } from '../../services/bookings';
import { dbService } from '../../services/database';
import { RouteMap } from '../map/RouteMap';
import { routingService, RouteResult, HYDERABAD_LANDMARKS } from '../../services/routing';
import { gpsService } from '../../services/gps';
import { billingService } from '../../services/billing';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface BookingModalProps {
  driver: Driver;
  preselectedService?: ServiceType;
  onClose: () => void;
  onBookingComplete: (booking: Booking) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  driver,
  preselectedService,
  onClose,
  onBookingComplete,
}) => {
  const navigate = useNavigate();
  useBodyScrollLock(true, onClose);
  const [step, setStep] = useState<number>(1);

  // Form State
  const [selectedService, setSelectedService] = useState<ServiceType>(
    preselectedService || driver.services[0] || 'City Driver'
  );
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('localdrivers_customer_name') || '');
  const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem('localdrivers_verified_customer_phone') || '');
  
  // Locations and Coordinates
  const [pickupLocation, setPickupLocation] = useState(() => {
    try {
      const stored = localStorage.getItem('localdrivers_user_location');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.address && !parsed.isFallback) return parsed.address;
      }
    } catch {}
    return 'Road No. 36, Jubilee Hills, Hyderabad';
  });

  const [pickupCoords, setPickupCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: 17.4319,
    longitude: 78.4073,
  });

  const [destinationLocation, setDestinationLocation] = useState('Inorbit Mall, Madhapur, Hyderabad');
  const [destinationCoords, setDestinationCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: 17.4356,
    longitude: 78.3869,
  });

  // Intermediate Stops & Return Trip
  const [intermediateStops, setIntermediateStops] = useState<TripStop[]>([]);
  const [isReturnTrip, setIsReturnTrip] = useState(false);

  // Map Interaction State
  const [activePinSelection, setActivePinSelection] = useState<'pickup' | 'destination' | 'none'>('none');
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  // Date, Time & Vehicle
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(todayStr);
  const [time, setTime] = useState<string>('Instant ASAP (Within 15 Mins)');
  const [transmission, setTransmission] = useState<'Manual' | 'Automatic'>('Manual');
  const [vehicleModel, setVehicleModel] = useState('');
  const [notes, setNotes] = useState('');

  // Step 5: Trip Duration, Destination Waiting & Return Journey Specification
  const [returnJourneyOption, setReturnJourneyOption] = useState<'same_day' | 'after_waiting' | 'different_date' | 'one_way'>(
    'one_way'
  );
  const [waitingHours, setWaitingHours] = useState<number>(3);
  const [isCustomWaiting, setIsCustomWaiting] = useState(false);
  const [customWaitingInput, setCustomWaitingInput] = useState<string>('5');
  const [durationSelectionMode, setDurationSelectionMode] = useState<'auto' | 'package' | 'custom'>('auto');
  const [selectedPackageHours, setSelectedPackageHours] = useState<number>(8);
  const [customDurationHours, setCustomDurationHours] = useState<number>(10);

  // Confirmed booking response
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  // Auto-calculate Road Route via OSRM whenever points or return-trip setting changes
  useEffect(() => {
    let isCancelled = false;

    const calculateRoute = async () => {
      if (!pickupCoords || !destinationCoords) return;
      setIsCalculatingRoute(true);

      const res = await routingService.calculateRoadRoute(
        pickupCoords,
        destinationCoords,
        intermediateStops.map(s => ({ latitude: s.latitude, longitude: s.longitude })),
        isReturnTrip
      );

      if (!isCancelled) {
        setRouteResult(res);
        setIsCalculatingRoute(false);
      }
    };

    calculateRoute();
    return () => {
      isCancelled = true;
    };
  }, [pickupCoords, destinationCoords, intermediateStops, isReturnTrip]);

  // Handle GPS Current Location for Pickup
  const handleUseGpsForPickup = async () => {
    const geo = await gpsService.captureEventLocation('Manual Refresh');
    if (geo.source === 'gps') {
      setPickupCoords({ latitude: geo.latitude, longitude: geo.longitude });
      setPickupLocation(geo.address || `Current Location (${geo.latitude}, ${geo.longitude})`);
    } else {
      alert(geo.address || 'Unable to access GPS location. Please select on the map or type your address.');
    }
  };

  // Handle Map Pin Dropping
  const handleMapLocationSelect = (
    type: 'pickup' | 'destination',
    coords: { latitude: number; longitude: number }
  ) => {
    if (type === 'pickup') {
      setPickupCoords(coords);
      setPickupLocation(`Map Pin (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`);
    } else {
      setDestinationCoords(coords);
      setDestinationLocation(`Map Pin (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`);
    }
    setActivePinSelection('none');
  };

  // Add Intermediate Stop
  const handleAddStop = () => {
    const newStop: TripStop = {
      id: `stop-${Date.now()}`,
      address: 'Cyber Towers, Hitec City',
      latitude: 17.4504,
      longitude: 78.3808,
    };
    setIntermediateStops([...intermediateStops, newStop]);
  };

  const handleRemoveStop = (id: string) => {
    setIntermediateStops(intermediateStops.filter(s => s.id !== id));
  };

  // Synchronize return trip toggle with returnJourneyOption
  const handleToggleReturnTrip = (checked: boolean) => {
    setIsReturnTrip(checked);
    if (checked) {
      if (returnJourneyOption === 'one_way') {
        setReturnJourneyOption('after_waiting');
      }
      if (waitingHours === 0) {
        setWaitingHours(3);
      }
    } else {
      setReturnJourneyOption('one_way');
      setWaitingHours(0);
    }
  };

  // Transparent Fare Calculation based on Admin Rules, Driving Road-Route, and Destination Waiting
  const adminConfig: AdminPricingConfig = dbService.getAdminPricingConfig();
  const serviceConfig = dbService.getServiceByTitle(selectedService);

  const outboundKm = routeResult?.outboundDistanceKm || 10;
  const returnKm = isReturnTrip ? (routeResult?.returnDistanceKm || 10) : 0;
  const totalRoadKm = isReturnTrip ? Number((outboundKm + returnKm).toFixed(1)) : outboundKm;

  const outboundMins = routeResult?.durationMinutes
    ? Math.round(isReturnTrip ? routeResult.durationMinutes / 2 : routeResult.durationMinutes)
    : 30;
  const returnMins = isReturnTrip ? outboundMins : 0;
  const totalDrivingMins = outboundMins + returnMins;
  const totalDrivingHours = Number((totalDrivingMins / 60).toFixed(1));

  // Effective destination waiting time
  const effectiveWaitingHours = returnJourneyOption === 'one_way' ? 0 : (isCustomWaiting ? Number(customWaitingInput) || 0 : waitingHours);

  // Expected Total Duration in Hours
  let expectedTotalDurationHours = Number((totalDrivingHours + effectiveWaitingHours).toFixed(1));
  if (durationSelectionMode === 'package') {
    expectedTotalDurationHours = Math.max(selectedPackageHours, totalDrivingHours + effectiveWaitingHours);
  } else if (durationSelectionMode === 'custom') {
    expectedTotalDurationHours = Math.max(customDurationHours, totalDrivingHours + effectiveWaitingHours);
  } else {
    expectedTotalDurationHours = Math.max(serviceConfig?.minimumHours || 2, totalDrivingHours + effectiveWaitingHours);
  }

  const estimatedFareResult = billingService.calculateEstimatedFare({
    serviceType: selectedService,
    hourlyRate: driver.startingPrice || adminConfig.hourlyRate,
    minimumHours: serviceConfig?.minimumHours || adminConfig.minimumHours,
    partialHourRule: adminConfig.partialHourRule,
    dailyRate24h: adminConfig.dailyRate24h,
    multiDayDiscountPercent: adminConfig.multiDayDiscountPercent,
    outstationRatePerDay: adminConfig.outstationRatePerDay,
    outstationIncludedKmPerDay: adminConfig.outstationIncludedKmPerDay,
    outstationExtraKmRate: adminConfig.outstationExtraKmRate,
    nightAllowance: adminConfig.nightAllowance,
    waitingChargePerHour: adminConfig.waitingChargePerHour,
    outboundDistanceKm: outboundKm,
    outboundDurationMinutes: outboundMins,
    returnDistanceKm: returnKm,
    returnDurationMinutes: returnMins,
    isReturnTrip: isReturnTrip,
    waitingHours: effectiveWaitingHours,
    expectedTotalDurationHours: expectedTotalDurationHours,
    returnJourneyOption: returnJourneyOption,
  });

  const handleConfirmBooking = () => {
    const vehicleDetail = vehicleModel.trim() ? `${vehicleModel.trim()} (${transmission})` : `${transmission} Transmission`;
    const fullNotes = `Vehicle: ${vehicleDetail}${notes.trim() ? ` • ${notes.trim()}` : ''}`;
    
    const booking = bookingsService.createBooking({
      driverId: driver.id,
      driverName: driver.name,
      driverPhoto: driver.photo,
      driverPhone: driver.phone,
      driverCode: driver.driverCode,
      serviceTitle: selectedService,
      customerName,
      customerPhone,
      pickupLocation,
      destinationLocation,
      date,
      time,
      notes: fullNotes,
      estimatedFare: estimatedFareResult.totalEstimatedFare,

      // OpenStreetMap & Road Routing Parameters
      pickupCoords,
      destinationCoords,
      intermediateStops,
      isReturnTrip,
      estimatedDistanceKm: estimatedFareResult.totalRoadDistanceKm,
      estimatedReturnDistanceKm: isReturnTrip ? estimatedFareResult.returnDistanceKm : 0,
      estimatedDurationMinutes: estimatedFareResult.totalDrivingMinutes,
      routePolyline: routeResult?.outboundPolyline || [],
      outboundPolyline: routeResult?.outboundPolyline || [],
      returnPolyline: routeResult?.returnPolyline || [],

      // Trip Duration & Destination Waiting Specifications
      expectedWaitingHours: effectiveWaitingHours,
      expectedTotalDurationHours: estimatedFareResult.expectedTotalDurationHours,
      expectedDrivingMinutes: estimatedFareResult.totalDrivingMinutes,
      estimatedOutboundDistanceKm: estimatedFareResult.outboundDistanceKm,
      estimatedOutboundDurationMinutes: estimatedFareResult.outboundDrivingMinutes,
      estimatedReturnDurationMinutes: estimatedFareResult.returnDrivingMinutes,
      returnJourneyOption,
      billingMethod: estimatedFareResult.billingMethod,
      estimatedTimeBasedCharge: estimatedFareResult.timeBasedCharge,
      estimatedDistanceBasedCharge: estimatedFareResult.distanceBasedCharge,
      estimatedTaxesAndFees: estimatedFareResult.taxesAndFees,
      durationHours: estimatedFareResult.expectedTotalDurationHours,

      // Locked Pricing Snapshot at Confirmation
      pricingSnapshot: {
        serviceType: selectedService,
        baseHourlyRate: driver.startingPrice || adminConfig.hourlyRate,
        hourlyRate: driver.startingPrice || adminConfig.hourlyRate,
        minimumHours: serviceConfig?.minimumHours || adminConfig.minimumHours,
        partialHourRule: adminConfig.partialHourRule,
        daily24hRate: adminConfig.dailyRate24h,
        overnightCharge: adminConfig.nightAllowance,
        multiDayDiscountPercent: adminConfig.multiDayDiscountPercent,
        includedKmPerDay: adminConfig.outstationIncludedKmPerDay,
        extraPerKmRate: adminConfig.outstationExtraKmRate,
        waitingChargePerHour: adminConfig.waitingChargePerHour,
      },
    });

    if (customerName.trim()) {
      localStorage.setItem('localdrivers_customer_name', customerName.trim());
    }

    setCreatedBooking(booking);
    setStep(7); // Confirmation Screen
    onBookingComplete(booking);
  };

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto modal-overlay-container overscroll-contain animate-in fade-in duration-200"
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 relative my-auto max-h-[94vh] flex flex-col overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 to-brand-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={driver.photo}
              alt={driver.name}
              className="w-12 h-12 rounded-xl object-cover border-2 border-brand-400/40"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-base text-white">{driver.name}</h3>
                {driver.verificationBadge && (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <p className="text-xs text-brand-200 flex items-center gap-1">
                <span>₹{driver.startingPrice}/hr</span>
                <span>•</span>
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300 inline" />
                <span>{driver.rating} ({driver.totalTrips} trips)</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        {step < 7 && (
          <div className="bg-slate-100 h-1.5 w-full shrink-0">
            <div
              className="bg-brand-600 h-full transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
          
          {/* STEP 1: Service Type */}
          {step === 1 && (
            <div>
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
                Step 1 of 6
              </span>
              <h4 className="text-xl font-extrabold text-slate-900 mb-2">Select Service</h4>
              <p className="text-xs text-slate-500 mb-4">
                Choose the driver rental package for your car.
              </p>

              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {dbService.getServices().map(srv => {
                  const isSelected = selectedService === srv.title;
                  const isSupported = driver.services.includes(srv.title);

                  return (
                    <div
                      key={srv.id}
                      onClick={() => isSupported && setSelectedService(srv.title)}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/20'
                          : isSupported
                          ? 'border-slate-200 hover:border-slate-300 bg-white'
                          : 'border-slate-100 bg-slate-50/50 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">{srv.title}</span>
                          {srv.badge && (
                            <span className="text-[10px] bg-brand-100 text-brand-800 font-extrabold px-2 py-0.5 rounded-full">
                              {srv.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{srv.shortDescription}</p>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-sm text-slate-900">₹{srv.startingPrice}</span>
                        <span className="text-[10px] text-slate-400 block">base</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-600/25 flex items-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Customer Contact Info */}
          {step === 2 && (
            <div>
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
                Step 2 of 6
              </span>
              <h4 className="text-xl font-extrabold text-slate-900 mb-2">Customer Contact</h4>
              <p className="text-xs text-slate-500 mb-4">
                Required for direct phone connection and trip assignment.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 text-sm font-medium"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mobile Number (10 Digits)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-sm font-bold text-slate-500">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-14 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 text-sm font-bold"
                      placeholder="98765 43210"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Your number is verified and masked until driver accepts.
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-xl flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!customerName.trim() || customerPhone.length < 10}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-600/25 flex items-center gap-2 disabled:opacity-50"
                >
                  Next: Route & Map
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Interactive OpenStreetMap & Road Route Selection */}
          {step === 3 && (
            <div>
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
                Step 3 of 6
              </span>
              <h4 className="text-xl font-extrabold text-slate-900 mb-1">Route & Locations</h4>
              <p className="text-xs text-slate-500 mb-3">
                Select pickup, destination, and intermediate stops on the road route.
              </p>

              {/* Interactive Map */}
              <div className="mb-4">
                <RouteMap
                  pickupCoords={pickupCoords}
                  destinationCoords={destinationCoords}
                  intermediateStops={intermediateStops}
                  outboundPolyline={routeResult?.outboundPolyline || []}
                  returnPolyline={routeResult?.returnPolyline || []}
                  isReturnTrip={isReturnTrip}
                  interactive={true}
                  activePinSelection={activePinSelection}
                  onLocationSelect={handleMapLocationSelect}
                  height="220px"
                />
              </div>

              {/* Pin Drop Buttons */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setActivePinSelection(activePinSelection === 'pickup' ? 'none' : 'pickup')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                    activePinSelection === 'pickup'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{activePinSelection === 'pickup' ? 'Click Map for Pickup' : 'Set Pickup on Map'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePinSelection(activePinSelection === 'destination' ? 'none' : 'destination')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                    activePinSelection === 'destination'
                      ? 'bg-red-600 text-white border-red-600 shadow-sm'
                      : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{activePinSelection === 'destination' ? 'Click Map for Drop' : 'Set Drop-off on Map'}</span>
                </button>
              </div>

              {/* Location Input Fields */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                      Pickup Address
                    </label>
                    <button
                      type="button"
                      onClick={handleUseGpsForPickup}
                      className="text-[11px] text-brand-600 hover:underline font-bold flex items-center gap-1"
                    >
                      <Compass className="w-3 h-3" />
                      Use GPS
                    </button>
                  </div>
                  <input
                    type="text"
                    value={pickupLocation}
                    onChange={e => setPickupLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-brand-500"
                    placeholder="Enter pickup address"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                    Destination Address
                  </label>
                  <input
                    type="text"
                    value={destinationLocation}
                    onChange={e => setDestinationLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-brand-500"
                    placeholder="Enter destination address"
                  />
                </div>

                {/* Intermediate Stops */}
                {intermediateStops.map((stop, idx) => (
                  <div key={stop.id} className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                      <span className="text-xs font-bold text-amber-900">Stop {idx + 1}:</span>
                      <span className="text-xs text-amber-800 truncate">{stop.address}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveStop(stop.id)}
                      className="text-amber-700 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleAddStop}
                    className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Intermediate Stop
                  </button>

                  {/* Return Trip Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={isReturnTrip}
                      onChange={e => handleToggleReturnTrip(e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                    />
                    <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                    <span>Round Trip (Include Return Journey)</span>
                  </label>
                </div>
              </div>

              {/* Road Routing Calculation Feedback Banner (Requirement 1: Informational road distance & driving time) */}
              <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px] uppercase">Outbound Road Distance</span>
                    <span className="font-black text-slate-900 text-sm">
                      {outboundKm} km <span className="text-[11px] font-normal text-slate-500">(~{outboundMins} mins drive)</span>
                    </span>
                  </div>

                  {isReturnTrip ? (
                    <div className="text-right">
                      <span className="text-purple-700 font-semibold block text-[10px] uppercase">Return Road Distance</span>
                      <span className="font-black text-purple-900 text-sm">
                        {returnKm} km <span className="text-[11px] font-normal text-purple-600">(~{returnMins} mins drive)</span>
                      </span>
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="text-slate-500 font-semibold block text-[10px] uppercase">Trip Mode</span>
                      <span className="font-bold text-slate-800">One-Way Journey</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-slate-700">
                  <span className="font-bold">Total Estimated Road Distance:</span>
                  <span className="font-black text-slate-900 text-sm">{totalRoadKm} km</span>
                </div>

                <p className="text-[11px] text-slate-500 pt-1 leading-tight">
                  Driving times are routing estimates. In the next step, you will specify your planned destination waiting time and expected total service duration.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-xl flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!pickupLocation.trim() || !destinationLocation.trim()}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-600/25 flex items-center gap-2 disabled:opacity-50"
                >
                  Next: Schedule & Vehicle
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Date, Time & Vehicle */}
          {step === 4 && (
            <div>
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
                Step 4 of 6
              </span>
              <h4 className="text-xl font-extrabold text-slate-900 mb-1">Schedule & Vehicle</h4>
              <p className="text-xs text-slate-500 mb-4">
                Specify start date, reporting time, and car transmission.
              </p>

              <div className="space-y-4">
                {/* Date Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Service Date
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setDate(todayStr)}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                        date === todayStr
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Today ({new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const tmrw = new Date();
                        tmrw.setDate(tmrw.getDate() + 1);
                        setDate(tmrw.toISOString().split('T')[0]);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                        date !== todayStr
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Tomorrow
                    </button>
                  </div>

                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                    />
                  </div>
                </div>

                {/* Reporting Time */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Reporting Time
                  </label>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setTime('Instant ASAP (Within 15 Mins)')}
                      className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                        time === 'Instant ASAP (Within 15 Mins)'
                          ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-brand-600" />
                        Instant ASAP (Within 15 Mins)
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        Fastest
                      </span>
                    </button>

                    <div className="relative">
                      <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="time"
                        value={time.includes(':') ? time : '09:00'}
                        onChange={e => setTime(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Transmission Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Transmission Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTransmission('Manual')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-2 ${
                        transmission === 'Manual'
                          ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Car className="w-4 h-4" />
                      Manual Gear
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransmission('Automatic')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-2 ${
                        transmission === 'Automatic'
                          ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Car className="w-4 h-4" />
                      Automatic Gear
                    </button>
                  </div>
                </div>

                {/* Vehicle Model */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Vehicle Model (Optional)
                  </label>
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={e => setVehicleModel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                    placeholder="e.g. Fortuner, Honda City, Audi A6"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-2.5 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-xl flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={() => setStep(5)}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-600/25 flex items-center gap-2"
                >
                  Next: Trip Duration & Fare
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: DEDICATED TRIP DURATION & ESTIMATED FARE STEP (Requirements 2 & 3) */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
                  Step 5 of 6
                </span>
                <h4 className="text-xl font-extrabold text-slate-900 mb-1">Trip Duration & Estimated Fare</h4>
                <p className="text-xs text-slate-500 mb-4">
                  Account for destination waiting, overnight stays, and return travel before finalizing charges.
                </p>
              </div>

              {/* SECTION A: Return Journey Schedule */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <label className="text-xs font-black text-slate-900 block">
                  Return Journey Option
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setReturnJourneyOption('after_waiting');
                      setIsReturnTrip(true);
                      if (waitingHours === 0) setWaitingHours(3);
                    }}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                      returnJourneyOption === 'after_waiting'
                        ? 'border-brand-600 bg-brand-50 text-brand-900 ring-2 ring-brand-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block font-black">Return after waiting</span>
                    <span className="text-[10px] text-slate-500 font-normal">Driver waits at destination & drives back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReturnJourneyOption('same_day');
                      setIsReturnTrip(true);
                    }}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                      returnJourneyOption === 'same_day'
                        ? 'border-brand-600 bg-brand-50 text-brand-900 ring-2 ring-brand-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block font-black">Return on same day</span>
                    <span className="text-[10px] text-slate-500 font-normal">Continuous local errands & return drop</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReturnJourneyOption('different_date');
                      setIsReturnTrip(true);
                      if (waitingHours < 8) setWaitingHours(12);
                    }}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                      returnJourneyOption === 'different_date'
                        ? 'border-brand-600 bg-brand-50 text-brand-900 ring-2 ring-brand-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block font-black">Return on different date</span>
                    <span className="text-[10px] text-slate-500 font-normal">Overnight or multi-day outstation stay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReturnJourneyOption('one_way');
                      setIsReturnTrip(false);
                      setWaitingHours(0);
                    }}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                      returnJourneyOption === 'one_way'
                        ? 'border-brand-600 bg-brand-50 text-brand-900 ring-2 ring-brand-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block font-black">One-way service only</span>
                    <span className="text-[10px] text-slate-500 font-normal">Driver relieved at destination point</span>
                  </button>
                </div>
              </div>

              {/* SECTION B: Expected Destination Waiting Time */}
              {returnJourneyOption !== 'one_way' && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-black text-slate-900 block">
                        Expected Destination Waiting Time
                      </label>
                      <span className="text-[11px] text-slate-500">
                        How long will the driver wait while you complete your work, darshan, or meeting?
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { label: 'None (0h)', hrs: 0 },
                      { label: '1 Hour', hrs: 1 },
                      { label: '3 Hours', hrs: 3 },
                      { label: '6 Hours', hrs: 6 },
                      { label: '12 Hours', hrs: 12 },
                      { label: 'Overnight (8h)', hrs: 8 },
                      { label: '1 Day (24h)', hrs: 24 },
                    ].map(w => (
                      <button
                        key={w.hrs}
                        type="button"
                        onClick={() => {
                          setIsCustomWaiting(false);
                          setWaitingHours(w.hrs);
                        }}
                        className={`py-2 px-2 rounded-xl border text-center font-bold transition-all ${
                          !isCustomWaiting && waitingHours === w.hrs
                            ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setIsCustomWaiting(true)}
                      className={`py-2 px-2 rounded-xl border text-center font-bold transition-all ${
                        isCustomWaiting
                          ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Custom Hours
                    </button>
                  </div>

                  {isCustomWaiting && (
                    <div className="pt-2 flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 shrink-0">Enter Custom Waiting Hours:</span>
                      <input
                        type="number"
                        min="1"
                        max="168"
                        value={customWaitingInput}
                        onChange={e => setCustomWaitingInput(e.target.value)}
                        className="w-24 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-black text-slate-900"
                        placeholder="Hours"
                      />
                      <span className="text-xs text-slate-500 font-medium">hours</span>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION C: Expected Total Service Duration Selection */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                <div>
                  <label className="text-xs font-black text-slate-900 block">
                    Expected Total Service Duration
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Calculated from road driving and destination waiting, or choose a fixed shift package.
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setDurationSelectionMode('auto')}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all col-span-2 sm:col-span-1 ${
                      durationSelectionMode === 'auto'
                        ? 'border-brand-600 bg-brand-50 text-brand-900 ring-2 ring-brand-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block font-black text-xs text-brand-700">Calculated Total</span>
                    <span className="text-[10px] text-slate-500 block">
                      ~{totalDrivingHours}h driving + {effectiveWaitingHours}h waiting
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDurationSelectionMode('package');
                      setSelectedPackageHours(4);
                    }}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                      durationSelectionMode === 'package' && selectedPackageHours === 4
                        ? 'border-brand-600 bg-brand-50 text-brand-900 ring-2 ring-brand-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block font-black">4 Hours</span>
                    <span className="text-[10px] text-slate-500 block">City errand shift</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDurationSelectionMode('package');
                      setSelectedPackageHours(8);
                    }}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                      durationSelectionMode === 'package' && selectedPackageHours === 8
                        ? 'border-brand-600 bg-brand-50 text-brand-900 ring-2 ring-brand-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block font-black">8 Hours</span>
                    <span className="text-[10px] text-slate-500 block">Standard day shift</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDurationSelectionMode('package');
                      setSelectedPackageHours(12);
                    }}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                      durationSelectionMode === 'package' && selectedPackageHours === 12
                        ? 'border-brand-600 bg-brand-50 text-brand-900 ring-2 ring-brand-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block font-black">12 Hours</span>
                    <span className="text-[10px] text-slate-500 block">Full day package</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDurationSelectionMode('package');
                      setSelectedPackageHours(24);
                    }}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                      durationSelectionMode === 'package' && selectedPackageHours === 24
                        ? 'border-brand-600 bg-brand-50 text-brand-900 ring-2 ring-brand-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block font-black">24h / 1 Day</span>
                    <span className="text-[10px] text-slate-500 block">Flat 24h package</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDurationSelectionMode('package');
                      setSelectedPackageHours(48);
                    }}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                      durationSelectionMode === 'package' && selectedPackageHours === 48
                        ? 'border-brand-600 bg-brand-50 text-brand-900 ring-2 ring-brand-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block font-black">2 Days (48h)</span>
                    <span className="text-[10px] text-slate-500 block">Multi-day discount</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 leading-tight">
                  Package assurance: If your selected package already covers your total trip duration, destination waiting is included within those hours and not charged a second time.
                </p>
              </div>

              {/* SECTION D: Live Transparent Fare Estimate Breakdown */}
              <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white p-4 rounded-2xl shadow-lg space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-extrabold text-sm text-white">Estimated Fare Calculation</span>
                  <span className="font-mono text-[10px] bg-brand-500/20 text-brand-300 border border-brand-400/30 px-2 py-0.5 rounded-full font-bold">
                    {estimatedFareResult.billingMethod.toUpperCase()} BILLING
                  </span>
                </div>

                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between items-center">
                    <span>Driving Time (~{totalDrivingMins} mins):</span>
                    <span className="font-bold text-white">~{totalDrivingHours} Hours ({totalRoadKm} km)</span>
                  </div>

                  {returnJourneyOption !== 'one_way' && (
                    <div className="flex justify-between items-center">
                      <span>Destination Waiting Time:</span>
                      <span className="font-bold text-amber-300">{effectiveWaitingHours} Hours</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span>Expected Total Service Duration:</span>
                    <span className="font-black text-white">{estimatedFareResult.expectedTotalDurationHours} Hours</span>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-white/10">
                    <span>Time-Based Charge ({estimatedFareResult.billableHours} billable hrs @ ₹{estimatedFareResult.effectiveHourlyRate}/hr):</span>
                    <span className="font-bold text-white">₹{estimatedFareResult.timeBasedCharge}</span>
                  </div>

                  {estimatedFareResult.distanceBasedCharge > 0 && (
                    <div className="flex justify-between items-center">
                      <span>Distance Extra Charge ({estimatedFareResult.extraKm} km @ ₹{adminConfig.outstationExtraKmRate}/km):</span>
                      <span className="font-bold text-white">₹{estimatedFareResult.distanceBasedCharge}</span>
                    </div>
                  )}

                  {estimatedFareResult.nightCharges > 0 && (
                    <div className="flex justify-between items-center">
                      <span>Overnight / Night Allowance:</span>
                      <span className="font-bold text-white">₹{estimatedFareResult.nightCharges}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-brand-300 font-bold uppercase block">Estimated Fare</span>
                    <span className="text-[10px] text-slate-400">Final bill derived from actual server timer</span>
                  </div>
                  <span className="text-2xl font-black text-emerald-400">
                    ₹{estimatedFareResult.totalEstimatedFare}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between pt-2">
                <button
                  onClick={() => setStep(4)}
                  className="px-4 py-2.5 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-xl flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={() => setStep(6)}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-600/25 flex items-center gap-2"
                >
                  Next: Review & Confirm
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: Review & Final Confirmation (Requirement 4) */}
          {step === 6 && (
            <div>
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
                Step 6 of 6
              </span>
              <h4 className="text-xl font-extrabold text-slate-900 mb-2">Review & Confirm Booking</h4>
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5 mb-4 text-xs">
                
                {/* Driver */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Selected Driver:</span>
                  <span className="font-bold text-slate-900">
                    {driver.name} (#{driver.driverCode}) • ₹{driver.startingPrice}/hr
                  </span>
                </div>

                {/* Service Package */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Service Package:</span>
                  <span className="font-bold text-brand-700">{selectedService}</span>
                </div>

                {/* Locations */}
                <div className="flex justify-between items-start">
                  <span className="text-slate-500 font-medium shrink-0">Pickup:</span>
                  <span className="font-bold text-slate-800 text-right">{pickupLocation}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-500 font-medium shrink-0">Destination:</span>
                  <span className="font-bold text-slate-800 text-right">{destinationLocation}</span>
                </div>

                {/* Road Distance & Driving Time */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Outbound Road Distance:</span>
                  <span className="font-bold text-slate-900">{outboundKm} km (~{outboundMins} mins)</span>
                </div>

                {isReturnTrip && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Return Road Distance:</span>
                    <span className="font-bold text-purple-700">{returnKm} km (~{returnMins} mins)</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Total Planned Road Distance:</span>
                  <span className="font-extrabold text-slate-900">{totalRoadKm} km</span>
                </div>

                {/* Waiting & Duration */}
                {returnJourneyOption !== 'one_way' && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Expected Destination Waiting:</span>
                    <span className="font-bold text-amber-700">{effectiveWaitingHours} Hours</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Expected Total Service Duration:</span>
                  <span className="font-black text-slate-900">{estimatedFareResult.expectedTotalDurationHours} Hours</span>
                </div>

                {/* Schedule */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Reporting Schedule:</span>
                  <span className="font-bold text-slate-900">{date} at {time}</span>
                </div>

                {/* Billing Breakdown */}
                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Billing Method:</span>
                    <span className="font-bold text-slate-900 capitalize">{estimatedFareResult.billingMethod.replace('_', ' ')}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span>Estimated Time-Based Charge ({estimatedFareResult.billableHours} hrs):</span>
                    <span className="font-bold text-slate-900">₹{estimatedFareResult.timeBasedCharge}</span>
                  </div>

                  {estimatedFareResult.distanceBasedCharge > 0 && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Estimated Distance-Based Charge:</span>
                      <span className="font-bold text-slate-900">₹{estimatedFareResult.distanceBasedCharge}</span>
                    </div>
                  )}

                  {estimatedFareResult.nightCharges > 0 && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Overnight / Night Allowance:</span>
                      <span className="font-bold text-slate-900">₹{estimatedFareResult.nightCharges}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">Estimated Fare</span>
                      <span className="text-[10px] text-slate-400">Transparent provisional quote</span>
                    </div>
                    <span className="text-2xl font-black text-brand-600">
                      ₹{estimatedFareResult.totalEstimatedFare}
                    </span>
                  </div>
                </div>

              </div>

              {/* Requirement 4: Mandatory Disclaimer & Return-To-Duration link */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 mb-4 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="leading-relaxed">
                    Your estimated fare includes your planned driving and service duration, including the waiting time you selected. The final amount may change according to the actual trip duration and the pricing rules for your booking.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep(5)}
                    className="text-brand-600 font-extrabold hover:underline mt-1 inline-block"
                  >
                    Modify expected duration or waiting hours
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Special Instructions
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  placeholder="e.g. Driver to wait near temple entrance, parking pass available"
                />
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setStep(5)}
                  className="px-4 py-2.5 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-xl flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Duration
                </button>
                <button
                  onClick={handleConfirmBooking}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/25 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Confirm Booking
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: Booking Success Confirmation */}
          {step === 7 && createdBooking && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-50">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>

              <h4 className="text-2xl font-black text-slate-900 mb-1">Booking Dispatched</h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto mb-5">
                Your driver request is confirmed and dispatched to {driver.name}.
              </p>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left max-w-sm mx-auto space-y-2 mb-6 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Booking ID:</span>
                  <span className="font-mono font-extrabold text-sm text-brand-700">{createdBooking.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Planned Road Distance:</span>
                  <span className="font-bold text-slate-900">{createdBooking.estimatedDistanceKm} km</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Expected Total Duration:</span>
                  <span className="font-bold text-slate-900">{createdBooking.expectedTotalDurationHours || createdBooking.durationHours} Hours</span>
                </div>
                {createdBooking.expectedWaitingHours !== undefined && createdBooking.expectedWaitingHours > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Destination Waiting Time:</span>
                    <span className="font-bold text-amber-700">{createdBooking.expectedWaitingHours} Hours</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Driver:</span>
                  <span className="font-bold text-slate-900">{driver.name}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-slate-700 font-bold">Estimated Fare:</span>
                  <span className="font-black text-base text-brand-600">₹{createdBooking.estimatedFare}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/bookings/${createdBooking.id}`);
                  }}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  View Live Trip Tracking
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
};

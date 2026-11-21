import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  X, CheckCircle2, Calendar, Clock, MapPin, Navigation, 
  Car, ShieldCheck, ArrowRight, ArrowLeft, Star, Plus, Trash2, 
  RotateCcw, Compass, Map, ExternalLink, Hourglass, Info, AlertCircle 
} from 'lucide-react';
import { Driver, ServiceType, Booking, TripStop, AdminPricingConfig, UserLocation } from '../../types';
import { bookingsService } from '../../services/bookings';
import { dbService } from '../../services/database';
import { RouteMap } from '../map/RouteMap';
import { routingService, RouteResult, HYDERABAD_LANDMARKS } from '../../services/routing';
import { gpsService } from '../../services/gps';
import { billingService } from '../../services/billing';
import { locationService } from '../../services/location';
import { LocationSearchInput } from './LocationSearchInput';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useUser } from '@clerk/react';
import { GoogleAuthButton } from '../common/GoogleAuthButton';

interface BookingModalProps {
  driver: Driver;
  preselectedService?: ServiceType;
  initialUserLocation?: UserLocation;
  initialPickup?: string;
  initialDrop?: string;
  initialPickupCoords?: { latitude: number; longitude: number };
  initialDropCoords?: { latitude: number; longitude: number };
  initialVehicleType?: string;
  initialTransmission?: 'Manual' | 'Automatic';
  initialVehicleModel?: string;
  initialDate?: string;
  initialTime?: string;
  onClose: () => void;
  onBookingComplete: (booking: Booking) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  driver,
  preselectedService,
  initialUserLocation,
  initialPickup,
  initialDrop,
  initialPickupCoords,
  initialDropCoords,
  initialVehicleType,
  initialTransmission,
  initialVehicleModel,
  initialDate,
  initialTime,
  onClose,
  onBookingComplete,
}) => {
  const navigate = useNavigate();
  useBodyScrollLock(true, onClose);
  const { user, isSignedIn } = useUser();
  const [step, setStep] = useState<number>(1);

  // Determine initial service based strictly on Blueprint (City Driver vs Outstation Driver)
  const resolveInitialService = (): ServiceType => {
    if (preselectedService === 'Outstation Driver' || (preselectedService as string) === 'Outstation') {
      return 'Outstation Driver';
    }
    if (preselectedService === 'City Driver' || (preselectedService as string) === 'City') {
      return 'City Driver';
    }
    return driver.services.includes('City Driver') ? 'City Driver' : (driver.services[0] || 'City Driver');
  };

  const [selectedService, setSelectedService] = useState<ServiceType>(resolveInitialService());

  const [customerName, setCustomerName] = useState(() => 
    localStorage.getItem('localdrivers_customer_name') || ''
  );
  const [customerPhone, setCustomerPhone] = useState(() => 
    localStorage.getItem('localdrivers_verified_customer_phone') || ''
  );

  // Pre-fill customer details from Google account when available
  useEffect(() => {
    if (isSignedIn && user) {
      if (!customerName) {
        const fullName = user.fullName || user.firstName || '';
        if (fullName) setCustomerName(fullName);
      }
      if (!customerPhone && user.primaryPhoneNumber?.phoneNumber) {
        const clean = user.primaryPhoneNumber.phoneNumber.replace(/\D/g, '').slice(-10);
        if (clean) setCustomerPhone(clean);
      }
    }
  }, [isSignedIn, user]);
  
  // Locations and Coordinates
  const initialStoredLocation = initialUserLocation || locationService.getStoredLocation();
  const hasExplicitStoredPickup = Boolean(
    initialStoredLocation?.address &&
    initialStoredLocation.latitude &&
    initialStoredLocation.longitude
  );

  const [pickupLocation, setPickupLocation] = useState(() =>
    initialPickup || (hasExplicitStoredPickup ? initialStoredLocation.address : 'Road No. 36, Jubilee Hills, Hyderabad')
  );

  const [pickupCoords, setPickupCoords] = useState<{ latitude: number; longitude: number }>(() =>
    initialPickupCoords || (hasExplicitStoredPickup
      ? { latitude: initialStoredLocation.latitude, longitude: initialStoredLocation.longitude }
      : { latitude: 17.4319, longitude: 78.4073 })
  );

  const userEditedPickupRef = useRef<boolean>(Boolean(initialPickup || hasExplicitStoredPickup));

  const [destinationLocation, setDestinationLocation] = useState(
    initialDrop || 'Inorbit Mall, Madhapur, Hyderabad'
  );
  const [destinationCoords, setDestinationCoords] = useState<{ latitude: number; longitude: number }>(
    initialDropCoords || { latitude: 17.4356, longitude: 78.3869 }
  );

  // Intermediate Stops & Return Trip
  const [intermediateStops, setIntermediateStops] = useState<TripStop[]>([]);
  const [isReturnTrip, setIsReturnTrip] = useState(false);

  // Map Interaction State
  const [activePinSelection, setActivePinSelection] = useState<'pickup' | 'destination' | 'none' | string>('none');
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [isGpsLocating, setIsGpsLocating] = useState(false);

  // Date, Time & Vehicle
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(initialDate || todayStr);
  const [time, setTime] = useState<string>(initialTime || 'Instant ASAP (Within 15 Mins)');
  const [transmission, setTransmission] = useState<'Manual' | 'Automatic'>(initialTransmission || 'Manual');
  const [vehicleType, setVehicleType] = useState<string>(initialVehicleType || 'Sedan');
  const [vehicleModel, setVehicleModel] = useState(initialVehicleModel || '');
  const [notes, setNotes] = useState('');

  // Trip Duration & Return Setting
  const [returnJourneyOption, setReturnJourneyOption] = useState<'same_day' | 'after_waiting' | 'different_date' | 'one_way'>(
    'one_way'
  );
  const [waitingHours, setWaitingHours] = useState<number>(0);

  // Confirmed booking response
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Automatically detect customer location by permission on mount ONLY if not pre-provided
  useEffect(() => {
    if (userEditedPickupRef.current) return;
    if (!('geolocation' in navigator)) return;

    let isMounted = true;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (!isMounted || userEditedPickupRef.current) return;
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        try {
          const resolved = await locationService.reverseGeocode(lat, lng);
          if (isMounted && !userEditedPickupRef.current && resolved?.address) {
            setPickupCoords({ latitude: lat, longitude: lng });
            setPickupLocation(resolved.address);
          }
        } catch {}
      },
      (err) => {
        console.log('[Geolocation] Auto-detect not granted:', err.message);
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
    );

    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-calculate Road Route via OSRM whenever points change
  useEffect(() => {
    let isCancelled = false;

    const calculateRoute = async () => {
      if (!pickupCoords || !destinationCoords) return;
      setIsCalculatingRoute(true);

      const validStops = intermediateStops
        .filter(s => s.latitude !== 0 && s.longitude !== 0)
        .map(s => ({ latitude: s.latitude, longitude: s.longitude }));

      const res = await routingService.calculateRoadRoute(
        pickupCoords,
        destinationCoords,
        validStops,
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
    setIsGpsLocating(true);
    try {
      const geo = await gpsService.captureEventLocation('Manual Refresh');
      if (geo.source === 'gps') {
        const resolved = await locationService.reverseGeocode(geo.latitude, geo.longitude);
        const resolvedAddr = resolved?.address || geo.address || `Current Location (${geo.latitude}, ${geo.longitude})`;
        userEditedPickupRef.current = true;
        setPickupCoords({ latitude: geo.latitude, longitude: geo.longitude });
        setPickupLocation(resolvedAddr);
        locationService.saveLocation({
          latitude: geo.latitude,
          longitude: geo.longitude,
          address: resolvedAddr,
          area: resolved?.area || resolvedAddr.split(',')[0] || 'Hyderabad',
          city: resolved?.city || 'Hyderabad',
          isFallback: false,
        });
      } else {
        alert(geo.address || 'Unable to access GPS location. Please select on the map or type your address.');
      }
    } finally {
      setIsGpsLocating(false);
    }
  };

  // Handle Map Pin Dropping
  const handleMapLocationSelect = async (
    type: string,
    coords: { latitude: number; longitude: number }
  ) => {
    let readable = `Map Location (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`;
    let resolvedArea = 'Hyderabad';
    try {
      const resolved = await locationService.reverseGeocode(coords.latitude, coords.longitude);
      if (resolved?.address) {
        readable = resolved.address;
        resolvedArea = resolved.area || 'Hyderabad';
      }
    } catch {}

    if (type === 'pickup') {
      userEditedPickupRef.current = true;
      setPickupCoords(coords);
      setPickupLocation(readable);
      locationService.saveLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
        address: readable,
        area: resolvedArea,
        city: 'Hyderabad',
        isFallback: false,
      });
    } else if (type === 'destination') {
      setDestinationCoords(coords);
      setDestinationLocation(readable);
    } else if (type.startsWith('stop-')) {
      const stopIdx = parseInt(type.replace('stop-', ''), 10);
      setIntermediateStops(prev => {
        const copy = [...prev];
        if (copy[stopIdx]) {
          copy[stopIdx] = {
            ...copy[stopIdx],
            latitude: coords.latitude,
            longitude: coords.longitude,
            address: readable,
          };
        }
        return copy;
      });
    }
    setActivePinSelection('none');
  };

  const handleAddStop = () => {
    if (intermediateStops.length >= 4) {
      alert('You can add up to 4 intermediate stops per journey.');
      return;
    }
    const newStop: TripStop = {
      id: `stop-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      address: '',
      latitude: 0,
      longitude: 0,
    };
    setIntermediateStops([...intermediateStops, newStop]);
  };

  const handleUpdateStop = (id: string, updates: Partial<TripStop>) => {
    setIntermediateStops(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleRemoveStop = (id: string) => {
    setIntermediateStops(intermediateStops.filter(s => s.id !== id));
  };

  // Transparent Fare Calculation based on Admin Rules
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

  const effectiveWaitingHours = isReturnTrip ? waitingHours : 0;
  const expectedTotalDurationHours = Math.max(
    selectedService === 'Outstation Driver' ? 12 : 2,
    Number((totalDrivingHours + effectiveWaitingHours).toFixed(1))
  );

  const estimatedFareResult = billingService.calculateEstimatedFare({
    serviceType: selectedService,
    hourlyRate: driver.startingPrice || adminConfig.hourlyRate,
    minimumHours: selectedService === 'Outstation Driver' ? 12 : (serviceConfig?.minimumHours || adminConfig.minimumHours),
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
    returnJourneyOption: returnJourneyOption,
    expectedTotalDurationHours: expectedTotalDurationHours,
  });

  // Authoritative Booking Submission (Generates Virtual Pickup OTP)
  const handleConfirmBooking = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmissionError(null);

    const vehicleDetail = vehicleModel.trim() ? `${vehicleModel.trim()} (${transmission})` : `${transmission} Transmission`;
    const fullNotes = `Vehicle: ${vehicleType} - ${vehicleDetail}${notes.trim() ? ` • ${notes.trim()}` : ''}`;

    const bookingPayload = {
      driverId: driver.id,
      driverName: driver.name,
      driverPhoto: driver.photo,
      driverPhone: driver.phone,
      driverCode: driver.driverCode,
      serviceTitle: selectedService,
      customerName: customerName.trim() || 'Customer',
      customerPhone: customerPhone.replace(/\D/g, '').slice(-10),
      customerEmail: user?.primaryEmailAddress?.emailAddress || undefined,
      customerId: user?.id || undefined,
      pickupLocation,
      destinationLocation,
      vehicleType,
      vehicleModel: vehicleModel.trim() || undefined,
      date,
      time,
      notes: fullNotes,
      estimatedFare: estimatedFareResult.totalEstimatedFare,

      pickupCoords,
      destinationCoords,
      intermediateStops: intermediateStops.filter(s => s.latitude !== 0 && s.longitude !== 0),
      isReturnTrip,
      routePolyline: routeResult?.outboundPolyline,
      returnPolyline: routeResult?.returnPolyline,
      estimatedOutboundDistanceKm: estimatedFareResult.outboundDistanceKm,
      estimatedOutboundDurationMinutes: estimatedFareResult.outboundDrivingMinutes,
      estimatedReturnDurationMinutes: estimatedFareResult.returnDrivingMinutes,
      returnJourneyOption,
      billingMethod: estimatedFareResult.billingMethod,
      estimatedTimeBasedCharge: estimatedFareResult.timeBasedCharge,
      estimatedDistanceBasedCharge: estimatedFareResult.distanceBasedCharge,
      estimatedTaxesAndFees: estimatedFareResult.taxesAndFees,
      durationHours: estimatedFareResult.expectedTotalDurationHours,

      pricingSnapshot: {
        serviceType: selectedService,
        baseHourlyRate: driver.startingPrice || adminConfig.hourlyRate,
        hourlyRate: driver.startingPrice || adminConfig.hourlyRate,
        minimumHours: selectedService === 'Outstation Driver' ? 12 : (serviceConfig?.minimumHours || adminConfig.minimumHours),
        partialHourRule: adminConfig.partialHourRule,
        daily24hRate: adminConfig.dailyRate24h,
        overnightCharge: adminConfig.nightAllowance,
        multiDayDiscountPercent: adminConfig.multiDayDiscountPercent,
        includedKmPerDay: adminConfig.outstationIncludedKmPerDay,
        extraPerKmRate: adminConfig.outstationExtraKmRate,
        waitingChargePerHour: adminConfig.waitingChargePerHour,
      },
    };

    try {
      const res = await bookingsService.createBookingAsync(bookingPayload);
      if (res.success && res.booking) {
        if (customerName.trim()) {
          localStorage.setItem('localdrivers_customer_name', customerName.trim());
        }
        if (customerPhone.trim()) {
          const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10);
          if (cleanPhone) {
            localStorage.setItem('localdrivers_verified_customer_phone', cleanPhone);
          }
        }
        setCreatedBooking(res.booking);
        setStep(4); // Success step
        onBookingComplete(res.booking);
      } else {
        setSubmissionError(res.error || 'The driver is no longer available. Please select another driver.');
      }
    } catch (err: any) {
      setSubmissionError(err.message || 'An unexpected error occurred while confirming booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
                <span>📍 {driver.livingArea || driver.area || 'Hyderabad'}</span>
                <span>•</span>
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300 inline" />
                <span>{driver.rating} ({driver.totalTrips} trips)</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar (3 steps) */}
        {step < 4 && (
          <div className="bg-slate-100 h-1.5 w-full shrink-0">
            <div
              className="bg-brand-600 h-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
          
          {/* STEP 1: Route & Blueprint Service Option */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-0.5">
                    Step 1 of 3
                  </span>
                  <h4 className="text-xl font-extrabold text-slate-900">Ride & Route</h4>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500 block">Est. Fare</span>
                  <span className="text-lg font-black text-brand-700">₹{estimatedFareResult.totalEstimatedFare}</span>
                </div>
              </div>

              {/* 2 BLUEPRINT CHOICES: NOW/IN CITY vs FOR LATER/OUTSTATION */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedService('City Driver')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedService === 'City Driver'
                      ? 'border-brand-600 bg-brand-50/80 ring-2 ring-brand-500/20 text-brand-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-black text-xs">
                    <Car className="w-3.5 h-3.5 text-brand-600" />
                    <span>Now / In City</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Hourly travel • ₹200/hr</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedService('Outstation Driver')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedService === 'Outstation Driver'
                      ? 'border-brand-600 bg-brand-50/80 ring-2 ring-brand-500/20 text-brand-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-black text-xs">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span>For Later / OutStation</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Highway trips • ₹1500/day</p>
                </button>
              </div>

              {/* Interactive Map */}
              <div className="rounded-2xl overflow-hidden border border-slate-200">
                <RouteMap
                  pickupCoords={pickupCoords}
                  destinationCoords={destinationCoords}
                  intermediateStops={intermediateStops.filter(s => s.latitude !== 0 && s.longitude !== 0)}
                  outboundPolyline={routeResult?.outboundPolyline || []}
                  returnPolyline={routeResult?.returnPolyline || []}
                  isReturnTrip={isReturnTrip}
                  interactive={true}
                  activePinSelection={activePinSelection}
                  onLocationSelect={handleMapLocationSelect}
                  height="180px"
                />
              </div>

              {/* Pin Selection Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActivePinSelection(activePinSelection === 'pickup' ? 'none' : 'pickup')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activePinSelection === 'pickup'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{activePinSelection === 'pickup' ? 'Tap Map to Set Pickup' : 'Set Pickup on Map'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePinSelection(activePinSelection === 'destination' ? 'none' : 'destination')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activePinSelection === 'destination'
                      ? 'bg-red-600 text-white border-red-600 shadow-sm'
                      : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{activePinSelection === 'destination' ? 'Tap Map to Set Drop' : 'Set Drop on Map'}</span>
                </button>
              </div>

              {/* Pickup Address */}
              <LocationSearchInput
                label="Pickup Address (Where driver reports)"
                value={pickupLocation}
                onChange={val => {
                  userEditedPickupRef.current = true;
                  setPickupLocation(val);
                }}
                onSelectLocation={point => {
                  userEditedPickupRef.current = true;
                  setPickupCoords({ latitude: point.latitude, longitude: point.longitude });
                  setPickupLocation(point.address);
                }}
                onUseGps={handleUseGpsForPickup}
                isGpsLoading={isGpsLocating}
                onToggleMapPin={() => setActivePinSelection(activePinSelection === 'pickup' ? 'none' : 'pickup')}
                isSettingOnMap={activePinSelection === 'pickup'}
                dotColor="emerald"
                showQuickPicks={true}
                placeholder="Search pickup area, landmark or street..."
              />

              {/* Intermediate Stops */}
              {intermediateStops.map((stop, idx) => (
                <div key={stop.id} className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                      Stop {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStop(stop.id)}
                      className="text-amber-700 hover:text-red-600 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                  <LocationSearchInput
                    label={`Stop ${idx + 1} Address`}
                    value={stop.address}
                    onChange={val => handleUpdateStop(stop.id, { address: val })}
                    onSelectLocation={point => {
                      handleUpdateStop(stop.id, {
                        address: point.address,
                        latitude: point.latitude,
                        longitude: point.longitude,
                      });
                    }}
                    dotColor="amber"
                    placeholder="Type stop address or landmark..."
                  />
                </div>
              ))}

              {/* Drop-off Address */}
              <LocationSearchInput
                label="Drop-off Destination"
                value={destinationLocation}
                onChange={setDestinationLocation}
                onSelectLocation={point => {
                  setDestinationCoords({ latitude: point.latitude, longitude: point.longitude });
                  setDestinationLocation(point.address);
                }}
                onToggleMapPin={() => setActivePinSelection(activePinSelection === 'destination' ? 'none' : 'destination')}
                isSettingOnMap={activePinSelection === 'destination'}
                dotColor="red"
                showQuickPicks={true}
                placeholder="Search drop destination or landmark..."
              />

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleAddStop}
                  className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Intermediate Stop</span>
                </button>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={isReturnTrip}
                    onChange={e => setIsReturnTrip(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Round Trip (Return)</span>
                </label>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!pickupLocation.trim() || !destinationLocation.trim()}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <span>Next: Schedule & Vehicle</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Schedule & Vehicle Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-0.5">
                  Step 2 of 3
                </span>
                <h4 className="text-xl font-extrabold text-slate-900">Schedule & Vehicle</h4>
                <p className="text-xs text-slate-500">
                  Specify pickup time and your vehicle transmission.
                </p>
              </div>

              {/* Service Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Trip Date
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setDate(todayStr)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      date === todayStr
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const tmrw = new Date();
                      tmrw.setDate(tmrw.getDate() + 1);
                      setDate(tmrw.toISOString().split('T')[0]);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      date !== todayStr
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Tomorrow
                  </button>
                </div>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                />
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
                    className={`w-full py-2.5 px-3.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
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

                  <input
                    type="time"
                    value={time.includes(':') ? time : '10:00'}
                    onChange={e => setTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                  />
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
                    className={`py-2.5 px-3 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
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
                    className={`py-2.5 px-3 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
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

              {/* Vehicle Type & Model */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Vehicle Category & Model
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {['Hatchback', 'Sedan', 'SUV', 'Luxury'].map((vCat) => (
                    <button
                      type="button"
                      key={vCat}
                      onClick={() => setVehicleType(vCat)}
                      className={`py-2 px-1.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        vehicleType === vCat
                          ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {vCat}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={vehicleModel}
                  onChange={e => setVehicleModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                  placeholder="Car Model (e.g. Swift, Honda City, Creta, Fortuner)"
                />
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-slate-600 font-bold text-xs hover:bg-slate-100 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <span>Next: Contact & Confirm</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Customer Contact & Review & Submit */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-0.5">
                  Step 3 of 3
                </span>
                <h4 className="text-xl font-extrabold text-slate-900">Confirm & Book</h4>
                <p className="text-xs text-slate-500">
                  Review trip details and confirm your verified driver booking.
                </p>
              </div>

              {/* Google Account Association */}
              <div>
                {isSignedIn && user ? (
                  <div className="p-3 bg-sky-50 border border-sky-200 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-sky-100 border border-sky-300 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4 text-sky-700" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-sky-800 uppercase block">Google Linked Rider</span>
                        <span className="text-xs font-bold text-slate-900 truncate block">{user.primaryEmailAddress?.emailAddress}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                      Active
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-amber-900">Sign in with Google (Fast & Verified)</p>
                      <p className="text-[10px] text-amber-700">Link your ride for trip receipts and seamless driver assignment.</p>
                    </div>
                    <div className="shrink-0">
                      <GoogleAuthButton
                        label="Google Sign In"
                        redirectUrl={window.location.pathname}
                        mode="auto"
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shrink-0 flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Contact Details */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number (10 Digits)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-500">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                      placeholder="98765 43210"
                    />
                  </div>
                </div>
              </div>

              {/* Trip Summary Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Selected Driver:</span>
                  <span className="font-black text-slate-900">
                    {driver.name} (#{driver.driverCode})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Driver Living Area:</span>
                  <span className="font-bold text-brand-700">
                    📍 {driver.livingArea || driver.area || 'Hyderabad'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Package:</span>
                  <span className="font-bold text-slate-800">
                    {selectedService === 'City Driver' ? 'Now / In City (Hourly)' : 'For Later / OutStation (Daily)'}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-500 font-medium shrink-0">Pickup:</span>
                  <span className="font-bold text-slate-800 text-right truncate max-w-[260px]">{pickupLocation}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-500 font-medium shrink-0">Drop:</span>
                  <span className="font-bold text-slate-800 text-right truncate max-w-[260px]">{destinationLocation}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Schedule:</span>
                  <span className="font-bold text-slate-900">{date} at {time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Vehicle:</span>
                  <span className="font-bold text-slate-900">{vehicleType} ({transmission}) {vehicleModel ? `• ${vehicleModel}` : ''}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">Estimated Fare</span>
                    <span className="text-[10px] text-slate-400">Zero surge pricing • Cash to driver upon ride completion</span>
                  </div>
                  <span className="text-2xl font-black text-brand-600">
                    ₹{estimatedFareResult.totalEstimatedFare}
                  </span>
                </div>
              </div>

              {submissionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{submissionError}</span>
                </div>
              )}

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-slate-600 font-bold text-xs hover:bg-slate-100 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  onClick={handleConfirmBooking}
                  disabled={isSubmitting || !customerPhone || customerPhone.length < 10}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Booking</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: BLUEPRINT SUCCESS & VIRTUAL PICKUP OTP (1AB2C3 Style) */}
          {step === 4 && createdBooking && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-50">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>

              <div>
                <h4 className="text-2xl font-black text-slate-900">Booking Confirmed!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Your ride booking has been dispatched to <strong>{driver.name}</strong>.
                </p>
              </div>

              {/* VIRTUAL PICKUP OTP BADGE (Rule 7 & Blueprint Plan) */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-5 max-w-sm mx-auto shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block mb-1">
                  Virtual Pickup OTP (Share with Driver on Arrival)
                </span>
                <div className="text-4xl font-mono font-black text-slate-950 tracking-widest my-2 select-all">
                  {(createdBooking as any).virtualPickupOtp || createdBooking.pickupOtp || '1AB2C3'}
                </div>
                <p className="text-[11px] text-amber-900 font-medium leading-tight">
                  Driver will ask for this 6-digit code upon reaching your pickup location to start the official ride timer.
                </p>
              </div>

              {/* Driver Living Area & Details */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left max-w-sm mx-auto text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Assigned Driver:</span>
                  <span className="font-bold text-slate-900">{driver.name} (#{driver.driverCode})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Driver Living Area:</span>
                  <span className="font-extrabold text-brand-700">📍 {driver.livingArea || driver.area || 'Hyderabad'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Driver Contact:</span>
                  <span className="font-bold text-slate-900">+91 {driver.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Estimated Fare:</span>
                  <span className="font-black text-brand-700">₹{createdBooking.estimatedFare} (Pay Cash)</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/bookings/${createdBooking.id}`);
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  View Trip & Live Status &rarr;
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Done
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

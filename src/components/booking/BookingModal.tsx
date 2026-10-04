import React, { useState } from 'react';
import { X, CheckCircle2, Calendar, Clock, MapPin, Navigation, Car, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { Driver, ServiceType, Booking } from '../../types';
import { bookingsService } from '../../services/bookings';
import { dbService } from '../../services/database';

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
  const [step, setStep] = useState<number>(1);

  // Form State
  const [selectedService, setSelectedService] = useState<ServiceType>(
    preselectedService || driver.services[0] || 'City Driver'
  );
  const [customerName, setCustomerName] = useState('Priya Sharma');
  const [customerPhone, setCustomerPhone] = useState('+91 99887 76655');
  const [pickupLocation, setPickupLocation] = useState('Road No. 36, Jubilee Hills, Hyderabad');
  const [destinationLocation, setDestinationLocation] = useState('RGIA Airport, Shamshabad');
  
  // Tomorrow's date default
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [date, setDate] = useState(defaultDateStr);
  const [time, setTime] = useState('09:00 AM');
  const [notes, setNotes] = useState('Automatic transmission car (Honda City). Non-smoker required.');

  // Confirmed booking response
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  // Dynamic Site-Wide Fare Calculation Logic from Admin Dashboard
  const getEstimatedFare = () => {
    const srvConfig = dbService.getServiceByTitle(selectedService);
    if (srvConfig) {
      return srvConfig.startingPrice;
    }
    return driver.startingPrice || 299;
  };

  const estimatedFare = getEstimatedFare();

  const handleConfirmBooking = () => {
    const booking = bookingsService.createBooking({
      driverId: driver.id,
      driverName: driver.name,
      driverPhoto: driver.photo,
      driverPhone: driver.phone,
      serviceTitle: selectedService,
      customerName,
      customerPhone,
      pickupLocation,
      destinationLocation,
      date,
      time,
      notes,
      estimatedFare,
    });

    setCreatedBooking(booking);
    setStep(7); // Confirmation Screen
    onBookingComplete(booking);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 relative my-8">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 to-brand-950 text-white p-5 flex items-center justify-between">
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
              <p className="text-xs text-brand-200">
                ₹{driver.startingPrice}/hr • {driver.rating} ★ ({driver.totalTrips} trips)
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
          <div className="bg-slate-100 h-1.5 w-full">
            <div
              className="bg-brand-600 h-1.5 transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        )}

        {/* Step Contents */}
        <div className="p-6">
          
          {/* STEP 1: Select Service */}
          {step === 1 && (
            <div>
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
                Step 1 of 6
              </span>
              <h4 className="text-xl font-extrabold text-slate-900 mb-2">Select Service</h4>
              <p className="text-xs text-slate-500 mb-4">
                Choose the service requirement for {driver.name}.
              </p>

              <div className="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                {dbService.getServices().map(srv => {
                  const isSupported = driver.services.includes(srv.title);
                  const isSelected = selectedService === srv.title;

                  return (
                    <div
                      key={srv.id}
                      onClick={() => isSupported && setSelectedService(srv.title)}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/20'
                          : isSupported
                          ? 'border-slate-200 hover:border-brand-300 bg-white'
                          : 'border-slate-200/50 bg-slate-50 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{srv.title}</span>
                          {srv.badge && (
                            <span className="text-[10px] font-extrabold bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
                              {srv.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{srv.shortDescription}</p>
                      </div>

                      {!isSupported && (
                        <span className="text-[10px] text-slate-400 font-semibold">Not Offered</span>
                      )}
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

          {/* STEP 2: Pickup Location */}
          {step === 2 && (
            <div>
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
                Step 2 of 6
              </span>
              <h4 className="text-xl font-extrabold text-slate-900 mb-2">Pickup Location</h4>
              <p className="text-xs text-slate-500 mb-4">
                Where should {driver.name} meet you?
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm font-medium"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mobile Number (Mandatory for Driver Direct Call)
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm font-medium"
                    placeholder="+91 Mobile number"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Pickup Address / Landmark
                  </label>
                  <div className="relative">
                    <MapPin className="w-5 h-5 text-brand-600 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={pickupLocation}
                      onChange={e => setPickupLocation(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm font-medium"
                      placeholder="e.g. Jubilee Hills Road 36, Hyderabad"
                    />
                  </div>
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
                  disabled={!pickupLocation.trim() || !customerPhone.trim() || !customerName.trim()}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-600/25 flex items-center gap-2 disabled:opacity-50"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Destination Location */}
          {step === 3 && (
            <div>
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
                Step 3 of 6
              </span>
              <h4 className="text-xl font-extrabold text-slate-900 mb-2">Destination</h4>
              <p className="text-xs text-slate-500 mb-4">
                Where are you traveling to?
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Destination Address / City
                </label>
                <div className="relative">
                  <Navigation className="w-5 h-5 text-emerald-600 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={destinationLocation}
                    onChange={e => setDestinationLocation(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm font-medium"
                    placeholder="e.g. RGIA Airport, Vijayawada, Gachibowli"
                  />
                </div>
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
                  disabled={!destinationLocation.trim()}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-600/25 flex items-center gap-2 disabled:opacity-50"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Date */}
          {step === 4 && (
            <div>
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
                Step 4 of 6
              </span>
              <h4 className="text-xl font-extrabold text-slate-900 mb-2">Select Date</h4>
              <p className="text-xs text-slate-500 mb-4">
                When do you need the driver?
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Booking Date
                </label>
                <div className="relative">
                  <Calendar className="w-5 h-5 text-brand-600 absolute left-3.5 top-3.5" />
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm font-medium"
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
                  disabled={!date}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-600/25 flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Time */}
          {step === 5 && (
            <div>
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
                Step 5 of 6
              </span>
              <h4 className="text-xl font-extrabold text-slate-900 mb-2">Select Time</h4>
              <p className="text-xs text-slate-500 mb-4">
                Choose driver reporting time.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Reporting Time
                </label>
                <div className="relative">
                  <Clock className="w-5 h-5 text-brand-600 absolute left-3.5 top-3.5" />
                  <select
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm font-medium bg-white"
                  >
                    <option value="06:00 AM">06:00 AM (Early Morning)</option>
                    <option value="07:30 AM">07:30 AM</option>
                    <option value="09:00 AM">09:00 AM (Morning Peak)</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="05:00 PM">05:00 PM (Evening Peak)</option>
                    <option value="08:00 PM">08:00 PM (Night Escort)</option>
                    <option value="10:30 PM">10:30 PM (Late Night)</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
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
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: Additional Instructions & Booking Summary */}
          {step === 6 && (
            <div>
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
                Step 6 of 6
              </span>
              <h4 className="text-xl font-extrabold text-slate-900 mb-2">Booking Summary</h4>
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 mb-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Selected Driver:</span>
                  <span className="font-bold text-slate-900">{driver.name}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Service Type:</span>
                  <span className="font-bold text-brand-700">{selectedService}</span>
                </div>
                <div className="flex justify-between items-start text-xs">
                  <span className="text-slate-500 font-medium shrink-0">Pickup:</span>
                  <span className="font-bold text-slate-800 text-right">{pickupLocation}</span>
                </div>
                <div className="flex justify-between items-start text-xs">
                  <span className="text-slate-500 font-medium shrink-0">Destination:</span>
                  <span className="font-bold text-slate-800 text-right">{destinationLocation}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Date & Time:</span>
                  <span className="font-bold text-slate-900">{date} at {time}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Estimated Amount:</span>
                  <span className="text-xl font-black text-brand-600">₹{estimatedFare}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Additional Instructions for Driver (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 text-xs"
                  placeholder="e.g. Automatic car, luggage info, preferred landmark"
                />
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setStep(5)}
                  className="px-4 py-2.5 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-xl flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
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

          {/* STEP 7: Booking Confirmation Screen */}
          {step === 7 && createdBooking && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-50">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>

              <h4 className="text-2xl font-black text-slate-900 mb-1">Booking Request Sent</h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto mb-5">
                Your driver request has been created and dispatched to {driver.name}.
              </p>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left max-w-sm mx-auto space-y-2 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-medium">Booking ID:</span>
                  <span className="font-mono font-extrabold text-sm text-brand-700">{createdBooking.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-medium">Status:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Waiting for driver confirmation
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-medium">Driver:</span>
                  <span className="font-bold text-slate-900 text-xs">{driver.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-medium">Estimated Amount:</span>
                  <span className="font-extrabold text-slate-900 text-xs">₹{createdBooking.estimatedFare}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                <button
                  onClick={() => {
                    onClose();
                    window.location.href = `/bookings/${createdBooking.id}`;
                  }}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  View Booking
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Book Another Driver
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

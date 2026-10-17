import { 
  Driver, Booking, ServiceCategory, Review, UserLocation, 
  GeoLocation, AdminPricingConfig, PricingPolicySnapshot, TripAuditRecord 
} from '../types';
import { billingService, DEFAULT_ADMIN_PRICING_CONFIG } from './billing';

// Default Hyderabad Coordinates (Jubilee Hills / Banjara Hills center)
export const DEFAULT_HYDERABAD_LOCATION: UserLocation = {
  latitude: 17.4126,
  longitude: 78.4071,
  address: "Road No. 36, Jubilee Hills, Hyderabad",
  area: "Jubilee Hills",
  city: "Hyderabad",
  isFallback: true,
};

export const INITIAL_SERVICES: ServiceCategory[] = [
  {
    id: 'srv-1',
    title: 'City Driver',
    shortDescription: 'Driver for local city travel & daily errands',
    fullDescription: 'Professional hourly drivers for navigating city traffic, shopping trips, family outings, and urban commutes in your vehicle.',
    icon: 'Car',
    startingPrice: 299,
    extraHourRate: 99,
    nightAllowance: 200,
    minimumHours: 2,
    badge: 'Popular',
    isActive: true,
  },
  {
    id: 'srv-2',
    title: 'Outstation Driver',
    shortDescription: 'Experienced drivers for long-distance journeys',
    fullDescription: 'Highway-certified drivers trained for night driving, mountain terrains, and long-distance road trips across states.',
    icon: 'MapPin',
    startingPrice: 1499,
    extraHourRate: 150,
    nightAllowance: 300,
    minimumHours: 12,
    outstationPerKmRate: 12,
    badge: 'Top Rated',
    isActive: true,
  },
  {
    id: 'srv-3',
    title: 'Monthly Driver',
    shortDescription: 'Permanent Driver for your daily needs',
    fullDescription: 'Full-time or part-time monthly dedicated drivers tailored for executives, senior citizens, and daily office drop/pickups (₹28,000 / ₹32,000 per month).',
    icon: 'Calendar',
    startingPrice: 28000,
    extraHourRate: 120,
    nightAllowance: 250,
    minimumHours: 200,
    badge: 'Best Value',
    isActive: true,
  },
  {
    id: 'srv-4',
    title: 'Personal Driver',
    shortDescription: 'Regular driver for your personal vehicle',
    fullDescription: 'Flexible on-demand private drivers for personal cars (Manual & Automatic) available on short notice.',
    icon: 'UserCheck',
    startingPrice: 349,
    extraHourRate: 99,
    nightAllowance: 200,
    minimumHours: 2,
    isActive: true,
  },
  {
    id: 'srv-5',
    title: 'VIP Driver',
    shortDescription: 'Professional Driver for Luxury & Executive Cars',
    fullDescription: 'Formal chauffeurs trained to drive high-end luxury vehicles in your own car.',
    icon: 'Crown',
    startingPrice: 1000,
    extraHourRate: 250,
    nightAllowance: 400,
    minimumHours: 4,
    badge: 'Premium',
    isActive: true,
  },
  {
    id: 'srv-6',
    title: 'Escort Driver',
    shortDescription: 'Experienced drivers for executive & special travel',
    fullDescription: 'Specially vetted drivers providing secure transit for night travel, late event returns, corporate delegates, and special guests.',
    icon: 'ShieldCheck',
    startingPrice: 899,
    extraHourRate: 199,
    nightAllowance: 300,
    minimumHours: 4,
    isActive: true,
  },
];

export const generateDriverCode = (): string => {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const numbers = '123456789';
  const l1 = letters.charAt(Math.floor(Math.random() * letters.length));
  const n1 = numbers.charAt(Math.floor(Math.random() * numbers.length));
  const l2 = letters.charAt(Math.floor(Math.random() * letters.length));
  const n2 = numbers.charAt(Math.floor(Math.random() * numbers.length));
  const l3 = letters.charAt(Math.floor(Math.random() * letters.length));
  const n3 = numbers.charAt(Math.floor(Math.random() * numbers.length));
  return `${l1}${n1}${l2}${n2}${l3}${n3}`;
};

export const INITIAL_DRIVERS: Driver[] = [];

export const INITIAL_BOOKINGS: Booking[] = [];

export const INITIAL_REVIEWS: Review[] = [];

// Platform Fee Calculator (Tiered Structure)
export const calculateCommissionFee = (fare: number, serviceTitle?: string): number => {
  if (serviceTitle === 'Monthly Driver' || fare >= 28000) return 1500;
  if (!fare || fare <= 0) return 25;
  if (fare >= 299 && fare <= 499) return 25; // Short City Errand (2 Hours) -> ₹25
  if (fare >= 500 && fare <= 999) return 40; // Driver Now (4H / 8H City) -> ₹40
  if (fare >= 1000 && fare <= 1999) return 50; // Full Day / Outstation Return -> ₹50 (Tiered Flat Fee)
  if (fare >= 2000) return 100; // Multi-Day Outstation / Luxury -> ₹100 (Tiered Flat Fee)
  return 25;
};

// Reactive Database Storage Layer (Local-First & Production-Ready)
class DatabaseService {
  private driversKey = 'localdrivers_db_drivers';
  private bookingsKey = 'localdrivers_db_bookings';
  private reviewsKey = 'localdrivers_db_reviews';
  private servicesKey = 'localdrivers_db_services';
  private pricingConfigKey = 'localdrivers_db_pricing_config';
  private listeners: (() => void)[] = [];

  constructor() {
    this.initDatabase();
    this.startAutoReassignmentEngine();
  }

  private startAutoReassignmentEngine() {
    if (typeof window === 'undefined') return;
    setInterval(() => {
      const bookings = this.getBookings();
      const now = Date.now();

      bookings.forEach(b => {
        if (b.status === 'Pending') {
          const assignedTime = new Date(b.assignedAt || b.createdAt).getTime();
          const elapsed = (now - assignedTime) / 1000;
          if (elapsed >= 20) {
            this.reassignBookingToNextDriver(b.id);
          }
        }
      });
    }, 2000);
  }

  private initDatabase() {
    const versionKey = 'localdrivers_db_v7_production_clean';
    if (!localStorage.getItem(versionKey)) {
      localStorage.removeItem(this.driversKey);
      localStorage.removeItem(this.bookingsKey);
      localStorage.removeItem(this.reviewsKey);
      localStorage.setItem(versionKey, 'true');
    }

    if (!localStorage.getItem(this.driversKey)) {
      localStorage.setItem(this.driversKey, JSON.stringify(INITIAL_DRIVERS));
    }
    if (!localStorage.getItem(this.bookingsKey)) {
      localStorage.setItem(this.bookingsKey, JSON.stringify(INITIAL_BOOKINGS));
    }
    if (!localStorage.getItem(this.reviewsKey)) {
      localStorage.setItem(this.reviewsKey, JSON.stringify(INITIAL_REVIEWS));
    }
    if (!localStorage.getItem(this.servicesKey)) {
      localStorage.setItem(this.servicesKey, JSON.stringify(INITIAL_SERVICES));
    }
    if (!localStorage.getItem(this.pricingConfigKey)) {
      localStorage.setItem(this.pricingConfigKey, JSON.stringify(DEFAULT_ADMIN_PRICING_CONFIG));
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  // --- ADMIN PRICING CONFIGURATION ---
  public getAdminPricingConfig(): AdminPricingConfig {
    const raw = localStorage.getItem(this.pricingConfigKey);
    return raw ? JSON.parse(raw) : DEFAULT_ADMIN_PRICING_CONFIG;
  }

  public updateAdminPricingConfig(updates: Partial<AdminPricingConfig>): AdminPricingConfig {
    const current = this.getAdminPricingConfig();
    const updated = { ...current, ...updates };
    localStorage.setItem(this.pricingConfigKey, JSON.stringify(updated));
    this.notify();
    return updated;
  }

  // --- SERVICE CATEGORIES & SITE-WIDE PRICING CRUD ---
  public getServices(): ServiceCategory[] {
    const raw = localStorage.getItem(this.servicesKey);
    return raw ? JSON.parse(raw) : INITIAL_SERVICES;
  }

  public getServiceByTitle(title: string): ServiceCategory | undefined {
    return this.getServices().find(s => s.title === title);
  }

  public updateService(id: string, updates: Partial<ServiceCategory>): ServiceCategory | undefined {
    const services = this.getServices();
    const index = services.findIndex(s => s.id === id);
    if (index !== -1) {
      services[index] = { ...services[index], ...updates };
      localStorage.setItem(this.servicesKey, JSON.stringify(services));
      this.notify();
      return services[index];
    }
    return undefined;
  }

  // --- DRIVERS CRUD & DISCOVERY ---
  public getDrivers(): Driver[] {
    const raw = localStorage.getItem(this.driversKey);
    return raw ? JSON.parse(raw) : INITIAL_DRIVERS;
  }

  public getApprovedDrivers(): Driver[] {
    return this.getDrivers().filter(d => d.status === 'Approved');
  }

  // Discovery: Find online available drivers (excludes drivers assigned to active in-progress bookings)
  public getAvailableOnlineDrivers(pickupCoords?: { latitude: number; longitude: number }): Driver[] {
    const approved = this.getApprovedDrivers();
    const available = approved.filter(d => d.isOnline && !d.isHold && !d.activeBookingId);

    if (pickupCoords && pickupCoords.latitude && pickupCoords.longitude) {
      // Calculate straight-line proximity for initial discovery sorting
      return available.map(d => {
        const dLat = d.lastKnownLocation?.latitude || d.latitude;
        const dLng = d.lastKnownLocation?.longitude || d.longitude;
        const dist = Number((
          Math.sqrt(
            Math.pow((dLat - pickupCoords.latitude) * 111, 2) +
            Math.pow((dLng - pickupCoords.longitude) * 111 * Math.cos(pickupCoords.latitude * Math.PI / 180), 2)
          )
        ).toFixed(1));
        return { ...d, distanceKm: Math.max(0.3, dist) };
      }).sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return available;
  }

  public getDriverById(id: string): Driver | undefined {
    return this.getDrivers().find(d => d.id === id);
  }

  public getDriverByCode(code: string): Driver | undefined {
    const clean = code.trim().toUpperCase();
    return this.getDrivers().find(d => d.driverCode?.toUpperCase() === clean);
  }

  public getDriverByPhone(phone: string): Driver | undefined {
    const cleanDigits = phone.replace(/\D/g, '');
    return this.getDrivers().find(d => {
      const dDigits = d.phone.replace(/\D/g, '');
      return dDigits.endsWith(cleanDigits) || cleanDigits.endsWith(dDigits);
    });
  }

  public toggleDriverOnline(id: string, isOnline: boolean, location?: GeoLocation): Driver | undefined {
    const drivers = this.getDrivers();
    const index = drivers.findIndex(d => d.id === id);
    if (index !== -1) {
      if (isOnline && (drivers[index].pendingCommissionFee || 0) > 0) {
        drivers[index].isHold = true;
        drivers[index].isOnline = false;
        drivers[index].status = 'Payment Due';
        localStorage.setItem(this.driversKey, JSON.stringify(drivers));
        this.notify();
        return drivers[index];
      }

      drivers[index].isOnline = isOnline;
      if (location) {
        drivers[index].lastKnownLocation = location;
        drivers[index].lastLocationUpdatedAt = new Date().toISOString();
        if (location.latitude && location.longitude) {
          drivers[index].latitude = location.latitude;
          drivers[index].longitude = location.longitude;
        }
      }

      localStorage.setItem(this.driversKey, JSON.stringify(drivers));
      this.notify();
      return drivers[index];
    }
    return undefined;
  }

  public payDriverCommissionFee(id: string, amount: number): Driver | undefined {
    const drivers = this.getDrivers();
    const index = drivers.findIndex(d => d.id === id);
    if (index !== -1) {
      const currentFee = drivers[index].pendingCommissionFee || 0;
      const newFee = Math.max(0, currentFee - amount);
      drivers[index].pendingCommissionFee = newFee;

      if (newFee <= 0) {
        drivers[index].isHold = false;
        drivers[index].status = 'Approved';
        drivers[index].isOnline = true;
      }

      localStorage.setItem(this.driversKey, JSON.stringify(drivers));
      this.notify();
      return drivers[index];
    }
    return undefined;
  }

  public addDriver(driverInput: Omit<Driver, 'id' | 'driverCode' | 'status' | 'verificationBadge' | 'joinedDate' | 'isOnline' | 'isHold' | 'pendingCommissionFee'>): Driver {
    const drivers = this.getDrivers();
    const id = `drv-${Date.now()}`;
    const driverCode = generateDriverCode();
    const now = new Date().toISOString().split('T')[0];

    const newDriver: Driver = {
      ...driverInput,
      id,
      driverCode,
      status: 'Pending',
      verificationBadge: false,
      isHold: false,
      isOnline: false,
      pendingCommissionFee: 0,
      joinedDate: now,
    };

    drivers.unshift(newDriver);
    localStorage.setItem(this.driversKey, JSON.stringify(drivers));
    this.notify();
    return newDriver;
  }

  public updateDriver(id: string, updates: Partial<Driver>): Driver | undefined {
    const drivers = this.getDrivers();
    const index = drivers.findIndex(d => d.id === id);
    if (index !== -1) {
      drivers[index] = { ...drivers[index], ...updates };
      localStorage.setItem(this.driversKey, JSON.stringify(drivers));
      this.notify();
      return drivers[index];
    }
    return undefined;
  }

  public approveDriver(id: string): Driver | undefined {
    return this.updateDriver(id, {
      status: 'Approved',
      verificationBadge: true,
      isHold: false,
      isOnline: true,
      pendingCommissionFee: 0,
    });
  }

  public rejectDriver(id: string, reason?: string): Driver | undefined {
    return this.updateDriver(id, {
      status: 'Rejected',
      verificationBadge: false,
      isOnline: false,
      description: reason ? `Rejected: ${reason}` : 'Application rejected by compliance team.',
    });
  }

  public getPendingDrivers(): Driver[] {
    return this.getDrivers().filter(d => d.status === 'Pending');
  }

  public updateDriverStatus(id: string, status: any): Driver | undefined {
    return this.updateDriver(id, { status });
  }

  public toggleDriverHold(id: string, isHold: boolean): Driver | undefined {
    return this.updateDriver(id, { isHold });
  }

  public updateDriverProfile(id: string, updates: Partial<Driver>): Driver | undefined {
    return this.updateDriver(id, updates);
  }

  public registerDriver(driverInput: Omit<Driver, 'id' | 'driverCode' | 'status' | 'verificationBadge' | 'joinedDate' | 'isOnline' | 'isHold' | 'pendingCommissionFee'>): Driver {
    return this.addDriver(driverInput);
  }

  public updateServiceCategory(service: ServiceCategory): ServiceCategory | undefined {
    return this.updateService(service.id, service);
  }

  public resetServicesToDefaults(): ServiceCategory[] {
    localStorage.setItem(this.servicesKey, JSON.stringify(INITIAL_SERVICES));
    this.notify();
    return INITIAL_SERVICES;
  }

  // --- BOOKINGS CRUD & AUTHORITATIVE TRIP ENGINE ---
  public getBookings(): Booking[] {
    const raw = localStorage.getItem(this.bookingsKey);
    return raw ? JSON.parse(raw) : INITIAL_BOOKINGS;
  }

  public getBookingById(id: string): Booking | undefined {
    return this.getBookings().find(b => b.id === id);
  }

  public getBookingsForDriver(driverId: string): Booking[] {
    return this.getBookings().filter(b => b.driverId === driverId);
  }

  public createBooking(bookingInput: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Booking {
    const bookings = this.getBookings();
    const id = `LD-${new Date().getFullYear()}-${String(bookings.length + 1).padStart(4, '0')}`;
    const nowIso = new Date().toISOString();

    const config = this.getAdminPricingConfig();
    const pricingSnapshot: PricingPolicySnapshot = bookingInput.pricingSnapshot || {
      serviceType: bookingInput.serviceTitle,
      baseHourlyRate: config.hourlyRate,
      minimumHours: config.minimumHours,
      partialHourRule: config.partialHourRule,
      daily24hRate: config.dailyRate24h,
      overnightCharge: config.nightAllowance,
      multiDayDiscountPercent: config.multiDayDiscountPercent,
      includedKmPerDay: config.outstationIncludedKmPerDay,
      extraPerKmRate: config.outstationExtraKmRate,
    };

    const newBooking: Booking = {
      ...bookingInput,
      id,
      status: 'Pending',
      pricingSnapshot,
      createdAt: nowIso,
      updatedAt: nowIso,
      assignedAt: nowIso,
      attemptedDriverIds: [bookingInput.driverId],
    };

    bookings.unshift(newBooking);
    localStorage.setItem(this.bookingsKey, JSON.stringify(bookings));
    this.notify();
    return newBooking;
  }

  public reassignBookingToNextDriver(bookingId: string): Booking | undefined {
    const bookings = this.getBookings();
    const index = bookings.findIndex(b => b.id === bookingId);
    if (index === -1) return undefined;

    const booking = bookings[index];
    if (booking.status !== 'Pending') return booking;

    const attempted = [...(booking.attemptedDriverIds || [])];
    if (!attempted.includes(booking.driverId)) {
      attempted.push(booking.driverId);
    }

    const available = this.getAvailableOnlineDrivers(booking.pickupCoords);
    const onlineCandidates = available.filter(d => !attempted.includes(d.id));

    const nowIso = new Date().toISOString();

    if (onlineCandidates.length > 0) {
      const nextDriver = onlineCandidates[0];
      attempted.push(nextDriver.id);

      bookings[index].driverId = nextDriver.id;
      bookings[index].driverName = nextDriver.name;
      bookings[index].driverPhoto = nextDriver.photo;
      bookings[index].driverPhone = nextDriver.phone;
      bookings[index].driverCode = nextDriver.driverCode;
      bookings[index].assignedAt = nowIso;
      bookings[index].updatedAt = nowIso;
      bookings[index].attemptedDriverIds = attempted;

      localStorage.setItem(this.bookingsKey, JSON.stringify(bookings));
      this.notify();
      return bookings[index];
    } else {
      bookings[index].assignedAt = nowIso;
      bookings[index].attemptedDriverIds = [booking.driverId];
      localStorage.setItem(this.bookingsKey, JSON.stringify(bookings));
      this.notify();
      return bookings[index];
    }
  }

  // START TRIP: Authoritative Server Timestamp, Location Capture, Status In Progress
  public startTrip(bookingId: string, location?: GeoLocation, odometerStartKm?: number): Booking | undefined {
    const bookings = this.getBookings();
    const index = bookings.findIndex(b => b.id === bookingId);
    if (index === -1) return undefined;

    const nowIso = new Date().toISOString();
    bookings[index].status = 'In Progress';
    bookings[index].tripStartedAt = nowIso;
    bookings[index].tripStartLocation = location;
    bookings[index].updatedAt = nowIso;
    if (odometerStartKm !== undefined) {
      bookings[index].odometerStartKm = odometerStartKm;
    }

    // Set activeBookingId on assigned driver to prevent discovery for conflicting jobs
    const driverId = bookings[index].driverId;
    const drivers = this.getDrivers();
    const drvIndex = drivers.findIndex(d => d.id === driverId);
    if (drvIndex !== -1) {
      drivers[drvIndex].activeBookingId = bookingId;
      localStorage.setItem(this.driversKey, JSON.stringify(drivers));
    }

    localStorage.setItem(this.bookingsKey, JSON.stringify(bookings));
    this.notify();
    return bookings[index];
  }

  // COMPLETE TRIP: Idempotent finalization, authoritative duration & itemized charges
  public completeTrip(
    bookingId: string,
    location?: GeoLocation,
    completedBy: 'customer' | 'driver' = 'customer',
    odometerEndKm?: number
  ): Booking | undefined {
    const bookings = this.getBookings();
    const index = bookings.findIndex(b => b.id === bookingId);
    if (index === -1) return undefined;

    const booking = bookings[index];
    // Idempotent guard
    if (booking.status === 'Completed') {
      return booking;
    }

    const nowIso = new Date().toISOString();
    bookings[index].status = 'Completed';
    bookings[index].tripCompletedAt = nowIso;
    bookings[index].tripEndLocation = location;
    bookings[index].updatedAt = nowIso;

    if (completedBy === 'customer') {
      bookings[index].customerCompleted = true;
    } else {
      bookings[index].driverCompleted = true;
    }

    // Odometer verification if recorded
    if (odometerEndKm !== undefined && booking.odometerStartKm !== undefined) {
      const distance = Math.max(0, odometerEndKm - booking.odometerStartKm);
      bookings[index].odometerEndKm = odometerEndKm;
      bookings[index].actualTraveledKm = distance;
      bookings[index].distanceSource = 'odometer';
      bookings[index].distanceVerified = true;
    } else {
      bookings[index].distanceSource = 'estimated_only';
      bookings[index].distanceVerified = false;
    }

    // Calculate final billing charges
    const calc = billingService.calculateTripCharges(bookings[index], Date.now());
    bookings[index].elapsedSeconds = calc.elapsedSeconds;
    bookings[index].billableHours = calc.billableHours;
    bookings[index].timeBasedCharge = calc.timeBasedCharge;
    bookings[index].distanceBasedCharge = calc.distanceBasedCharge;
    bookings[index].nightCharges = calc.nightCharges;
    bookings[index].finalFare = calc.totalEstimatedOrFinal;

    // Platform Fee & Driver Hold clearance
    const driverId = bookings[index].driverId;
    const finalFare = calc.totalEstimatedOrFinal || bookings[index].estimatedFare || 1000;
    const commissionFee = calculateCommissionFee(finalFare, bookings[index].serviceTitle);
    bookings[index].commissionFee = commissionFee;
    bookings[index].commissionSettled = false;

    const drivers = this.getDrivers();
    const drvIndex = drivers.findIndex(d => d.id === driverId);
    if (drvIndex !== -1) {
      drivers[drvIndex].pendingCommissionFee = (drivers[drvIndex].pendingCommissionFee || 0) + commissionFee;
      drivers[drvIndex].isHold = true;
      drivers[drvIndex].status = 'Payment Due';
      drivers[drvIndex].activeBookingId = undefined; // release lock
      drivers[drvIndex].paymentLinkUrl = `https://pay.localdrivers.in/upi?amount=${commissionFee}&driver=${drivers[drvIndex].driverCode || driverId}`;
      localStorage.setItem(this.driversKey, JSON.stringify(drivers));
    }

    localStorage.setItem(this.bookingsKey, JSON.stringify(bookings));
    this.notify();
    return bookings[index];
  }

  // Raise Dispute
  public raiseTripDispute(bookingId: string, reason: string): Booking | undefined {
    const bookings = this.getBookings();
    const index = bookings.findIndex(b => b.id === bookingId);
    if (index !== -1) {
      bookings[index].status = 'Disputed';
      bookings[index].disputeFlag = true;
      bookings[index].disputeReason = reason;
      bookings[index].updatedAt = new Date().toISOString();
      localStorage.setItem(this.bookingsKey, JSON.stringify(bookings));
      this.notify();
      return bookings[index];
    }
    return undefined;
  }

  // Admin Manual Correction with Mandatory Reason
  public adminCorrectTrip(
    bookingId: string,
    changes: Partial<Booking>,
    adminEmail: string,
    reason: string
  ): Booking | undefined {
    const bookings = this.getBookings();
    const index = bookings.findIndex(b => b.id === bookingId);
    if (index !== -1) {
      const audit: TripAuditRecord = {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        adminEmail,
        reason,
        changes: JSON.stringify(changes),
      };

      const auditList = [...(bookings[index].auditHistory || []), audit];
      bookings[index] = {
        ...bookings[index],
        ...changes,
        auditHistory: auditList,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(this.bookingsKey, JSON.stringify(bookings));
      this.notify();
      return bookings[index];
    }
    return undefined;
  }

  public updateBookingStatus(id: string, status: Booking['status']): Booking | undefined {
    const bookings = this.getBookings();
    const index = bookings.findIndex(b => b.id === id);
    if (index !== -1) {
      bookings[index].status = status;
      bookings[index].updatedAt = new Date().toISOString();

      if (status === 'Completed') {
        return this.completeTrip(id);
      }

      localStorage.setItem(this.bookingsKey, JSON.stringify(bookings));
      this.notify();
      return bookings[index];
    }
    return undefined;
  }

  // --- REVIEWS ---
  public getReviewsForDriver(driverId: string): Review[] {
    const raw = localStorage.getItem(this.reviewsKey);
    const reviews: Review[] = raw ? JSON.parse(raw) : INITIAL_REVIEWS;
    return reviews.filter(r => r.driverId === driverId);
  }

  public addReview(reviewInput: Omit<Review, 'id' | 'date'>): Review {
    const raw = localStorage.getItem(this.reviewsKey);
    const reviews: Review[] = raw ? JSON.parse(raw) : INITIAL_REVIEWS;

    const newReview: Review = {
      ...reviewInput,
      id: `rev-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };

    reviews.unshift(newReview);
    localStorage.setItem(this.reviewsKey, JSON.stringify(reviews));

    // Recalculate average rating for driver
    const driverReviews = reviews.filter(r => r.driverId === reviewInput.driverId);
    const avgRating = Number((driverReviews.reduce((sum, r) => sum + r.rating, 0) / driverReviews.length).toFixed(1));
    this.updateDriver(reviewInput.driverId, {
      rating: avgRating,
      totalTrips: (this.getDriverById(reviewInput.driverId)?.totalTrips || 0) + 1,
    });

    this.notify();
    return newReview;
  }
}

export const dbService = new DatabaseService();

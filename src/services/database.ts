import { Driver, Booking, ServiceCategory, Review, UserLocation } from '../types';

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
    shortDescription: 'Car + Driver / Self Drive - Premium Luxury Cars',
    fullDescription: 'Chauffeurs dressed in formal attire trained for high-end luxury vehicles (BMW, Audi, Mercedes, Volvo, Jaguar).',
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

// Platform Commission Fee Calculator (3-5% Tiered Structure)
export const calculateCommissionFee = (fare: number): number => {
  if (!fare || fare <= 0) return 40;
  if (fare < 500) return 25; // < ₹500 -> ₹25 fee
  if (fare >= 500 && fare < 1000) return 40; // ₹500 - ₹1,000 -> ₹40 fee
  if (fare >= 1000 && fare < 2000) return 50; // ₹1,000 -> ₹50 fee
  if (fare >= 2000) return Math.round(fare * 0.05); // ₹2,000 -> ₹100 fee (5%)
  return Math.max(25, Math.round(fare * 0.05));
};

// Reactive Database Storage Layer (Turso Ready Schema)
class DatabaseService {
  private driversKey = 'localdrivers_db_drivers';
  private bookingsKey = 'localdrivers_db_bookings';
  private reviewsKey = 'localdrivers_db_reviews';
  private servicesKey = 'localdrivers_db_services';
  private listeners: (() => void)[] = [];

  constructor() {
    this.initDatabase();
  }

  private initDatabase() {
    const versionKey = 'localdrivers_db_v3_clean';
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

  // --- SERVICE CATEGORIES & SITE-WIDE PRICING CRUD ---
  public getServices(): ServiceCategory[] {
    const raw = localStorage.getItem(this.servicesKey);
    return raw ? JSON.parse(raw) : INITIAL_SERVICES;
  }

  public getServiceByTitle(title: string): ServiceCategory | undefined {
    return this.getServices().find(s => s.title === title);
  }

  public updateServiceCategory(serviceData: ServiceCategory): ServiceCategory {
    const services = this.getServices();
    const index = services.findIndex(s => s.id === serviceData.id || s.title === serviceData.title);
    if (index !== -1) {
      services[index] = { ...services[index], ...serviceData };
    } else {
      services.push(serviceData);
    }
    localStorage.setItem(this.servicesKey, JSON.stringify(services));
    this.notify();
    return services[index !== -1 ? index : services.length - 1];
  }

  public resetServicesToDefaults(): ServiceCategory[] {
    localStorage.setItem(this.servicesKey, JSON.stringify(INITIAL_SERVICES));
    this.notify();
    return INITIAL_SERVICES;
  }

  // --- DRIVERS CRUD ---
  public getDrivers(): Driver[] {
    const raw = localStorage.getItem(this.driversKey);
    return raw ? JSON.parse(raw) : INITIAL_DRIVERS;
  }

  public getDriverById(id: string): Driver | undefined {
    return this.getDrivers().find(d => d.id === id);
  }

  public getApprovedDrivers(): Driver[] {
    return this.getDrivers().filter(d => 
      d.status === 'Approved' && 
      !d.isHold && 
      (!d.pendingCommissionFee || d.pendingCommissionFee <= 0)
    );
  }

  public getPendingDrivers(): Driver[] {
    return this.getDrivers().filter(d => d.status === 'Pending');
  }

  public toggleDriverHold(id: string, hold: boolean): Driver | undefined {
    const drivers = this.getDrivers();
    const index = drivers.findIndex(d => d.id === id);
    if (index !== -1) {
      drivers[index].isHold = hold;
      if (hold) {
        drivers[index].status = 'Hold';
      } else {
        if ((drivers[index].pendingCommissionFee || 0) <= 0) {
          drivers[index].status = 'Approved';
        } else {
          drivers[index].status = 'Payment Due';
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
        drivers[index].paymentLinkUrl = undefined;
      }
      localStorage.setItem(this.driversKey, JSON.stringify(drivers));
      this.notify();
      return drivers[index];
    }
    return undefined;
  }

  public updateDriverStatus(id: string, status: 'Approved' | 'Rejected' | 'Hold' | 'Payment Due'): Driver | undefined {
    const drivers = this.getDrivers();
    const index = drivers.findIndex(d => d.id === id);
    if (index !== -1) {
      drivers[index].status = status;
      if (status === 'Approved') {
        drivers[index].verificationBadge = true;
        drivers[index].isHold = false;
        drivers[index].pendingCommissionFee = 0;
        drivers[index].documents = drivers[index].documents.map(doc => ({
          ...doc,
          status: 'Verified'
        }));
      } else if (status === 'Hold') {
        drivers[index].isHold = true;
      }
      localStorage.setItem(this.driversKey, JSON.stringify(drivers));
      this.notify();
      return drivers[index];
    }
    return undefined;
  }

  public toggleDriverOnline(id: string, isOnline: boolean): Driver | undefined {
    const drivers = this.getDrivers();
    const index = drivers.findIndex(d => d.id === id);
    if (index !== -1) {
      drivers[index].isOnline = isOnline;
      localStorage.setItem(this.driversKey, JSON.stringify(drivers));
      this.notify();
      return drivers[index];
    }
    return undefined;
  }

  public updateDriverProfile(id: string, updates: Partial<Driver>): Driver | undefined {
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

  public registerDriver(input: {
    name: string;
    phone: string;
    email?: string;
    area: string;
    city?: string;
    experienceYears: number;
    languages: string[];
    services: string[];
    vehicleCategories: string[];
    description?: string;
    photoUrl?: string;
    aadhaarUrl?: string;
    licenseUrl?: string;
  }): Driver {
    const drivers = this.getDrivers();
    const cleanPhoneDigits = input.phone.replace(/\D/g, '');
    const newId = `drv-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];

    const defaultSelfie = input.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=400';
    const defaultAadhaar = input.aadhaarUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800';
    const defaultDL = input.licenseUrl || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800';

    const newDriver: Driver = {
      id: newId,
      driverCode: generateDriverCode(),
      name: input.name,
      photo: defaultSelfie,
      phone: input.phone,
      email: input.email || `${cleanPhoneDigits}@localdrivers.in`,
      rating: 5.0,
      totalTrips: 0,
      experienceYears: input.experienceYears || 1,
      languages: input.languages && input.languages.length > 0 ? input.languages : ['Telugu', 'Hindi'],
      services: (input.services as any) || ['City Driver'],
      vehicleCategories: (input.vehicleCategories as any) || ['Manual', 'Automatic'],
      status: 'Pending',
      isOnline: false,
      startingPrice: 299,
      distanceKm: 2.5,
      latitude: 17.4126,
      longitude: 78.4071,
      area: input.area || 'Jubilee Hills',
      city: input.city || 'Hyderabad',
      verificationBadge: false,
      documents: [
        { id: `doc-${Date.now()}-1`, type: 'Profile Photo Selfie', status: 'Under Review', url: defaultSelfie, uploadedAt: today },
        { id: `doc-${Date.now()}-2`, type: 'Aadhaar Card', status: 'Under Review', url: defaultAadhaar, uploadedAt: today },
        { id: `doc-${Date.now()}-3`, type: 'Driving Licence', status: 'Under Review', url: defaultDL, uploadedAt: today },
      ],
      description: input.description || 'Newly registered driver partner. Awaiting document verification by Admin.',
      joinedDate: today,
    };

    drivers.unshift(newDriver);
    localStorage.setItem(this.driversKey, JSON.stringify(drivers));
    this.notify();
    return newDriver;
  }

  // --- BOOKINGS CRUD ---
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

  public createBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Booking {
    const bookings = this.getBookings();
    const count = bookings.length + 1;
    const newId = `LD-2026-${String(count).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const targetDriver = this.getDriverById(bookingData.driverId);
    const driverCode = targetDriver?.driverCode || generateDriverCode();

    const newBooking: Booking = {
      ...bookingData,
      id: newId,
      driverCode,
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
    };

    bookings.unshift(newBooking);
    localStorage.setItem(this.bookingsKey, JSON.stringify(bookings));
    this.notify();
    return newBooking;
  }

  public updateBookingStatus(id: string, status: Booking['status']): Booking | undefined {
    const bookings = this.getBookings();
    const index = bookings.findIndex(b => b.id === id);
    if (index !== -1) {
      bookings[index].status = status;
      bookings[index].updatedAt = new Date().toISOString();

      // AUTOMATIC TIERED COMMISSION FEE (3-5%) & PROFILE HOLD LOGIC UPON RIDE COMPLETION
      if (status === 'Completed') {
        const driverId = bookings[index].driverId;
        const fare = bookings[index].estimatedFare || 1000;
        const commissionFee = calculateCommissionFee(fare);
        
        const drivers = this.getDrivers();
        const drvIndex = drivers.findIndex(d => d.id === driverId);
        if (drvIndex !== -1) {
          drivers[drvIndex].pendingCommissionFee = (drivers[drvIndex].pendingCommissionFee || 0) + commissionFee;
          drivers[drvIndex].isHold = true;
          drivers[drvIndex].status = 'Payment Due';
          drivers[drvIndex].paymentLinkUrl = `https://pay.localdrivers.in/upi?amount=${commissionFee}&driver=${driverId}`;
          localStorage.setItem(this.driversKey, JSON.stringify(drivers));
        }
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
}

export const dbService = new DatabaseService();

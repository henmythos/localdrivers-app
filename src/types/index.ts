export type ServiceType =
  | 'City Driver'
  | 'Outstation Driver'
  | 'Monthly Driver'
  | 'Personal Driver'
  | 'VIP Driver'
  | 'Escort Driver';

export type DriverStatus = 'Approved' | 'Pending' | 'Rejected' | 'Hold' | 'Payment Due';

export type BookingStatus =
  | 'Pending'
  | 'Accepted'
  | 'Driver Arriving'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled'
  | 'Disputed';

export interface DocumentItem {
  id: string;
  type:
  | 'Profile Photo Selfie'
  | 'Aadhaar Card' // legacy backwards-compatible
  | 'Aadhaar Card (Front)'
  | 'Aadhaar Card (Back)'
  | 'Driving Licence' // legacy backwards-compatible
  | 'Driving Licence (Front)'
  | 'Driving Licence (Back)';
  status: 'Verified' | 'Under Review' | 'Rejected' | 'Not Uploaded';
  url?: string;
  rejectionReason?: string;
  uploadedAt?: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number; // GPS accuracy radius in meters
  address?: string;
  recordedAt?: string; // Server UTC ISO timestamp
  source?: 'gps' | 'map_pin' | 'address_search' | 'unavailable';
}

export interface TripStop {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface TripAuditRecord {
  id: string;
  timestamp: string;
  adminEmail: string;
  reason: string;
  changes: string;
}

export interface PricingPolicySnapshot {
  serviceType: ServiceType;
  baseHourlyRate: number; // in INR
  hourlyRate?: number; // alias in INR
  minimumHours: number;
  partialHourRule: 'ceil_hour' | 'exact_fraction' | '15_min_block';
  daily24hRate: number; // in INR
  overnightCharge: number; // in INR (10 PM - 6 AM)
  multiDayDiscountPercent: number; // e.g., 10%
  includedKmPerDay?: number;
  extraPerKmRate?: number;
  waitingChargePerHour?: number;
  overtimePerHourRate?: number;
  taxPercent?: number;
}

export interface AdminPricingConfig {
  hourlyRate: number; // e.g., ₹200/hr
  minimumHours: number; // e.g., 2
  minimumBookingDurationHours: number; // e.g., 2
  partialHourRule: 'ceil_hour' | 'exact_fraction' | '15_min_block';
  dailyRate24h: number; // e.g., ₹2000/day
  multiDayDiscountPercent: number; // e.g., 10%
  outstationRatePerDay: number; // e.g., ₹2200/day
  outstationIncludedKmPerDay: number; // e.g., 250 km
  outstationExtraKmRate: number; // e.g., ₹12/km
  waitingChargePerHour: number; // e.g., ₹99/hr
  nightAllowance: number; // e.g., ₹300
  reminderIntervalMinutes: number; // e.g., 60 mins
  locationFreshnessMinutes: number; // e.g., 30 mins
}

export interface Driver {
  id: string;
  driverCode: string; // 6-character alphanumeric code, e.g., 'A1B2C3'
  name: string;
  photo: string;
  phone: string;
  email: string;
  rating: number;
  totalTrips: number;
  experienceYears: number;
  languages: string[];
  services: ServiceType[];
  vehicleCategories: ('Manual' | 'Automatic' | 'Luxury' | 'SUV' | 'Sedan')[];
  status: DriverStatus;
  isOnline: boolean;
  isHold?: boolean;
  pendingCommissionFee?: number;
  paymentLinkUrl?: string;
  startingPrice: number;
  distanceKm: number;
  latitude: number;
  longitude: number;
  area: string;
  city: string;
  verificationBadge: boolean;
  documents: DocumentItem[];
  description: string;
  joinedDate: string;
  // GPS & Availability
  lastKnownLocation?: GeoLocation;
  lastLocationUpdatedAt?: string;
  activeBookingId?: string | null;
  currentWorkStatus?: 'available' | 'assigned' | 'on_trip' | 'offline';
  lastOnlineAt?: string;
  rejectionReason?: string;
  recentBookings?: any[];
}

export interface ServiceCategory {
  id: string;
  title: ServiceType;
  shortDescription: string;
  fullDescription: string;
  icon: string;
  startingPrice: number; // Base starting price in ₹
  extraHourRate: number; // Per extra hour rate in ₹
  nightAllowance: number; // Night driver charge in ₹ (10 PM - 6 AM)
  minimumHours: number; // Minimum package hours (e.g. 2, 4, 8, 12)
  outstationPerKmRate?: number; // Per km charge for outstation drives
  badge?: string;
  isActive: boolean;
}

export interface Booking {
  id: string; // e.g., LD-2026-0001
  driverId: string;
  driverCode?: string; // 6-character code, e.g., 'A1B2C3'
  driverName: string;
  driverPhoto: string;
  driverPhone: string;
  serviceTitle: ServiceType;
  customerName: string;
  customerPhone: string;
  pickupLocation: string;
  destinationLocation: string;
  date: string;
  time: string;
  notes?: string;
  estimatedFare: number;
  commissionFee?: number;
  commissionSettled?: boolean;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  assignedAt?: string;
  attemptedDriverIds?: string[];

  // Route & OpenStreetMap Coordinates
  pickupCoords?: { latitude: number; longitude: number };
  destinationCoords?: { latitude: number; longitude: number };
  intermediateStops?: TripStop[];
  stops?: TripStop[]; // alias
  isReturnTrip?: boolean;
  durationHours?: number; // duration in hours
  estimatedDistanceKm?: number; // one-way or planned total
  estimatedReturnDistanceKm?: number;
  estimatedDurationMinutes?: number;
  routePolyline?: [number, number][]; // [lat, lng] array for Leaflet
  outboundPolyline?: [number, number][];
  returnPolyline?: [number, number][];

  // Duration & Destination Waiting Specifications
  expectedWaitingHours?: number;
  expectedTotalDurationHours?: number;
  expectedDrivingMinutes?: number;
  estimatedOutboundDistanceKm?: number;
  estimatedOutboundDurationMinutes?: number;
  estimatedReturnDurationMinutes?: number;
  returnJourneyOption?: 'same_day' | 'after_waiting' | 'different_date' | 'one_way';
  billingMethod?: 'hourly' | 'daily_package' | 'multi_day' | 'package';
  estimatedTimeBasedCharge?: number;
  estimatedDistanceBasedCharge?: number;
  estimatedTaxesAndFees?: number;

  // Authoritative Server Trip Execution & GPS
  tripStartedAt?: string; // Server UTC ISO string
  tripStartLocation?: GeoLocation;
  tripCompletedAt?: string; // Server UTC ISO string
  tripEndLocation?: GeoLocation;
  elapsedSeconds?: number;
  billableHours?: number;

  // Distance & Odometer Verification
  odometerStartKm?: number;
  odometerEndKm?: number;
  actualTraveledKm?: number;
  distanceSource?: 'odometer' | 'driver_reported' | 'estimated_only';
  distanceVerified?: boolean;

  // Hourly / Daily Billing & Snapshot
  pricingSnapshot?: PricingPolicySnapshot;
  timeBasedCharge?: number;
  distanceBasedCharge?: number;
  nightCharges?: number;
  finalFare?: number;

  // Confirmations & Dispute Management
  customerCompleted?: boolean;
  driverCompleted?: boolean;
  disputeFlag?: boolean;
  disputeReason?: string;
  reminderIntervalMinutes?: number;
  lastReminderSentAt?: string;
  auditHistory?: TripAuditRecord[];
}

export interface Review {
  id: string;
  driverId: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  address: string;
  area: string;
  city: string;
  isFallback: boolean;
}

export interface FilterState {
  searchQuery: string;
  service: string;
  maxDistance: number;
  minExperience: number;
  minRating: number;
  availableOnly: boolean;
}

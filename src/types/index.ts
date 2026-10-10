export type ServiceType = 
  | 'City Driver' 
  | 'Outstation Driver' 
  | 'Monthly Driver' 
  | 'Personal Driver' 
  | 'VIP Driver' 
  | 'Escort Driver';

export type DriverStatus = 'Approved' | 'Pending' | 'Rejected' | 'Hold' | 'Payment Due';

export type BookingStatus = 'Pending' | 'Accepted' | 'Driver Arriving' | 'Completed' | 'Cancelled';

export interface DocumentItem {
  id: string;
  type: 'Profile Photo Selfie' | 'Aadhaar Card' | 'Driving Licence';
  status: 'Verified' | 'Under Review' | 'Rejected' | 'Not Uploaded';
  url?: string;
  rejectionReason?: string;
  uploadedAt?: string;
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
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  assignedAt?: string;
  attemptedDriverIds?: string[];
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

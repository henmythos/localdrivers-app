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

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'drv-101',
    driverCode: 'A1B2C3',
    name: 'Ramesh Kumar',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    phone: '+91 98490 12345',
    email: 'ramesh.kumar@localdrivers.in',
    rating: 4.9,
    totalTrips: 428,
    experienceYears: 8,
    languages: ['Telugu', 'Hindi', 'English'],
    services: ['City Driver', 'Personal Driver'],
    vehicleCategories: ['Manual', 'Automatic', 'Sedan', 'SUV'],
    status: 'Approved',
    isOnline: true,
    startingPrice: 299,
    distanceKm: 1.2,
    latitude: 17.4319,
    longitude: 78.4073,
    area: 'Jubilee Hills',
    city: 'Hyderabad',
    verificationBadge: true,
    lastKnownLocation: {
      latitude: 17.4319,
      longitude: 78.4073,
      address: 'Road No. 36, Jubilee Hills (GPS Active)',
      source: 'gps',
      recordedAt: new Date().toISOString(),
    },
    lastLocationUpdatedAt: new Date().toISOString(),
    documents: [
      { id: 'doc-101-1', type: 'Profile Photo Selfie', status: 'Verified', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400', uploadedAt: '2026-01-10' },
      { id: 'doc-101-2', type: 'Aadhaar Card (Front)', status: 'Verified', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-01-10' },
      { id: 'doc-101-3', type: 'Aadhaar Card (Back)', status: 'Verified', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-01-10' },
      { id: 'doc-101-4', type: 'Driving Licence (Front)', status: 'Verified', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-01-10' },
      { id: 'doc-101-5', type: 'Driving Licence (Back)', status: 'Verified', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-01-10' },
    ],
    description: 'Expert luxury chauffeur with 8 years of impeccable driving record across Jubilee Hills, Banjara Hills, and Gachibowli.',
    joinedDate: '2026-01-10',
  },
  {
    id: 'drv-102',
    driverCode: 'H7K9P2',
    name: 'Mohammed Shafi',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    phone: '+91 97001 23456',
    email: 'm.shafi@localdrivers.in',
    rating: 4.8,
    totalTrips: 310,
    experienceYears: 10,
    languages: ['Telugu', 'Hindi', 'Urdu'],
    services: ['Outstation Driver', 'City Driver'],
    vehicleCategories: ['Manual', 'Automatic', 'SUV'],
    status: 'Approved',
    isOnline: true,
    startingPrice: 349,
    distanceKm: 2.5,
    latitude: 17.4156,
    longitude: 78.4357,
    area: 'Banjara Hills',
    city: 'Hyderabad',
    verificationBadge: true,
    lastKnownLocation: {
      latitude: 17.4156,
      longitude: 78.4357,
      address: 'Road No. 12, Banjara Hills (GPS Active)',
      source: 'gps',
      recordedAt: new Date().toISOString(),
    },
    lastLocationUpdatedAt: new Date().toISOString(),
    documents: [
      { id: 'doc-102-1', type: 'Profile Photo Selfie', status: 'Verified', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400', uploadedAt: '2026-01-12' },
      { id: 'doc-102-2', type: 'Aadhaar Card (Front)', status: 'Verified', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-01-12' },
      { id: 'doc-102-3', type: 'Aadhaar Card (Back)', status: 'Verified', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-01-12' },
      { id: 'doc-102-4', type: 'Driving Licence (Front)', status: 'Verified', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-01-12' },
      { id: 'doc-102-5', type: 'Driving Licence (Back)', status: 'Verified', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-01-12' },
    ],
    description: 'Highway and long-distance driving specialist for journeys towards Srisailam, Vijayawada, and Bangalore.',
    joinedDate: '2026-01-12',
  },
  {
    id: 'drv-103',
    driverCode: 'J4M8N1',
    name: 'Srinivas Rao',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
    phone: '+91 94405 67890',
    email: 'srinivas.rao@localdrivers.in',
    rating: 4.95,
    totalTrips: 512,
    experienceYears: 12,
    languages: ['Telugu', 'Hindi', 'English'],
    services: ['VIP Driver', 'Personal Driver'],
    vehicleCategories: ['Manual', 'Automatic', 'Luxury', 'SUV'],
    status: 'Approved',
    isOnline: true,
    startingPrice: 1000,
    distanceKm: 3.1,
    latitude: 17.4152,
    longitude: 78.3377,
    area: 'Gachibowli',
    city: 'Hyderabad',
    verificationBadge: true,
    lastKnownLocation: {
      latitude: 17.4152,
      longitude: 78.3377,
      address: 'Financial District, Gachibowli (GPS Active)',
      source: 'gps',
      recordedAt: new Date().toISOString(),
    },
    lastLocationUpdatedAt: new Date().toISOString(),
    documents: [
      { id: 'doc-103-1', type: 'Profile Photo Selfie', status: 'Verified', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400', uploadedAt: '2026-01-15' },
      { id: 'doc-103-2', type: 'Aadhaar Card (Front)', status: 'Verified', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-01-15' },
      { id: 'doc-103-3', type: 'Aadhaar Card (Back)', status: 'Verified', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-01-15' },
      { id: 'doc-103-4', type: 'Driving Licence (Front)', status: 'Verified', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-01-15' },
      { id: 'doc-103-5', type: 'Driving Licence (Back)', status: 'Verified', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-01-15' },
    ],
    description: 'Executive chauffeur certified for German luxury marques (Mercedes, BMW, Audi, Jaguar).',
    joinedDate: '2026-01-15',
  },
  {
    id: 'drv-104',
    driverCode: 'T5V2W9',
    name: 'Venkat Reddy',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400',
    phone: '+91 93910 54321',
    email: 'venkat.reddy@localdrivers.in',
    rating: 4.85,
    totalTrips: 275,
    experienceYears: 7,
    languages: ['Telugu', 'English'],
    services: ['Monthly Driver', 'City Driver'],
    vehicleCategories: ['Manual', 'Automatic', 'Sedan'],
    status: 'Approved',
    isOnline: true,
    startingPrice: 299,
    distanceKm: 0.8,
    latitude: 17.4504,
    longitude: 78.3808,
    area: 'Hitec City',
    city: 'Hyderabad',
    verificationBadge: true,
    lastKnownLocation: {
      latitude: 17.4504,
      longitude: 78.3808,
      address: 'Cyber Towers, Hitec City (GPS Active)',
      source: 'gps',
      recordedAt: new Date().toISOString(),
    },
    lastLocationUpdatedAt: new Date().toISOString(),
    documents: [
      { id: 'doc-104-1', type: 'Profile Photo Selfie', status: 'Verified', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400', uploadedAt: '2026-02-01' },
      { id: 'doc-104-2', type: 'Aadhaar Card (Front)', status: 'Verified', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-02-01' },
      { id: 'doc-104-3', type: 'Aadhaar Card (Back)', status: 'Verified', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-02-01' },
      { id: 'doc-104-4', type: 'Driving Licence (Front)', status: 'Verified', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-02-01' },
      { id: 'doc-104-5', type: 'Driving Licence (Back)', status: 'Verified', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-02-01' },
    ],
    description: 'Punctual, non-smoking professional driver ideal for daily corporate transit across Cyberabad.',
    joinedDate: '2026-02-01',
  },
  {
    id: 'drv-105',
    driverCode: 'P3Q6R8',
    name: 'Suresh Goud',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400',
    phone: '+91 91210 98765',
    email: 'suresh.goud@localdrivers.in',
    rating: 4.7,
    totalTrips: 145,
    experienceYears: 6,
    languages: ['Telugu', 'Hindi'],
    services: ['City Driver'],
    vehicleCategories: ['Manual', 'Automatic'],
    status: 'Payment Due',
    isHold: true,
    pendingCommissionFee: 50,
    paymentLinkUrl: 'https://pay.localdrivers.in/upi?amount=50&driver=P3Q6R8',
    isOnline: false,
    startingPrice: 299,
    distanceKm: 3.8,
    latitude: 17.4483,
    longitude: 78.3915,
    area: 'Madhapur',
    city: 'Hyderabad',
    verificationBadge: true,
    documents: [
      { id: 'doc-105-1', type: 'Profile Photo Selfie', status: 'Verified', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400', uploadedAt: '2026-02-14' },
      { id: 'doc-105-2', type: 'Aadhaar Card (Front)', status: 'Verified', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-02-14' },
      { id: 'doc-105-3', type: 'Aadhaar Card (Back)', status: 'Verified', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-02-14' },
      { id: 'doc-105-4', type: 'Driving Licence (Front)', status: 'Verified', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-02-14' },
      { id: 'doc-105-5', type: 'Driving Licence (Back)', status: 'Verified', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-02-14' },
    ],
    description: 'City navigator with excellent knowledge of shortcuts across Cyberabad.',
    joinedDate: '2026-02-14',
  },
  {
    id: 'drv-106',
    driverCode: 'K9L2M4',
    name: 'K. Naresh Kumar',
    photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=400',
    phone: '+91 99590 11223',
    email: 'naresh.k@localdrivers.in',
    rating: 5.0,
    totalTrips: 0,
    experienceYears: 5,
    languages: ['Telugu', 'Hindi', 'English'],
    services: ['City Driver', 'Outstation Driver'],
    vehicleCategories: ['Manual', 'Automatic'],
    status: 'Pending',
    isOnline: false,
    startingPrice: 299,
    distanceKm: 4.2,
    latitude: 17.4849,
    longitude: 78.4138,
    area: 'Kukatpally',
    city: 'Hyderabad',
    verificationBadge: false,
    documents: [
      { id: 'doc-106-1', type: 'Profile Photo Selfie', status: 'Under Review', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=400', uploadedAt: '2026-10-15' },
      { id: 'doc-106-2', type: 'Aadhaar Card (Front)', status: 'Under Review', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-10-15' },
      { id: 'doc-106-3', type: 'Aadhaar Card (Back)', status: 'Under Review', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-10-15' },
      { id: 'doc-106-4', type: 'Driving Licence (Front)', status: 'Under Review', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-10-15' },
      { id: 'doc-106-5', type: 'Driving Licence (Back)', status: 'Under Review', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-10-15' },
    ],
    description: 'Applied for Driver Partner program. Commercial badge holder.',
    joinedDate: '2026-10-15',
  },
  {
    id: 'drv-107',
    driverCode: 'R4S8T1',
    name: 'Syed Arshad',
    photo: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=400',
    phone: '+91 96180 77889',
    email: 'arshad.syed@localdrivers.in',
    rating: 5.0,
    totalTrips: 0,
    experienceYears: 4,
    languages: ['Urdu', 'Hindi', 'Telugu'],
    services: ['City Driver'],
    vehicleCategories: ['Manual'],
    status: 'Pending',
    isOnline: false,
    startingPrice: 299,
    distanceKm: 5.0,
    latitude: 17.3616,
    longitude: 78.4747,
    area: 'Old City',
    city: 'Hyderabad',
    verificationBadge: false,
    documents: [
      { id: 'doc-107-1', type: 'Profile Photo Selfie', status: 'Under Review', url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=400', uploadedAt: '2026-10-16' },
      { id: 'doc-107-2', type: 'Aadhaar Card (Front)', status: 'Under Review', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-10-16' },
      { id: 'doc-107-3', type: 'Aadhaar Card (Back)', status: 'Under Review', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-10-16' },
      { id: 'doc-107-4', type: 'Driving Licence (Front)', status: 'Under Review', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-10-16' },
      { id: 'doc-107-5', type: 'Driving Licence (Back)', status: 'Under Review', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-10-16' },
    ],
    description: 'Experienced driver from Mehdipatnam area seeking verification.',
    joinedDate: '2026-10-16',
  },
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'LD-2026-0001',
    driverId: 'drv-101',
    driverCode: 'A1B2C3',
    driverName: 'Ramesh Kumar',
    driverPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    driverPhone: '+91 98490 12345',
    serviceTitle: 'City Driver',
    customerName: 'Ranjith Varma',
    customerPhone: '9849123456',
    pickupLocation: 'Road No. 36, Jubilee Hills, Hyderabad',
    destinationLocation: 'Inorbit Mall, Madhapur, Hyderabad',
    date: '2026-10-16',
    time: 'Instant ASAP (Within 15 Mins)',
    notes: 'Automatic Fortuner, Gate 1 pickup',
    estimatedFare: 499,
    commissionFee: 25,
    status: 'In Progress',
    pickupCoords: { latitude: 17.4319, longitude: 78.4073 },
    destinationCoords: { latitude: 17.4356, longitude: 78.3869 },
    estimatedDistanceKm: 6.8,
    estimatedOutboundDistanceKm: 6.8,
    estimatedOutboundDurationMinutes: 25,
    expectedDrivingMinutes: 25,
    expectedWaitingHours: 1,
    expectedTotalDurationHours: 2,
    returnJourneyOption: 'one_way',
    billingMethod: 'hourly',
    estimatedTimeBasedCharge: 499,
    estimatedDistanceBasedCharge: 0,
    isReturnTrip: false,
    tripStartedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    tripStartLocation: {
      latitude: 17.4320,
      longitude: 78.4075,
      address: 'Road No. 36, Jubilee Hills (GPS Verified)',
      source: 'gps',
      recordedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    pricingSnapshot: {
      serviceType: 'City Driver',
      baseHourlyRate: 200,
      minimumHours: 2,
      partialHourRule: 'ceil_hour',
      daily24hRate: 2000,
      overnightCharge: 300,
      multiDayDiscountPercent: 10,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    assignedAt: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
  },
  {
    id: 'LD-2026-0002',
    driverId: 'drv-102',
    driverCode: 'H7K9P2',
    driverName: 'Mohammed Shafi',
    driverPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    driverPhone: '+91 97001 23456',
    serviceTitle: 'Outstation Driver',
    customerName: 'Ananya Rao',
    customerPhone: '9876543210',
    pickupLocation: 'Banjara Hills Road No. 12, Hyderabad',
    destinationLocation: 'Srisailam Temple Ghats, Andhra Pradesh',
    date: '2026-10-17',
    time: '06:00 AM',
    notes: 'Round trip outstation journey, Honda City Manual',
    estimatedFare: 3750,
    commissionFee: 100,
    status: 'Accepted',
    pickupCoords: { latitude: 17.4156, longitude: 78.4357 },
    destinationCoords: { latitude: 16.0734, longitude: 78.8687 },
    isReturnTrip: true,
    estimatedDistanceKm: 430.8,
    estimatedOutboundDistanceKm: 215.4,
    estimatedReturnDistanceKm: 215.4,
    estimatedOutboundDurationMinutes: 270,
    estimatedReturnDurationMinutes: 270,
    expectedDrivingMinutes: 540,
    expectedWaitingHours: 6,
    expectedTotalDurationHours: 15,
    returnJourneyOption: 'after_waiting',
    billingMethod: 'hourly',
    estimatedTimeBasedCharge: 3750,
    estimatedDistanceBasedCharge: 0,
    pricingSnapshot: {
      serviceType: 'Outstation Driver',
      baseHourlyRate: 250,
      minimumHours: 12,
      partialHourRule: 'ceil_hour',
      daily24hRate: 2200,
      overnightCharge: 300,
      multiDayDiscountPercent: 10,
      includedKmPerDay: 250,
      extraPerKmRate: 12,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignedAt: new Date().toISOString(),
  },
  {
    id: 'LD-2026-0003',
    driverId: 'drv-103',
    driverCode: 'J4M8N1',
    driverName: 'Srinivas Rao',
    driverPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
    driverPhone: '+91 94405 67890',
    serviceTitle: 'VIP Driver',
    customerName: 'Dr. K. Mohan Reddy',
    customerPhone: '9988776655',
    pickupLocation: 'Financial District, Gachibowli, Hyderabad',
    destinationLocation: 'Rajiv Gandhi International Airport (RGIA)',
    date: '2026-10-16',
    time: '02:00 PM',
    notes: 'Audi A6 Automatic Chauffeur',
    estimatedFare: 1000,
    commissionFee: 50,
    commissionSettled: true,
    status: 'Completed',
    pickupCoords: { latitude: 17.4152, longitude: 78.3377 },
    destinationCoords: { latitude: 17.2403, longitude: 78.4294 },
    estimatedDistanceKm: 28.5,
    estimatedOutboundDistanceKm: 28.5,
    estimatedOutboundDurationMinutes: 45,
    expectedDrivingMinutes: 45,
    expectedWaitingHours: 2,
    expectedTotalDurationHours: 4,
    returnJourneyOption: 'one_way',
    billingMethod: 'hourly',
    estimatedTimeBasedCharge: 1000,
    estimatedDistanceBasedCharge: 0,
    tripStartedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    tripStartLocation: {
      latitude: 17.4152,
      longitude: 78.3377,
      address: 'Financial District, Gachibowli (GPS Verified)',
      source: 'gps',
      recordedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    },
    tripCompletedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    tripEndLocation: {
      latitude: 17.2403,
      longitude: 78.4294,
      address: 'RGIA Shamshabad Terminal 1 (GPS Verified)',
      source: 'gps',
      recordedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    elapsedSeconds: 9000, // 2.5 hours
    billableHours: 4,     // 4 hour minimum
    timeBasedCharge: 1000,
    finalFare: 1000,
    customerCompleted: true,
    driverCompleted: true,
    distanceSource: 'estimated_only',
    distanceVerified: false,
    pricingSnapshot: {
      serviceType: 'VIP Driver',
      baseHourlyRate: 250,
      minimumHours: 4,
      partialHourRule: 'ceil_hour',
      daily24hRate: 2500,
      overnightCharge: 400,
      multiDayDiscountPercent: 10,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 190).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    assignedAt: new Date(Date.now() - 1000 * 60 * 185).toISOString(),
  },
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    driverId: 'drv-101',
    customerName: 'Kiran K.',
    rating: 5,
    comment: 'Punctual, polite, and handled my Fortuner with exceptional care in heavy Jubilee Hills traffic.',
    date: '2026-10-10',
  },
  {
    id: 'rev-2',
    driverId: 'drv-101',
    customerName: 'Sumanth V.',
    rating: 5,
    comment: 'Smooth drive, clean uniform, and thoroughly professional approach. Highly recommended.',
    date: '2026-10-08',
  },
  {
    id: 'rev-3',
    driverId: 'drv-102',
    customerName: 'Rahul M.',
    rating: 5,
    comment: 'Great highway experience to Srisailam. Very patient with curves and night driving.',
    date: '2026-10-12',
  },
  {
    id: 'rev-4',
    driverId: 'drv-103',
    customerName: 'Vikram C.',
    rating: 5,
    comment: 'Drove my Mercedes effortlessly. Flawless suit, punctual arrival, and gentle demeanor.',
    date: '2026-10-05',
  },
];

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
    const versionKey = 'localdrivers_db_v5_maps_timer';
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

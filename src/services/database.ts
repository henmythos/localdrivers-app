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

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'drv-1',
    driverCode: 'A1B2C3',
    name: 'Ravi Kumar',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    phone: '+91 98765 43210',
    email: 'ravi@localdrivers.in',
    rating: 4.9,
    totalTrips: 1240,
    experienceYears: 8,
    languages: ['Telugu', 'Hindi', 'English'],
    services: ['City Driver', 'Outstation Driver', 'Personal Driver', 'VIP Driver'],
    vehicleCategories: ['Manual', 'Automatic', 'SUV', 'Sedan'],
    status: 'Approved',
    isOnline: true,
    startingPrice: 299,
    distanceKm: 1.2,
    latitude: 17.4150,
    longitude: 78.4120,
    area: 'Jubilee Hills',
    city: 'Hyderabad',
    verificationBadge: true,
    documents: [
      { id: 'doc-1', type: 'Profile Photo Selfie', status: 'Verified', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400', uploadedAt: '2024-01-15' },
      { id: 'doc-2', type: 'Aadhaar Card', status: 'Verified', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', uploadedAt: '2024-01-15' },
      { id: 'doc-3', type: 'Driving Licence', status: 'Verified', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800', uploadedAt: '2024-01-16' },
    ],
    description: 'Punctual, non-smoker chauffeur with 8+ years of expertise in luxury cars and highway driving across Telangana and Andhra Pradesh.',
    joinedDate: '2024-01-15',
  },
  {
    id: 'drv-2',
    driverCode: 'A2C4X5',
    name: 'Suresh Reddy',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    phone: '+91 98765 43211',
    email: 'suresh@localdrivers.in',
    rating: 4.8,
    totalTrips: 980,
    experienceYears: 10,
    languages: ['Telugu', 'Hindi'],
    services: ['Outstation Driver', 'VIP Driver', 'Escort Driver'],
    vehicleCategories: ['Automatic', 'Luxury', 'SUV'],
    status: 'Approved',
    isOnline: true,
    startingPrice: 699,
    distanceKm: 2.4,
    latitude: 17.4210,
    longitude: 78.4010,
    area: 'Banjara Hills',
    city: 'Hyderabad',
    verificationBadge: true,
    documents: [
      { id: 'doc-4', type: 'Profile Photo Selfie', status: 'Verified', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400', uploadedAt: '2023-11-10' },
      { id: 'doc-5', type: 'Aadhaar Card', status: 'Verified', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', uploadedAt: '2023-11-10' },
      { id: 'doc-6', type: 'Driving Licence', status: 'Verified', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800', uploadedAt: '2023-11-12' },
    ],
    description: 'Specialist in outstation routes and VIP executive escort services. Known for defensive driving and high confidentiality.',
    joinedDate: '2023-11-10',
  },
  {
    id: 'drv-3',
    driverCode: 'G2Z4N8',
    name: 'Vikram Singh',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
    phone: '+91 98765 43212',
    email: 'vikram@localdrivers.in',
    rating: 4.95,
    totalTrips: 1510,
    experienceYears: 12,
    languages: ['Hindi', 'English', 'Punjabi'],
    services: ['VIP Driver', 'City Driver', 'Escort Driver', 'Outstation Driver'],
    vehicleCategories: ['Manual', 'Automatic', 'Luxury', 'SUV', 'Sedan'],
    status: 'Approved',
    isOnline: true,
    startingPrice: 699,
    distanceKm: 3.1,
    latitude: 17.4400,
    longitude: 78.3800,
    area: 'Hitec City',
    city: 'Hyderabad',
    verificationBadge: true,
    documents: [
      { id: 'doc-7', type: 'Profile Photo Selfie', status: 'Verified', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400', uploadedAt: '2023-08-01' },
      { id: 'doc-8', type: 'Aadhaar Card', status: 'Verified', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', uploadedAt: '2023-08-01' },
      { id: 'doc-9', type: 'Driving Licence', status: 'Verified', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800', uploadedAt: '2023-08-03' },
    ],
    description: 'Former corporate fleet lead with 12 years experience. Specializes in luxury German cars (Mercedes, BMW, Audi) and VIP protocol.',
    joinedDate: '2023-08-01',
  },
  {
    id: 'drv-4',
    driverCode: 'K4T5P6',
    name: 'Ketan Patel',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400',
    phone: '+91 98765 43213',
    email: 'ketan@localdrivers.in',
    rating: 4.75,
    totalTrips: 640,
    experienceYears: 6,
    languages: ['Gujarati', 'Hindi', 'English'],
    services: ['City Driver', 'Personal Driver', 'Monthly Driver'],
    vehicleCategories: ['Manual', 'Automatic', 'Sedan'],
    status: 'Approved',
    isOnline: true,
    startingPrice: 299,
    distanceKm: 4.5,
    latitude: 17.4480,
    longitude: 78.3700,
    area: 'Gachibowli',
    city: 'Hyderabad',
    verificationBadge: true,
    documents: [
      { id: 'doc-10', type: 'Profile Photo Selfie', status: 'Verified', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400', uploadedAt: '2024-02-14' },
      { id: 'doc-11', type: 'Aadhaar Card', status: 'Verified', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', uploadedAt: '2024-02-14' },
      { id: 'doc-12', type: 'Driving Licence', status: 'Verified', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800', uploadedAt: '2024-02-15' },
    ],
    description: 'Reliable and courteous city driver for daily office commutes, errands, and family duties.',
    joinedDate: '2024-02-14',
  },
  {
    id: 'drv-5',
    driverCode: 'N7K8N9',
    name: 'Nikhil Naidu',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400',
    phone: '+91 98765 43214',
    email: 'nikhil@localdrivers.in',
    rating: 4.85,
    totalTrips: 870,
    experienceYears: 7,
    languages: ['Telugu', 'Hindi', 'English'],
    services: ['Outstation Driver', 'City Driver', 'Monthly Driver'],
    vehicleCategories: ['Manual', 'Automatic', 'SUV'],
    status: 'Approved',
    isOnline: false,
    startingPrice: 349,
    distanceKm: 5.2,
    latitude: 17.4300,
    longitude: 78.3900,
    area: 'Madhapur',
    city: 'Hyderabad',
    verificationBadge: true,
    documents: [
      { id: 'doc-13', type: 'Profile Photo Selfie', status: 'Verified', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400', uploadedAt: '2024-03-01' },
      { id: 'doc-14', type: 'Aadhaar Card', status: 'Verified', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', uploadedAt: '2024-03-01' },
      { id: 'doc-15', type: 'Driving Licence', status: 'Verified', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800', uploadedAt: '2024-03-02' },
    ],
    description: 'Experienced in long-distance weekend getaways (Srisailam, Vijayawada, Vizag, Bengaluru). Smooth automatic drive.',
    joinedDate: '2024-03-01',
  },
  {
    id: 'drv-6',
    driverCode: 'M1B2R3',
    name: 'Mahesh Babu Rao',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    phone: '+91 98765 43215',
    email: 'mahesh@localdrivers.in',
    rating: 4.9,
    totalTrips: 1120,
    experienceYears: 9,
    languages: ['Telugu', 'Hindi'],
    services: ['Monthly Driver', 'Personal Driver', 'City Driver'],
    vehicleCategories: ['Manual', 'Automatic', 'Sedan', 'SUV'],
    status: 'Approved',
    isOnline: true,
    startingPrice: 299,
    distanceKm: 1.8,
    latitude: 17.4100,
    longitude: 78.4200,
    area: 'Panjagutta',
    city: 'Hyderabad',
    verificationBadge: true,
    documents: [
      { id: 'doc-16', type: 'Profile Photo Selfie', status: 'Verified', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400', uploadedAt: '2023-12-05' },
      { id: 'doc-17', type: 'Aadhaar Card', status: 'Verified', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', uploadedAt: '2023-12-05' },
      { id: 'doc-18', type: 'Driving Licence', status: 'Verified', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800', uploadedAt: '2023-12-06' },
    ],
    description: 'Dedicated monthly driver for senior executives and families. Calm demeanor and impeccable traffic record.',
    joinedDate: '2023-12-05',
  },
  {
    id: 'drv-7',
    driverCode: 'R9J0S1',
    name: 'Rajesh Sharma',
    photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=400',
    phone: '+91 98765 43216',
    email: 'rajesh@localdrivers.in',
    rating: 4.7,
    totalTrips: 540,
    experienceYears: 5,
    languages: ['Hindi', 'English'],
    services: ['City Driver', 'Outstation Driver'],
    vehicleCategories: ['Manual', 'Sedan'],
    status: 'Approved',
    isOnline: true,
    startingPrice: 299,
    distanceKm: 6.1,
    latitude: 17.4400,
    longitude: 78.4400,
    area: 'Begumpet',
    city: 'Hyderabad',
    verificationBadge: true,
    documents: [
      { id: 'doc-19', type: 'Profile Photo Selfie', status: 'Verified', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=400', uploadedAt: '2024-04-10' },
      { id: 'doc-20', type: 'Aadhaar Card', status: 'Verified', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', uploadedAt: '2024-04-10' },
      { id: 'doc-21', type: 'Driving Licence', status: 'Verified', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800', uploadedAt: '2024-04-12' },
    ],
    description: 'City specialist. Familiar with shortcut routes across twin cities Begumpet, Secunderabad, and Old City.',
    joinedDate: '2024-04-10',
  },
  {
    id: 'drv-8',
    driverCode: 'D3P4C5',
    name: 'Deepak Chawla',
    photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400',
    phone: '+91 98765 43217',
    email: 'deepak@localdrivers.in',
    rating: 4.88,
    totalTrips: 1350,
    experienceYears: 11,
    languages: ['Hindi', 'English', 'Telugu'],
    services: ['VIP Driver', 'Escort Driver', 'Outstation Driver'],
    vehicleCategories: ['Automatic', 'Luxury', 'SUV'],
    status: 'Approved',
    isOnline: true,
    startingPrice: 699,
    distanceKm: 3.8,
    latitude: 17.4600,
    longitude: 78.3600,
    area: 'Kondapur',
    city: 'Hyderabad',
    verificationBadge: true,
    documents: [
      { id: 'doc-22', type: 'Profile Photo Selfie', status: 'Verified', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400', uploadedAt: '2023-09-18' },
      { id: 'doc-23', type: 'Aadhaar Card', status: 'Verified', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', uploadedAt: '2023-09-18' },
      { id: 'doc-24', type: 'Driving Licence', status: 'Verified', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800', uploadedAt: '2023-09-20' },
    ],
    description: 'Premium chauffeur experienced with luxury SUVs (Fortuner, Endeavour, Defender) and corporate delegations.',
    joinedDate: '2023-09-18',
  },
  {
    id: 'drv-9',
    driverCode: 'K6R7G8',
    name: 'Kiran Goud',
    photo: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=400',
    phone: '+91 98765 43218',
    email: 'kiran@localdrivers.in',
    rating: 4.65,
    totalTrips: 420,
    experienceYears: 4,
    languages: ['Telugu', 'Hindi'],
    services: ['Personal Driver', 'City Driver'],
    vehicleCategories: ['Manual', 'Automatic'],
    status: 'Approved',
    isOnline: true,
    startingPrice: 299,
    distanceKm: 7.2,
    latitude: 17.4800,
    longitude: 78.4000,
    area: 'Kukatpally',
    city: 'Hyderabad',
    verificationBadge: true,
    documents: [
      { id: 'doc-25', type: 'Profile Photo Selfie', status: 'Verified', url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=400', uploadedAt: '2024-05-01' },
      { id: 'doc-26', type: 'Aadhaar Card', status: 'Verified', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', uploadedAt: '2024-05-01' },
      { id: 'doc-27', type: 'Driving Licence', status: 'Verified', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800', uploadedAt: '2024-05-02' },
    ],
    description: 'Friendly local driver available for short city trips, shopping drop-offs, and weekend social events.',
    joinedDate: '2024-05-01',
  },
  // Pending applications for Admin Approval section demo!
  {
    id: 'drv-pending-1',
    driverCode: 'A9N0V1',
    name: 'Anand Varma',
    photo: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&q=80&w=400',
    phone: '+91 98765 88101',
    email: 'anand.v@localdrivers.in',
    rating: 4.9,
    totalTrips: 310,
    experienceYears: 6,
    languages: ['Telugu', 'English'],
    services: ['Outstation Driver', 'VIP Driver'],
    vehicleCategories: ['Automatic', 'Luxury'],
    status: 'Pending',
    isOnline: false,
    startingPrice: 699,
    distanceKm: 2.1,
    latitude: 17.4180,
    longitude: 78.4050,
    area: 'Banjara Hills',
    city: 'Hyderabad',
    verificationBadge: false,
    documents: [
      { id: 'doc-p1', type: 'Profile Photo Selfie', status: 'Under Review', url: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&q=80&w=400', uploadedAt: '2026-10-01' },
      { id: 'doc-p2', type: 'Aadhaar Card', status: 'Under Review', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-10-01' },
      { id: 'doc-p3', type: 'Driving Licence', status: 'Under Review', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-10-02' },
    ],
    description: 'Applied for VIP Driver status. Has 6 years experience in luxury rentals across Hyderabad airport routes.',
    joinedDate: '2026-10-01',
  },
  {
    id: 'drv-pending-2',
    driverCode: 'S2N3R4',
    name: 'Sneha Reddy',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    phone: '+91 98765 88102',
    email: 'sneha.r@localdrivers.in',
    rating: 5.0,
    totalTrips: 180,
    experienceYears: 5,
    languages: ['Telugu', 'Hindi', 'English'],
    services: ['Escort Driver', 'Personal Driver', 'City Driver'],
    vehicleCategories: ['Automatic', 'Sedan', 'SUV'],
    status: 'Pending',
    isOnline: false,
    startingPrice: 349,
    distanceKm: 3.4,
    latitude: 17.4350,
    longitude: 78.3850,
    area: 'Madhapur',
    city: 'Hyderabad',
    verificationBadge: false,
    documents: [
      { id: 'doc-p4', type: 'Profile Photo Selfie', status: 'Under Review', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400', uploadedAt: '2026-10-02' },
      { id: 'doc-p5', type: 'Aadhaar Card', status: 'Under Review', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-10-02' },
      { id: 'doc-p6', type: 'Driving Licence', status: 'Under Review', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-10-03' },
    ],
    description: 'Professional female chauffeur providing secure escort and personal driver services for families and female executives.',
    joinedDate: '2026-10-02',
  },
  {
    id: 'drv-pending-3',
    driverCode: 'M5I6F7',
    name: 'Mohammed Irfan',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400',
    phone: '+91 98765 88103',
    email: 'irfan.m@localdrivers.in',
    rating: 4.8,
    totalTrips: 740,
    experienceYears: 8,
    languages: ['Hindi', 'Telugu', 'Urdu'],
    services: ['Outstation Driver', 'Monthly Driver'],
    vehicleCategories: ['Manual', 'SUV'],
    status: 'Pending',
    isOnline: false,
    startingPrice: 1499,
    distanceKm: 4.9,
    latitude: 17.3850,
    longitude: 78.4860,
    area: 'Charminar',
    city: 'Hyderabad',
    verificationBadge: false,
    documents: [
      { id: 'doc-p7', type: 'Profile Photo Selfie', status: 'Under Review', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400', uploadedAt: '2026-10-03' },
      { id: 'doc-p8', type: 'Aadhaar Card', status: 'Under Review', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-10-03' },
      { id: 'doc-p9', type: 'Driving Licence', status: 'Under Review', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800', uploadedAt: '2026-10-03' },
    ],
    description: 'Heavy vehicle & SUV expert certified for inter-state long distance travel to Vizag and Karnataka.',
    joinedDate: '2026-10-03',
  },
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'LD-2026-0001',
    driverId: 'drv-1',
    driverCode: 'A1B2C3',
    driverName: 'Ravi Kumar',
    driverPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    driverPhone: '+91 98765 43210',
    serviceTitle: 'Outstation Driver',
    customerName: 'Priya Sharma',
    customerPhone: '+91 99887 76655',
    pickupLocation: 'Jubilee Hills Checkpost, Hyderabad',
    destinationLocation: 'Vijayawada Highway, AP',
    date: '2026-10-05',
    time: '07:30 AM',
    notes: 'Please bring hand sanitizer and mask. Driving Honda City Automatic.',
    estimatedFare: 2800,
    status: 'Pending', // Ready for Driver Acceptance Demo!
    createdAt: '2026-10-04T07:15:00.000Z',
    updatedAt: '2026-10-04T07:15:00.000Z',
  },
  {
    id: 'LD-2026-0002',
    driverId: 'drv-2',
    driverCode: 'A2C4X5',
    driverName: 'Suresh Reddy',
    driverPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    driverPhone: '+91 98765 43211',
    serviceTitle: 'VIP Driver',
    customerName: 'Karan Kapoor',
    customerPhone: '+91 98112 23344',
    pickupLocation: 'Taj Krishna, Banjara Hills',
    destinationLocation: 'RGIA Airport, Shamshabad',
    date: '2026-10-04',
    time: '04:00 PM',
    notes: 'Mercedes E-Class vehicle. Formal attire preferred.',
    estimatedFare: 1200,
    status: 'Accepted',
    createdAt: '2026-10-04T06:00:00.000Z',
    updatedAt: '2026-10-04T06:10:00.000Z',
  },
  {
    id: 'LD-2026-0003',
    driverId: 'drv-3',
    driverCode: 'G2Z4N8',
    driverName: 'Vikram Singh',
    driverPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
    driverPhone: '+91 98765 43212',
    serviceTitle: 'City Driver',
    customerName: 'Venkat Rao',
    customerPhone: '+91 94401 12233',
    pickupLocation: 'Inorbit Mall, Madhapur',
    destinationLocation: 'Begumpet Railway Station',
    date: '2026-10-03',
    time: '02:15 PM',
    notes: 'Luggage drop-off.',
    estimatedFare: 450,
    status: 'Completed',
    createdAt: '2026-10-03T10:00:00.000Z',
    updatedAt: '2026-10-03T15:30:00.000Z',
  },
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    driverId: 'drv-1',
    customerName: 'Ananya Roy',
    rating: 5,
    comment: 'Ravi was extraordinarily polite and handled weekend highway traffic smoothly. Car was driven with complete care.',
    date: '2026-09-28',
  },
  {
    id: 'rev-2',
    driverId: 'drv-1',
    customerName: 'Dr. Srinivas',
    rating: 5,
    comment: 'Booked Ravi for a family outstation trip to Srisailam. Very patient with elders and knows safe driving techniques.',
    date: '2026-09-20',
  },
  {
    id: 'rev-3',
    driverId: 'drv-2',
    customerName: 'Harish Mehta',
    rating: 5,
    comment: 'Suresh drives my Audi A6 whenever I need VIP service for client dinners. Spotless record and great etiquette.',
    date: '2026-09-15',
  },
];

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

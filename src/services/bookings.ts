import { dbService } from './database';
import { Booking, BookingStatus, GeoLocation, AdminPricingConfig } from '../types';

const MY_BOOKINGS_STORAGE_KEY = 'localdrivers_customer_booking_ids';

export const bookingsService = {
  // Check and rotate pending bookings older than 20 seconds to next available online driver
  checkAndAutoPassPendingBookings(): void {
    const now = Date.now();
    const bookings = dbService.getBookings();
    bookings.forEach(b => {
      if (b.status === 'Pending') {
        const assignedTime = new Date(b.assignedAt || b.createdAt).getTime();
        if ((now - assignedTime) / 1000 >= 20) {
          dbService.reassignBookingToNextDriver(b.id);
        }
      }
    });
  },

  // Get all bookings (for Admin)
  getAllBookings(): Booking[] {
    this.checkAndAutoPassPendingBookings();
    return dbService.getBookings();
  },

  // Get booking details by ID
  getBookingById(id: string): Booking | undefined {
    this.checkAndAutoPassPendingBookings();
    return dbService.getBookingById(id);
  },

  // Get customer local bookings filtered by verified customer phone number
  getBookingsByCustomerPhone(phone: string): Booking[] {
    this.checkAndAutoPassPendingBookings();
    const cleanPhoneDigits = phone.replace(/\D/g, '');
    if (!cleanPhoneDigits || cleanPhoneDigits.length < 10) return [];
    
    const allBookings = dbService.getBookings();
    return allBookings.filter(b => {
      const bDigits = b.customerPhone.replace(/\D/g, '');
      return bDigits.endsWith(cleanPhoneDigits) || cleanPhoneDigits.endsWith(bDigits);
    });
  },

  // Get customer local bookings remembered on device
  getCustomerBookings(verifiedPhone?: string): Booking[] {
    this.checkAndAutoPassPendingBookings();
    if (verifiedPhone) {
      return this.getBookingsByCustomerPhone(verifiedPhone);
    }

    const savedPhone = localStorage.getItem('localdrivers_verified_customer_phone');
    if (savedPhone) {
      return this.getBookingsByCustomerPhone(savedPhone);
    }

    const rawIds = localStorage.getItem(MY_BOOKINGS_STORAGE_KEY);
    const savedIds: string[] = rawIds ? JSON.parse(rawIds) : [];
    if (savedIds.length === 0) return [];
    
    const allBookings = dbService.getBookings();
    return allBookings.filter(b => savedIds.includes(b.id));
  },

  // Get driver bookings
  getDriverBookings(driverId: string): Booking[] {
    this.checkAndAutoPassPendingBookings();
    return dbService.getBookingsForDriver(driverId);
  },

  // Create a new booking (Customer)
  createBooking(bookingInput: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Booking {
    const booking = dbService.createBooking(bookingInput);

    // Save verified customer phone and local storage IDs
    localStorage.setItem('localdrivers_verified_customer_phone', booking.customerPhone);
    const rawIds = localStorage.getItem(MY_BOOKINGS_STORAGE_KEY);
    const savedIds: string[] = rawIds ? JSON.parse(rawIds) : [];
    if (!savedIds.includes(booking.id)) {
      savedIds.unshift(booking.id);
      localStorage.setItem(MY_BOOKINGS_STORAGE_KEY, JSON.stringify(savedIds));
    }

    return booking;
  },

  // Driver / Admin status updates
  updateStatus(id: string, status: BookingStatus): Booking | undefined {
    return dbService.updateBookingStatus(id, status);
  },

  // Start Trip (Authoritative Server Timestamp & Location Capture)
  startTrip(id: string, location?: GeoLocation, odometerStartKm?: number): Booking | undefined {
    return dbService.startTrip(id, location, odometerStartKm);
  },

  // Complete Trip (Idempotent duration calculation, distance verification, itemized charges)
  completeTrip(
    id: string,
    location?: GeoLocation,
    completedBy: 'customer' | 'driver' = 'customer',
    odometerEndKm?: number
  ): Booking | undefined {
    return dbService.completeTrip(id, location, completedBy, odometerEndKm);
  },

  // Raise dispute
  raiseDispute(id: string, reason: string): Booking | undefined {
    return dbService.raiseTripDispute(id, reason);
  },

  // Admin manual correction with audit record
  adminCorrectTrip(
    id: string,
    changes: Partial<Booking>,
    adminEmail: string,
    reason: string
  ): Booking | undefined {
    return dbService.adminCorrectTrip(id, changes, adminEmail, reason);
  },

  // Driver rejects/passes or 20s timeout passes to next online driver
  passToNextDriver(id: string): Booking | undefined {
    return dbService.reassignBookingToNextDriver(id);
  },

  // Admin Pricing Config
  getPricingConfig(): AdminPricingConfig {
    return dbService.getAdminPricingConfig();
  },

  updatePricingConfig(updates: Partial<AdminPricingConfig>): AdminPricingConfig {
    return dbService.updateAdminPricingConfig(updates);
  }
};

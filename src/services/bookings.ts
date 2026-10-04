import { dbService } from './database';
import { Booking, BookingStatus } from '../types';

const MY_BOOKINGS_STORAGE_KEY = 'localdrivers_customer_booking_ids';

export const bookingsService = {
  // Get all bookings (for Admin)
  getAllBookings(): Booking[] {
    return dbService.getBookings();
  },

  // Get booking details by ID
  getBookingById(id: string): Booking | undefined {
    return dbService.getBookingById(id);
  },

  // Get customer local bookings filtered by verified customer phone number
  getBookingsByCustomerPhone(phone: string): Booking[] {
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
  }
};

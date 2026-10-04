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

  // Get customer local bookings (remembered without account creation)
  getCustomerBookings(): Booking[] {
    const rawIds = localStorage.getItem(MY_BOOKINGS_STORAGE_KEY);
    const savedIds: string[] = rawIds ? JSON.parse(rawIds) : [];
    const allBookings = dbService.getBookings();
    
    // Also include default demo booking LD-2026-0001 if no local items exist yet
    if (savedIds.length === 0) {
      const demoBooking = allBookings.find(b => b.id === 'LD-2026-0001');
      return demoBooking ? [demoBooking] : [];
    }

    return allBookings.filter(b => savedIds.includes(b.id));
  },

  // Get driver bookings
  getDriverBookings(driverId: string): Booking[] {
    return dbService.getBookingsForDriver(driverId);
  },

  // Create a new booking (Customer)
  createBooking(bookingInput: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Booking {
    const booking = dbService.createBooking(bookingInput);

    // Save to local customer storage
    const rawIds = localStorage.getItem(MY_BOOKINGS_STORAGE_KEY);
    const savedIds: string[] = rawIds ? JSON.parse(rawIds) : ['LD-2026-0001'];
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

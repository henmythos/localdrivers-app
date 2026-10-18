import { dbService } from './database';
import { Booking, BookingStatus, GeoLocation, AdminPricingConfig } from '../types';
import { apiClient } from './apiClient';
import { authService } from './auth';

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

  // Fetch live bookings from server
  async getAllBookingsAsync(): Promise<Booking[]> {
    const res = await apiClient.get<{ bookings: Booking[] }>('/api/bookings', {
      headers: authService.getAdminAuthHeaders(),
      fallbackErrorMessage: 'Unable to retrieve live bookings from server.',
    });

    if (res.success && res.data && Array.isArray(res.data.bookings)) {
      return res.data.bookings;
    }
    return this.getAllBookings();
  },

  // Get booking details by ID
  getBookingById(id: string): Booking | undefined {
    this.checkAndAutoPassPendingBookings();
    return dbService.getBookingById(id);
  },

  // Get booking details by ID from server with fallback to local cache
  async getBookingByIdAsync(id: string): Promise<Booking | null> {
    const res = await apiClient.get<{ booking?: Booking; bookings?: Booking[] }>(
      `/api/bookings?id=${encodeURIComponent(id)}`,
      {
        headers: authService.getAdminAuthHeaders(),
        fallbackErrorMessage: 'Unable to retrieve booking details from server.',
      }
    );

    if (res.success && res.data) {
      const b = res.data.booking || (Array.isArray(res.data.bookings) ? res.data.bookings[0] : null);
      if (b) {
        try {
          dbService.createBooking(b);
        } catch {}
        return b;
      }
    }

    const local = dbService.getBookingById(id);
    return local || null;
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

  // Create a new booking (Customer) with server persistence and race safety
  async createBookingAsync(
    bookingInput: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const idempotencyKey = `bkg-idem-${bookingInput.driverId}-${bookingInput.customerPhone.replace(/\D/g, '')}-${Date.now()}`;

    const res = await apiClient.post<{ success: boolean; booking?: Booking; error?: string }>(
      '/api/bookings',
      {
        ...bookingInput,
        idempotencyKey,
      },
      {
        fallbackErrorMessage: 'Could not submit your booking right now. Please try again.',
      }
    );

    if (res.success && res.data?.booking) {
      const serverBooking = res.data.booking;
      // Save locally to dbService for reactive UI updates
      try {
        dbService.createBooking({
          ...bookingInput,
          ...serverBooking,
        });
      } catch {}

      localStorage.setItem('localdrivers_verified_customer_phone', bookingInput.customerPhone);
      const rawIds = localStorage.getItem(MY_BOOKINGS_STORAGE_KEY);
      const savedIds: string[] = rawIds ? JSON.parse(rawIds) : [];
      if (!savedIds.includes(serverBooking.id)) {
        savedIds.unshift(serverBooking.id);
        localStorage.setItem(MY_BOOKINGS_STORAGE_KEY, JSON.stringify(savedIds));
      }

      return { success: true, booking: serverBooking };
    }

    return {
      success: false,
      error: res.error || res.data?.error || 'Booking could not be assigned. The driver may have become unavailable.',
    };
  },

  // Synchronous create booking fallback
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

    // Call server asynchronously
    this.createBookingAsync(bookingInput).catch(console.error);

    return booking;
  },

  // Driver / Admin status updates
  updateStatus(id: string, status: BookingStatus): Booking | undefined {
    return dbService.updateBookingStatus(id, status);
  },

  // Start Trip (Authoritative Server Timestamp & Location Capture)
  async startTripAsync(id: string, location?: GeoLocation, odometerStartKm?: number): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const res = await apiClient.post<{ success: boolean; bookingId: string; tripStartTime: string; status: string; error?: string }>(
      '/api/bookings/trip',
      {
        action: 'start',
        bookingId: id,
        location,
        odometerKm: odometerStartKm,
      },
      {
        fallbackErrorMessage: 'Failed to start trip on server. Please check your connection.',
      }
    );

    const localBooking = dbService.startTrip(id, location, odometerStartKm);
    if (res.success && res.data?.success) {
      return { success: true, booking: localBooking };
    }

    return { success: false, booking: localBooking, error: res.error || res.data?.error };
  },

  startTrip(id: string, location?: GeoLocation, odometerStartKm?: number): Booking | undefined {
    // Send to server asynchronously
    this.startTripAsync(id, location, odometerStartKm).catch(console.error);
    return dbService.startTrip(id, location, odometerStartKm);
  },

  // Complete Trip (Idempotent duration calculation, distance verification, itemized charges)
  async completeTripAsync(
    id: string,
    location?: GeoLocation,
    completedBy: 'customer' | 'driver' = 'customer',
    odometerEndKm?: number
  ): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const res = await apiClient.post<{ success: boolean; bookingId: string; tripDurationMinutes: number; finalFare: number; error?: string }>(
      '/api/bookings/trip',
      {
        action: 'complete',
        bookingId: id,
        location,
        odometerKm: odometerEndKm,
        completedBy,
      },
      {
        fallbackErrorMessage: 'Failed to complete trip on server. Please check your connection.',
      }
    );

    const localBooking = dbService.completeTrip(id, location, completedBy, odometerEndKm);
    if (res.success && res.data?.success) {
      return { success: true, booking: localBooking };
    }

    return { success: false, booking: localBooking, error: res.error || res.data?.error };
  },

  completeTrip(
    id: string,
    location?: GeoLocation,
    completedBy: 'customer' | 'driver' = 'customer',
    odometerEndKm?: number
  ): Booking | undefined {
    // Send to server asynchronously
    this.completeTripAsync(id, location, completedBy, odometerEndKm).catch(console.error);
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

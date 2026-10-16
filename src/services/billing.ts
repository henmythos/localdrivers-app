// Authoritative Server-Driven Trip Timer & Hourly/Daily Billing Calculation Engine

import { Booking, PricingPolicySnapshot, AdminPricingConfig } from '../types';

export interface TripCalculationResult {
  elapsedSeconds: number;
  formattedElapsed: string; // "HH:MM:SS" or "X Days HH:MM:SS"
  billableHours: number;
  timeBasedCharge: number;
  distanceBasedCharge: number;
  nightCharges: number;
  overtimeCharges: number;
  totalEstimatedOrFinal: number;
  isOver24Hours: boolean;
  daysElapsed: number;
}

export const DEFAULT_ADMIN_PRICING_CONFIG: AdminPricingConfig = {
  hourlyRate: 200,
  minimumHours: 2,
  minimumBookingDurationHours: 2,
  partialHourRule: 'ceil_hour',
  dailyRate24h: 2000,
  multiDayDiscountPercent: 10,
  outstationRatePerDay: 2200,
  outstationIncludedKmPerDay: 250,
  outstationExtraKmRate: 12,
  waitingChargePerHour: 99,
  nightAllowance: 300,
  reminderIntervalMinutes: 60,
  locationFreshnessMinutes: 30,
};

// Format elapsed seconds into standard human-readable format
export const formatDuration = (totalSeconds: number): string => {
  if (totalSeconds < 0) totalSeconds = 0;
  const days = Math.floor(totalSeconds / 86400);
  const remainingSecs = totalSeconds % 86400;
  const hours = Math.floor(remainingSecs / 3600);
  const minutes = Math.floor((remainingSecs % 3600) / 60);
  const seconds = remainingSecs % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  if (days > 0) {
    return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  }
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export class BillingService {
  // Authoritative calculation of elapsed time and itemized charges
  public calculateTripCharges(
    booking: Booking,
    currentTimeMs: number = Date.now()
  ): TripCalculationResult {
    // Determine start timestamp
    const startTimeStr = booking.tripStartedAt || booking.createdAt;
    const startMs = new Date(startTimeStr).getTime();

    // Determine end timestamp (if completed, use authoritative tripCompletedAt; otherwise current time)
    const endMs = booking.tripCompletedAt
      ? new Date(booking.tripCompletedAt).getTime()
      : currentTimeMs;

    const elapsedSeconds = Math.max(0, Math.floor((endMs - startMs) / 1000));
    const totalHoursExact = elapsedSeconds / 3600;
    const daysElapsed = Math.floor(elapsedSeconds / 86400);
    const isOver24Hours = daysElapsed >= 1;

    // Use saved snapshot if present, else fallback to defaults
    const snapshot: PricingPolicySnapshot = booking.pricingSnapshot || {
      serviceType: booking.serviceTitle,
      baseHourlyRate: booking.estimatedFare > 2000 ? 250 : 200,
      minimumHours: booking.serviceTitle === 'Outstation Driver' ? 12 : 2,
      partialHourRule: 'ceil_hour',
      daily24hRate: 2000,
      overnightCharge: 300,
      multiDayDiscountPercent: 10,
      includedKmPerDay: 250,
      extraPerKmRate: 12,
      overtimePerHourRate: 99,
      taxPercent: 0,
    };

    // Calculate billable hours based on configured rounding policy
    let calculatedHours = totalHoursExact;
    if (snapshot.partialHourRule === 'ceil_hour') {
      calculatedHours = Math.ceil(totalHoursExact);
    } else if (snapshot.partialHourRule === '15_min_block') {
      calculatedHours = Math.ceil(totalHoursExact * 4) / 4;
    } else {
      calculatedHours = Number(totalHoursExact.toFixed(2));
    }

    const billableHours = Math.max(snapshot.minimumHours, calculatedHours);

    // Calculate time-based charges
    let timeBasedCharge = 0;
    if (daysElapsed >= 1) {
      // 24-Hour Day Package pricing
      const dailyBase = daysElapsed * snapshot.daily24hRate;
      const remainingHours = Math.max(0, billableHours - daysElapsed * 24);
      const remainingCharge = remainingHours * snapshot.baseHourlyRate;
      timeBasedCharge = dailyBase + remainingCharge;

      // Apply multi-day discount if >1 day
      if (daysElapsed >= 2 && snapshot.multiDayDiscountPercent > 0) {
        const discount = (timeBasedCharge * snapshot.multiDayDiscountPercent) / 100;
        timeBasedCharge = Math.round(timeBasedCharge - discount);
      }
    } else {
      // Regular hourly billing
      timeBasedCharge = Math.round(billableHours * snapshot.baseHourlyRate);
    }

    // Distance charges (separate from time charges)
    let distanceBasedCharge = 0;
    const actualKm = booking.actualTraveledKm || 0;
    const includedKm = (snapshot.includedKmPerDay || 250) * Math.max(1, daysElapsed);

    if (actualKm > includedKm && snapshot.extraPerKmRate) {
      const extraKm = actualKm - includedKm;
      distanceBasedCharge = Math.round(extraKm * snapshot.extraPerKmRate);
    }

    // Overnight charge check (if trip spanned 10 PM to 6 AM)
    const startDate = new Date(startMs);
    const endDate = new Date(endMs);
    const spansNight = startDate.getHours() >= 22 || endDate.getHours() <= 6 || elapsedSeconds > 43200;
    const nightCharges = spansNight ? snapshot.overnightCharge : 0;

    const totalEstimatedOrFinal = timeBasedCharge + distanceBasedCharge + nightCharges;

    return {
      elapsedSeconds,
      formattedElapsed: formatDuration(elapsedSeconds),
      billableHours,
      timeBasedCharge,
      distanceBasedCharge,
      nightCharges,
      overtimeCharges: 0,
      totalEstimatedOrFinal,
      isOver24Hours,
      daysElapsed,
    };
  }

  // Pre-trip transparent fare estimation accounting for driving time, destination waiting, and return routes
  public calculateEstimatedFare(params: {
    serviceType: any;
    hourlyRate: number;
    minimumHours: number;
    partialHourRule: 'ceil_hour' | 'exact_fraction' | '15_min_block';
    dailyRate24h: number;
    multiDayDiscountPercent: number;
    outstationRatePerDay: number;
    outstationIncludedKmPerDay: number;
    outstationExtraKmRate: number;
    nightAllowance: number;
    waitingChargePerHour: number;
    outboundDistanceKm: number;
    outboundDurationMinutes: number;
    returnDistanceKm: number;
    returnDurationMinutes: number;
    isReturnTrip: boolean;
    waitingHours: number;
    expectedTotalDurationHours?: number;
    returnJourneyOption: 'same_day' | 'after_waiting' | 'different_date' | 'one_way';
  }) {
    const outboundDistanceKm = Number((params.outboundDistanceKm || 0).toFixed(1));
    const returnDistanceKm = params.isReturnTrip ? Number((params.returnDistanceKm || 0).toFixed(1)) : 0;
    const totalRoadDistanceKm = Number((outboundDistanceKm + returnDistanceKm).toFixed(1));

    const outboundDrivingMinutes = Math.round(params.outboundDurationMinutes || 0);
    const returnDrivingMinutes = params.isReturnTrip ? Math.round(params.returnDurationMinutes || 0) : 0;
    const totalDrivingMinutes = outboundDrivingMinutes + returnDrivingMinutes;
    const totalDrivingHours = Number((totalDrivingMinutes / 60).toFixed(1));

    const waitingHours = Math.max(0, Number(params.waitingHours || 0));

    // Calculate expected total duration
    const requiredDrivingAndWaitingHours = Number((totalDrivingHours + waitingHours).toFixed(1));
    const expectedTotalDurationHours = Math.max(
      params.minimumHours,
      params.expectedTotalDurationHours !== undefined && params.expectedTotalDurationHours > 0
        ? params.expectedTotalDurationHours
        : requiredDrivingAndWaitingHours
    );

    // Apply partial hour rounding rule
    let roundedHours = expectedTotalDurationHours;
    if (params.partialHourRule === 'ceil_hour') {
      roundedHours = Math.ceil(expectedTotalDurationHours);
    } else if (params.partialHourRule === '15_min_block') {
      roundedHours = Math.ceil(expectedTotalDurationHours * 4) / 4;
    } else {
      roundedHours = Number(expectedTotalDurationHours.toFixed(2));
    }

    const billableHours = Math.max(params.minimumHours, roundedHours);
    const effectiveHourlyRate = params.hourlyRate || 200;

    let timeBasedCharge = 0;
    let billingMethod: 'hourly' | 'daily_package' | 'multi_day' | 'package' = 'hourly';

    if (billableHours >= 24) {
      const days = Math.floor(billableHours / 24);
      const remainingHours = billableHours % 24;
      const dailyRate = params.serviceType === 'Outstation Driver' ? params.outstationRatePerDay : params.dailyRate24h;
      let dailyBase = days * dailyRate;

      if (days >= 2 && params.multiDayDiscountPercent > 0) {
        dailyBase = Math.round(dailyBase * (1 - params.multiDayDiscountPercent / 100));
        billingMethod = 'multi_day';
      } else {
        billingMethod = 'daily_package';
      }

      const remainingCharge = Math.round(remainingHours * effectiveHourlyRate);
      timeBasedCharge = dailyBase + remainingCharge;
    } else if (billableHours === 12) {
      timeBasedCharge = Math.round(billableHours * effectiveHourlyRate);
      billingMethod = 'package';
    } else {
      timeBasedCharge = Math.round(billableHours * effectiveHourlyRate);
      billingMethod = 'hourly';
    }

    // Distance-based charges (e.g. for Outstation beyond included km)
    let distanceBasedCharge = 0;
    let includedKm = 0;
    let extraKm = 0;

    if (params.serviceType === 'Outstation Driver') {
      const days = Math.max(1, Math.ceil(billableHours / 24));
      includedKm = (params.outstationIncludedKmPerDay || 250) * days;
      if (totalRoadDistanceKm > includedKm) {
        extraKm = Number((totalRoadDistanceKm - includedKm).toFixed(1));
        distanceBasedCharge = Math.round(extraKm * (params.outstationExtraKmRate || 12));
      }
    }

    // Night / overnight allowance
    let nightCharges = 0;
    if (params.returnJourneyOption === 'different_date' || waitingHours >= 8 || billableHours >= 24) {
      nightCharges = params.nightAllowance || 0;
    }

    const taxesAndFees = 0;
    const totalEstimatedFare = timeBasedCharge + distanceBasedCharge + nightCharges + taxesAndFees;

    return {
      totalEstimatedFare,
      timeBasedCharge,
      distanceBasedCharge,
      nightCharges,
      taxesAndFees,
      billingMethod,
      billableHours,
      effectiveHourlyRate,
      outboundDistanceKm,
      returnDistanceKm,
      totalRoadDistanceKm,
      outboundDrivingMinutes,
      returnDrivingMinutes,
      totalDrivingMinutes,
      totalDrivingHours,
      waitingHours,
      expectedTotalDurationHours,
      includedKm,
      extraKm,
    };
  }
}

export const billingService = new BillingService();

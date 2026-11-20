import { apiClient } from './apiClient';
import { CustomerProfile } from '../types';
import { authService } from './auth';

export interface CustomerSyncData {
  email: string;
  name?: string;
  phone?: string;
  avatarUrl?: string;
  city?: string;
  clerkId?: string;
}

export const customerService = {
  // Sync customer profile with backend on Google Login
  async syncCustomerProfileAsync(data: CustomerSyncData): Promise<{ success: boolean; customer?: CustomerProfile; error?: string }> {
    try {
      const res = await apiClient.post<{ success: boolean; customer: CustomerProfile; error?: string }>(
        '/api/customers/sync',
        data,
        {
          fallbackErrorMessage: 'Unable to synchronize customer profile with server.',
        }
      );

      if (res.success && res.data?.customer) {
        // Cache customer profile in local storage
        try {
          localStorage.setItem('localdrivers_customer_profile', JSON.stringify(res.data.customer));
          if (res.data.customer.name) {
            localStorage.setItem('localdrivers_customer_name', res.data.customer.name);
          }
          if (res.data.customer.phone) {
            localStorage.setItem('localdrivers_verified_customer_phone', res.data.customer.phone);
          }
        } catch {}
        return { success: true, customer: res.data.customer };
      }

      return { success: false, error: res.error || 'Failed to sync customer profile.' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // Get customer profile by email
  async getCustomerProfileAsync(email: string): Promise<CustomerProfile | null> {
    if (!email) return null;
    try {
      const res = await apiClient.get<{ success: boolean; customer: CustomerProfile }>(
        `/api/customers/profile?email=${encodeURIComponent(email.trim().toLowerCase())}`,
        {
          fallbackErrorMessage: 'Unable to retrieve customer profile.',
        }
      );

      if (res.success && res.data?.customer) {
        return res.data.customer;
      }
      return null;
    } catch {
      return null;
    }
  },

  // Update customer contact phone number or city
  async updateCustomerProfileAsync(data: { email: string; phone?: string; name?: string; city?: string }): Promise<boolean> {
    try {
      const res = await apiClient.post<{ success: boolean; message?: string }>(
        '/api/customers/profile',
        data,
        {
          fallbackErrorMessage: 'Unable to update customer contact details.',
        }
      );
      if (res.success) {
        if (data.phone) {
          localStorage.setItem('localdrivers_verified_customer_phone', data.phone.replace(/\D/g, '').slice(-10));
        }
        if (data.name) {
          localStorage.setItem('localdrivers_customer_name', data.name);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  // Admin: Get all customer records with trip analytics
  async getAdminCustomersAsync(): Promise<CustomerProfile[]> {
    try {
      const res = await apiClient.get<{ success: boolean; customers: CustomerProfile[] }>(
        '/api/admin/customers',
        {
          headers: authService.getAdminAuthHeaders(),
          fallbackErrorMessage: 'Unable to retrieve customer records.',
        }
      );

      if (res.success && res.data?.customers && Array.isArray(res.data.customers)) {
        return res.data.customers;
      }
      return [];
    } catch {
      return [];
    }
  },

  // Get locally remembered customer profile
  getCachedCustomerProfile(): CustomerProfile | null {
    try {
      const cached = localStorage.getItem('localdrivers_customer_profile');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  },
};

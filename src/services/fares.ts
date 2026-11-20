import { apiClient } from './apiClient';
import { authService } from './auth';
import { AdminPricingConfig } from '../types';

export const faresService = {
  async getFaresAsync(): Promise<AdminPricingConfig | null> {
    const res = await apiClient.get<{ fares: AdminPricingConfig }>('/api/fares', {
      fallbackErrorMessage: 'Unable to retrieve real-time fares from server.',
    });
    if (res.success && res.data?.fares) {
      return res.data.fares;
    }
    return null;
  },

  async updateFaresAsync(fares: Partial<AdminPricingConfig>): Promise<{ success: boolean; error?: string; message?: string }> {
    const res = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
      '/api/fares',
      fares,
      {
        headers: authService.getAdminAuthHeaders(),
        fallbackErrorMessage: 'Failed to update fare prices on server.',
      }
    );
    return {
      success: Boolean(res.success && res.data?.success),
      error: res.error || res.data?.error,
      message: res.data?.message,
    };
  },
};

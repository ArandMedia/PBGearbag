import { apiClient } from './api';

export type BillingPlan = 'monthly' | 'yearly';

export interface BillingStatus {
  isPro: boolean;
  plan: BillingPlan | null;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

class BillingService {
  async getStatus(): Promise<BillingStatus> {
    const response = await apiClient.get<BillingStatus>('/billing/status');
    return response.data;
  }

  async startCheckout(plan: BillingPlan): Promise<string> {
    const response = await apiClient.post<{ url: string }>(
      '/billing/checkout-session',
      { plan },
    );
    return response.data.url;
  }

  async openPortal(): Promise<string> {
    const response = await apiClient.post<{ url: string }>(
      '/billing/portal-session',
    );
    return response.data.url;
  }
}

export const billingService = new BillingService();

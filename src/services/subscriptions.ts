import { api } from './api';

// Types
export interface Subscription {
  id: string;
  userId: string;
  planType: string;
  status: 'active' | 'pending' | 'cancelled' | 'expired';
  amount: number;
  startDate: string;
  endDate: string;
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionDto {
  planType: string;
  paymentMethod?: string;
}

export interface SubscriptionFilters {
  status?: string;
  page?: number;
  limit?: number;
}

export interface SubscriptionsResponse {
  data: Subscription[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Subscriptions Service
export const subscriptionsService = {
  async create(data: CreateSubscriptionDto): Promise<{ data: Subscription | null; error: string | null }> {
    return api.post<Subscription>('/subscriptions', data);
  },

  async list(filters?: SubscriptionFilters): Promise<{ data: SubscriptionsResponse | null; error: string | null }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<SubscriptionsResponse>(`/subscriptions${query}`);
  },

  async getHistory(): Promise<{ data: Subscription[] | null; error: string | null }> {
    return api.get<Subscription[]>('/subscriptions/history');
  },

  async getCurrent(): Promise<{ data: Subscription | null; error: string | null }> {
    return api.get<Subscription>('/subscriptions/me');
  },
};

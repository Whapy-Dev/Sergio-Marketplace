import { api } from './api';

// Types
export interface Shop {
  id: string;
  name: string;
  description?: string;
  type: 'retailer' | 'wholesaler';
  logo?: string;
  banner?: string;
  province: string;
  city: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  schedule?: ShopSchedule;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShopSchedule {
  monday?: { open: string; close: string };
  tuesday?: { open: string; close: string };
  wednesday?: { open: string; close: string };
  thursday?: { open: string; close: string };
  friday?: { open: string; close: string };
  saturday?: { open: string; close: string };
  sunday?: { open: string; close: string };
}

export interface CreateShopDto {
  name: string;
  description?: string;
  type: 'retailer' | 'wholesaler';
  province: string;
  city: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  schedule?: ShopSchedule;
}

export interface ShopFilters {
  type?: 'retailer' | 'wholesaler';
  state?: string;
  radius?: number;
  lat?: number;
  lng?: number;
  openNow?: boolean;
  products?: string;
  page?: number;
  limit?: number;
}

export interface ShopsResponse {
  data: Shop[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Shops Service
export const shopsService = {
  async create(data: CreateShopDto, logo?: any, banner?: any): Promise<{ data: Shop | null; error: string | null }> {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    if (logo) {
      formData.append('logo', logo);
    }
    if (banner) {
      formData.append('banner', banner);
    }

    return api.uploadFormData<Shop>('/shops', formData);
  },

  async list(filters?: ShopFilters): Promise<{ data: ShopsResponse | null; error: string | null }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<ShopsResponse>(`/shops${query}`);
  },

  async getMyShop(): Promise<{ data: Shop | null; error: string | null }> {
    return api.get<Shop>('/shops/me');
  },

  async getById(id: string, productsPage?: number, productsLimit?: number): Promise<{ data: Shop | null; error: string | null }> {
    const params = new URLSearchParams();
    if (productsPage) params.append('productsPage', String(productsPage));
    if (productsLimit) params.append('productsLimit', String(productsLimit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<Shop>(`/shops/${id}${query}`);
  },

  async update(id: string, data: Partial<CreateShopDto>, logo?: any, banner?: any): Promise<{ data: Shop | null; error: string | null }> {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    if (logo) {
      formData.append('logo', logo);
    }
    if (banner) {
      formData.append('banner', banner);
    }

    return api.uploadFormData<Shop>(`/shops/${id}`, formData);
  },

  async delete(id: string): Promise<{ data: any; error: string | null }> {
    return api.delete(`/shops/${id}`);
  },
};

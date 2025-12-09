import { api } from './api';

// Types
export interface Product {
  id: string;
  name: string;
  description?: string;
  retailPrice?: number;
  wholesalePrice?: number;
  stock: number;
  sku?: string;
  barcode?: string;
  brand?: string;
  characteristics?: Record<string, any>;
  images: string[];
  categoryId?: string;
  shopId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  retailPrice?: number;
  wholesalePrice?: number;
  stock: number;
  sku?: string;
  barcode?: string;
  brand?: string;
  characteristics?: Record<string, any>;
  categoryId?: string;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  brand?: string;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface ProductsResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Products Service
export const apiProductsService = {
  async createForShop(
    shopId: string,
    data: CreateProductDto,
    images?: any[]
  ): Promise<{ data: Product | null; error: string | null }> {
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

    if (images) {
      images.forEach((image, index) => {
        formData.append('images', image);
      });
    }

    return api.uploadFormData<Product>(`/products/shop/${shopId}`, formData);
  },

  async listByShop(shopId: string, filters?: ProductFilters): Promise<{ data: ProductsResponse | null; error: string | null }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<ProductsResponse>(`/products/shop/${shopId}${query}`);
  },

  async listAll(filters?: ProductFilters): Promise<{ data: ProductsResponse | null; error: string | null }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<ProductsResponse>(`/products${query}`);
  },

  async search(query: string): Promise<{ data: Product[] | null; error: string | null }> {
    if (query.length < 2) {
      return { data: [], error: null };
    }
    return api.get<Product[]>(`/products/search?q=${encodeURIComponent(query)}`);
  },

  async getById(id: string): Promise<{ data: Product | null; error: string | null }> {
    return api.get<Product>(`/products/${id}`);
  },

  async update(id: string, data: Partial<CreateProductDto>): Promise<{ data: Product | null; error: string | null }> {
    return api.patch<Product>(`/products/${id}`, data);
  },

  async delete(id: string): Promise<{ data: any; error: string | null }> {
    return api.delete(`/products/${id}`);
  },
};

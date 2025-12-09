import { api } from './api';

// Types
export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  image?: string;
  parentId?: string;
}

// Categories Service
export const apiCategoriesService = {
  async create(data: CreateCategoryDto): Promise<{ data: Category | null; error: string | null }> {
    return api.post<Category>('/categories', data);
  },

  async list(): Promise<{ data: Category[] | null; error: string | null }> {
    return api.get<Category[]>('/categories');
  },

  async getById(id: string): Promise<{ data: Category | null; error: string | null }> {
    return api.get<Category>(`/categories/${id}`);
  },

  async update(id: string, data: Partial<CreateCategoryDto>): Promise<{ data: Category | null; error: string | null }> {
    return api.patch<Category>(`/categories/${id}`, data);
  },

  async delete(id: string): Promise<{ data: any; error: string | null }> {
    return api.delete(`/categories/${id}`);
  },

  async getProducts(categoryId: string, page?: number, limit?: number): Promise<{ data: any; error: string | null }> {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/categories/${categoryId}/products${query}`);
  },
};

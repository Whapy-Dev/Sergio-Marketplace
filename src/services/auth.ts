import { api } from './api';

// Types
export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: 'client' | 'retailer' | 'wholesaler';
  province?: string;
  city?: string;
  address?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  province?: string;
  city?: string;
  address?: string;
  createdAt: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface UpdateLocationDto {
  province: string;
  city: string;
  address?: string;
}

// Auth Service
export const authService = {
  async register(data: RegisterDto): Promise<{ data: AuthResponse | null; error: string | null }> {
    const result = await api.post<AuthResponse>('/auth/register', data);
    if (result.data?.access_token) {
      await api.setAuthToken(result.data.access_token);
      await api.setUser(result.data.user);
    }
    return result;
  },

  async login(data: LoginDto): Promise<{ data: AuthResponse | null; error: string | null }> {
    const result = await api.post<AuthResponse>('/auth/login', data);
    if (result.data?.access_token) {
      await api.setAuthToken(result.data.access_token);
      await api.setUser(result.data.user);
    }
    return result;
  },

  async forgotPassword(email: string): Promise<{ data: any; error: string | null }> {
    return api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<{ data: any; error: string | null }> {
    return api.post('/auth/reset-password', { token, password });
  },

  async getMe(): Promise<{ data: User | null; error: string | null }> {
    return api.get<User>('/auth/me');
  },

  async updateLocation(data: UpdateLocationDto): Promise<{ data: User | null; error: string | null }> {
    return api.patch<User>('/auth/location', data);
  },

  async logout(): Promise<void> {
    await api.removeAuthToken();
  },

  async getCurrentUser(): Promise<User | null> {
    return api.getUser();
  },

  async isAuthenticated(): Promise<boolean> {
    const user = await api.getUser();
    return !!user;
  },
};

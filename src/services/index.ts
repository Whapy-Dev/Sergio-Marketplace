// API Client
export { api, API_URL } from './api';

// Auth Service
export { authService } from './auth';
export type { RegisterDto, LoginDto, User, AuthResponse, UpdateLocationDto } from './auth';

// Shops Service
export { shopsService } from './shops';
export type { Shop, ShopSchedule, CreateShopDto, ShopFilters, ShopsResponse } from './shops';

// Products Service (API)
export { apiProductsService } from './apiProducts';
export type { Product, CreateProductDto, ProductFilters, ProductsResponse } from './apiProducts';

// Categories Service (API)
export { apiCategoriesService } from './apiCategories';
export type { Category, CreateCategoryDto } from './apiCategories';

// Subscriptions Service
export { subscriptionsService } from './subscriptions';
export type { Subscription, CreateSubscriptionDto, SubscriptionFilters, SubscriptionsResponse } from './subscriptions';

// Supabase (existing)
export { supabase } from './supabase';

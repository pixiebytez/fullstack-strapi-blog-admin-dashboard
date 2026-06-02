/**
 * Strapi API client
 *
 * Centralises all HTTP communication with the Strapi backend.
 * Uses axios with interceptors for auth token injection,
 * error normalisation, and response unwrapping.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type { StrapiResponse, Blog, Category, Tag, Comment, BlogFilters } from '@/types';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const API_TOKEN  = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;

// ============================================================
// Axios instance
// ============================================================
const api: AxiosInstance = axios.create({
  baseURL: `${STRAPI_URL}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
  },
});

// --- Request interceptor: inject user JWT if present --------
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('strapi_jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// --- Response interceptor: normalise errors -----------------
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ error?: { message?: string } }>) => {
    const message =
      error.response?.data?.error?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// ============================================================
// Blog APIs
// ============================================================
export const blogApi = {

  getAll: (filters: BlogFilters = {}) => {
    const params: Record<string, unknown> = {
      'pagination[page]':     filters.page     || 1,
      'pagination[pageSize]': filters.pageSize || 12,
      'populate[0]': 'featuredImage',
      'populate[1]': 'author',
      'populate[2]': 'category',
      'populate[3]': 'tags',
      sort: filters.sort || 'publishedDate:desc',
    };

    if (filters.category) params['filters[category][slug][$eq]'] = filters.category;
    if (filters.tag)      params['filters[tags][slug][$in]']     = filters.tag;
    if (filters.featured) params['filters[isFeatured][$eq]']     = true;

    return api.get<StrapiResponse<Blog[]>>('/blogs', { params });
  },

  getBySlug: (slug: string) =>
    api.get<StrapiResponse<Blog>>(`/blogs/slug/${slug}`),

  search: (q: string, filters: Omit<BlogFilters, 'q'> = {}) =>
    api.get<StrapiResponse<Blog[]>>('/blogs/search', { params: { q, ...filters } }),

  getTrending: (limit = 10) =>
    api.get<StrapiResponse<Blog[]>>('/blogs/trending', { params: { limit } }),

  getRelated: (id: number, limit = 4) =>
    api.get<StrapiResponse<Blog[]>>(`/blogs/${id}/related`, { params: { limit } }),

  create: (data: Partial<Blog>) =>
    api.post<StrapiResponse<Blog>>('/blogs', { data }),

  update: (id: number, data: Partial<Blog>) =>
    api.put<StrapiResponse<Blog>>(`/blogs/${id}`, { data }),

  delete: (id: number) =>
    api.delete(`/blogs/${id}`),

  generate: (payload: { topic: string; tone?: string; length?: string; keywords?: string[] }) =>
    api.post('/blogs/generate', payload),
};

// ============================================================
// Category APIs
// ============================================================
export const categoryApi = {
  getAll: () =>
    api.get<StrapiResponse<Category[]>>('/categories', {
      params: {
        'populate[0]': 'image',
        sort:          'name:asc',
      },
    }),

  getBySlug: (slug: string, page = 1) =>
    api.get<StrapiResponse<Category>>(`/categories/slug/${slug}`, { params: { page } }),
};

// ============================================================
// Tag APIs
// ============================================================
export const tagApi = {
  getAll: () =>
    api.get<StrapiResponse<Tag[]>>('/tags', { params: { sort: 'name:asc' } }),
};

// ============================================================
// Comment APIs
// ============================================================
export const commentApi = {
  getByBlog: (blogId: number, page = 1) =>
    api.get<StrapiResponse<Comment[]>>(`/comments/blog/${blogId}`, { params: { page } }),

  create: (data: { content: string; blogId: number; parentCommentId?: number }) =>
    api.post<StrapiResponse<Comment>>('/comments', { data }),

  like: (id: number) =>
    api.post(`/comments/${id}/like`),
};

// ============================================================
// Auth APIs
// ============================================================
export const authApi = {
  login: (identifier: string, password: string) =>
    api.post('/auth/local', { identifier, password }),

  register: (data: { username: string; email: string; password: string; firstName?: string; lastName?: string }) =>
    api.post('/auth/local/register', data),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (code: string, password: string, passwordConfirmation: string) =>
    api.post('/auth/reset-password', { code, password, passwordConfirmation }),

  getMe: () =>
    api.get('/users/me', {
      params: { 'populate[0]': 'role', 'populate[1]': 'avatar' },
    }),
};

// ============================================================
// Newsletter APIs
// ============================================================
export const newsletterApi = {
  subscribe: (email: string, firstName?: string) =>
    api.post('/newsletters/subscribe', { email, firstName, source: 'website' }),
};

export default api;

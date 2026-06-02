'use client';

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogApi } from '@/lib/strapi';
import type { BlogFilters } from '@/types';

// ============================================================
// useBlogs — list with filters and pagination
// ============================================================
export function useBlogs(filters: BlogFilters = {}) {
  return useQuery({
    queryKey: ['blogs', filters],
    queryFn:  () => blogApi.getAll(filters).then((r) => r.data),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

// ============================================================
// useBlogBySlug — single blog post
// ============================================================
export function useBlogBySlug(slug: string) {
  return useQuery({
    queryKey: ['blog', slug],
    queryFn:  () => blogApi.getBySlug(slug).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    enabled:  !!slug,
  });
}

// ============================================================
// useTrendingBlogs — trending section
// ============================================================
export function useTrendingBlogs(limit = 5) {
  return useQuery({
    queryKey: ['blogs', 'trending', limit],
    queryFn:  () => blogApi.getTrending(limit).then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  });
}

// ============================================================
// useRelatedBlogs — related posts sidebar
// ============================================================
export function useRelatedBlogs(id: number | undefined, limit = 4) {
  return useQuery({
    queryKey: ['blogs', 'related', id, limit],
    queryFn:  () => blogApi.getRelated(id!, limit).then((r) => r.data),
    enabled:  !!id,
    staleTime: 10 * 60 * 1000,
  });
}

// ============================================================
// useSearchBlogs — full-text search
// ============================================================
export function useSearchBlogs(q: string, filters: Omit<BlogFilters, 'q'> = {}) {
  return useQuery({
    queryKey: ['blogs', 'search', q, filters],
    queryFn:  () => blogApi.search(q, filters).then((r) => r.data),
    enabled:  q.trim().length >= 2,
    staleTime: 30 * 1000,
  });
}

// ============================================================
// useInfiniteBlogs — infinite scroll
// ============================================================
export function useInfiniteBlogs(filters: BlogFilters = {}) {
  return useInfiniteQuery({
    queryKey:       ['blogs', 'infinite', filters],
    queryFn:        ({ pageParam = 1 }) =>
      blogApi.getAll({ ...filters, page: pageParam }).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, pageCount } = lastPage.meta?.pagination || {};
      return page && page < (pageCount || 1) ? page + 1 : undefined;
    },
    staleTime: 60 * 1000,
  });
}

// ============================================================
// useDeleteBlog — delete mutation
// ============================================================
export function useDeleteBlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => blogApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blogs'] });
    },
  });
}

// ============================================================
// useGenerateBlog — AI generation mutation
// ============================================================
export function useGenerateBlog() {
  return useMutation({
    mutationFn: (payload: {
      topic: string;
      tone?: string;
      length?: string;
      keywords?: string[];
    }) => blogApi.generate(payload).then((r) => r.data),
  });
}

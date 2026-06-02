'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/strapi';
import { useAuthStore } from '@/store/auth.store';
import type { User } from '@/types';

// ============================================================
// useAuth — authentication hook
// ============================================================
export function useAuth() {
  const { user, token, login, logout, setLoading } = useAuthStore();
  const router = useRouter();

  const isAuthenticated = !!token && !!user;

  // Fetch current user from /users/me
  const { data: currentUser, refetch: refetchUser } = useQuery({
    queryKey: ['me'],
    queryFn:  async () => {
      const res = await authApi.getMe();
      return res.data as User;
    },
    enabled:  isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: ({ identifier, password }: { identifier: string; password: string }) =>
      authApi.login(identifier, password),
    onSuccess: (res) => {
      login(res.data.user as User, res.data.jwt as string);
      router.push('/dashboard');
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: {
      username: string;
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    }) => authApi.register(data),
    onSuccess: (res) => {
      login(res.data.user as User, res.data.jwt as string);
      router.push('/dashboard');
    },
  });

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  });

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return {
    user:               currentUser || user,
    token,
    isAuthenticated,
    isAdmin:            user?.role?.type === 'administrator',
    isModerator:        ['administrator', 'moderator'].includes(user?.role?.type || ''),
    login:              loginMutation.mutateAsync,
    register:           registerMutation.mutateAsync,
    forgotPassword:     forgotPasswordMutation.mutateAsync,
    logout:             handleLogout,
    refetchUser,
    isLoginLoading:     loginMutation.isPending,
    isRegisterLoading:  registerMutation.isPending,
    loginError:         loginMutation.error?.message,
    registerError:      registerMutation.error?.message,
  };
}

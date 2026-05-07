import { useMemo } from 'react';
import type { AuthUser, UserRole } from '../types';

export function useAuth() {
  const user: AuthUser | null = useMemo(() => {
    try {
      const raw = localStorage.getItem('gc_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const isAdmin = user?.role === 'admin';
  const isOperator = user?.role === 'operator';
  const isLoggedIn = !!user && !!localStorage.getItem('gc_token');

  function hasRole(role: UserRole) {
    return user?.role === role;
  }

  return { user, isAdmin, isOperator, isLoggedIn, hasRole };
}

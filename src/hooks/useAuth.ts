import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  const hasRole = (role: string) => user?.role === role;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'LAB_DIRECTOR';
    
  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    setUser,
    checkAuth,
    hasRole,
    isAdmin,
  };
}

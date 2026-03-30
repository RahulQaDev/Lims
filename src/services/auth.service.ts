import { get, post, put } from './api';
import type { ApiResponse, LoginResponse, User } from '../types';

export const authService = {
  login(username: string, password: string) {
    return post<ApiResponse<LoginResponse>>('/auth/login', { username, password });
  },

  logout() {
    return post<ApiResponse<null>>('/auth/logout');
  },

  getCurrentUser() {
    return get<ApiResponse<User>>('/auth/me');
  },

  updateProfile(data: Partial<User>) {
    return put<ApiResponse<User>>('/auth/profile', data);
  },

  changePassword(currentPassword: string, newPassword: string) {
    return put<ApiResponse<null>>('/auth/change-password', { currentPassword, newPassword });
  },
};

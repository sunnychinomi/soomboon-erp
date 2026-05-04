import { apiClient } from './client';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  roles: string[];
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: LoginRequest & { email: string; fullName?: string }) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data),
};

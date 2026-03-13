import api from './axios';

export interface User {
  id: string;
  email: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  date_of_birth?: string;
  gender?: string;
  location?: string;
  travel_style?: string;
  interests: string[];
  languages: string[];
  countries_visited: string[];
  bucket_list: string[];
  instagram?: string;
  twitter?: string;
  website?: string;
  created_at?: string;
  trips_count: number;
  companions_count: number;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export const authApi = {
  register: (data: { email: string; password: string; full_name: string }) =>
    api.post<AuthResponse>('/api/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/api/auth/login', data),

  getProfile: () =>
    api.get<User>('/api/users/me'),

  updateProfile: (data: Partial<User>) =>
    api.put<User>('/api/users/me', data),

  getUserProfile: (userId: string) =>
    api.get<User>(`/api/users/${userId}`),
};

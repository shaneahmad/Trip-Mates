import api from './axios';

export interface Trip {
  id: string;
  creator_id: string;
  creator_name: string;
  creator_avatar?: string;
  title: string;
  description: string;
  destination: string;
  cover_image?: string;
  start_date: string;
  end_date: string;
  budget_min?: number;
  budget_max?: number;
  budget_currency: string;
  max_companions: number;
  current_companions: number;
  companions: { user_id: string; full_name: string; avatar_url?: string }[];
  tags: string[];
  activities: string[];
  accommodation_type?: string;
  status: string;
  created_at?: string;
  is_joined: boolean;
}

export interface TripCreate {
  title: string;
  description: string;
  destination: string;
  cover_image?: string;
  start_date: string;
  end_date: string;
  budget_min?: number;
  budget_max?: number;
  budget_currency?: string;
  max_companions?: number;
  tags?: string[];
  activities?: string[];
  accommodation_type?: string;
}

export const tripsApi = {
  create: (data: TripCreate) =>
    api.post<Trip>('/api/trips', data),

  list: (params?: Record<string, string | number>) =>
    api.get<Trip[]>('/api/trips', { params }),

  getMyTrips: () =>
    api.get<Trip[]>('/api/trips/my-trips'),

  getById: (id: string) =>
    api.get<Trip>(`/api/trips/${id}`),

  update: (id: string, data: Partial<TripCreate>) =>
    api.put<Trip>(`/api/trips/${id}`, data),

  delete: (id: string) =>
    api.delete(`/api/trips/${id}`),

  join: (id: string) =>
    api.post(`/api/trips/${id}/join`),
};

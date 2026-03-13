import api from './axios';

export interface DiscoverProfile {
  id: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  location?: string;
  travel_style?: string;
  interests: string[];
  languages: string[];
  countries_visited: string[];
  bucket_list: string[];
  age?: number;
  trips_count: number;
  companions_count: number;
  compatibility_score?: number;
}

export interface Match {
  id: string;
  users: { user_id: string; full_name: string; avatar_url?: string }[];
  matched_at?: string;
  conversation_id?: string;
}

export const matchesApi = {
  discover: () =>
    api.get<DiscoverProfile[]>('/api/discover'),

  swipe: (targetId: string, action: 'like' | 'pass') =>
    api.post<{ matched: boolean; conversation_id?: string; message: string }>('/api/matches/action', {
      target_id: targetId,
      action,
    }),

  getMatches: () =>
    api.get<Match[]>('/api/matches'),
};

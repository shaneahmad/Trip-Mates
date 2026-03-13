import api from './axios';

export interface Post {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  images: string[];
  location?: string;
  trip_id?: string;
  tags: string[];
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  comments: Comment[];
  created_at?: string;
}

export interface Comment {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  created_at?: string;
}

export const postsApi = {
  create: (data: { content: string; images?: string[]; location?: string; trip_id?: string; tags?: string[] }) =>
    api.post<Post>('/api/posts', data),

  getFeed: (page = 1, limit = 20) =>
    api.get<Post[]>('/api/posts', { params: { page, limit } }),

  getById: (id: string) =>
    api.get<Post>(`/api/posts/${id}`),

  toggleLike: (id: string) =>
    api.post<{ liked: boolean }>(`/api/posts/${id}/like`),

  addComment: (id: string, content: string) =>
    api.post<Comment>(`/api/posts/${id}/comment`, { content }),

  delete: (id: string) =>
    api.delete(`/api/posts/${id}`),
};

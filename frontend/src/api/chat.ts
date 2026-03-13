import api from './axios';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  read: boolean;
  created_at?: string;
}

export interface Conversation {
  id: string;
  participants: { user_id: string; full_name: string; avatar_url?: string }[];
  last_message?: {
    content: string;
    sender_id: string;
    sender_name: string;
    created_at: string;
  };
  unread_count: number;
  created_at?: string;
  updated_at?: string;
}

export const chatApi = {
  getConversations: () =>
    api.get<Conversation[]>('/api/chat/conversations'),

  getMessages: (conversationId: string, page = 1) =>
    api.get<Message[]>(`/api/chat/${conversationId}/messages`, { params: { page } }),
};

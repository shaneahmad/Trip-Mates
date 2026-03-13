import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { chatApi } from '../api/chat';
import type { Conversation, Message } from '../api/chat';
import { useAuthStore } from '../store/authStore';
import { useWebSocket } from '../hooks/useWebSocket';
import Avatar from '../components/Avatar';
import './ChatPage.css';

export default function ChatListPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const { data } = await chatApi.getConversations();
      setConversations(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const getOtherParticipant = (conv: Conversation) => {
    return conv.participants.find((p) => p.user_id !== user?.id) || conv.participants[0];
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  return (
    <div className="page-container chat-page">
      <div className="page-header animate-fadeInUp">
        <h1>Messages</h1>
        <p>Chat with your travel mates</p>
      </div>

      {loading ? (
        <div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ marginBottom: 8 }}>
              <div className="card-body" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 999 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: 120, height: 16, marginBottom: 6 }} />
                  <div className="skeleton" style={{ width: 200, height: 12 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <h3>No conversations yet</h3>
          <p>Match with travel mates to start chatting!</p>
          <Link to="/discover" className="btn btn-primary" style={{ marginTop: 16 }}>
            Discover Mates
          </Link>
        </div>
      ) : (
        <div className="conversation-list">
          {conversations.map((conv, idx) => {
            const other = getOtherParticipant(conv);
            return (
              <Link
                key={conv.id}
                to={`/chat/${conv.id}`}
                className="conversation-item card animate-fadeInUp"
                style={{ animationDelay: `${idx * 0.03}s` }}
              >
                <div className="card-body conversation-item-inner">
                  <Avatar src={other.avatar_url} name={other.full_name || 'User'} />
                  <div className="conversation-info">
                    <div className="conversation-name-row">
                      <span className="conversation-name">{other.full_name || 'User'}</span>
                      {conv.last_message && (
                        <span className="conversation-time">{formatTime(conv.last_message.created_at)}</span>
                      )}
                    </div>
                    <p className="conversation-preview">
                      {conv.last_message?.content || 'Start a conversation...'}
                    </p>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="conversation-badge">{conv.unread_count}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ChatRoomPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isConnected, messages: wsMessages, sendMessage } = useWebSocket(conversationId || null);

  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  useEffect(() => {
    // Append WebSocket messages
    if (wsMessages.length > 0) {
      const latest = wsMessages[wsMessages.length - 1] as unknown as Message;
      if (latest && latest.sender_id !== user?.id) {
        setMessages((prev) => [...prev, latest]);
      }
    }
  }, [wsMessages, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!conversationId) return;
    try {
      const { data } = await chatApi.getMessages(conversationId);
      setMessages(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());

    // Optimistic update
    const newMsg: Message = {
      id: Date.now().toString(),
      conversation_id: conversationId || '',
      sender_id: user?.id || '',
      sender_name: user?.full_name || '',
      sender_avatar: user?.avatar_url,
      content: input.trim(),
      read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-room-page">
      <div className="chat-room-header">
        <Link to="/chat" className="btn btn-ghost btn-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="chat-room-info">
          <h3>Chat</h3>
          <span className={`chat-status ${isConnected ? 'online' : 'offline'}`}>
            {isConnected ? '● Connected' : '○ Connecting...'}
          </span>
        </div>
      </div>

      <div className="chat-messages">
        {loading ? (
          <div style={{ padding: 24 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ width: '60%', height: 40, marginBottom: 12, borderRadius: 12, marginLeft: i % 2 === 0 ? 'auto' : 0 }} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-state" style={{ padding: '48px 24px' }}>
            <div className="empty-state-icon">👋</div>
            <h3>Say hello!</h3>
            <p>Start the conversation with your travel mate</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-bubble ${msg.sender_id === user?.id ? 'chat-bubble-mine' : 'chat-bubble-theirs'}`}
            >
              {msg.sender_id !== user?.id && (
                <Avatar src={msg.sender_avatar} name={msg.sender_name} size="sm" />
              )}
              <div className="chat-bubble-content">
                <p>{msg.content}</p>
                <span className="chat-bubble-time">{formatTime(msg.created_at)}</span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-bar">
        <input
          className="input chat-input"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button className="btn btn-primary btn-icon" onClick={handleSend} disabled={!input.trim()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

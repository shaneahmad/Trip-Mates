import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postsApi } from '../api/posts';
import type { Post } from '../api/posts';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/Avatar';
import './HomePage.css';

export default function HomePage() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const { data } = await postsApi.getFeed();
      setPosts(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!newPost.trim() || posting) return;
    setPosting(true);
    try {
      const { data } = await postsApi.create({ content: newPost });
      setPosts([data, ...posts]);
      setNewPost('');
    } catch {
      // handle error
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const { data } = await postsApi.toggleLike(postId);
      setPosts(posts.map((p) =>
        p.id === postId
          ? { ...p, is_liked: data.liked, likes_count: data.liked ? p.likes_count + 1 : p.likes_count - 1 }
          : p
      ));
    } catch {
      // handle error
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="page-container home-page">
      {/* Create Post Card */}
      <div className="card create-post-card animate-fadeInUp">
        <div className="card-body">
          <div className="create-post-top">
            <Avatar src={user?.avatar_url} name={user?.full_name || 'U'} />
            <textarea
              className="input create-post-input"
              placeholder="Share your travel story, tips, or plans..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              rows={2}
            />
          </div>
          <div className="create-post-actions">
            <div className="create-post-options">
              <button className="btn btn-ghost btn-sm">📷 Photo</button>
              <button className="btn btn-ghost btn-sm">📍 Location</button>
              <button className="btn btn-ghost btn-sm">🏷️ Tag</button>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={handlePost}
              disabled={!newPost.trim() || posting}
            >
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="quick-links animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
        <Link to="/explore" className="quick-link-card">
          <span className="quick-link-icon">🌍</span>
          <span className="quick-link-text">Explore Trips</span>
        </Link>
        <Link to="/discover" className="quick-link-card">
          <span className="quick-link-icon">💝</span>
          <span className="quick-link-text">Find Mates</span>
        </Link>
        <Link to="/create-trip" className="quick-link-card">
          <span className="quick-link-icon">✈️</span>
          <span className="quick-link-text">Create Trip</span>
        </Link>
      </div>

      {/* Feed */}
      <div className="feed-section">
        <h2 className="feed-title">Your Feed</h2>

        {loading ? (
          <div className="feed-loading">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card" style={{ marginBottom: 16 }}>
                <div className="card-body">
                  <div className="skeleton" style={{ width: 200, height: 20, marginBottom: 12 }} />
                  <div className="skeleton" style={{ width: '100%', height: 60, marginBottom: 12 }} />
                  <div className="skeleton" style={{ width: 100, height: 16 }} />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h3>No posts yet</h3>
            <p>Be the first to share a travel story! Or explore trips and find travel mates.</p>
            <Link to="/explore" className="btn btn-primary" style={{ marginTop: 16 }}>
              Explore Trips
            </Link>
          </div>
        ) : (
          posts.map((post, idx) => (
            <div
              key={post.id}
              className="card post-card animate-fadeInUp"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="card-body">
                <div className="post-header">
                  <Avatar src={post.author_avatar} name={post.author_name} />
                  <div className="post-meta">
                    <span className="post-author">{post.author_name}</span>
                    <span className="post-time">{formatDate(post.created_at)}</span>
                  </div>
                  {post.location && <span className="badge badge-secondary">📍 {post.location}</span>}
                </div>

                <p className="post-content">{post.content}</p>

                {post.images.length > 0 && (
                  <div className="post-images">
                    {post.images.map((img, i) => (
                      <img key={i} src={img} alt="" className="post-image" />
                    ))}
                  </div>
                )}

                {post.tags.length > 0 && (
                  <div className="post-tags">
                    {post.tags.map((tag) => (
                      <span key={tag} className="tag">#{tag}</span>
                    ))}
                  </div>
                )}

                <div className="post-actions">
                  <button
                    className={`btn btn-ghost btn-sm ${post.is_liked ? 'post-liked' : ''}`}
                    onClick={() => handleLike(post.id)}
                  >
                    {post.is_liked ? '❤️' : '🤍'} {post.likes_count}
                  </button>
                  <button className="btn btn-ghost btn-sm">
                    💬 {post.comments_count}
                  </button>
                  <button className="btn btn-ghost btn-sm">
                    🔗 Share
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

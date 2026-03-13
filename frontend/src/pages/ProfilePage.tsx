import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { tripsApi } from '../api/trips';
import type { Trip } from '../api/trips';
import Avatar from '../components/Avatar';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, setUser, logout } = useAuthStore();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: user?.full_name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    travel_style: user?.travel_style || '',
    interests: user?.interests?.join(', ') || '',
    languages: user?.languages?.join(', ') || '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const { data } = await tripsApi.getMyTrips();
      setTrips(data);
    } catch {
      // handle error
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await authApi.updateProfile({
        full_name: editForm.full_name,
        bio: editForm.bio,
        location: editForm.location,
        travel_style: editForm.travel_style,
        interests: editForm.interests.split(',').map((i) => i.trim()).filter(Boolean),
        languages: editForm.languages.split(',').map((l) => l.trim()).filter(Boolean),
      });
      setUser(data);
      setEditing(false);
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container profile-page">
      {/* Cover & Avatar */}
      <div className="profile-hero animate-fadeInUp">
        <div className="profile-cover" style={{ backgroundImage: user?.cover_url ? `url(${user.cover_url})` : undefined }}>
          <div className="profile-cover-overlay" />
        </div>
        <div className="profile-avatar-section">
          <Avatar src={user?.avatar_url} name={user?.full_name || 'U'} size="2xl" />
          <div className="profile-name-section">
            <h1>{user?.full_name}</h1>
            {user?.location && <p className="profile-location">📍 {user.location}</p>}
            {user?.travel_style && <span className="badge badge-primary">{user.travel_style}</span>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="profile-stats animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
        <div className="profile-stat">
          <span className="profile-stat-value">{user?.trips_count || 0}</span>
          <span className="profile-stat-label">Trips</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value">{user?.companions_count || 0}</span>
          <span className="profile-stat-label">Companions</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value">{user?.countries_visited?.length || 0}</span>
          <span className="profile-stat-label">Countries</span>
        </div>
      </div>

      {/* Actions */}
      <div className="profile-actions animate-fadeInUp" style={{ animationDelay: '0.15s' }}>
        <button className="btn btn-primary" onClick={() => setEditing(!editing)}>
          {editing ? 'Cancel' : '✏️ Edit Profile'}
        </button>
        <button className="btn btn-secondary" onClick={logout}>
          Logout
        </button>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="card profile-edit animate-fadeInUp">
          <div className="card-body">
            <h3>Edit Profile</h3>
            <div className="form-section">
              <div className="input-group">
                <label>Full Name</label>
                <input className="input" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Bio</label>
                <textarea className="input" value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} rows={3} placeholder="Tell others about yourself..." />
              </div>
              <div className="input-group">
                <label>Location</label>
                <input className="input" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} placeholder="e.g., San Francisco, CA" />
              </div>
              <div className="input-group">
                <label>Travel Style</label>
                <select className="input" value={editForm.travel_style} onChange={(e) => setEditForm({ ...editForm, travel_style: e.target.value })}>
                  <option value="">Select</option>
                  <option value="Backpacker">Backpacker</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Digital Nomad">Digital Nomad</option>
                  <option value="Eco-Traveler">Eco-Traveler</option>
                </select>
              </div>
              <div className="input-group">
                <label>Interests (comma-separated)</label>
                <input className="input" value={editForm.interests} onChange={(e) => setEditForm({ ...editForm, interests: e.target.value })} placeholder="e.g., Photography, Hiking, Food" />
              </div>
              <div className="input-group">
                <label>Languages (comma-separated)</label>
                <input className="input" value={editForm.languages} onChange={(e) => setEditForm({ ...editForm, languages: e.target.value })} placeholder="e.g., English, Spanish, French" />
              </div>
              <button className="btn btn-primary btn-full" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bio & Interests */}
      {!editing && (
        <div className="profile-about card animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <div className="card-body">
            {user?.bio && (
              <div className="profile-section">
                <h3>About</h3>
                <p>{user.bio}</p>
              </div>
            )}

            {(user?.interests?.length ?? 0) > 0 && (
              <div className="profile-section">
                <h3>Interests</h3>
                <div className="profile-tags">
                  {user?.interests.map((i) => <span key={i} className="tag">{i}</span>)}
                </div>
              </div>
            )}

            {(user?.languages?.length ?? 0) > 0 && (
              <div className="profile-section">
                <h3>Languages</h3>
                <div className="profile-tags">
                  {user?.languages.map((l) => <span key={l} className="tag">{l}</span>)}
                </div>
              </div>
            )}

            {(user?.countries_visited?.length ?? 0) > 0 && (
              <div className="profile-section">
                <h3>Countries Visited</h3>
                <div className="profile-tags">
                  {user?.countries_visited.map((c) => <span key={c} className="tag">{c}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* My Trips */}
      <div className="profile-trips animate-fadeInUp" style={{ animationDelay: '0.25s' }}>
        <h3>My Trips</h3>
        {trips.length === 0 ? (
          <div className="empty-state" style={{ padding: 32 }}>
            <p>No trips yet</p>
            <Link to="/create-trip" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
              Create your first trip
            </Link>
          </div>
        ) : (
          <div className="profile-trips-list">
            {trips.map((trip) => (
              <div key={trip.id} className="card" style={{ marginBottom: 12 }}>
                <div className="card-body" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{trip.title}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>📍 {trip.destination} · 👥 {trip.current_companions}/{trip.max_companions}</p>
                    </div>
                    <span className={`badge badge-${trip.status === 'planning' ? 'primary' : trip.status === 'active' ? 'success' : 'secondary'}`}>
                      {trip.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

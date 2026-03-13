import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tripsApi } from '../api/trips';
import type { Trip } from '../api/trips';
import Avatar from '../components/Avatar';
import './ExplorePage.css';

export default function ExplorePage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchDest, setSearchDest] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  const popularTags = ['Adventure', 'Beach', 'Culture', 'Hiking', 'Backpacking', 'Road Trip', 'Solo', 'Group', 'Luxury', 'Budget'];

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async (destination?: string, tags?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (destination) params.destination = destination;
      if (tags) params.tags = tags;
      const { data } = await tripsApi.list(params);
      setTrips(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadTrips(searchDest, selectedTag);
  };

  const handleJoin = async (tripId: string) => {
    try {
      await tripsApi.join(tripId);
      setTrips(trips.map((t) =>
        t.id === tripId ? { ...t, is_joined: true, current_companions: t.current_companions + 1 } : t
      ));
    } catch {
      // handle error
    }
  };

  const formatDateRange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${s.toLocaleDateString('en-US', opts)} — ${e.toLocaleDateString('en-US', opts)}`;
  };

  return (
    <div className="page-container explore-page">
      <div className="page-header animate-fadeInUp">
        <h1>Explore Trips</h1>
        <p>Find your next adventure and travel companions</p>
      </div>

      {/* Search & Filters */}
      <div className="explore-search card animate-fadeInUp" style={{ animationDelay: '0.05s' }}>
        <div className="card-body">
          <div className="explore-search-row">
            <div className="explore-search-input-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                className="input"
                placeholder="Where do you want to go?"
                value={searchDest}
                onChange={(e) => setSearchDest(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button className="btn btn-primary" onClick={handleSearch}>
              Search
            </button>
          </div>

          <div className="explore-tags">
            {popularTags.map((tag) => (
              <button
                key={tag}
                className={`tag ${selectedTag === tag ? 'tag-active' : ''}`}
                onClick={() => {
                  const newTag = selectedTag === tag ? '' : tag;
                  setSelectedTag(newTag);
                  loadTrips(searchDest, newTag);
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Trip Cards */}
      {loading ? (
        <div className="trips-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card">
              <div className="skeleton" style={{ height: 180, borderRadius: '16px 16px 0 0' }} />
              <div className="card-body">
                <div className="skeleton" style={{ width: '70%', height: 20, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: '100%', height: 40, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: '50%', height: 16 }} />
              </div>
            </div>
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🌍</div>
          <h3>No trips found</h3>
          <p>Be the first to create a trip! Others will be able to discover and join you.</p>
          <Link to="/create-trip" className="btn btn-primary" style={{ marginTop: 16 }}>
            Create a Trip
          </Link>
        </div>
      ) : (
        <div className="trips-grid">
          {trips.map((trip, idx) => (
            <div
              key={trip.id}
              className="card trip-card animate-fadeInUp"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="trip-card-cover" style={{ backgroundImage: trip.cover_image ? `url(${trip.cover_image})` : undefined }}>
                {!trip.cover_image && <span className="trip-card-cover-placeholder">🏔️</span>}
                <div className="trip-card-overlay">
                  <span className="badge badge-primary">{trip.status}</span>
                  {trip.budget_max && (
                    <span className="badge badge-success">
                      {trip.budget_currency} {trip.budget_max}
                    </span>
                  )}
                </div>
              </div>

              <div className="card-body">
                <div className="trip-card-destination">
                  📍 {trip.destination}
                </div>
                <h3 className="trip-card-title">{trip.title}</h3>
                <p className="trip-card-desc">{trip.description.slice(0, 120)}...</p>

                <div className="trip-card-dates">
                  📅 {formatDateRange(trip.start_date, trip.end_date)}
                </div>

                {trip.tags.length > 0 && (
                  <div className="trip-card-tags">
                    {trip.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}

                <div className="trip-card-footer">
                  <div className="trip-card-creator">
                    <Avatar src={trip.creator_avatar} name={trip.creator_name} size="sm" />
                    <span>{trip.creator_name}</span>
                  </div>

                  <div className="trip-card-companions">
                    <span className="trip-companions-count">
                      👥 {trip.current_companions}/{trip.max_companions}
                    </span>
                    {!trip.is_joined && trip.current_companions < trip.max_companions && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleJoin(trip.id)}>
                        Join
                      </button>
                    )}
                    {trip.is_joined && (
                      <span className="badge badge-success">Joined ✓</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

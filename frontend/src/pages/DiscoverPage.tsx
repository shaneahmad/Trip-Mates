import { useState, useEffect } from 'react';
import { matchesApi } from '../api/matches';
import type { DiscoverProfile } from '../api/matches';
import Avatar from '../components/Avatar';
import './DiscoverPage.css';

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState<'left' | 'right' | null>(null);
  const [matchPopup, setMatchPopup] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const { data } = await matchesApi.discover();
      setProfiles(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (action: 'like' | 'pass') => {
    if (currentIndex >= profiles.length) return;

    const profile = profiles[currentIndex];
    setSwiping(action === 'like' ? 'right' : 'left');

    try {
      const { data } = await matchesApi.swipe(profile.id, action);
      if (data.matched) {
        setMatchPopup(profile.full_name);
        setTimeout(() => setMatchPopup(null), 3000);
      }
    } catch {
      // handle error
    }

    setTimeout(() => {
      setSwiping(null);
      setCurrentIndex((prev) => prev + 1);
    }, 300);
  };

  const currentProfile = profiles[currentIndex];

  return (
    <div className="page-container discover-page">
      <div className="page-header animate-fadeInUp">
        <h1>Discover</h1>
        <p>Find your perfect travel companion</p>
      </div>

      {/* Match Popup */}
      {matchPopup && (
        <div className="match-popup animate-fadeIn">
          <div className="match-popup-content">
            <span className="match-popup-emoji">🎉</span>
            <h2>It's a Match!</h2>
            <p>You and {matchPopup} liked each other!</p>
            <p className="match-popup-sub">You can now chat and plan trips together</p>
          </div>
        </div>
      )}

      <div className="discover-container">
        {loading ? (
          <div className="discover-card-skeleton card">
            <div className="skeleton" style={{ height: '100%' }} />
          </div>
        ) : !currentProfile ? (
          <div className="empty-state">
            <div className="empty-state-icon">🌏</div>
            <h3>No more profiles</h3>
            <p>You've seen all available travel mates! Check back later for new people.</p>
            <button className="btn btn-primary" onClick={() => { setCurrentIndex(0); loadProfiles(); }} style={{ marginTop: 16 }}>
              Refresh
            </button>
          </div>
        ) : (
          <>
            <div className={`discover-card card ${swiping ? `swiping-${swiping}` : ''}`}>
              <div className="discover-card-cover" style={{ backgroundImage: currentProfile.cover_url ? `url(${currentProfile.cover_url})` : undefined }}>
                <div className="discover-card-gradient" />

                <div className="discover-card-info">
                  <div className="discover-card-avatar-row">
                    <Avatar src={currentProfile.avatar_url} name={currentProfile.full_name} size="xl" />
                    {currentProfile.compatibility_score !== undefined && currentProfile.compatibility_score > 0 && (
                      <span className="badge badge-love">💝 {currentProfile.compatibility_score}% match</span>
                    )}
                  </div>

                  <h2 className="discover-card-name">
                    {currentProfile.full_name}
                    {currentProfile.age && <span className="discover-card-age">, {currentProfile.age}</span>}
                  </h2>

                  {currentProfile.location && (
                    <p className="discover-card-location">📍 {currentProfile.location}</p>
                  )}
                </div>
              </div>

              <div className="discover-card-body">
                {currentProfile.bio && (
                  <p className="discover-card-bio">{currentProfile.bio}</p>
                )}

                {currentProfile.travel_style && (
                  <div className="discover-card-detail">
                    <span className="discover-detail-label">Travel Style</span>
                    <span className="badge badge-primary">{currentProfile.travel_style}</span>
                  </div>
                )}

                {currentProfile.interests.length > 0 && (
                  <div className="discover-card-detail">
                    <span className="discover-detail-label">Interests</span>
                    <div className="discover-tags">
                      {currentProfile.interests.map((i) => (
                        <span key={i} className="tag">{i}</span>
                      ))}
                    </div>
                  </div>
                )}

                {currentProfile.languages.length > 0 && (
                  <div className="discover-card-detail">
                    <span className="discover-detail-label">Languages</span>
                    <div className="discover-tags">
                      {currentProfile.languages.map((l) => (
                        <span key={l} className="tag">{l}</span>
                      ))}
                    </div>
                  </div>
                )}

                {currentProfile.countries_visited.length > 0 && (
                  <div className="discover-card-detail">
                    <span className="discover-detail-label">Countries Visited</span>
                    <div className="discover-tags">
                      {currentProfile.countries_visited.slice(0, 6).map((c) => (
                        <span key={c} className="tag">{c}</span>
                      ))}
                      {currentProfile.countries_visited.length > 6 && (
                        <span className="tag">+{currentProfile.countries_visited.length - 6}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="discover-card-stats">
                  <div className="discover-stat">
                    <span className="discover-stat-value">{currentProfile.trips_count}</span>
                    <span className="discover-stat-label">Trips</span>
                  </div>
                  <div className="discover-stat">
                    <span className="discover-stat-value">{currentProfile.companions_count}</span>
                    <span className="discover-stat-label">Companions</span>
                  </div>
                  <div className="discover-stat">
                    <span className="discover-stat-value">{currentProfile.countries_visited.length}</span>
                    <span className="discover-stat-label">Countries</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="discover-actions">
              <button className="discover-action-btn discover-pass" onClick={() => handleSwipe('pass')}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <button className="discover-action-btn discover-like" onClick={() => handleSwipe('like')}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      <p className="discover-counter" style={{ textAlign: 'center', color: 'var(--text-tertiary)', marginTop: 16, fontSize: 'var(--font-sm)' }}>
        {currentIndex + 1} / {profiles.length} profiles
      </p>
    </div>
  );
}

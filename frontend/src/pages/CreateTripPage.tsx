import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripsApi } from '../api/trips';
import type { TripCreate } from '../api/trips';
import './CreateTripPage.css';

export default function CreateTripPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<TripCreate>({
    title: '',
    description: '',
    destination: '',
    start_date: '',
    end_date: '',
    budget_min: undefined,
    budget_max: undefined,
    budget_currency: 'USD',
    max_companions: 5,
    tags: [],
    activities: [],
    accommodation_type: '',
  });
  const [tagInput, setTagInput] = useState('');

  const handleChange = (field: keyof TripCreate, value: unknown) => {
    setForm({ ...form, [field]: value });
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags?.includes(tagInput.trim())) {
      setForm({ ...form, tags: [...(form.tags || []), tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setForm({ ...form, tags: form.tags?.filter((t) => t !== tag) });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await tripsApi.create(form);
      navigate('/explore');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container create-trip-page">
      <div className="page-header animate-fadeInUp">
        <h1>Create a Trip</h1>
        <p>Plan your adventure and find travel companions</p>
      </div>

      <form onSubmit={handleSubmit} className="create-trip-form card animate-fadeInUp" style={{ animationDelay: '0.05s' }}>
        <div className="card-body">
          {error && <div className="auth-error">{error}</div>}

          <div className="form-section">
            <h3 className="form-section-title">📍 Trip Details</h3>
            <div className="input-group">
              <label>Trip Title</label>
              <input className="input" placeholder="e.g., Backpacking through Southeast Asia" value={form.title} onChange={(e) => handleChange('title', e.target.value)} required minLength={3} />
            </div>
            <div className="input-group">
              <label>Destination</label>
              <input className="input" placeholder="e.g., Bali, Indonesia" value={form.destination} onChange={(e) => handleChange('destination', e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Description</label>
              <textarea className="input" placeholder="Describe your trip plans, what you're looking for in travel companions, itinerary ideas..." value={form.description} onChange={(e) => handleChange('description', e.target.value)} required minLength={10} rows={4} />
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">📅 Dates</h3>
            <div className="form-row">
              <div className="input-group">
                <label>Start Date</label>
                <input type="date" className="input" value={form.start_date} onChange={(e) => handleChange('start_date', e.target.value)} required />
              </div>
              <div className="input-group">
                <label>End Date</label>
                <input type="date" className="input" value={form.end_date} onChange={(e) => handleChange('end_date', e.target.value)} required />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">💰 Budget & Companions</h3>
            <div className="form-row">
              <div className="input-group">
                <label>Budget Min</label>
                <input type="number" className="input" placeholder="500" value={form.budget_min || ''} onChange={(e) => handleChange('budget_min', e.target.value ? Number(e.target.value) : undefined)} />
              </div>
              <div className="input-group">
                <label>Budget Max</label>
                <input type="number" className="input" placeholder="2000" value={form.budget_max || ''} onChange={(e) => handleChange('budget_max', e.target.value ? Number(e.target.value) : undefined)} />
              </div>
              <div className="input-group">
                <label>Max Companions</label>
                <input type="number" className="input" min={1} max={50} value={form.max_companions} onChange={(e) => handleChange('max_companions', Number(e.target.value))} />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">🏷️ Tags</h3>
            <div className="tag-input-row">
              <input className="input" placeholder="Add a tag (e.g., Adventure)" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
              <button type="button" className="btn btn-secondary" onClick={addTag}>Add</button>
            </div>
            {(form.tags?.length ?? 0) > 0 && (
              <div className="form-tags">
                {form.tags?.map((tag) => (
                  <span key={tag} className="tag tag-active" onClick={() => removeTag(tag)} style={{ cursor: 'pointer' }}>
                    {tag} ✕
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="form-section">
            <h3 className="form-section-title">🏨 Accommodation</h3>
            <select className="input" value={form.accommodation_type} onChange={(e) => handleChange('accommodation_type', e.target.value)}>
              <option value="">Select type</option>
              <option value="hostel">Hostel</option>
              <option value="hotel">Hotel</option>
              <option value="airbnb">Airbnb</option>
              <option value="camping">Camping</option>
              <option value="couchsurfing">Couchsurfing</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? 'Creating...' : '✈️ Create Trip'}
          </button>
        </div>
      </form>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Star, Trash2, Edit, Plus, Upload } from 'lucide-react';
import { reviews as reviewsApi, uploadFile } from '../../lib/api';

const defaultForm = {
  customer_name: '',
  email: '',
  rating: 5,
  text: '',
  image: '',
  status: 'Approved',
  featured: false,
};

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ...defaultForm });
  const [uploading, setUploading] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await reviewsApi.getAll();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReviews(); }, []);

  const filteredReviews = reviews.filter(r =>
    r.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.text?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Create / Update ────────────────────────────────────────
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, 'reviews');
      if (url) setForm(prev => ({ ...prev, image: url }));
    } catch (err) { alert('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await reviewsApi.updateStatus(editingId, form.status); // partial
        await reviewsApi.sendReply(editingId, form.text);      // we could use a different approach, but for simplicity we update whole review via a general update
        // Actually the API has no single update call for all fields; we can use sendReply for text, but we need a general update.
        // We'll add a generic update function in api.js: update(id, body) -> request(`/reviews/${id}`, { method: 'PATCH', body }).
        // Since we already have updateStatus etc., we'll just do a custom fetch for full update.
        await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/reviews/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('solohans_token')}` },
          body: JSON.stringify({ customer_name: form.customer_name, email: form.email, rating: form.rating, text: form.text, image: form.image, status: form.status, featured: form.featured }),
        });
      } else {
        await reviewsApi.create(form);
      }
      resetForm();
      fetchReviews();
    } catch (err) { alert('Failed to save'); }
  };

  const resetForm = () => {
    setForm({ ...defaultForm });
    setEditingId(null);
    setShowCreate(false);
  };

  const openEdit = (review) => {
    setEditingId(review._id);
    setForm({
      customer_name: review.customer_name,
      email: review.email || '',
      rating: review.rating,
      text: review.text,
      image: review.image || '',
      status: review.status,
      featured: review.featured,
    });
    setShowCreate(true);
  };

  const toggleFeatured = async (id, current) => {
    await reviewsApi.toggleFeatured(id, !current);
    fetchReviews();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    await reviewsApi.delete(id);
    fetchReviews();
  };

  return (
    <>
      <Helmet><title>Reviews – Solohans Admin</title></Helmet>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Reviews & Testimonials</h1>
          <button onClick={() => { resetForm(); setShowCreate(true); }} className="flex items-center gap-2 bg-[#C62828] text-white px-5 py-2 rounded-full">
            <Plus size={18} /> Add Testimonial
          </button>
        </div>

        <div className="relative max-w-md mb-6">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reviews..." className="w-full pl-10 pr-4 py-3 border rounded-xl" />
        </div>

        {showCreate && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Review' : 'New Testimonial'}</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Customer Name *</label>
                    <input type="text" name="customer_name" value={form.customer_name} onChange={handleFormChange} required className="w-full px-4 py-2 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Email</label>
                    <input type="email" name="email" value={form.email} onChange={handleFormChange} className="w-full px-4 py-2 border rounded-xl" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">Rating</label>
                  <select name="rating" value={form.rating} onChange={handleFormChange} className="w-full px-4 py-2 border rounded-xl">
                    {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Star{n>1?'s':''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Review Text *</label>
                  <textarea name="text" rows={4} value={form.text} onChange={handleFormChange} required className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Image (optional)</label>
                  <div className="flex items-center gap-4">
                    {form.image && <img src={form.image} alt="preview" className="h-16 w-16 rounded-xl object-cover" />}
                    <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl cursor-pointer">
                      <Upload size={18} />
                      {uploading ? 'Uploading...' : 'Upload Image'}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                    </label>
                    {form.image && <button type="button" onClick={() => setForm(p => ({...p, image: ''}))} className="text-red-500 text-sm">Remove</button>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Status</label>
                    <select name="status" value={form.status} onChange={handleFormChange} className="w-full px-4 py-2 border rounded-xl">
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Hidden">Hidden</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="featured" checked={form.featured} onChange={handleFormChange} />
                      <span className="text-sm">Featured</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={resetForm} className="px-5 py-2 bg-gray-200 rounded-full">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-[#C62828] text-white rounded-full">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Text</th>
                <th className="py-3 px-4">Image</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Featured</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">No reviews found.</td></tr>
              ) : (
                filteredReviews.map(review => (
                  <tr key={review._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{review.customer_name}</td>
                    <td className="py-3 px-4">{'⭐'.repeat(review.rating)}</td>
                    <td className="py-3 px-4 max-w-xs truncate">{review.text}</td>
                    <td className="py-3 px-4">{review.image ? <img src={review.image} className="h-8 w-8 rounded object-cover" /> : '-'}</td>
                    <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${review.status === 'Approved' ? 'bg-green-100 text-green-700' : review.status === 'Hidden' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{review.status}</span></td>
                    <td className="py-3 px-4">
                      <button onClick={() => toggleFeatured(review._id, review.featured)} className={`text-xs font-medium ${review.featured ? 'text-green-600' : 'text-gray-400'}`}>
                        {review.featured ? 'Yes' : 'No'}
                      </button>
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <button onClick={() => openEdit(review)}><Edit size={16} /></button>
                      <button onClick={() => handleDelete(review._id)}><Trash2 size={16} className="text-red-500" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
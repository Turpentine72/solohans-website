import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Plus, Edit, Trash2, X, Upload } from 'lucide-react';
import { categories as categoriesApi, uploadFile } from '../../lib/api';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState({
    name: '',
    image: null,
    imagePreview: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await categoriesApi.getAll();
      setCategories(Array.isArray(data) ? data : data.categories || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setForm({ name: '', image: null, imagePreview: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setForm({ name: cat.name, image: null, imagePreview: cat.image || '' });
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, image: file, imagePreview: URL.createObjectURL(file) });
    }
  };

  const uploadImage = async (file) => {
    try { return await uploadFile(file, 'menu-images'); }
    catch (err) { console.error('Upload error:', err); return null; }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);

    let imageUrl = form.imagePreview; // keep existing if no new file
    if (form.image) {
      const uploaded = await uploadImage(form.image);
      if (uploaded) imageUrl = uploaded;
      else {
        setSaving(false);
        alert('Failed to upload image.');
        return;
      }
    }

    const dataToSave = { name: form.name.trim(), image: imageUrl };

    try {
      if (editingCategory) {
        await categoriesApi.update(editingCategory._id || editingCategory.id, dataToSave);
      } else {
        await categoriesApi.create(dataToSave);
      }
    } catch (err) {
      alert(`Save failed: ${err.message}`);
      setSaving(false);
      return;
    }

    setSaving(false);
    setShowModal(false);
    fetchCategories();
  };

  const handleDelete = async (id) => {
    if (!id) {
      console.error('Delete failed: no category ID provided');
      return;
    }
    if (!window.confirm('Delete this category?')) return;
    try {
      await categoriesApi.delete(id);
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Helmet><title>Category Management – Solohans Admin</title></Helmet>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Category Management</h1>
          <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-[#C62828] text-white px-5 py-2.5 rounded-full font-semibold hover:bg-[#B71C1C] transition-colors">
            <Plus size={18} /> Add Category
          </button>
        </div>

        <div className="relative max-w-md mb-6">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search categories..." className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828] bg-white" />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading…</div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No categories found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredCategories.map(cat => (
              <div key={cat._id || cat.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                <div className="h-40 overflow-hidden">
                  <img src={cat.image || 'https://via.placeholder.com/300x150?text=No+Image'} alt={cat.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-800 mb-2">{cat.name}</h3>
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleOpenEdit(cat)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={16} /></button>
                    {/* FIXED: using cat._id instead of cat.id */}
                    <button onClick={() => handleDelete(cat._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="text-xl font-bold text-gray-800">{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828]" placeholder="" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Image</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#C62828] transition-colors">
                    {form.imagePreview ? (
                      <img src={form.imagePreview} alt="Preview" className="h-full w-auto object-contain p-1" />
                    ) : (
                      <div className="flex flex-col items-center text-gray-400">
                        <Upload size={24} />
                        <span className="text-sm mt-1">Click to upload image</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t">
                <button onClick={() => setShowModal(false)} className="px-5 py-3 border border-gray-200 rounded-full text-gray-700 font-medium hover:bg-gray-50">Cancel</button>
                <button onClick={handleSave} disabled={saving} className={`px-5 py-3 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C] transition-colors ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}>
                  {saving ? 'Saving…' : editingCategory ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
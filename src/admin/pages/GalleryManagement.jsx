import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Trash2, Eye, EyeOff, Upload } from 'lucide-react';
import { gallery as galleryApi, uploadFile } from '../../lib/api';

export default function GalleryManagement() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchImages = async () => {
    try {
      const data = await galleryApi.getAdmin();
      setImages(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchImages(); }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, 'gallery');
      if (url) {
        await galleryApi.create({ image: url, caption });
        setCaption('');
        fetchImages();
      } else {
        alert('Upload failed');
      }
    } catch (err) { alert('Upload failed'); }
    finally { setUploading(false); }
  };

  const toggleActive = async (id, current) => {
    await galleryApi.update(id, { active: !current });
    fetchImages();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this image?')) return;
    await galleryApi.delete(id);
    fetchImages();
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <>
      <Helmet><title>Gallery – Solohans Admin</title></Helmet>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Gallery Management</h1>

        {/* Upload area */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold mb-3">Add New Image</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Caption (optional)"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-xl"
            />
            <label className="flex items-center gap-2 px-5 py-2 bg-[#C62828] text-white rounded-full cursor-pointer hover:bg-[#B71C1C] font-medium">
              <Upload size={18} />
              {uploading ? 'Uploading...' : 'Choose Image'}
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
        </div>

        {/* Image grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.length === 0 ? (
            <p className="text-gray-500 col-span-full text-center py-8">No images yet.</p>
          ) : (
            images.map(img => (
              <div key={img._id} className={`relative group rounded-xl overflow-hidden shadow-md ${!img.active ? 'opacity-50' : ''}`}>
                <img src={img.image} alt={img.caption || 'Gallery'} className="w-full h-48 object-cover" />
                {img.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm">
                    {img.caption}
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => toggleActive(img._id, img.active)}
                    className="p-1 bg-white rounded-full shadow hover:bg-gray-100"
                    title={img.active ? 'Hide' : 'Show'}
                  >
                    {img.active ? <EyeOff size={16} className="text-gray-600" /> : <Eye size={16} className="text-gray-600" />}
                  </button>
                  <button
                    onClick={() => handleDelete(img._id)}
                    className="p-1 bg-white rounded-full shadow hover:bg-red-100"
                    title="Delete"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
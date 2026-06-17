import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { promos as promosApi, menuItems as menuApi } from '../../lib/api';
import { usePromos } from '../../context/PromoContext';

const PROMO_TYPES = [
  { value: 'percentage', label: 'Percentage Discount' },
  { value: 'buyXgetY', label: 'Buy X Get Y Free' },
  { value: 'freeItem', label: 'Free Item' },
  { value: 'freeDelivery', label: 'Free Delivery' },
];

// ── Autocomplete for single selection (used for Free Item) ──
const AutocompleteMenu = ({ items, value, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const selectedItem = items.find(item => item._id === value);
  useEffect(() => {
    setInputValue(selectedItem ? selectedItem.name : '');
  }, [value, selectedItem]);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleChange = (e) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
  };

  const handleSelect = (item) => {
    setInputValue(item.name);
    onChange(item._id);
    setShowSuggestions(false);
  };

  const clearSelection = () => {
    setInputValue('');
    onChange('');
  };

  return (
    <div className="relative">
      <div className="flex items-center border rounded-xl">
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className="flex-1 p-3 rounded-xl outline-none"
        />
        {value && (
          <button onClick={clearSelection} className="px-2 text-gray-400 hover:text-red-500">
            <X size={16} />
          </button>
        )}
      </div>
      {showSuggestions && filteredItems.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white border rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filteredItems.map(item => (
            <li
              key={item._id}
              onMouseDown={() => handleSelect(item)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
            >
              {item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ── Multi‑select for trigger items (tags) ──
const MultiAutocomplete = ({ items, selected, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const availableItems = items.filter(item => !selected.includes(item._id));
  const filteredItems = availableItems.filter(item =>
    item.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelect = (item) => {
    onChange([...selected, item._id]);
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleRemove = (id) => {
    onChange(selected.filter(s => s !== id));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selected.map(id => {
          const item = items.find(i => i._id === id);
          return item ? (
            <span key={id} className="inline-flex items-center gap-1 bg-gray-200 px-2 py-1 rounded-full text-xs">
              {item.name}
              <button onClick={() => handleRemove(id)} className="text-gray-500 hover:text-red-500">
                <X size={12} />
              </button>
            </span>
          ) : null;
        })}
      </div>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className="w-full p-3 border rounded-xl outline-none"
        />
        {showSuggestions && filteredItems.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full bg-white border rounded-xl shadow-lg max-h-48 overflow-y-auto">
            {filteredItems.map(item => (
              <li
                key={item._id}
                onMouseDown={() => handleSelect(item)}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              >
                {item.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// ── Main Promotions Component ──
export default function Promotions() {
  const [promos, setPromos] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const { refetch } = usePromos();

  const [form, setForm] = useState({
    title: '',
    type: 'percentage',
    discountPercentage: '',
    buyQuantity: '',
    getQuantity: '',
    triggerItems: [],          // array of IDs
    freeItem: '',
    scope: 'all',
    applicableItems: [],
    startDate: '',
    endDate: '',
    active: true,
  });

  const fetchPromos = async () => {
    try {
      const data = await promosApi.getAll();
      setPromos(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchMenuItems = async () => {
    try {
      const data = await menuApi.getAll({ available: true });
      setMenuItems(Array.isArray(data) ? data : data.items || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchPromos(); fetchMenuItems(); }, []);

  const resetForm = () => {
    setForm({
      title: '', type: 'percentage', discountPercentage: '', buyQuantity: '',
      getQuantity: '', triggerItems: [], freeItem: '', scope: 'all',
      applicableItems: [], startDate: '', endDate: '', active: true,
    });
    setEditingPromo(null);
  };

  const openCreate = () => { resetForm(); setShowForm(true); };
  const openEdit = (promo) => {
    setEditingPromo(promo);
    setForm({
      title: promo.title, type: promo.type,
      discountPercentage: promo.discountPercentage || '',
      buyQuantity: promo.buyQuantity || '',
      getQuantity: promo.getQuantity || '',
      triggerItems: promo.triggerItems?.map(i => i._id) || [],
      freeItem: promo.freeItem?._id || '',
      scope: promo.scope || 'all',
      applicableItems: promo.applicableItems?.map(i => i._id) || [],
      startDate: promo.startDate?.slice(0, 10) || '',
      endDate: promo.endDate?.slice(0, 10) || '',
      active: promo.active,
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const body = {
      ...form,
      discountPercentage: form.discountPercentage ? Number(form.discountPercentage) : null,
      buyQuantity: form.buyQuantity ? Number(form.buyQuantity) : null,
      getQuantity: form.getQuantity ? Number(form.getQuantity) : null,
      triggerItems: form.triggerItems,
      freeItem: form.freeItem || null,
    };
    try {
      if (editingPromo) await promosApi.update(editingPromo._id, body);
      else await promosApi.create(body);
      setShowForm(false);
      fetchPromos();
      refetch();
    } catch (err) { alert('Failed to save promo'); }
  };

  const handleToggle = async (id) => {
    await promosApi.toggle(id);
    fetchPromos();
    refetch();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this promo?')) return;
    await promosApi.delete(id);
    fetchPromos();
    refetch();
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <>
      <Helmet><title>Promotions – Solohans Admin</title></Helmet>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Promotions</h1>
          <button onClick={openCreate} className="flex items-center gap-2 bg-[#C62828] text-white px-5 py-2 rounded-full">
            <Plus size={18} /> New Promo
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">{editingPromo ? 'Edit Promo' : 'New Promo'}</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <input type="text" placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border p-3 rounded-xl" required />
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full border p-3 rounded-xl">
                  {PROMO_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>

                {form.type === 'percentage' && (
                  <input type="number" placeholder="Discount %" value={form.discountPercentage} onChange={e => setForm({...form, discountPercentage: e.target.value})} className="w-full border p-3 rounded-xl" />
                )}
                {form.type === 'buyXgetY' && (
                  <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Buy Quantity" value={form.buyQuantity} onChange={e => setForm({...form, buyQuantity: e.target.value})} className="border p-3 rounded-xl" />
                    <input type="number" placeholder="Get Quantity Free" value={form.getQuantity} onChange={e => setForm({...form, getQuantity: e.target.value})} className="border p-3 rounded-xl" />
                  </div>
                )}
                {form.type === 'freeItem' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1">Trigger Items (any of these)</label>
                      <MultiAutocomplete
                        items={menuItems}
                        selected={form.triggerItems}
                        onChange={(ids) => setForm({...form, triggerItems: ids})}
                        placeholder="Search trigger items..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Free Item</label>
                      <AutocompleteMenu
                        items={menuItems}
                        value={form.freeItem}
                        onChange={(id) => setForm({...form, freeItem: id})}
                        placeholder="Search free item..."
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm mb-1">Scope</label>
                  <select value={form.scope} onChange={e => setForm({...form, scope: e.target.value})} className="w-full border p-3 rounded-xl">
                    <option value="all">All Products</option>
                    <option value="selected">Selected Items</option>
                  </select>
                </div>
                {form.scope === 'selected' && (
                  <div className="max-h-40 overflow-y-auto border p-3 rounded-xl">
                    {menuItems.map(item => (
                      <label key={item._id} className="flex items-center gap-2">
                        <input type="checkbox" checked={form.applicableItems.includes(item._id)} onChange={e => {
                          const list = e.target.checked ? [...form.applicableItems, item._id] : form.applicableItems.filter(id => id !== item._id);
                          setForm({...form, applicableItems: list});
                        }} />
                        {item.name}
                      </label>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="border p-3 rounded-xl" />
                  <input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="border p-3 rounded-xl" />
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 bg-gray-200 rounded-full">Cancel</button>
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
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Active</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promos.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">No promotions yet.</td></tr>
              ) : (
                promos.map(promo => (
                  <tr key={promo._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{promo.title}</td>
                    <td className="py-3 px-4">{PROMO_TYPES.find(t => t.value === promo.type)?.label}</td>
                    <td className="py-3 px-4 text-xs">{new Date(promo.startDate).toLocaleDateString()} – {new Date(promo.endDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <button onClick={() => handleToggle(promo._id)}>
                        {promo.active ? <ToggleRight size={20} className="text-green-600" /> : <ToggleLeft size={20} className="text-gray-400" />}
                      </button>
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <button onClick={() => openEdit(promo)}><Edit size={16} /></button>
                      <button onClick={() => handleDelete(promo._id)}><Trash2 size={16} className="text-red-500" /></button>
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
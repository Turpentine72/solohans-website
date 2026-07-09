import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Save } from 'lucide-react';
import { menuItems as menuItemsApi, stock as stockApi } from '../../lib/api';

export default function StockManagement() {
  const [items, setItems] = useState([]);
  const [todayStock, setTodayStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openingValues, setOpeningValues] = useState({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [menu, today] = await Promise.all([menuItemsApi.getAll(), stockApi.getToday()]);
      const list = Array.isArray(menu) ? menu : menu.items || [];
      setItems(list);
      setTodayStock(today);
      const initial = {};
      list.forEach(m => { initial[m._id] = m.openingStock || 0; });
      setOpeningValues(initial);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const remainingFor = (id) => {
    const entry = todayStock?.items?.find(i => String(i.menuItem) === String(id));
    return entry ? entry.remaining : items.find(m => m._id === id)?.remaining ?? 0;
  };

  const soldFor = (id) => {
    const entry = todayStock?.items?.find(i => String(i.menuItem) === String(id));
    return entry ? entry.sold : items.find(m => m._id === id)?.sold ?? 0;
  };

  const handleSaveOpening = async () => {
    setSaving(true);
    try {
      const payload = items.map(m => ({ menuItemId: m._id, openingStock: Number(openingValues[m._id]) || 0 }));
      await stockApi.setOpening(payload);
      await fetchData();
      alert('Opening stock saved for today.');
    } catch (err) {
      alert(`Failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Helmet><title>Daily Dish Stock – Solohans Admin</title></Helmet>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Daily Dish Stock</h1>
            <p className="text-gray-500 text-sm mt-1">Set today's opening stock per dish (Shawarma, Hotdog, and any other menu item). This is separate from Meal Inventory (rice/spaghetti/boxes) and Ingredient Inventory (raw ingredients) — this page caps how many of each finished dish you're selling today.</p>
            {todayStock?.isClosed && (
              <p className="text-red-600 text-sm font-medium mt-1">⚠️ Today has already been closed via reconciliation — opening stock can't be changed again until tomorrow.</p>
            )}
          </div>
          <button onClick={handleSaveOpening} disabled={saving || todayStock?.isClosed} className="flex items-center gap-2 bg-[#C62828] text-white px-5 py-2.5 rounded-full font-semibold hover:bg-[#B71C1C] disabled:opacity-50">
            <Save size={18} /> {saving ? 'Saving…' : 'Save Opening Stock'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading…</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  <th className="py-3 px-4">Dish</th>
                  <th className="py-3 px-4">Opening Stock</th>
                  <th className="py-3 px-4">Sold Today</th>
                  <th className="py-3 px-4">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {items.map(m => (
                  <tr key={m._id} className="border-t border-gray-100">
                    <td className="py-3 px-4 font-medium text-gray-800">{m.name}</td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min="0"
                        disabled={todayStock?.isClosed}
                        value={openingValues[m._id] ?? 0}
                        onChange={e => setOpeningValues({ ...openingValues, [m._id]: e.target.value })}
                        className="w-24 px-3 py-1.5 border rounded-lg"
                      />
                    </td>
                    <td className="py-3 px-4">{soldFor(m._id)}</td>
                    <td className={`py-3 px-4 font-semibold ${remainingFor(m._id) === 0 ? 'text-red-600' : 'text-green-600'}`}>{remainingFor(m._id)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
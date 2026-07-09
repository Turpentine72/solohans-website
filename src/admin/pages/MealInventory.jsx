import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { PlusCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { inventory as inventoryApi } from '../../lib/api';

const CORE_ITEMS = [
  { key: 'jollof', label: 'Jollof Rice', unit: 'scoops' },
  { key: 'friedRice', label: 'Fried Rice', unit: 'scoops' },
  { key: 'spaghettiPlastics', label: 'Spaghetti Plastics', unit: 'plastics' },
  { key: 'lunchBoxes', label: 'Lunch Boxes', unit: 'boxes' },
  { key: 'extraPlastics', label: 'Extra Packaging Plastics', unit: 'plastics' },
];

function StatCard({ label, unit, data }) {
  const low = data.remaining <= 10;
  const out = data.remaining <= 0;
  return (
    <div className={`bg-white rounded-2xl shadow-sm border p-5 ${out ? 'border-red-300' : low ? 'border-amber-300' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-800">{label}</h3>
        {out && <span className="flex items-center gap-1 text-red-600 text-xs font-semibold"><AlertTriangle size={14}/> OUT OF STOCK</span>}
        {!out && low && <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold"><AlertTriangle size={14}/> LOW STOCK</span>}
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div><p className="text-gray-400">Added</p><p className="font-bold text-gray-800">{data.totalAdded}</p></div>
        <div><p className="text-gray-400">Sold</p><p className="font-bold text-gray-800">{data.sold}</p></div>
        <div><p className="text-gray-400">Remaining</p><p className={`font-bold ${out ? 'text-red-600' : low ? 'text-amber-600' : 'text-green-600'}`}>{data.remaining} {unit}</p></div>
      </div>
    </div>
  );
}

export default function MealInventory() {
  const [inv, setInv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restockItem, setRestockItem] = useState('jollof');
  const [qty, setQty] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setInv(await inventoryApi.get()); } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRestock = async (e) => {
    e.preventDefault();
    if (!qty || Number(qty) <= 0) return alert('Enter a valid quantity');
    setSaving(true);
    try {
      await inventoryApi.restock(restockItem, Number(qty), 'Admin restock');
      setQty('');
      await load();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleExtraPrice = async (key, price) => {
    try { await inventoryApi.updateExtraPrice(key, { price: Number(price) }); await load(); }
    catch (err) { alert(`Failed: ${err.message}`); }
  };

  if (loading || !inv) return <div className="text-center py-12 text-gray-500">Loading…</div>;

  return (
    <>
      <Helmet><title>Meal Inventory – Solohans Admin</title></Helmet>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Meal Inventory</h1>
            <p className="text-gray-500 text-sm mt-1">One shared inventory for Website + Physical Store rice, spaghetti, and packaging. Portions deduct automatically on every sale. Separate from Daily Dish Stock (per-menu-item caps) and Ingredient Inventory (raw ingredients).</p>
          </div>
          <button onClick={load} className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-50">
            <RefreshCw size={16}/> Refresh
          </button>
        </div>

        {/* Restock form */}
        <form onSubmit={handleRestock} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Item</label>
            <select value={restockItem} onChange={e => setRestockItem(e.target.value)} className="border rounded-lg px-3 py-2">
              {CORE_ITEMS.map(i => <option key={i.key} value={i.key}>{i.label}</option>)}
              {Object.entries(inv.extras).map(([key, e]) => <option key={key} value={`extras:${key}`}>{e.label} (extra)</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Quantity to add</label>
            <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} className="border rounded-lg px-3 py-2 w-32" placeholder="e.g. 50" />
          </div>
          <button disabled={saving} className="flex items-center gap-2 bg-[#C62828] text-white px-5 py-2.5 rounded-full font-semibold hover:bg-[#B71C1C] disabled:opacity-50">
            <PlusCircle size={18}/> {saving ? 'Adding…' : 'Add Stock'}
          </button>
        </form>

        {(inv.extraPortionsSold > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-sm text-amber-800">
            Extra Portions Sold: <strong>{inv.extraPortionsSold}</strong> · Extra Portion Revenue: <strong>₦{inv.extraPortionsRevenue.toLocaleString()}</strong>
          </div>
        )}

        <h2 className="text-lg font-bold text-gray-800 mb-3">Meal Portions & Packaging</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {CORE_ITEMS.map(i => <StatCard key={i.key} label={i.label} unit={i.unit} data={inv[i.key]} />)}
        </div>

        <h2 className="text-lg font-bold text-gray-800 mb-3">Extras</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm">
              <tr>
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">Price (₦)</th>
                <th className="py-3 px-4">Packaging</th>
                <th className="py-3 px-4">Added</th>
                <th className="py-3 px-4">Sold</th>
                <th className="py-3 px-4">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(inv.extras).map(([key, e]) => (
                <tr key={key} className="border-t border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-800">{e.label}</td>
                  <td className="py-3 px-4">
                    <input type="number" defaultValue={e.price} onBlur={ev => handleExtraPrice(key, ev.target.value)} className="w-24 border rounded-lg px-2 py-1" />
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-sm">{e.usesPlastic ? 'Plastic' : '—'}</td>
                  <td className="py-3 px-4">{e.totalAdded}</td>
                  <td className="py-3 px-4">{e.sold}</td>
                  <td className={`py-3 px-4 font-semibold ${e.remaining <= 0 ? 'text-red-600' : e.remaining <= 10 ? 'text-amber-600' : 'text-green-600'}`}>{e.remaining}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
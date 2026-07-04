import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Package, PlusCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { ingredients as ingredientsApi } from '../../lib/api';

function IngredientCard({ ing }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border p-5 ${ing.outOfStock ? 'border-red-300' : ing.lowStock ? 'border-amber-300' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800 flex items-center gap-2"><Package size={18} /> {ing.label}</h3>
        {ing.outOfStock && <span className="flex items-center gap-1 text-red-600 text-xs font-semibold"><AlertTriangle size={14} /> OUT OF STOCK</span>}
        {!ing.outOfStock && ing.lowStock && <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold"><AlertTriangle size={14} /> LOW STOCK</span>}
      </div>
      <div className="grid grid-cols-2 gap-y-2 text-sm">
        <div><p className="text-gray-400">Initial Packs Added</p><p className="font-bold text-gray-800">{ing.initialPacksAdded}</p></div>
        <div><p className="text-gray-400">Initial Pieces</p><p className="font-bold text-gray-800">{ing.initialPieces}</p></div>
        <div><p className="text-gray-400">Pieces Used</p><p className="font-bold text-gray-800">{ing.piecesUsed}</p></div>
        <div><p className="text-gray-400">Packs Consumed</p><p className="font-bold text-gray-800">{ing.packsConsumed}</p></div>
        <div><p className="text-gray-400">Remaining Pieces</p><p className={`font-bold ${ing.outOfStock ? 'text-red-600' : ing.lowStock ? 'text-amber-600' : 'text-green-600'}`}>{ing.remainingPieces}</p></div>
        <div><p className="text-gray-400">Remaining Packs</p><p className={`font-bold ${ing.outOfStock ? 'text-red-600' : ing.lowStock ? 'text-amber-600' : 'text-green-600'}`}>{ing.remainingPacks}</p></div>
      </div>
    </div>
  );
}

export default function Ingredients() {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restockKey, setRestockKey] = useState('shawarmaBread');
  const [packs, setPacks] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setReport(await ingredientsApi.getReport()); } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRestock = async (e) => {
    e.preventDefault();
    if (!packs || Number(packs) <= 0) return alert('Enter a valid number of packs');
    setSaving(true);
    try {
      await ingredientsApi.restock(restockKey, Number(packs));
      setPacks('');
      await load();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Helmet><title>Ingredient Inventory – Solohans Admin</title></Helmet>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Ingredient Inventory</h1>
            <p className="text-gray-500 text-sm mt-1">Dual-level pack/piece tracking. Admin adds packs only — pieces and remaining packs are always calculated automatically.</p>
          </div>
          <button onClick={load} className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-50">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        <form onSubmit={handleRestock} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ingredient</label>
            <select value={restockKey} onChange={(e) => setRestockKey(e.target.value)} className="border rounded-lg px-3 py-2">
              {report.map((r) => <option key={r.key} value={r.key}>{r.label} ({r.piecesPerPack} pieces/pack)</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Packs to add</label>
            <input type="number" min="1" value={packs} onChange={(e) => setPacks(e.target.value)} className="border rounded-lg px-3 py-2 w-32" placeholder="e.g. 6" />
          </div>
          <button disabled={saving} className="flex items-center gap-2 bg-[#C62828] text-white px-5 py-2.5 rounded-full font-semibold hover:bg-[#B71C1C] disabled:opacity-50">
            <PlusCircle size={18} /> {saving ? 'Adding…' : 'Add Stock (Packs)'}
          </button>
        </form>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.map((ing) => <IngredientCard key={ing.key} ing={ing} />)}
          </div>
        )}
      </div>
    </>
  );
}

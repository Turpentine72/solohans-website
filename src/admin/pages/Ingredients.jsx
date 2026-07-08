import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Package, PlusCircle, AlertTriangle, RefreshCw, Pencil, Trash2, X, Plus } from 'lucide-react';
import { ingredients as ingredientsApi } from '../../lib/api';
import { useAuth } from '../context/AuthContext';

const emptyForm = { label: '', pieceLabel: '', piecesPerPack: '', lowStockThresholdPieces: '16' };

function IngredientCard({ ing, onEdit, onDelete, canDelete }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border p-5 ${ing.outOfStock ? 'border-red-300' : ing.lowStock ? 'border-amber-300' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800 flex items-center gap-2"><Package size={18} /> {ing.label}</h3>
        <div className="flex items-center gap-1">
          {ing.outOfStock && <span className="flex items-center gap-1 text-red-600 text-xs font-semibold mr-1"><AlertTriangle size={14} /> OUT OF STOCK</span>}
          {!ing.outOfStock && ing.lowStock && <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold mr-1"><AlertTriangle size={14} /> LOW STOCK</span>}
          <button onClick={() => onEdit(ing)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><Pencil size={14} /></button>
          {canDelete && <button onClick={() => onDelete(ing)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>}
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-3">Tracked in {ing.pieceLabel} pieces — {ing.piecesPerPack} per pack</p>
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
  const { session } = useAuth();
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restockKey, setRestockKey] = useState('');
  const [packs, setPacks] = useState('');
  const [saving, setSaving] = useState(false);
  const pollRef = useRef(null);

  // Create/edit modal
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // ingredient being edited, or null for "new"
  const [form, setForm] = useState(emptyForm);
  const [formSaving, setFormSaving] = useState(false);

  const isAdmin = session?.role === 'admin';

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await ingredientsApi.getReport();
      setReport(data);
      if (!restockKey && data.length) setRestockKey(data[0].key);
    } catch (err) { console.error(err); }
    finally { if (!silent) setLoading(false); }
  };

  useEffect(() => {
    load();
    // Real-time sync: poll quietly every 8s so this page reflects sales made
    // from the POS or website without anyone needing to hit Refresh.
    pollRef.current = setInterval(() => load(true), 8000);
    return () => clearInterval(pollRef.current);
  }, []);

  const handleRestock = async (e) => {
    e.preventDefault();
    if (!restockKey) return alert('Choose an ingredient first');
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

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (ing) => {
    setEditing(ing);
    setForm({
      label: ing.label,
      pieceLabel: ing.pieceLabel,
      piecesPerPack: String(ing.piecesPerPack),
      lowStockThresholdPieces: String(ing.lowStockThresholdPieces ?? 16),
    });
    setShowForm(true);
  };

  const handleFormSave = async () => {
    if (!form.label.trim() || !form.pieceLabel.trim() || !form.piecesPerPack) {
      alert('Ingredient name, piece label, and pieces per pack are all required.');
      return;
    }
    setFormSaving(true);
    try {
      if (editing) {
        await ingredientsApi.update(editing._id || editing.key, form);
      } else {
        await ingredientsApi.create(form);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (ing) => {
    if (!window.confirm(`Delete "${ing.label}"? This can't be undone.`)) return;
    try {
      await ingredientsApi.delete(ing._id || ing.key);
      await load();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    }
  };

  return (
    <>
      <Helmet><title>Ingredient Inventory – Solohans Admin</title></Helmet>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Ingredient Inventory</h1>
            <p className="text-gray-500 text-sm mt-1">Dual-level pack/piece tracking. Admin adds packs only — pieces and remaining packs are always calculated automatically.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={openAdd} className="flex items-center gap-2 bg-[#C62828] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#B71C1C]">
              <Plus size={16} /> New Ingredient
            </button>
            <button onClick={() => load()} className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-50">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
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
          <button disabled={saving || !report.length} className="flex items-center gap-2 bg-[#C62828] text-white px-5 py-2.5 rounded-full font-semibold hover:bg-[#B71C1C] disabled:opacity-50">
            <PlusCircle size={18} /> {saving ? 'Adding…' : 'Add Stock (Packs)'}
          </button>
        </form>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading…</div>
        ) : report.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">
            No ingredients yet — click "New Ingredient" to add your first one.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.map((ing) => (
              <IngredientCard key={ing.key} ing={ing} onEdit={openEdit} onDelete={handleDelete} canDelete={isAdmin} />
            ))}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="text-xl font-bold text-gray-800">{editing ? 'Edit Ingredient' : 'New Ingredient'}</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ingredient Name</label>
                  <input type="text" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Chicken Wings" className="w-full px-4 py-3 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Piece Label</label>
                  <input type="text" value={form.pieceLabel} onChange={(e) => setForm({ ...form, pieceLabel: e.target.value })} placeholder="e.g. Wing (used in low-stock alerts)" className="w-full px-4 py-3 border rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Pieces per Pack</label>
                    <input type="number" min="1" value={form.piecesPerPack} onChange={(e) => setForm({ ...form, piecesPerPack: e.target.value })} className="w-full px-4 py-3 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Low Stock Alert</label>
                    <input type="number" min="0" value={form.lowStockThresholdPieces} onChange={(e) => setForm({ ...form, lowStockThresholdPieces: e.target.value })} className="w-full px-4 py-3 border rounded-xl" />
                  </div>
                </div>
                {editing && <p className="text-xs text-gray-400">Renaming won't affect existing recipes — the internal key stays the same.</p>}
              </div>
              <div className="flex justify-end gap-3 p-5 border-t">
                <button onClick={() => setShowForm(false)} className="px-5 py-3 border rounded-full font-medium hover:bg-gray-50">Cancel</button>
                <button onClick={handleFormSave} disabled={formSaving} className="px-5 py-3 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C] disabled:opacity-60">
                  {formSaving ? 'Saving…' : editing ? 'Save Changes' : 'Create Ingredient'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
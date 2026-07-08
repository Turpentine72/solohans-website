import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Trash2, X, Pencil, Search, Filter, XCircle } from 'lucide-react';
import { expenses as expensesApi } from '../../lib/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Ingredients', 'Utilities', 'Transport', 'Salaries', 'Maintenance', 'Packaging', 'Other'];

const emptyForm = { date: new Date().toISOString().slice(0, 10), category: 'Ingredients', amount: '', description: '' };

const naira = (n) => `₦${Number(n || 0).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;

// Group a flat list of expenses into { dateKey, dateLabel, items, total } buckets,
// sorted newest date first, items within a day newest first.
function groupByDay(list) {
  const buckets = new Map();
  for (const e of list) {
    const d = new Date(e.date);
    const key = d.toISOString().slice(0, 10);
    if (!buckets.has(key)) {
      buckets.set(key, {
        dateKey: key,
        dateLabel: d.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        items: [],
        total: 0,
      });
    }
    const bucket = buckets.get(key);
    bucket.items.push(e);
    bucket.total += Number(e.amount) || 0;
  }
  return Array.from(buckets.values())
    .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1))
    .map((b) => ({ ...b, items: b.items.sort((x, y) => new Date(y.date) - new Date(x.date)) }));
}

export default function Expenses() {
  const { session } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => { fetchExpenses(); }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      setList(await expensesApi.getAll());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (e) => {
    setEditingId(e._id);
    setForm({
      date: new Date(e.date).toISOString().slice(0, 10),
      category: e.category,
      amount: String(e.amount),
      description: e.description || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.category || !form.amount || Number(form.amount) <= 0) {
      alert('Please choose a category and enter a valid amount.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await expensesApi.update(editingId, form);
      } else {
        await expensesApi.create(form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchExpenses();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await expensesApi.delete(id);
      fetchExpenses();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('All');
    setFromDate('');
    setToDate('');
  };

  const hasActiveFilters = search || category !== 'All' || fromDate || toDate;

  // Filtered list — drives both the grouped view AND the Overall Total,
  // so the total always matches what's currently on screen.
  const filtered = useMemo(() => {
    return list.filter((e) => {
      if (category !== 'All' && e.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        const inDesc = (e.description || '').toLowerCase().includes(q);
        const inCat = (e.category || '').toLowerCase().includes(q);
        if (!inDesc && !inCat) return false;
      }
      const d = new Date(e.date);
      if (fromDate && d < new Date(fromDate)) return false;
      if (toDate && d > new Date(`${toDate}T23:59:59`)) return false;
      return true;
    });
  }, [list, search, category, fromDate, toDate]);

  const overallTotal = useMemo(
    () => filtered.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [filtered]
  );

  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  return (
    <>
      <Helmet><title>Expenses – Solohans Admin</title></Helmet>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Expenses</h1>
            <p className="text-gray-500 text-sm mt-1">Log daily costs — these feed directly into Net Profit and the Expense Trend chart on Reports.</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center justify-center gap-2 bg-[#C62828] text-white px-5 py-2.5 rounded-full font-semibold hover:bg-[#B71C1C] transition-colors shrink-0"
          >
            <Plus size={18} /> Add Expense
          </button>
        </div>

        {/* Overall Total — always visible, always reflects the current filter */}
        <div className="sticky top-0 z-10 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 transition-all">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            {hasActiveFilters ? 'Filtered Total' : 'Overall Total Expenses'}
          </p>
          <p className="text-3xl font-extrabold text-red-600 mt-1">{naira(overallTotal)}</p>
          {hasActiveFilters && (
            <p className="text-xs text-gray-400 mt-1">Showing filtered results — clear filters to see the overall total.</p>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search description or category…"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/30"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-1.5 shrink-0 text-gray-400"><Filter size={14} /></div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm min-w-[140px]"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm"
              />
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 px-2 py-2.5"
                >
                  <XCircle size={16} /> Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Daily groups */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading…</div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">
            {hasActiveFilters ? 'No expenses match your filters.' : 'No expenses logged yet.'}
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div
                key={group.dateKey}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-[fadeIn_0.25s_ease-out]"
              >
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-700 text-sm sm:text-base">{group.dateLabel}</h3>
                </div>

                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-gray-400 text-xs">
                      <tr>
                        <th className="py-2 px-5 font-medium">Category</th>
                        <th className="py-2 px-5 font-medium">Amount</th>
                        <th className="py-2 px-5 font-medium">Description</th>
                        <th className="py-2 px-5 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((e) => (
                        <tr key={e._id} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 px-5 text-sm">{e.category}</td>
                          <td className="py-3 px-5 font-medium text-red-600 text-sm">{naira(e.amount)}</td>
                          <td className="py-3 px-5 text-sm text-gray-600 max-w-xs truncate">{e.description || '—'}</td>
                          <td className="py-3 px-5 text-right whitespace-nowrap">
                            <button onClick={() => openEdit(e)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg inline-block">
                              <Pencil size={15} />
                            </button>
                            {session?.role === 'admin' && (
                              <button onClick={() => handleDelete(e._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg inline-block">
                                <Trash2 size={15} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards — one per row */}
                <div className="sm:hidden divide-y divide-gray-50">
                  {group.items.map((e) => (
                    <div key={e._id} className="p-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{e.category}</p>
                        {e.description && <p className="text-xs text-gray-500 truncate mt-0.5">{e.description}</p>}
                        <p className="text-red-600 font-bold mt-1">{naira(e.amount)}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEdit(e)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                          <Pencil size={15} />
                        </button>
                        {session?.role === 'admin' && (
                          <button onClick={() => handleDelete(e._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Daily Total — visually distinct */}
                <div className="px-5 py-3 bg-red-50/70 border-t border-red-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-red-700">Daily Total</span>
                  <span className="text-base font-extrabold text-red-700">{naira(group.total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add / Edit modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-[fadeIn_0.15s_ease-out]">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Expense' : 'Add Expense'}</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-4 py-3 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-3 border rounded-xl">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount (₦)</label>
                  <input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-4 py-3 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description (optional)</label>
                  <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 border rounded-xl" />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t">
                <button onClick={() => setShowForm(false)} className="px-5 py-3 border rounded-full font-medium hover:bg-gray-50">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-5 py-3 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C] disabled:opacity-60">
                  {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Expense'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
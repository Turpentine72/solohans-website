import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Trash2, X } from 'lucide-react';
import { expenses as expensesApi } from '../../lib/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Ingredients', 'Utilities', 'Transport', 'Salaries', 'Maintenance', 'Packaging', 'Other'];

export default function Expenses() {
  const { session } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), category: 'Ingredients', amount: '', description: '' });

  useEffect(() => { fetchExpenses(); }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      setList(await expensesApi.getAll());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!form.category || !form.amount || Number(form.amount) <= 0) {
      alert('Please choose a category and enter a valid amount.');
      return;
    }
    setSaving(true);
    try {
      await expensesApi.create(form);
      setShowAdd(false);
      setForm({ date: new Date().toISOString().slice(0, 10), category: 'Ingredients', amount: '', description: '' });
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

  const total = list.reduce((sum, e) => sum + e.amount, 0);

  return (
    <>
      <Helmet><title>Expenses – Solohans Admin</title></Helmet>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Expenses</h1>
            <p className="text-gray-500 text-sm mt-1">Log daily costs — these feed directly into Net Profit and the Expense Trend chart on Reports.</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-[#C62828] text-white px-5 py-2.5 rounded-full font-semibold hover:bg-[#B71C1C]">
            <Plus size={18} /> Add Expense
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <p className="text-xs text-gray-500">Total Logged</p>
          <p className="text-2xl font-bold text-red-600">₦{total.toLocaleString()}</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading…</div>
        ) : list.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No expenses logged yet.</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map(e => (
                  <tr key={e._id} className="border-t border-gray-100">
                    <td className="py-3 px-4 whitespace-nowrap">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{e.category}</td>
                    <td className="py-3 px-4 font-medium text-red-600">₦{e.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">{e.description || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      {session?.role === 'admin' && (
                        <button onClick={() => handleDelete(e._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg inline-block"><Trash2 size={16} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="text-xl font-bold text-gray-800">Add Expense</h3>
                <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div><label className="block text-sm font-medium mb-1">Date</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full px-4 py-3 border rounded-xl" /></div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-3 border rounded-xl">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium mb-1">Amount (₦)</label><input type="number" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="w-full px-4 py-3 border rounded-xl" /></div>
                <div><label className="block text-sm font-medium mb-1">Description (optional)</label><input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 border rounded-xl" /></div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t">
                <button onClick={() => setShowAdd(false)} className="px-5 py-3 border rounded-full font-medium hover:bg-gray-50">Cancel</button>
                <button onClick={handleAdd} disabled={saving} className="px-5 py-3 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C]">{saving ? 'Saving…' : 'Add Expense'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

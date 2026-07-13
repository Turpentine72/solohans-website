import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Download, Printer, XCircle, LogIn, LogOut, Clock, ShoppingBag, Tag, Receipt as ReceiptIcon, KeyRound, ShieldAlert } from 'lucide-react';
import { staffActivity as staffActivityApi } from '../../lib/api';
import { useAuth } from '../context/AuthContext';

const naira = (n) => `₦${Number(n || 0).toLocaleString('en-NG')}`;
const toDateKey = (d) => new Date(d).toISOString().slice(0, 10);

const TYPE_ICON = {
  Login: LogIn,
  Logout: LogOut,
  'Shift Started': Clock,
  'Shift Ended': Clock,
  'Orders Processed': ShoppingBag,
  'Discount Applied': Tag,
  'Receipt Printed': ReceiptIcon,
  'Receipt Reprinted': ReceiptIcon,
  'Password Reset (OTP)': KeyRound,
  'Staff Password Reset (by admin)': KeyRound,
};
const TYPE_COLOR = {
  Login: 'text-green-600 bg-green-50',
  Logout: 'text-gray-500 bg-gray-100',
  'Shift Started': 'text-blue-600 bg-blue-50',
  'Shift Ended': 'text-blue-600 bg-blue-50',
  'Orders Processed': 'text-purple-600 bg-purple-50',
  'Discount Applied': 'text-amber-600 bg-amber-50',
  'Receipt Printed': 'text-teal-600 bg-teal-50',
  'Receipt Reprinted': 'text-teal-600 bg-teal-50',
  'Password Reset (OTP)': 'text-red-600 bg-red-50',
  'Staff Password Reset (by admin)': 'text-red-600 bg-red-50',
};

function startOfWeek() {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function groupByDay(events) {
  const buckets = new Map();
  for (const e of events) {
    const key = toDateKey(e.timestamp);
    if (!buckets.has(key)) {
      buckets.set(key, {
        dateKey: key,
        dateLabel: new Date(e.timestamp).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        events: [],
      });
    }
    buckets.get(key).events.push(e);
  }
  return Array.from(buckets.values()).sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
}

export default function StaffActivity() {
  const { session, isSuperAdmin } = useAuth();
  const isAllowed = isSuperAdmin || session?.role === 'admin';

  const [data, setData] = useState({ events: [], summary: { ordersProcessed: 0, revenueProcessed: 0, loginHours: 0, receiptsPrinted: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [datePreset, setDatePreset] = useState('week');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [search, setSearch] = useState('');

  const { dateFrom, dateTo } = useMemo(() => {
    const today = new Date();
    if (datePreset === 'today') return { dateFrom: toDateKey(today), dateTo: toDateKey(today) };
    if (datePreset === 'week') return { dateFrom: toDateKey(startOfWeek()), dateTo: toDateKey(today) };
    if (datePreset === 'month') {
      const m = new Date(today.getFullYear(), today.getMonth(), 1);
      return { dateFrom: toDateKey(m), dateTo: toDateKey(today) };
    }
    return { dateFrom: customFrom, dateTo: customTo };
  }, [datePreset, customFrom, customTo]);

  const load = async () => {
    if (datePreset === 'custom' && (!customFrom || !customTo)) return;
    setLoading(true);
    setError('');
    try {
      setData(await staffActivityApi.get({ dateFrom, dateTo, search }));
    } catch (err) {
      setError(err.message || 'Failed to load staff activity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isAllowed) load(); }, [dateFrom, dateTo, isAllowed]);
  useEffect(() => {
    if (!isAllowed) return;
    const t = setTimeout(load, 400); // debounce search
    return () => clearTimeout(t);
  }, [search]);

  const groups = useMemo(() => groupByDay(data.events), [data.events]);

  const handleExportCSV = () => {
    const rows = [['Date', 'Time', 'Staff', 'Activity', 'Details']];
    data.events.forEach((e) => {
      const d = new Date(e.timestamp);
      rows.push([toDateKey(e.timestamp), d.toLocaleTimeString('en-NG'), e.staffName || e.staffEmail || '—', e.type, e.description]);
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `staff-activity-${dateFrom}-to-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  if (!isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <ShieldAlert size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Admin Access Only</h2>
        <p className="text-gray-500 max-w-sm">Staff Activity is restricted to Admins and the Super Admin.</p>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Staff Activity – Solohans Admin</title></Helmet>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 no-print">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Staff Activity</h1>
            <p className="text-gray-500 text-sm mt-1">Logins, shifts, orders processed, discounts, and receipt prints — separate from the payment-focused Staff History page.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportCSV} className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-full font-semibold hover:bg-gray-50">
              <Download size={16} /> Export CSV
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-full font-semibold hover:bg-gray-50">
              <Printer size={16} /> Print
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"><p className="text-xs text-gray-400 mb-1">Orders Processed</p><p className="text-lg font-bold text-gray-800">{data.summary.ordersProcessed}</p></div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"><p className="text-xs text-gray-400 mb-1">Revenue Processed</p><p className="text-lg font-bold text-gray-800">{naira(data.summary.revenueProcessed)}</p></div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"><p className="text-xs text-gray-400 mb-1">Login Hours</p><p className="text-lg font-bold text-gray-800">{data.summary.loginHours.toFixed(1)}h</p></div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"><p className="text-xs text-gray-400 mb-1">Receipts Printed</p><p className="text-lg font-bold text-gray-800">{data.summary.receiptsPrinted}</p></div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 space-y-3 no-print">
          <div className="flex flex-wrap gap-2">
            {[['today', 'Today'], ['week', 'This Week'], ['month', 'This Month'], ['custom', 'Custom Date']].map(([val, label]) => (
              <button key={val} onClick={() => setDatePreset(val)} className={`px-4 py-2 rounded-full text-sm font-semibold border ${datePreset === val ? 'bg-[#C62828] text-white border-[#C62828]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {label}
              </button>
            ))}
            {datePreset === 'custom' && (
              <>
                <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <span className="self-center text-gray-400 text-sm">to</span>
                <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </>
            )}
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff name, email, or activity…" className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600"><XCircle size={16} /></button>
            )}
          </div>
        </div>

        {/* Activity feed */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading…</div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 font-medium mb-3">{error}</p>
            <button onClick={load} className="px-5 py-2.5 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C] no-print">Try Again</button>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">No activity found for this period.</div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.dateKey} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-700">{group.dateLabel}</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {group.events.map((e, i) => {
                    const Icon = TYPE_ICON[e.type] || Clock;
                    const color = TYPE_COLOR[e.type] || 'text-gray-500 bg-gray-100';
                    return (
                      <div key={i} className="p-4 flex items-start gap-3">
                        <span className={`p-2 rounded-full shrink-0 ${color}`}><Icon size={15} /></span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-800">{e.description}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{new Date(e.timestamp).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

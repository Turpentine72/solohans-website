import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Filter, XCircle, Receipt, Eye, X, ShoppingBag, Banknote, Wallet } from 'lucide-react';
import { orders as ordersApi } from '../../lib/api';

const SOURCES = ['POS', 'Website', 'WhatsApp', 'Glovo', 'Chowdeck', 'Uber Eats', 'Other'];
const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'POS', label: 'POS' },
  { value: 'WEBSITE PAYMENT', label: 'Website' },
  { value: 'PLATFORM', label: 'Glovo/Chowdeck (Platform)' },
  { value: 'SPLIT', label: 'Split Payment' },
];

const naira = (n) => `₦${Number(n || 0).toLocaleString('en-NG')}`;
const toDateKey = (d) => d.toISOString().slice(0, 10);

function startOfWeek() {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
  return d;
}

function orderLineItems(order) {
  const rows = [];
  (order.items || []).forEach((i) => rows.push({ name: i.name, qty: i.quantity || 1 }));
  (order.mealPackages || []).forEach((m) => rows.push({ name: m.label || m.name || 'Meal Package', qty: m.quantity || 1 }));
  (order.storeExtras || []).forEach((e) => rows.push({ name: e.label || e.item || 'Extra', qty: e.qty || e.quantity || 1 }));
  return rows;
}

function groupByDay(list) {
  const buckets = new Map();
  for (const o of list) {
    const d = new Date(o.createdAt);
    const key = toDateKey(d);
    if (!buckets.has(key)) {
      buckets.set(key, {
        dateKey: key,
        dateLabel: d.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        orders: [],
        total: 0,
      });
    }
    const bucket = buckets.get(key);
    bucket.orders.push(o);
    bucket.total += Number(o.totalAmount) || 0;
  }
  return Array.from(buckets.values()).sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
}

const SOURCE_BADGE = {
  POS: 'bg-purple-100 text-purple-700',
  Website: 'bg-teal-100 text-teal-700',
  WhatsApp: 'bg-green-100 text-green-700',
  Glovo: 'bg-indigo-100 text-indigo-700',
  Chowdeck: 'bg-orange-100 text-orange-700',
  'Uber Eats': 'bg-gray-800 text-white',
  Other: 'bg-gray-100 text-gray-700',
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [datePreset, setDatePreset] = useState('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [source, setSource] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [search, setSearch] = useState('');
  const [detailOrder, setDetailOrder] = useState(null);

  const { dateFrom, dateTo } = useMemo(() => {
    const today = new Date();
    if (datePreset === 'today') return { dateFrom: toDateKey(today), dateTo: toDateKey(today) };
    if (datePreset === 'yesterday') {
      const y = new Date(today); y.setDate(y.getDate() - 1);
      return { dateFrom: toDateKey(y), dateTo: toDateKey(y) };
    }
    if (datePreset === 'week') return { dateFrom: toDateKey(startOfWeek()), dateTo: toDateKey(today) };
    if (datePreset === 'month') {
      const m = new Date(today.getFullYear(), today.getMonth(), 1);
      return { dateFrom: toDateKey(m), dateTo: toDateKey(today) };
    }
    return { dateFrom: customFrom, dateTo: customTo }; // custom
  }, [datePreset, customFrom, customTo]);

  const load = async () => {
    if (datePreset === 'custom' && (!customFrom || !customTo)) return;
    setLoading(true);
    setError('');
    try {
      const data = await ordersApi.getHistory({ dateFrom, dateTo, source, paymentMethod });
      setOrders(data);
    } catch (err) {
      setError(err.message || 'Failed to load order history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [dateFrom, dateTo, source, paymentMethod]);

  const filtered = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if ((o.order_id || '').toLowerCase().includes(q)) return true;
      if ((o.invoiceNumber || '').toLowerCase().includes(q)) return true;
      if ((o.customerName || '').toLowerCase().includes(q)) return true;
      if ((o.staffNameSnapshot || '').toLowerCase().includes(q)) return true;
      return orderLineItems(o).some((li) => li.name.toLowerCase().includes(q));
    });
  }, [orders, search]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  const summary = useMemo(() => {
    const s = { totalOrders: filtered.length, totalRevenue: 0, cash: 0, transfer: 0, pos: 0, website: 0, glovo: 0, chowdeck: 0 };
    filtered.forEach((o) => {
      s.totalRevenue += o.totalAmount || 0;
      if (o.paymentMethod === 'CASH') s.cash += o.totalAmount || 0;
      else if (o.paymentMethod === 'TRANSFER') s.transfer += o.totalAmount || 0;
      else if (o.paymentMethod === 'POS') s.pos += o.totalAmount || 0;
      else if (o.paymentMethod === 'WEBSITE PAYMENT') s.website += o.totalAmount || 0;
      else if (o.paymentMethod === 'PLATFORM') {
        if (o.platform === 'Glovo') s.glovo += o.totalAmount || 0;
        else if (o.platform === 'Chowdeck') s.chowdeck += o.totalAmount || 0;
      }
    });
    return s;
  }, [filtered]);

  const hasActiveFilters = source || paymentMethod || search;
  const clearFilters = () => { setSource(''); setPaymentMethod(''); setSearch(''); };

  const SUMMARY_CARDS = [
    { label: 'Total Orders', value: summary.totalOrders.toLocaleString(), icon: ShoppingBag },
    { label: 'Total Revenue', value: naira(summary.totalRevenue), icon: Wallet },
    { label: 'Cash', value: naira(summary.cash), icon: Banknote },
    { label: 'Transfer', value: naira(summary.transfer), icon: Banknote },
    { label: 'POS', value: naira(summary.pos), icon: Banknote },
    { label: 'Website', value: naira(summary.website), icon: Banknote },
    { label: 'Glovo', value: naira(summary.glovo), icon: Banknote },
    { label: 'Chowdeck', value: naira(summary.chowdeck), icon: Banknote },
  ];

  return (
    <>
      <Helmet><title>Order History – Solohans Admin</title></Helmet>
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Order History</h1>
          <p className="text-gray-500 text-sm mt-1">The master history for every completed order — POS, Website, WhatsApp, Glovo, and Chowdeck — in one place.</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {SUMMARY_CARDS.map((c) => (
            <div key={c.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-400 mb-1">{c.label}</p>
              <p className="text-lg font-bold text-gray-800">{c.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 space-y-3">
          <div className="flex flex-wrap gap-2">
            {[['today', 'Today'], ['yesterday', 'Yesterday'], ['week', 'This Week'], ['month', 'This Month'], ['custom', 'Custom Date']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setDatePreset(val)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border ${datePreset === val ? 'bg-[#C62828] text-white border-[#C62828]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
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

          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search receipt #, order #, customer, meal, or staff…"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C62828]/30"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={14} className="text-gray-400" />
              <select value={source} onChange={(e) => setSource(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm">
                <option value="">All Sources</option>
                {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm">
                <option value="">All Payment Methods</option>
                {PAYMENT_METHODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 px-2 py-2.5">
                  <XCircle size={16} /> Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Order groups */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading…</div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 font-medium mb-3">{error}</p>
            <button onClick={load} className="px-5 py-2.5 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C]">Try Again</button>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">No Records Found</div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.dateKey} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-700">{group.dateLabel}</h3>
                  <span className="text-sm font-bold text-gray-800">{naira(group.total)} · {group.orders.length} order(s)</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {group.orders.map((o) => (
                    <div key={o._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-gray-800">{o.order_id}</span>
                          {o.invoiceNumber && <span className="text-xs text-gray-400">{o.invoiceNumber}</span>}
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SOURCE_BADGE[o._source] || 'bg-gray-100 text-gray-700'}`}>{o._source}</span>
                          <span className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {orderLineItems(o).map((li) => `${li.name}${li.qty > 1 ? ` ×${li.qty}` : ''}`).join(', ') || '—'}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {o.customerName || 'Walk-in customer'} · Staff: {o.staffNameSnapshot || '—'} · {o.paymentMethod}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-bold text-gray-800">{naira(o.totalAmount)}</span>
                        <button onClick={() => setDetailOrder(o)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="View Details"><Eye size={16} /></button>
                        <a href={`/receipt/${o._id}?staff=1`} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="View / Print / Download Receipt"><Receipt size={16} /></a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order detail modal */}
        {detailOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
                <h3 className="text-lg font-bold">{detailOrder.order_id}</h3>
                <button onClick={() => setDetailOrder(null)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><p className="text-gray-400 text-xs">Source</p><p className="font-medium">{detailOrder._source}</p></div>
                  <div><p className="text-gray-400 text-xs">Payment Method</p><p className="font-medium">{detailOrder.paymentMethod}</p></div>
                  <div><p className="text-gray-400 text-xs">Customer</p><p className="font-medium">{detailOrder.customerName || 'Walk-in'}</p></div>
                  <div><p className="text-gray-400 text-xs">Staff</p><p className="font-medium">{detailOrder.staffNameSnapshot || '—'}</p></div>
                  <div><p className="text-gray-400 text-xs">Payment Status</p><p className="font-medium capitalize">{detailOrder.payment_status}</p></div>
                  <div><p className="text-gray-400 text-xs">Order Status</p><p className="font-medium">{detailOrder.status}</p></div>
                  <div><p className="text-gray-400 text-xs">Date</p><p className="font-medium">{new Date(detailOrder.createdAt).toLocaleString('en-NG')}</p></div>
                  {detailOrder.platform !== 'Walk-in' && <div><p className="text-gray-400 text-xs">Platform Order ID</p><p className="font-medium">{detailOrder.externalOrderId}</p></div>}
                </div>
                <div className="border-t pt-3">
                  <p className="text-gray-400 text-xs mb-1">Items</p>
                  {orderLineItems(detailOrder).map((li, i) => (
                    <p key={i} className="text-sm">{li.name} {li.qty > 1 && `× ${li.qty}`}</p>
                  ))}
                </div>
                <div className="border-t pt-3 flex justify-between font-bold text-base">
                  <span>Total</span><span>{naira(detailOrder.totalAmount)}</span>
                </div>
              </div>
              <div className="p-5 border-t">
                <a href={`/receipt/${detailOrder._id}?staff=1`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 bg-[#C62828] text-white py-2.5 rounded-full font-semibold hover:bg-[#B71C1C]">
                  <Receipt size={16} /> View / Print / Download Receipt
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
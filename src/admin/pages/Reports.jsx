import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Package,
  Wallet,
  Download,
  Bike,
  Users,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { orders as ordersApi, expenses as expensesApi } from '../../lib/api';

const COLORS = ['#C62828', '#B71C1C', '#D32F2F', '#E53935', '#EF5350', '#FF8A80'];
const STATUS_COLORS = {
  Pending: '#FFA726', Confirmed: '#42A5F5', Processing: '#AB47BC',
  'Out for Delivery': '#26C6DA', 'Ready for Pickup': '#26C6DA',
  Delivered: '#66BB6A', Completed: '#66BB6A', Cancelled: '#EF5350', Paid: '#42A5F5',
};

const PRESETS = ['Today', 'Yesterday', 'This Week', 'Last Week', 'This Month', 'Last Month', 'Custom'];
const PLATFORM_FILTERS = ['All', 'Walk-in', 'Glovo', 'Chowdeck', 'Uber Eats', 'Other'];

function getRangeForPreset(preset, customFrom, customTo) {
  const now = new Date();
  const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

  switch (preset) {
    case 'Today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case 'Yesterday': {
      const y = new Date(now); y.setDate(y.getDate() - 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case 'This Week': {
      const start = new Date(now);
      start.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
      return { from: startOfDay(start), to: endOfDay(now) };
    }
    case 'Last Week': {
      const start = new Date(now);
      start.setDate(now.getDate() - ((now.getDay() + 6) % 7) - 7);
      const end = new Date(start); end.setDate(start.getDate() + 6);
      return { from: startOfDay(start), to: endOfDay(end) };
    }
    case 'This Month':
      return { from: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)), to: endOfDay(now) };
    case 'Last Month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: startOfDay(start), to: endOfDay(end) };
    }
    case 'Custom':
      return { from: customFrom ? startOfDay(new Date(customFrom)) : startOfDay(now), to: customTo ? endOfDay(new Date(customTo)) : endOfDay(now) };
    default:
      return { from: startOfDay(now), to: endOfDay(now) };
  }
}

function downloadCSV(rows, filename) {
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [expensesList, setExpensesList] = useState([]);
  const [chartType, setChartType] = useState('daily');
  const [preset, setPreset] = useState('This Month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [allOrders, allExpenses] = await Promise.all([ordersApi.getAll(), expensesApi.getAll()]);
      setOrders(allOrders);
      setExpensesList(allExpenses);
    } catch (err) {
      console.error('Reports fetch error:', err);
      setError('Failed to load report data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const { from, to } = useMemo(() => getRangeForPreset(preset, customFrom, customTo), [preset, customFrom, customTo]);

  // Date-only — used for the Platform Breakdown so all platforms can be
  // compared side by side within the chosen date range, regardless of
  // which single platform is currently selected in the filter above.
  const dateRangeOrders = useMemo(
    () => orders.filter(o => { const d = new Date(o.createdAt); return d >= from && d <= to; }),
    [orders, from, to]
  );

  // Platform-only — used for the 12-month trend charts, which intentionally
  // ignore the date preset but should still respect the platform filter.
  const scopedAllOrders = useMemo(
    () => orders.filter(o => platformFilter === 'All' || (o.platform || 'Walk-in') === platformFilter),
    [orders, platformFilter]
  );

  const periodOrders = useMemo(
    () => dateRangeOrders.filter(o => platformFilter === 'All' || (o.platform || 'Walk-in') === platformFilter),
    [dateRangeOrders, platformFilter]
  );
  const periodExpenses = useMemo(
    () => expensesList.filter(e => { const d = new Date(e.date); return d >= from && d <= to; }),
    [expensesList, from, to]
  );
  const periodDeliveredOrders = periodOrders.filter(o => o.status === 'Delivered' || o.status === 'Completed');

  const periodRevenue = periodDeliveredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const periodExpenseTotal = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
  const periodProfit = periodRevenue - periodExpenseTotal;
  const periodCustomers = new Set(periodOrders.map(o => o.customerEmail)).size;
  const avgOrderValue = periodOrders.length > 0 ? periodRevenue / periodOrders.length : 0;
  const periodMealsSold = periodOrders.reduce((sum, o) => sum + (o.items || []).reduce((s, i) => s + (i.quantity || 1), 0), 0);

  const orderDistribution = useMemo(() => {
    const map = new Map();
    periodOrders.forEach(o => map.set(o.status, (map.get(o.status) || 0) + 1));
    return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
  }, [periodOrders]);

  const dailySales = useMemo(() => {
    const map = new Map();
    periodDeliveredOrders.forEach(o => {
      const key = new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      map.set(key, (map.get(key) || 0) + (o.totalAmount || 0));
    });
    return Array.from(map.entries()).map(([day, sales]) => ({ day, sales }));
  }, [periodDeliveredOrders]);

  const weeklySales = useMemo(() => {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const map = new Map(weeks.map(w => [w, 0]));
    const now = new Date();
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (now.getDay() || 7) - 7 * i);
      const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
      let total = 0;
      scopedAllOrders.forEach(o => {
        if (o.status !== 'Delivered' && o.status !== 'Completed') return;
        const d = new Date(o.createdAt);
        if (d >= weekStart && d <= weekEnd) total += o.totalAmount || 0;
      });
      map.set(`Week ${4 - i}`, total);
    }
    return weeks.map(w => ({ week: w, sales: map.get(w) }));
  }, [scopedAllOrders]);

  const { monthlySales, expenseTrend, customerGrowth } = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const buckets = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ label: months[d.getMonth()], year: d.getFullYear(), month: d.getMonth() });
    }

    const sales = buckets.map(b => ({
      month: b.label,
      sales: scopedAllOrders
        .filter(o => (o.status === 'Delivered' || o.status === 'Completed'))
        .filter(o => { const d = new Date(o.createdAt); return d.getFullYear() === b.year && d.getMonth() === b.month; })
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    }));

    const exp = buckets.map(b => ({
      month: b.label,
      expenses: expensesList
        .filter(e => { const d = new Date(e.date); return d.getFullYear() === b.year && d.getMonth() === b.month; })
        .reduce((sum, e) => sum + e.amount, 0),
    }));

    const seen = new Set();
    const growth = buckets.map(b => {
      scopedAllOrders.forEach(o => {
        const d = new Date(o.createdAt);
        if (d.getFullYear() === b.year && d.getMonth() === b.month) seen.add(o.customerEmail);
      });
      return { month: b.label, customers: seen.size };
    });

    return { monthlySales: sales, expenseTrend: exp, customerGrowth: growth };
  }, [scopedAllOrders, expensesList]);

  const topSellingMeals = useMemo(() => {
    const map = new Map();
    periodOrders.forEach(o => (o.items || []).forEach(item => {
      map.set(item.name, (map.get(item.name) || 0) + (item.quantity || 1));
    }));
    return Array.from(map.entries()).map(([name, orders]) => ({ name, orders })).sort((a, b) => b.orders - a.orders).slice(0, 6);
  }, [periodOrders]);

  // ─── Platform Breakdown — always compares ALL platforms within the
  // selected date range, regardless of which single platform is filtered
  // above, so Walk-in/Glovo/Chowdeck/etc. can be judged side by side. ───
  const platformBreakdown = useMemo(() => {
    const map = new Map();
    dateRangeOrders.forEach(o => {
      const p = o.platform || 'Walk-in';
      if (!map.has(p)) map.set(p, { platform: p, orders: 0, revenue: 0, meals: 0 });
      const entry = map.get(p);
      entry.orders += 1;
      entry.revenue += o.totalAmount || 0;
      entry.meals += (o.items || []).reduce((s, i) => s + (i.quantity || 1), 0);
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [dateRangeOrders]);

  // ─── Staff Performance — respects both the date range AND the platform
  // filter, so a manager can check "how did Chidi do on Glovo this week".
  // Only store/POS sales carry a staff attribution (website orders don't,
  // unless later tagged by a staff member).
  const staffPerformance = useMemo(() => {
    const map = new Map();
    periodOrders.forEach(o => {
      if (o.source !== 'store' && !o.taggedStaffName) return;
      const name = o.staffNameSnapshot || o.taggedStaffName || 'Unknown Staff';
      if (!map.has(name)) map.set(name, { name, orders: 0, revenue: 0, platforms: new Set() });
      const entry = map.get(name);
      entry.orders += 1;
      entry.revenue += o.totalAmount || 0;
      entry.platforms.add(o.platform || 'Walk-in');
    });
    return Array.from(map.values())
      .map(e => ({ ...e, platforms: Array.from(e.platforms).join(', '), avgOrderValue: e.orders ? e.revenue / e.orders : 0 }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [periodOrders]);

  const handleExportPlatformStaffCSV = () => {
    const rows = [['Platform Breakdown']];
    rows.push(['Platform', 'Orders', 'Revenue', 'Meals Sold']);
    platformBreakdown.forEach(p => rows.push([p.platform, p.orders, p.revenue, p.meals]));
    rows.push([]);
    rows.push(['Staff Performance']);
    rows.push(['Staff', 'Orders', 'Revenue', 'Avg. Order Value', 'Platforms']);
    staffPerformance.forEach(s => rows.push([s.name, s.orders, s.revenue, Math.round(s.avgOrderValue), s.platforms]));
    downloadCSV(rows, `solohans-platform-staff-${preset.toLowerCase().replace(/\s/g, '-')}.csv`);
  };

  const handleExportCSV = () => {
    const dayMap = new Map();
    periodOrders.forEach(o => {
      const key = new Date(o.createdAt).toLocaleDateString('en-CA');
      if (!dayMap.has(key)) dayMap.set(key, { orders: 0, revenue: 0, customers: new Set(), paymentMethods: new Set(), platforms: new Set() });
      const entry = dayMap.get(key);
      entry.orders += 1;
      if (o.status === 'Delivered' || o.status === 'Completed') entry.revenue += o.totalAmount || 0;
      entry.customers.add(o.customerEmail);
      entry.paymentMethods.add(o.order_channel === 'whatsapp' ? 'WhatsApp' : 'Card');
      entry.platforms.add(o.platform || 'Walk-in');
    });
    const expenseByDay = new Map();
    periodExpenses.forEach(e => {
      const key = new Date(e.date).toLocaleDateString('en-CA');
      expenseByDay.set(key, (expenseByDay.get(key) || 0) + e.amount);
    });

    const rows = [['Date', 'Orders', 'Revenue', 'Expenses', 'Profit', 'Customers', 'Payment Method', 'Platforms']];
    Array.from(dayMap.keys()).sort().forEach(date => {
      const entry = dayMap.get(date);
      const dayExpenses = expenseByDay.get(date) || 0;
      rows.push([
        date,
        entry.orders,
        entry.revenue,
        dayExpenses,
        entry.revenue - dayExpenses,
        entry.customers.size,
        Array.from(entry.paymentMethods).join(' / '),
        Array.from(entry.platforms).join(' / '),
      ]);
    });

    downloadCSV(rows, `solohans-report-${preset.toLowerCase().replace(/\s/g, '-')}.csv`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-gray-500 text-lg">Loading reports…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button onClick={fetchData} className="mt-4 px-4 py-2 bg-[#C62828] text-white rounded-lg">Retry</button>
      </div>
    );
  }

  const chartData = chartType === 'daily' ? dailySales : chartType === 'weekly' ? weeklySales : monthlySales;
  const xKey = chartType === 'daily' ? 'day' : chartType === 'weekly' ? 'week' : 'month';

  const metrics = [
    { label: `Revenue (${preset})`, value: `₦${periodRevenue.toLocaleString()}`, icon: <DollarSign size={24} />, bg: 'bg-purple-50 text-purple-600' },
    { label: 'Orders', value: periodOrders.length.toLocaleString(), icon: <ShoppingBag size={24} />, bg: 'bg-blue-50 text-blue-600' },
    { label: 'Expenses', value: `₦${periodExpenseTotal.toLocaleString()}`, icon: <Wallet size={24} />, bg: 'bg-red-50 text-red-600' },
    { label: 'Net Profit', value: `₦${periodProfit.toLocaleString()}`, icon: periodProfit >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />, bg: periodProfit >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600' },
    { label: 'Avg. Order Value', value: `₦${Math.round(avgOrderValue).toLocaleString()}`, icon: <TrendingUp size={24} />, bg: 'bg-green-50 text-green-600' },
    { label: 'Meals Sold', value: periodMealsSold.toLocaleString(), icon: <Package size={24} />, bg: 'bg-teal-50 text-teal-600' },
    { label: 'Customers', value: periodCustomers.toLocaleString(), icon: <Package size={24} />, bg: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <>
      <Helmet><title>Reports & Analytics – Solohans Admin</title></Helmet>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
          <button onClick={handleExportCSV} className="flex items-center gap-2 bg-[#C62828] text-white px-5 py-2.5 rounded-full font-semibold hover:bg-[#B71C1C]">
            <Download size={18} /> Export CSV
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {PRESETS.map(p => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${preset === p ? 'bg-[#C62828] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {p}
            </button>
          ))}
          {preset === 'Custom' && (
            <div className="flex gap-2 items-center">
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="px-3 py-2 border rounded-xl text-sm" />
              <span className="text-gray-400">to</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="px-3 py-2 border rounded-xl text-sm" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide mr-1">Platform</span>
          {PLATFORM_FILTERS.map(p => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${platformFilter === p ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {p !== 'All' && p !== 'Walk-in' && <Bike size={12} />} {p}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {metrics.map((metric, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${metric.bg}`}>{metric.icon}</div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{metric.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{metric.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Sales Overview</h2>
              <div className="flex gap-2">
                {['daily', 'weekly', 'monthly'].map((type) => (
                  <button key={type} onClick={() => setChartType(type)} className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase ${chartType === type ? 'bg-[#C62828] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{type}</button>
                ))}
              </div>
            </div>
            {chartData.every(d => d.sales === 0) ? (
              <p className="text-center text-gray-400 py-20">No sales in this view yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#666' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#666' }} />
                  <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
                  <Bar dataKey="sales" fill="#C62828" radius={[8, 8, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Distribution ({preset})</h2>
            {orderDistribution.length === 0 ? (
              <p className="text-center text-gray-400 py-20">No orders in this period.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={orderDistribution} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={110} label={({ status, count }) => `${status} (${count})`}>
                    {orderDistribution.map((entry, index) => (
                      <Cell key={index} fill={STATUS_COLORS[entry.status] || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Revenue Trend (12 months)</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#666' }} />
                <YAxis tick={{ fontSize: 12, fill: '#666' }} />
                <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="sales" stroke="#C62828" strokeWidth={3} dot={{ fill: '#C62828', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Expense Trend (12 months)</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={expenseTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#666' }} />
                <YAxis tick={{ fontSize: 12, fill: '#666' }} />
                <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="expenses" stroke="#EF5350" strokeWidth={3} dot={{ fill: '#EF5350', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Customer Growth (12 months)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={customerGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#666' }} />
              <YAxis tick={{ fontSize: 12, fill: '#666' }} />
              <Tooltip />
              <Line type="monotone" dataKey="customers" stroke="#42A5F5" strokeWidth={3} dot={{ fill: '#42A5F5', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Top Selling Meals ({preset})</h2>
          {topSellingMeals.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No items sold in this period.</p>
          ) : (
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={320} className="max-w-lg">
                <PieChart>
                  <Pie data={topSellingMeals} dataKey="orders" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, orders }) => `${name} (${orders})`}>
                    {topSellingMeals.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 w-full max-w-xs">
                {topSellingMeals.map((meal, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-sm text-gray-600">{meal.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-800">{meal.orders} orders</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Bike size={20} /> Platform Breakdown ({preset})</h2>
              <button onClick={handleExportPlatformStaffCSV} className="text-xs font-semibold text-[#C62828] hover:underline flex items-center gap-1">
                <Download size={13} /> Export
              </button>
            </div>
            {platformBreakdown.length === 0 ? (
              <p className="text-center text-gray-400 py-12">No orders in this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-gray-400 text-xs uppercase">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Platform</th>
                      <th className="py-2 pr-3 font-medium">Orders</th>
                      <th className="py-2 pr-3 font-medium">Revenue</th>
                      <th className="py-2 font-medium">Meals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {platformBreakdown.map((p) => (
                      <tr key={p.platform} className="border-t border-gray-50">
                        <td className="py-2.5 pr-3 font-medium text-gray-800">{p.platform}</td>
                        <td className="py-2.5 pr-3 text-gray-600">{p.orders}</td>
                        <td className="py-2.5 pr-3 font-semibold text-[#C62828]">₦{p.revenue.toLocaleString()}</td>
                        <td className="py-2.5 text-gray-600">{p.meals}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Users size={20} /> Staff Performance ({preset}{platformFilter !== 'All' ? ` · ${platformFilter}` : ''})</h2>
            </div>
            {staffPerformance.length === 0 ? (
              <p className="text-center text-gray-400 py-12">No staff-attributed sales in this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-gray-400 text-xs uppercase">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Staff</th>
                      <th className="py-2 pr-3 font-medium">Orders</th>
                      <th className="py-2 pr-3 font-medium">Revenue</th>
                      <th className="py-2 font-medium">Avg. Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffPerformance.map((s) => (
                      <tr key={s.name} className="border-t border-gray-50">
                        <td className="py-2.5 pr-3 font-medium text-gray-800">{s.name}</td>
                        <td className="py-2.5 pr-3 text-gray-600">{s.orders}</td>
                        <td className="py-2.5 pr-3 font-semibold text-[#C62828]">₦{s.revenue.toLocaleString()}</td>
                        <td className="py-2.5 text-gray-600">₦{Math.round(s.avgOrderValue).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
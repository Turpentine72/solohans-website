import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  DollarSign,
  Users,
  AlertTriangle,
  Wallet,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { orders as ordersApi, expenses as expensesApi, dashboard as dashboardApi } from '../../lib/api';

// Monday-start of the CURRENT week — this is what makes the dashboard
// naturally "reset" every Monday: it's a live query filtered to this date
// range, not a stored counter, so nothing needs a cron job and no history
// is ever deleted, last week's data still lives in Reports & Analytics.
function startOfCurrentWeek() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
  start.setHours(0, 0, 0, 0);
  return start;
}

export default function Dashboard() {
  const [stats, setStats] = useState([
    { label: 'Total Orders', value: 0, icon: <ShoppingBag size={24} />, bg: 'bg-blue-50 text-blue-600' },
    { label: 'Pending Orders', value: 0, icon: <Clock size={24} />, bg: 'bg-yellow-50 text-yellow-600' },
    { label: 'Completed Orders', value: 0, icon: <CheckCircle size={24} />, bg: 'bg-green-50 text-green-600' },
    { label: 'This Week Sales', value: '₦0', icon: <DollarSign size={24} />, bg: 'bg-purple-50 text-purple-600' },
    { label: 'This Week Expenses', value: '₦0', icon: <Wallet size={24} />, bg: 'bg-red-50 text-red-600' },
    { label: 'This Week Net Profit', value: '₦0', icon: <TrendingUp size={24} />, bg: 'bg-green-50 text-green-600' },
    { label: 'Total Customers', value: 0, icon: <Users size={24} />, bg: 'bg-indigo-50 text-indigo-600' },
    { label: 'Pending Payments', value: 0, icon: <AlertTriangle size={24} />, bg: 'bg-red-50 text-red-600' },
  ]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [weekOrderCount, setWeekOrderCount] = useState(0);
  const [summary, setSummary] = useState(null);
  const [summaryPeriod, setSummaryPeriod] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchSummary(summaryPeriod);
  }, [summaryPeriod]);

  const fetchSummary = async (period) => {
    try {
      const data = await dashboardApi.summary(period);
      setSummary(data);
    } catch (err) {
      console.error('Dashboard summary fetch error:', err);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [orders, expensesList] = await Promise.all([
        ordersApi.getAll(),
        expensesApi.getAll().catch(() => []), // don't let a permission gap (non-admin roles) break the whole dashboard
      ]);

      // --- All-time stats ---
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(o => ['Pending', 'Confirmed', 'Processing', 'Out for Delivery', 'Ready for Pickup'].includes(o.status)).length;
      const completedOrders = orders.filter(o => o.status === 'Delivered' || o.status === 'Completed').length;
      const uniqueCustomers = new Set(orders.map(o => o.customerEmail).filter(Boolean)).size;
      const pendingPayments = orders.filter(o => o.payment_status === 'unpaid').length;

      // --- Current week (Monday → today) — resets automatically each Monday ---
      const weekStart = startOfCurrentWeek();
      const weekOrders = orders.filter(o => new Date(o.createdAt) >= weekStart);
      const weekDeliveredOrders = weekOrders.filter(o => o.status === 'Delivered' || o.status === 'Completed');
      const weekSales = weekDeliveredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const weekExpenses = expensesList
        .filter(e => new Date(e.date) >= weekStart)
        .reduce((sum, e) => sum + e.amount, 0);
      const weekProfit = weekSales - weekExpenses;

      setWeekOrderCount(weekOrders.length);

      setStats([
        { label: 'Total Orders', value: totalOrders, icon: <ShoppingBag size={24} />, bg: 'bg-blue-50 text-blue-600' },
        { label: 'Pending Orders', value: pendingOrders, icon: <Clock size={24} />, bg: 'bg-yellow-50 text-yellow-600' },
        { label: 'Completed Orders', value: completedOrders, icon: <CheckCircle size={24} />, bg: 'bg-green-50 text-green-600' },
        { label: 'This Week Sales', value: `₦${weekSales.toLocaleString()}`, icon: <DollarSign size={24} />, bg: 'bg-purple-50 text-purple-600' },
        { label: 'This Week Expenses', value: `₦${weekExpenses.toLocaleString()}`, icon: <Wallet size={24} />, bg: 'bg-red-50 text-red-600' },
        {
          label: 'This Week Net Profit',
          value: `₦${weekProfit.toLocaleString()}`,
          icon: weekProfit >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />,
          bg: weekProfit >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600',
        },
        { label: 'Total Customers', value: uniqueCustomers, icon: <Users size={24} />, bg: 'bg-indigo-50 text-indigo-600' },
        { label: 'Pending Payments', value: pendingPayments, icon: <AlertTriangle size={24} />, bg: 'bg-red-50 text-red-600' },
      ]);

      // --- Daily breakdown WITHIN the current week only (Mon → Sun) ---
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weeklyMap = new Map(days.map(day => [day, 0]));

      weekDeliveredOrders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const dayIndex = (orderDate.getDay() + 6) % 7; // Monday = 0
        const dayName = days[dayIndex];
        weeklyMap.set(dayName, weeklyMap.get(dayName) + (order.totalAmount || 0));
      });

      setWeeklyData(days.map(day => ({ day, amount: weeklyMap.get(day) })));
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-gray-500 text-lg">Loading dashboard…</p>
        <button onClick={fetchDashboardData} className="px-4 py-2 bg-[#C62828] text-white rounded-full text-sm font-semibold hover:bg-[#B71C1C]">Refresh Data</button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-[#C62828] text-white rounded-lg hover:bg-[#B71C1C]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard – Solohans</title>
      </Helmet>
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Dashboard Overview</h1>
        <p className="text-gray-500 text-sm mb-6">Live operational view — "This Week" figures reset automatically every Monday. Nothing is ever deleted, see Reports &amp; Analytics for full yearly history.</p>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                  {stat.icon}
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* ─── Unified Payment + Inventory Summary (Website + Store) ─── */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-gray-800">Payment &amp; Inventory Summary</h2>
          <div className="flex gap-2">
            {['daily', 'weekly', 'monthly'].map((p) => (
              <button
                key={p}
                onClick={() => setSummaryPeriod(p)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${summaryPeriod === p ? 'bg-[#C62828] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {summary && (
          <>
            {(summary.alerts.outOfStock.length > 0 || summary.alerts.lowStock.length > 0) && (
              <div className="mb-6 space-y-2">
                {summary.alerts.outOfStock.map((label) => (
                  <div key={label} className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2 text-sm font-medium">
                    <AlertTriangle size={16} /> Out of stock: {label}
                  </div>
                ))}
                {summary.alerts.lowStock.map((a) => (
                  <div key={a.label} className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-2 text-sm font-medium">
                    <AlertTriangle size={16} /> Low stock: {a.label} ({a.remaining} remaining)
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
                <p className="text-xl font-bold text-gray-800">₦{summary.sales.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">Website ₦{summary.sales.websiteRevenue.toLocaleString()} · Store ₦{summary.sales.storeRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">🟢 Cash Total</p>
                <p className="text-xl font-bold text-gray-800">₦{summary.payments.cashTotal.toLocaleString()}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">🔵 Transfer Total</p>
                <p className="text-xl font-bold text-gray-800">₦{summary.payments.transferTotal.toLocaleString()}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">🟣 POS Total</p>
                <p className="text-xl font-bold text-gray-800">₦{summary.payments.posTotal.toLocaleString()}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">🌐 Website Payment Total</p>
                <p className="text-xl font-bold text-gray-800">₦{summary.payments.websitePaymentTotal.toLocaleString()}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Meals Sold</p>
                <p className="text-xl font-bold text-gray-800">{summary.sales.mealsSold}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Best Selling Meal</p>
                <p className="text-lg font-bold text-gray-800">{summary.analytics.bestSellingMeal || '—'}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Best Selling Protein</p>
                <p className="text-lg font-bold text-gray-800">{summary.analytics.bestSellingProtein || '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Remaining Jollof (scoops)</p>
                <p className="text-xl font-bold text-gray-800">{summary.inventory.jollof.remaining}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Remaining Fried Rice (scoops)</p>
                <p className="text-xl font-bold text-gray-800">{summary.inventory.friedRice.remaining}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Remaining Spaghetti Plastics</p>
                <p className="text-xl font-bold text-gray-800">{summary.inventory.spaghettiPlastics.remaining}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Remaining Lunch Boxes</p>
                <p className="text-xl font-bold text-gray-800">{summary.inventory.lunchBoxes.remaining}</p>
              </div>
              {(summary.ingredients || []).map((ing) => (
                <div key={ing.key} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Remaining {ing.pieceLabel} Pieces</p>
                  <p className={`text-xl font-bold ${ing.outOfStock ? 'text-red-600' : ing.lowStock ? 'text-amber-600' : 'text-gray-800'}`}>{ing.remainingPieces}</p>
                  <p className="text-xs text-gray-400 mt-1">{ing.remainingPacks} packs remaining</p>
                </div>
              ))}
            </div>
          </>
        )}


        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-3xl">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Current Week Sales (Mon–Sun)</h2>
          <p className="text-xs text-gray-500 mb-4">{weekOrderCount} order(s) so far this week</p>
          {weeklyData.every(d => d.amount === 0) ? (
            <p className="text-center text-gray-400 py-16">No sales recorded yet this week.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#666' }} />
                <YAxis tick={{ fontSize: 12, fill: '#666' }} />
                <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
                <Bar dataKey="amount" fill="#C62828" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="text-right mt-4 border-t pt-3">
            <span className="text-sm text-gray-500">Total (this week): </span>
            <span className="font-bold text-gray-800">
              ₦{weeklyData.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
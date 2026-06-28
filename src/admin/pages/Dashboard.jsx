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
import { orders as ordersApi, expenses as expensesApi } from '../../lib/api';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

        {/* Weekly Revenue Chart */}
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
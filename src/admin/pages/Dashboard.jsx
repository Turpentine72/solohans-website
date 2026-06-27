import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  DollarSign,
  Users,
  AlertTriangle,
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
import { orders as ordersApi } from '../../lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState([
    { label: 'Total Orders', value: 0, icon: <ShoppingBag size={24} />, bg: 'bg-blue-50 text-blue-600' },
    { label: 'Pending Orders', value: 0, icon: <Clock size={24} />, bg: 'bg-yellow-50 text-yellow-600' },
    { label: 'Completed Orders', value: 0, icon: <CheckCircle size={24} />, bg: 'bg-green-50 text-green-600' },
    { label: 'Total Revenue', value: '₦0', icon: <DollarSign size={24} />, bg: 'bg-purple-50 text-purple-600' },
    { label: 'Total Customers', value: 0, icon: <Users size={24} />, bg: 'bg-indigo-50 text-indigo-600' },
    { label: 'Pending Payments', value: 0, icon: <AlertTriangle size={24} />, bg: 'bg-red-50 text-red-600' },
  ]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const orders = await ordersApi.getAll();
      
      // --- Stats calculations ---
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Preparing' || o.status === 'Out for Delivery').length;
      const completedOrders = orders.filter(o => o.status === 'Delivered').length;
      const totalRevenue = orders
        .filter(o => o.status === 'Delivered')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const uniqueCustomers = new Set(
        orders.map(o => o.email || o.phone || o.customer_name).filter(Boolean)
      ).size;
      // ✅ payment_status is only ever 'unpaid' or 'paid' — 'Awaiting Verification'
      // was never a real value, so this metric always read 0.
      const pendingPayments = orders.filter(o => o.payment_status === 'unpaid').length;

      setStats([
        { label: 'Total Orders', value: totalOrders, icon: <ShoppingBag size={24} />, bg: 'bg-blue-50 text-blue-600' },
        { label: 'Pending Orders', value: pendingOrders, icon: <Clock size={24} />, bg: 'bg-yellow-50 text-yellow-600' },
        { label: 'Completed Orders', value: completedOrders, icon: <CheckCircle size={24} />, bg: 'bg-green-50 text-green-600' },
        { label: 'Total Revenue', value: `₦${totalRevenue.toLocaleString()}`, icon: <DollarSign size={24} />, bg: 'bg-purple-50 text-purple-600' },
        { label: 'Total Customers', value: uniqueCustomers, icon: <Users size={24} />, bg: 'bg-indigo-50 text-indigo-600' },
        { label: 'Pending Payments', value: pendingPayments, icon: <AlertTriangle size={24} />, bg: 'bg-red-50 text-red-600' },
      ]);

      // --- Weekly revenue (last 7 days, grouped by weekday) ---
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday (0) as start
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyMap = new Map(days.map(day => [day, 0]));

      orders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        if (orderDate >= startOfWeek && order.status === 'Delivered') {
          const dayName = days[orderDate.getDay()];
          weeklyMap.set(dayName, weeklyMap.get(dayName) + (order.totalAmount || 0));
        }
      });

      const chartData = days.map(day => ({
        day,
        amount: weeklyMap.get(day),
      }));

      setWeeklyData(chartData);
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
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>

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
          <h2 className="text-xl font-bold text-gray-800 mb-4">Weekly Revenue (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#666' }} />
              <YAxis tick={{ fontSize: 12, fill: '#666' }} />
              <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
              <Bar dataKey="amount" fill="#C62828" radius={[8, 8, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
          <div className="text-right mt-4 border-t pt-3">
            <span className="text-sm text-gray-500">Total (last 7 days): </span>
            <span className="font-bold text-gray-800">
              ₦{weeklyData.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
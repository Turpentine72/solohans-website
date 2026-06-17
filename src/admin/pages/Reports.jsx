import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Package,
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
import { orders as ordersApi } from '../../lib/api';

const COLORS = ['#C62828', '#B71C1C', '#D32F2F', '#E53935', '#EF5350', '#FF8A80'];

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState([
    { label: 'Total Revenue', value: '₦0', icon: <DollarSign size={24} />, bg: 'bg-purple-50 text-purple-600' },
    { label: 'Total Orders', value: '0', icon: <ShoppingBag size={24} />, bg: 'bg-blue-50 text-blue-600' },
    { label: 'Avg. Order Value', value: '₦0', icon: <TrendingUp size={24} />, bg: 'bg-green-50 text-green-600' },
    { label: 'Avg. Daily Orders', value: '0', icon: <Package size={24} />, bg: 'bg-orange-50 text-orange-600' },
  ]);
  const [dailySales, setDailySales] = useState([]);
  const [weeklySales, setWeeklySales] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [topSellingMeals, setTopSellingMeals] = useState([]);
  const [chartType, setChartType] = useState('daily');

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const orders = await ordersApi.getAll();
      
      // Filter delivered orders for revenue calculations
      const deliveredOrders = orders.filter(o => o.status === 'Delivered');
      const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const totalOrders = orders.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Calculate average daily orders (based on delivered orders? Use all orders for consistency)
      // Get first order date to determine number of days active
      let firstOrderDate = null;
      let lastOrderDate = null;
      orders.forEach(o => {
        const date = new Date(o.createdAt);
        if (!firstOrderDate || date < firstOrderDate) firstOrderDate = date;
        if (!lastOrderDate || date > lastOrderDate) lastOrderDate = date;
      });
      let activeDays = 1;
      if (firstOrderDate && lastOrderDate) {
        activeDays = Math.max(1, Math.ceil((lastOrderDate - firstOrderDate) / (1000 * 60 * 60 * 24)));
      }
      const avgDailyOrders = totalOrders / activeDays;
      
      setMetrics([
        { label: 'Total Revenue', value: `₦${totalRevenue.toLocaleString()}`, icon: <DollarSign size={24} />, bg: 'bg-purple-50 text-purple-600' },
        { label: 'Total Orders', value: totalOrders.toLocaleString(), icon: <ShoppingBag size={24} />, bg: 'bg-blue-50 text-blue-600' },
        { label: 'Avg. Order Value', value: `₦${Math.round(avgOrderValue).toLocaleString()}`, icon: <TrendingUp size={24} />, bg: 'bg-green-50 text-green-600' },
        { label: 'Avg. Daily Orders', value: Math.round(avgDailyOrders).toLocaleString(), icon: <Package size={24} />, bg: 'bg-orange-50 text-orange-600' },
      ]);
      
      // --- Daily sales (last 7 days, delivered orders only) ---
      const now = new Date();
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dailyMap = new Map(days.map(day => [day, 0]));
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      deliveredOrders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        if (orderDate >= sevenDaysAgo) {
          const dayName = days[orderDate.getDay()];
          dailyMap.set(dayName, dailyMap.get(dayName) + (order.total_amount || 0));
        }
      });
      const dailyData = days.map(day => ({ day, sales: dailyMap.get(day) }));
      setDailySales(dailyData);
      
      // --- Weekly sales (last 4 weeks, delivered orders) ---
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      const weeklyMap = new Map(weeks.map(w => [w, 0]));
      const nowWeeks = new Date();
      for (let i = 0; i < 4; i++) {
        const weekStart = new Date(nowWeeks);
        weekStart.setDate(nowWeeks.getDate() - (nowWeeks.getDay() || 7) - 7 * i);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        let weekTotal = 0;
        deliveredOrders.forEach(order => {
          const orderDate = new Date(order.createdAt);
          if (orderDate >= weekStart && orderDate <= weekEnd) {
            weekTotal += order.total_amount || 0;
          }
        });
        weeklyMap.set(`Week ${4 - i}`, weekTotal);
      }
      const weeklyData = weeks.map(week => ({ week, sales: weeklyMap.get(week) }));
      setWeeklySales(weeklyData);
      
      // --- Monthly sales (last 12 months, delivered orders) ---
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyMap = new Map(months.map(m => [m, 0]));
      const currentMonth = new Date().getMonth();
      // Show last 12 months (including current month)
      for (let i = 0; i < 12; i++) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const yearOffset = Math.floor((currentMonth - i) / 12);
        const year = new Date().getFullYear() + yearOffset;
        const monthName = months[monthIndex];
        let monthTotal = 0;
        deliveredOrders.forEach(order => {
          const orderDate = new Date(order.createdAt);
          if (orderDate.getFullYear() === year && orderDate.getMonth() === monthIndex) {
            monthTotal += order.total_amount || 0;
          }
        });
        monthlyMap.set(monthName, monthTotal);
      }
      // Order months from oldest to newest (last 12 months)
      const monthlyData = [];
      for (let i = 11; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        monthlyData.push({ month: months[monthIndex], sales: monthlyMap.get(months[monthIndex]) });
      }
      setMonthlySales(monthlyData);
      
      // --- Top selling meals (sum quantities across all orders) ---
      const itemMap = new Map();
      orders.forEach(order => {
        (order.items || []).forEach(item => {
          const name = item.name;
          const qty = item.quantity || 1;
          itemMap.set(name, (itemMap.get(name) || 0) + qty);
        });
      });
      const topItems = Array.from(itemMap.entries())
        .map(([name, orders]) => ({ name, orders }))
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 6);
      setTopSellingMeals(topItems);
      
    } catch (err) {
      console.error('Reports fetch error:', err);
      setError('Failed to load report data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-gray-500 text-lg">Loading reports…</p>
        <button onClick={fetchReportData} className="px-4 py-2 bg-[#C62828] text-white rounded-full text-sm font-semibold hover:bg-[#B71C1C]">Refresh Data</button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button onClick={fetchReportData} className="mt-4 px-4 py-2 bg-[#C62828] text-white rounded-lg">Retry</button>
      </div>
    );
  }

  const chartData = chartType === 'daily' ? dailySales : chartType === 'weekly' ? weeklySales : monthlySales;
  const xKey = chartType === 'daily' ? 'day' : chartType === 'weekly' ? 'week' : 'month';

  return (
    <>
      <Helmet><title>Reports & Analytics – Solohans Admin</title></Helmet>
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Reports & Analytics</h1>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${metric.bg}`}>
                  {metric.icon}
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{metric.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{metric.value}</p>
            </div>
          ))}
        </div>

        {/* Sales Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bar Chart – Daily/Weekly/Monthly Sales */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Sales Overview</h2>
              <div className="flex gap-2">
                {['daily', 'weekly', 'monthly'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase transition-colors ${
                      chartType === type ? 'bg-[#C62828] text-white' : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#666' }} />
                <YAxis tick={{ fontSize: 12, fill: '#666' }} />
                <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
                <Bar dataKey="sales" fill="#C62828" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Trend – Line Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Revenue Trend (Monthly)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#666' }} />
                <YAxis tick={{ fontSize: 12, fill: '#666' }} />
                <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="sales" stroke="#C62828" strokeWidth={3} dot={{ fill: '#C62828', r: 5 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Meals – Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Top Selling Meals</h2>
          {topSellingMeals.length === 0 ? (
            <p className="text-center text-gray-500">No items data available.</p>
          ) : (
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={350} className="max-w-lg">
                <PieChart>
                  <Pie
                    data={topSellingMeals}
                    dataKey="orders"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={({ name, orders }) => `${name} (${orders})`}
                  >
                    {topSellingMeals.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} orders`} />
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
      </div>
    </>
  );
}
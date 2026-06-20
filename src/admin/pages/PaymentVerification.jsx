import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, RefreshCw, Calendar, ArrowLeft, CreditCard } from 'lucide-react';
import { orders as ordersApi } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function PaymentVerification() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  // Month / year filter
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const allOrders = await ordersApi.getAll({ deleted: 'true' });
      // ✅ Use payment_status (whether money was received) rather than the
      // fulfillment "status" field — a paid order must stay listed here
      // permanently even after it moves to Processing/Out for Delivery/Delivered.
      const verified = allOrders.filter(order => order.payment_status === 'paid');
      setPayments(verified);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payment records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Refetch when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchPayments();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Filter payments by search + month/year
  const filteredPayments = payments.filter(p => {
    const matchesSearch =
      p.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      p.order_id?.toLowerCase().includes(search.toLowerCase());

    let matchesMonth = true;
    if (selectedMonth !== null && selectedYear !== null) {
      const orderDate = new Date(p.createdAt);
      matchesMonth =
        orderDate.getMonth() === selectedMonth &&
        orderDate.getFullYear() === selectedYear;
    }
    return matchesSearch && matchesMonth;
  });

  const setCurrentMonth = () => {
    const now = new Date();
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
  };

  const resetMonthFilter = () => {
    setSelectedMonth(null);
    setSelectedYear(null);
  };

  return (
    <>
      <Helmet><title>Payment Verification – Solohans Admin</title></Helmet>
      <div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-2">
          <h1 className="text-3xl font-bold text-gray-800">Verified Payments</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/admin/orders')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-full text-sm font-semibold hover:bg-gray-300 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Orders
            </button>
            <button
              onClick={fetchPayments}
              className="flex items-center gap-2 px-4 py-2 bg-[#C62828] text-white rounded-full text-sm font-semibold hover:bg-[#B71C1C] transition-colors"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-xl text-sm mb-6">
          ⚠️ This is a permanent record of every verified payment. Orders here cannot be removed, even if archived from the main Orders page.
        </div>

        {/* Search + Month filter bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by customer or order ID..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828] bg-white"
            />
          </div>
        </div>

        {/* Month filter */}
        <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-white rounded-xl border">
          <Calendar size={18} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by month:</span>

          <select
            value={selectedMonth !== null ? selectedMonth : ''}
            onChange={e => {
              const val = e.target.value;
              if (val === '') {
                setSelectedMonth(null);
                setSelectedYear(null);
              } else {
                setSelectedMonth(parseInt(val));
                if (selectedYear === null) setSelectedYear(new Date().getFullYear());
              }
            }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm"
          >
            <option value="">Any month</option>
            {MONTHS.map((month, idx) => (
              <option key={idx} value={idx}>{month}</option>
            ))}
          </select>

          <select
            value={selectedYear !== null ? selectedYear : ''}
            onChange={e => {
              const val = e.target.value;
              if (val === '') {
                setSelectedYear(null);
              } else {
                setSelectedYear(parseInt(val));
              }
            }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm"
          >
            <option value="">Any year</option>
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <button
            onClick={setCurrentMonth}
            className="px-4 py-2 bg-[#C62828] text-white rounded-full text-sm font-semibold hover:bg-[#B71C1C] transition-colors"
          >
            This Month
          </button>

          {(selectedMonth !== null || selectedYear !== null) && (
            <button
              onClick={resetMonthFilter}
              className="text-sm text-gray-500 hover:text-[#C62828] underline"
            >
              Clear
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl border">
            <p className="text-gray-500 mb-4">Loading verified payments…</p>
            <button onClick={fetchPayments} className="px-4 py-2 bg-[#C62828] text-white rounded-full text-sm font-semibold hover:bg-[#B71C1C]">Refresh Data</button>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-2xl border text-red-500">
            <p>{error}</p>
            <button onClick={fetchPayments} className="mt-2 text-[#C62828]">Retry</button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 border-b">
                  <th className="py-4 px-4 font-medium">Order ID</th>
                  <th className="py-4 px-4 font-medium">Customer</th>
                  <th className="py-4 px-4 font-medium">Amount</th>
                  <th className="py-4 px-4 font-medium">Status</th>
                  <th className="py-4 px-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500">
                      No verified payments found.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment._id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium text-[#C62828]">{payment.order_id}</td>
                      <td className="py-4 px-4">{payment.customerName}</td>
                      <td className="py-4 px-4 font-medium">₦{payment.totalAmount?.toLocaleString()}</td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          Verified
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-500">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
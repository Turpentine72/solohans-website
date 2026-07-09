import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, RefreshCw, Calendar, ArrowLeft, AlertTriangle, FolderOpen, Lock } from 'lucide-react';
import { orders as ordersApi } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function startOfCurrentWeek() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
  start.setHours(0, 0, 0, 0);
  return start;
}

export default function PaymentVerification() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('current'); // 'current' | 'archive'
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const allOrders = await ordersApi.getAll({ deleted: 'true' });
      const verified = allOrders.filter(order => order.verification_status === 'Verified');
      setPayments(verified);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payment records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchPayments();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Current-week filter + search + month/year filter
  const filteredPayments = useMemo(() => payments.filter(p => {
    const matchesSearch =
      p.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      p.order_id?.toLowerCase().includes(search.toLowerCase());

    let matchesMonth = true;
    if (selectedMonth !== null && selectedYear !== null) {
      const d = new Date(p.createdAt);
      matchesMonth = d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    }

    const matchesWeek = viewMode === 'archive' || new Date(p.createdAt) >= startOfCurrentWeek();

    return matchesSearch && matchesMonth && matchesWeek;
  }), [payments, search, selectedMonth, selectedYear, viewMode]);

  // Archive grouped by Year → Month → Week
  const archiveRows = useMemo(() => {
    if (viewMode !== 'archive') return filteredPayments.map(p => ({ type: 'payment', payment: p }));
    const sorted = [...filteredPayments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const rows = [];
    let lastKey = '';
    sorted.forEach(p => {
      const d = new Date(p.createdAt);
      const year = d.getFullYear();
      const month = MONTHS[d.getMonth()];
      const week = Math.ceil(d.getDate() / 7);
      const key = `${year}-${month}-${week}`;
      if (key !== lastKey) {
        rows.push({ type: 'header', label: `${year} — ${month} — Week ${week}` });
        lastKey = key;
      }
      rows.push({ type: 'payment', payment: p });
    });
    return rows;
  }, [filteredPayments, viewMode]);

  const thisWeekCount = payments.filter(p => new Date(p.createdAt) >= startOfCurrentWeek()).length;

  return (
    <>
      <Helmet><title>Payment Verification – Solohans Admin</title></Helmet>
      <div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-2">
          <h1 className="text-3xl font-bold text-gray-800">Verified Payments</h1>
          <div className="flex gap-2">
            <button onClick={() => navigate('/admin/orders')} className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-full text-sm font-semibold hover:bg-gray-300">
              <ArrowLeft size={16} /> Back to Orders
            </button>
            <button onClick={fetchPayments} className="flex items-center gap-2 px-4 py-2 bg-[#C62828] text-white rounded-full text-sm font-semibold hover:bg-[#B71C1C]">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-xl text-sm mb-6 flex items-start gap-2">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <span>
            Permanent record of every verified payment — these records cannot be removed.
            <strong> This week: {thisWeekCount} payment(s). </strong>
            Switch to Full Archive to see previous weeks organized by Year → Month → Week.
          </span>
        </div>

        {/* Current Week / Full Archive toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setViewMode('current')}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${viewMode === 'current' ? 'bg-[#C62828] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            Current Week
          </button>
          <button
            onClick={() => setViewMode('archive')}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${viewMode === 'archive' ? 'bg-[#C62828] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            Full Archive
          </button>
        </div>

        {/* Search bar */}
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

        {/* Month filter — only in archive mode */}
        {viewMode === 'archive' && (
          <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-white rounded-xl border">
            <Calendar size={18} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by month:</span>
            <select
              value={selectedMonth !== null ? selectedMonth : ''}
              onChange={e => {
                const val = e.target.value;
                if (val === '') { setSelectedMonth(null); setSelectedYear(null); }
                else { setSelectedMonth(parseInt(val)); if (selectedYear === null) setSelectedYear(new Date().getFullYear()); }
              }}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm"
            >
              <option value="">Any month</option>
              {MONTHS.map((month, idx) => <option key={idx} value={idx}>{month}</option>)}
            </select>
            <select
              value={selectedYear !== null ? selectedYear : ''}
              onChange={e => {
                const val = e.target.value;
                if (val === '') setSelectedYear(null);
                else setSelectedYear(parseInt(val));
              }}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm"
            >
              <option value="">Any year</option>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            {(selectedMonth !== null || selectedYear !== null) && (
              <button onClick={() => { setSelectedMonth(null); setSelectedYear(null); }} className="text-sm text-gray-500 hover:text-[#C62828] underline">Clear</button>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl border">
            <p className="text-gray-500 mb-4">Loading verified payments…</p>
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
                {archiveRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500">
                      {viewMode === 'current' ? 'No verified payments this week yet.' : 'No archived payments found.'}
                    </td>
                  </tr>
                ) : (
                  archiveRows.map((row, idx) => {
                    if (row.type === 'header') {
                      return (
                        <tr key={`header-${idx}`}>
                          <td colSpan={5} className="px-4 pt-6 pb-2">
                            <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
                              <FolderOpen size={13} /> {row.label}
                            </span>
                          </td>
                        </tr>
                      );
                    }
                    const payment = row.payment;
                    return (
                      <tr key={payment._id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-4 px-4 font-medium text-[#C62828]">{payment.order_id}</td>
                        <td className="py-4 px-4">{payment.customerName}</td>
                        <td className="py-4 px-4 font-medium">₦{payment.totalAmount?.toLocaleString()}</td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            Verified <Lock size={11} />
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-500">{new Date(payment.createdAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
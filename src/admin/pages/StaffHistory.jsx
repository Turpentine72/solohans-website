import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Banknote, ArrowLeftRight, CreditCard, Tag, Wallet, ShoppingBag } from 'lucide-react';
import { attendance as attendanceApi, staff as staffApi } from '../../lib/api';

const ROLE_LABELS = {
  admin: 'Admin', cashier: 'Cashier', storekeeper: 'Store Keeper',
  closing_staff: 'Closing Staff', chef: 'Chef', delivery_staff: 'Delivery Staff',
};

const PAYMENT_METHOD_OPTIONS = [
  { value: '', label: 'All Payment Methods' },
  { value: 'CASH', label: 'Cash' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'POS', label: 'POS/Card' },
  { value: 'WEBSITE', label: 'Website Orders Tagged' },
];

export default function StaffHistory() {
  const [records, setRecords] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: '', role: '', status: '', staffId: '', paymentMethod: '' });

  useEffect(() => { staffApi.getAll().then(setStaffList).catch(() => setStaffList([])); }, []);
  useEffect(() => { fetchData(); }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.date) params.date = filters.date;
      if (filters.role) params.role = filters.role;
      if (filters.status) params.status = filters.status;
      if (filters.staffId) params.staffId = filters.staffId;
      if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
      setRecords(await attendanceApi.getHistory(params));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // ─── Totals across the currently filtered set — "sales by staff / by
  // payment method" summed up for a quick at-a-glance report. ────────────
  const totals = records.reduce((acc, r) => {
    const s = r.summary || {};
    acc.cash += s.cashSales || 0;
    acc.transfer += s.transferSales || 0;
    acc.posCard += s.posCardSales || 0;
    acc.website += s.websiteOrdersTaggedTotal || 0;
    acc.orders += s.ordersHandled || 0;
    return acc;
  }, { cash: 0, transfer: 0, posCard: 0, website: 0, orders: 0 });
  const grandTotal = totals.cash + totals.transfer + totals.posCard + totals.website;

  return (
    <>
      <Helmet><title>Staff History & Sales Reports – Solohans Admin</title></Helmet>
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Staff History & Sales Reports</h1>
        <p className="text-gray-500 text-sm mb-6">Shifts, sales by staff, and website orders tagged — filterable by date, staff, role, payment method, or shift status.</p>

        <div className="flex flex-wrap gap-3 mb-6">
          <input type="date" value={filters.date} onChange={e => setFilters({ ...filters, date: e.target.value })} className="px-4 py-2 border rounded-xl" />
          <select value={filters.staffId} onChange={e => setFilters({ ...filters, staffId: e.target.value })} className="px-4 py-2 border rounded-xl">
            <option value="">All Staff</option>
            {staffList.map(s => <option key={s._id} value={s._id}>{s.name || s.email}</option>)}
          </select>
          <select value={filters.role} onChange={e => setFilters({ ...filters, role: e.target.value })} className="px-4 py-2 border rounded-xl">
            <option value="">All Roles</option>
            {Object.entries(ROLE_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
          </select>
          <select value={filters.paymentMethod} onChange={e => setFilters({ ...filters, paymentMethod: e.target.value })} className="px-4 py-2 border rounded-xl">
            {PAYMENT_METHOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="px-4 py-2 border rounded-xl">
            <option value="">All Shift Statuses</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {!loading && records.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><ShoppingBag size={12} /> Orders</p>
              <p className="font-bold text-gray-800">{totals.orders}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><Banknote size={12} /> Cash</p>
              <p className="font-bold text-gray-800">₦{totals.cash.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><ArrowLeftRight size={12} /> Transfer</p>
              <p className="font-bold text-gray-800">₦{totals.transfer.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><CreditCard size={12} /> POS/Card</p>
              <p className="font-bold text-gray-800">₦{totals.posCard.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><Tag size={12} /> Website Tagged</p>
              <p className="font-bold text-gray-800">₦{totals.website.toLocaleString()}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading…</div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No records match these filters.</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  <th className="py-3 px-4">Staff</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Check-In</th>
                  <th className="py-3 px-4">Check-Out</th>
                  <th className="py-3 px-4">Orders</th>
                  <th className="py-3 px-4">Cash</th>
                  <th className="py-3 px-4">Transfer</th>
                  <th className="py-3 px-4">POS/Card</th>
                  <th className="py-3 px-4">Website</th>
                  <th className="py-3 px-4">Shift Total</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r._id} className="border-t border-gray-100">
                    <td className="py-3 px-4 font-medium">{r.name}</td>
                    <td className="py-3 px-4">{ROLE_LABELS[r.role] || r.role}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '—'}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '—'}</td>
                    <td className="py-3 px-4">{r.summary?.ordersHandled ?? 0}</td>
                    <td className="py-3 px-4">₦{(r.summary?.cashSales ?? 0).toLocaleString()}</td>
                    <td className="py-3 px-4">₦{(r.summary?.transferSales ?? 0).toLocaleString()}</td>
                    <td className="py-3 px-4">₦{(r.summary?.posCardSales ?? 0).toLocaleString()}</td>
                    <td className="py-3 px-4">₦{(r.summary?.websiteOrdersTaggedTotal ?? 0).toLocaleString()}</td>
                    <td className="py-3 px-4 font-semibold">₦{(r.summary?.grandTotal ?? 0).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${r.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-50 font-bold">
                  <td className="py-3 px-4" colSpan={5}>Grand Total</td>
                  <td className="py-3 px-4">{totals.orders}</td>
                  <td className="py-3 px-4">₦{totals.cash.toLocaleString()}</td>
                  <td className="py-3 px-4">₦{totals.transfer.toLocaleString()}</td>
                  <td className="py-3 px-4">₦{totals.posCard.toLocaleString()}</td>
                  <td className="py-3 px-4">₦{totals.website.toLocaleString()}</td>
                  <td className="py-3 px-4 flex items-center gap-1"><Wallet size={14} /> ₦{grandTotal.toLocaleString()}</td>
                  <td className="py-3 px-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
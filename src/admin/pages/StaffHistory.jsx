import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { attendance as attendanceApi, staff as staffApi } from '../../lib/api';

const ROLE_LABELS = {
  admin: 'Admin', cashier: 'Cashier', storekeeper: 'Store Keeper',
  closing_staff: 'Closing Staff', chef: 'Chef', delivery_staff: 'Delivery Staff',
};

export default function StaffHistory() {
  const [records, setRecords] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: '', role: '', status: '', staffId: '' });

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
      setRecords(await attendanceApi.getHistory(params));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <>
      <Helmet><title>Staff History – Solohans Admin</title></Helmet>
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Staff History</h1>
        <p className="text-gray-500 text-sm mb-6">A strict activity log — who worked when, and what they did. Sales and order figures live on Order History and Payment Reconciliation instead.</p>

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
          <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="px-4 py-2 border rounded-xl">
            <option value="">All Shift Statuses</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading…</div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">No records match these filters.</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  <th className="py-3 px-4">Staff Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Login Time</th>
                  <th className="py-3 px-4">Logout Time</th>
                  <th className="py-3 px-4">Shift</th>
                  <th className="py-3 px-4">Actions Performed</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const actions = [];
                  if (r.activity?.ordersProcessed) actions.push(`${r.activity.ordersProcessed} order(s) processed`);
                  if (r.activity?.inventoryUpdates) actions.push(`${r.activity.inventoryUpdates} inventory update(s)`);
                  if (r.activity?.expensesAdded) actions.push(`${r.activity.expensesAdded} expense(s) added`);
                  return (
                    <tr key={r._id} className="border-t border-gray-100">
                      <td className="py-3 px-4 font-medium">{r.name}</td>
                      <td className="py-3 px-4">{ROLE_LABELS[r.role] || r.role}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${r.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {actions.length > 0 ? actions.join(' · ') : '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">{new Date(r.date).toLocaleDateString('en-NG')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
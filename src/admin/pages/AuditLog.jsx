import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Trash2, RefreshCw } from 'lucide-react';
import { auditLogs as auditLogsApi } from '../../lib/api';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const load = () => {
    setLoading(true);
    auditLogsApi.getAll().then(setLogs).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleClear = async () => {
    // NOTE: this endpoint is currently gated to role 'admin' (the top tier
    // that exists today). Once a distinct Super Admin role is built, this
    // should be restricted to that role only, per spec.
    if (!window.confirm('Clear the entire Audit Log? This permanently deletes every record and cannot be undone. Staff accounts and business data are not affected.')) {
      return;
    }
    setClearing(true);
    try {
      await auditLogsApi.clear();
      load(); // the clear action itself becomes the first fresh entry
    } catch (err) {
      alert(`Failed: ${err.message}`);
    } finally {
      setClearing(false);
    }
  };

  return (
    <>
      <Helmet><title>Audit Log – Solohans Admin</title></Helmet>
      <div>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-3xl font-bold text-gray-800">Audit Log</h1>
          <div className="flex gap-2">
            <button onClick={load} className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-50">
              <RefreshCw size={16} /> Refresh
            </button>
            <button
              onClick={handleClear}
              disabled={clearing || logs.length === 0}
              className="flex items-center gap-2 border border-red-200 text-red-600 px-4 py-2 rounded-full text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={16} /> {clearing ? 'Clearing…' : 'Clear Audit Log'}
            </button>
          </div>
        </div>
        <p className="text-gray-500 text-sm mb-6">A record of every sensitive action taken across the system.</p>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No actions logged yet.</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  <th className="py-3 px-4">When</th>
                  <th className="py-3 px-4">Staff</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log._id} className="border-t border-gray-100">
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-3 px-4">{log.userEmail || '—'}</td>
                    <td className="py-3 px-4 font-medium">{log.action}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
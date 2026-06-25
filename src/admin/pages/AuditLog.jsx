import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { auditLogs as auditLogsApi } from '../../lib/api';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auditLogsApi.getAll().then(setLogs).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Helmet><title>Audit Log – Solohans Admin</title></Helmet>
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Audit Log</h1>
        <p className="text-gray-500 text-sm mb-6">A record of every sensitive action taken across the system.</p>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No actions logged yet.</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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

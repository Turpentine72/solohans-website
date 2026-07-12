import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { DatabaseBackup, Download, RotateCcw, ShieldAlert, Clock, HardDriveDownload, Eraser } from 'lucide-react';
import { backup as backupApi } from '../../lib/api';
import { useAuth } from '../context/AuthContext';

function formatSize(bytes) {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const TYPE_LABEL = { manual: 'Manual', scheduled: 'Scheduled', 'pre-restore-safety': 'Pre-Restore Safety Snapshot', 'pre-reset-safety': 'Pre-Reset Safety Snapshot' };

export default function Backups() {
  const { isSuperAdmin } = useAuth();
  const [backups, setBackups] = useState([]);
  const [schedule, setSchedule] = useState({ enabled: false, frequency: 'daily' });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  // Restore confirmation flow
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [list, sched] = await Promise.all([backupApi.getAll(), backupApi.getSchedule()]);
      setBackups(list);
      setSchedule(sched);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <ShieldAlert size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Super Admin Only</h2>
        <p className="text-gray-500 max-w-sm">Backup and restore touches every record in the system, so only a Super Admin can access this page.</p>
      </div>
    );
  }

  // ✅ Reset View — clears whatever's currently displayed on screen
  // (the "restore complete" banner, any open restore-confirmation modal,
  // the download-in-progress indicator) and reloads the canonical backup
  // list + schedule fresh from the server. This is purely a UI reset — it
  // never deletes, modifies, or touches any actual backup file or
  // database record. Distinct from Audit Log's "Clear" button, which
  // really does delete data; this one deliberately does not.
  const handleResetView = () => {
    setRestoreResult(null);
    setRestoreTarget(null);
    setConfirmText('');
    setDownloadingId(null);
    load();
  };

  const handleCreateManual = async () => {
    setCreating(true);
    try {
      await backupApi.createManual();
      await load();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleScheduleChange = async (updates) => {
    const next = { ...schedule, ...updates };
    setSchedule(next);
    try {
      await backupApi.updateSchedule(next);
    } catch (err) {
      alert(`Failed to update schedule: ${err.message}`);
      load();
    }
  };

  const handleDownload = async (b) => {
    setDownloadingId(b._id);
    try {
      await backupApi.download(b._id, b.filename);
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRestore = async () => {
    if (confirmText !== 'RESTORE') return;
    setRestoring(true);
    try {
      const res = await backupApi.restore(restoreTarget._id);
      setRestoreResult(res);
      setRestoreTarget(null);
      setConfirmText('');
      await load();
    } catch (err) {
      alert(`Restore failed: ${err.message}`);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <>
      <Helmet><title>Backup &amp; Restore – Solohans Admin</title></Helmet>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Backup & Restore</h1>
            <p className="text-gray-500 text-sm mt-1">Covers Orders, Users/Staff, Roles &amp; Permissions, Menu Items, Ingredients, Inventory, Expenses, Settings, and more.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleResetView} className="flex items-center gap-2 border border-gray-200 text-gray-600 px-5 py-2.5 rounded-full font-semibold hover:bg-gray-50" title="Clear the page back to its default view — does not delete any backups">
              <Eraser size={18} /> Reset
            </button>
            <button onClick={handleCreateManual} disabled={creating} className="flex items-center gap-2 bg-[#C62828] text-white px-5 py-2.5 rounded-full font-semibold hover:bg-[#B71C1C] disabled:opacity-50">
              <DatabaseBackup size={18} /> {creating ? 'Backing up…' : 'Create Manual Backup'}
            </button>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Clock size={18} /> Automatic Backup Schedule</h3>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={schedule.enabled} onChange={(e) => handleScheduleChange({ enabled: e.target.checked })} className="w-4 h-4 accent-[#C62828]" />
              <span className="text-sm font-medium">Enabled</span>
            </label>
            <select
              value={schedule.frequency}
              onChange={(e) => handleScheduleChange({ frequency: e.target.value })}
              disabled={!schedule.enabled}
              className="border rounded-lg px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            {schedule.lastRunAt && (
              <span className="text-xs text-gray-400">Last automatic backup: {new Date(schedule.lastRunAt).toLocaleString()}</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Checked hourly on the server. If the backend host spins down when idle (common on free-tier hosting), a scheduled backup can only run while the server is awake — a request to the site wakes it back up.
          </p>
        </div>

        {restoreResult && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-sm text-green-800">
            <p className="font-semibold mb-1">Restore complete.</p>
            <p>A safety snapshot of the previous state was taken automatically before restoring, in case you need to undo this.</p>
          </div>
        )}

        {/* Backup history */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading…</div>
        ) : backups.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">No backups yet — create one above.</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Created By</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Orders</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b) => (
                  <tr key={b._id} className="border-t border-gray-100">
                    <td className="py-3 px-4">{new Date(b.createdAt).toLocaleString()}</td>
                    <td className="py-3 px-4">{TYPE_LABEL[b.type] || b.type}{b.frequency ? ` (${b.frequency})` : ''}</td>
                    <td className="py-3 px-4">{b.createdBy}</td>
                    <td className="py-3 px-4">{formatSize(b.sizeBytes)}</td>
                    <td className="py-3 px-4">{b.counts?.orders ?? '—'}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button onClick={() => handleDownload(b)} disabled={downloadingId === b._id} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg inline-block" title="Download">
                        <Download size={16} />
                      </button>
                      <button onClick={() => { setRestoreTarget(b); setConfirmText(''); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg inline-block" title="Restore">
                        <RotateCcw size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Restore confirmation modal */}
        {restoreTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center gap-2 text-red-600 mb-3">
                <HardDriveDownload size={22} />
                <h3 className="text-lg font-bold">Restore this backup?</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                This <strong>replaces every record</strong> in Orders, Users, Roles, Menu Items, Ingredients, Inventory, Expenses, Settings, and more with the state from <strong>{new Date(restoreTarget.createdAt).toLocaleString()}</strong>.
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Anything created or changed after that point will be lost. A safety snapshot of the current state will be taken automatically first, so this can be undone if needed.
              </p>
              <p className="text-sm font-medium mb-2">Type <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">RESTORE</span> to confirm:</p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 mb-4"
                placeholder="RESTORE"
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setRestoreTarget(null)} className="px-4 py-2.5 border rounded-full font-medium hover:bg-gray-50">Cancel</button>
                <button
                  onClick={handleRestore}
                  disabled={confirmText !== 'RESTORE' || restoring}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 disabled:opacity-50"
                >
                  {restoring ? 'Restoring…' : 'Restore Now'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
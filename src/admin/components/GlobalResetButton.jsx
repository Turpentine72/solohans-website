import { useState } from 'react';
import { Eraser, ShieldAlert, X } from 'lucide-react';
import { globalReset as globalResetApi } from '../../lib/api';
import { useAuth } from '../context/AuthContext';

export default function GlobalResetButton() {
  const { isSuperAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  if (!isSuperAdmin) return null; // Super Admin only — not visible to anyone else, per spec

  const handleRun = async () => {
    if (confirmText !== 'RESET') return;
    setRunning(true);
    try {
      await globalResetApi.run();
      setDone(true);
      // "Automatically refresh the application" per spec — a full reload
      // guarantees every page (dashboard cards, charts, lists) reflects
      // the now-empty transactional data, not just whatever's mounted now.
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      alert(`Reset failed: ${err.message}`);
      setRunning(false);
    }
  };

  return (
    <>
      <button
        onClick={() => { setOpen(true); setConfirmText(''); setDone(false); }}
        className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 px-3 py-2 rounded-full transition-colors"
        title="Global Reset — clears transactional data only (Super Admin only)"
      >
        <Eraser size={15} /> <span className="hidden sm:inline">Reset System</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            {done ? (
              <div className="p-8 text-center">
                <p className="text-lg font-bold text-green-700 mb-2">Reset complete</p>
                <p className="text-sm text-gray-500">Reloading the app…</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-5 border-b">
                  <h3 className="text-lg font-bold text-red-600 flex items-center gap-2"><ShieldAlert size={20} /> Global Reset</h3>
                  <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
                </div>
                <div className="p-5 space-y-3 text-sm">
                  <p className="text-gray-700">This permanently clears every transaction the business has ever recorded:</p>
                  <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                    <li>All orders (POS, Website, WhatsApp, Glovo, Chowdeck)</li>
                    <li>Sales, payment records, and reconciliation history</li>
                    <li>Notifications and the Audit Log</li>
                    <li>Old backup history (a fresh safety snapshot is taken first)</li>
                  </ul>
                  <p className="text-gray-700 font-medium">Never touched: Settings, Users, Roles &amp; Permissions, Menu Items, Ingredients, Inventory, Categories, Prices, Stock, and Images.</p>
                  <p className="text-gray-500 text-xs">A safety backup is taken automatically right before this runs, so it can be undone via Backup &amp; Restore if needed.</p>
                  <p className="text-sm font-medium pt-2">Type <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">RESET</span> to confirm:</p>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="RESET"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-3 p-5 border-t">
                  <button onClick={() => setOpen(false)} className="px-4 py-2.5 border rounded-full font-medium hover:bg-gray-50">Cancel</button>
                  <button
                    onClick={handleRun}
                    disabled={confirmText !== 'RESET' || running}
                    className="px-4 py-2.5 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 disabled:opacity-50"
                  >
                    {running ? 'Resetting…' : 'Run Global Reset'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

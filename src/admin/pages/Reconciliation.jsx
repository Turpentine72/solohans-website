import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, AlertTriangle, Lock } from 'lucide-react';
import { reconciliation as reconciliationApi } from '../../lib/api';

export default function Reconciliation() {
  const [expected, setExpected] = useState(null);
  const [actualValues, setActualValues] = useState({});
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [exp, hist] = await Promise.all([
        reconciliationApi.getExpected(),
        reconciliationApi.getHistory(),
      ]);
      setExpected(exp);
      setHistory(hist);
      const initial = {};
      exp.items?.forEach(i => { initial[i.menuItem] = i.remaining; });
      setActualValues(initial);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCloseDay = async () => {
    if (!window.confirm('Close today and lock stock? This resets all stock counters for tomorrow and cannot be undone.')) return;
    setClosing(true);
    try {
      const actualCounts = expected.items.map(i => ({
        menuItemId: i.menuItem,
        actual: Number(actualValues[i.menuItem]) || 0,
      }));
      const res = await reconciliationApi.closeDay(actualCounts);
      setResult(res);
      fetchData();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    } finally {
      setClosing(false);
    }
  };

  return (
    <>
      <Helmet><title>Day Reconciliation – Solohans Admin</title></Helmet>
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Day Reconciliation</h1>
        <p className="text-gray-500 text-sm mb-6">Count physical stock at close of day and compare against what the system expects.</p>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading…</div>
        ) : expected?.isClosed ? (
          <div className="bg-gray-100 rounded-2xl p-8 text-center text-gray-600">
            <Lock size={32} className="mx-auto mb-3" />
            <p className="font-medium">Today has already been closed. A new day will start fresh tomorrow.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto mb-6">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-sm">
                  <tr>
                    <th className="py-3 px-4">Dish</th>
                    <th className="py-3 px-4">Expected (System)</th>
                    <th className="py-3 px-4">Actual (Physical Count)</th>
                  </tr>
                </thead>
                <tbody>
                  {expected?.items?.map(i => (
                    <tr key={i.menuItem} className="border-t border-gray-100">
                      <td className="py-3 px-4 font-medium text-gray-800">{i.name}</td>
                      <td className="py-3 px-4">{i.remaining}</td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min="0"
                          value={actualValues[i.menuItem] ?? 0}
                          onChange={e => setActualValues({ ...actualValues, [i.menuItem]: e.target.value })}
                          className="w-24 px-3 py-1.5 border rounded-lg"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button onClick={handleCloseDay} disabled={closing} className="bg-[#C62828] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#B71C1C] disabled:opacity-50">
              {closing ? 'Closing Day…' : 'Submit & Close Day'}
            </button>
          </>
        )}

        {result && (
          <div className={`mt-6 p-5 rounded-2xl ${result.status === 'Verified' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
            <div className="flex items-center gap-2 font-bold mb-2">
              {result.status === 'Verified' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
              {result.status === 'Verified' ? 'All stock matched — Verified ✔' : 'Differences recorded ❌'}
            </div>
            {result.status === 'Mismatch' && (
              <ul className="text-sm space-y-1">
                {result.items.filter(i => i.difference !== 0).map(i => (
                  <li key={i.menuItem}>{i.name}: expected {i.expectedStock}, actual {i.actualStock} ({i.difference > 0 ? '+' : ''}{i.difference})</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-gray-800 mb-3">Past Reconciliations</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-sm">
                  <tr><th className="py-3 px-4">Date</th><th className="py-3 px-4">Status</th><th className="py-3 px-4">Items</th></tr>
                </thead>
                <tbody>
                  {history.map(r => (
                    <tr key={r._id} className="border-t border-gray-100">
                      <td className="py-3 px-4">{new Date(r.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${r.status === 'Verified' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {r.status === 'Verified' ? 'Verified ✔' : 'Mismatch ❌'}
                        </span>
                      </td>
                      <td className="py-3 px-4">{r.items.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
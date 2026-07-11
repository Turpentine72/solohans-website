import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, AlertTriangle, Lock, Banknote, ArrowLeftRight, CreditCard, Globe, Bike } from 'lucide-react';
import { paymentReconciliation as reconciliationApi } from '../../lib/api';

const FIELDS = [
  { key: 'cashTotal', label: 'Cash', icon: Banknote, iconColor: 'text-green-600', hint: 'Compare with physical cash' },
  { key: 'transferTotal', label: 'Transfer', icon: ArrowLeftRight, iconColor: 'text-blue-600', hint: 'Compare with bank transfers' },
  { key: 'posTotal', label: 'POS', icon: CreditCard, iconColor: 'text-purple-600', hint: 'Compare with POS account' },
  { key: 'websitePaymentTotal', label: 'Website Payment', icon: Globe, iconColor: 'text-teal-600', hint: 'Compare with Paystack dashboard' },
];

export default function PaymentReconciliation() {
  const [expected, setExpected] = useState(null);
  const [actual, setActual] = useState({ cashTotal: '', transferTotal: '', posTotal: '', websitePaymentTotal: '' });
  const [platformActuals, setPlatformActuals] = useState({}); // { Glovo: '5000', Chowdeck: '3200', ... }
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [result, setResult] = useState(null);

  const platformKeys = Object.keys(expected?.platformBreakdown || {});

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
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCloseDay = async () => {
    if (!window.confirm('Close today\'s reconciliation? This cannot be undone.')) return;
    setClosing(true);
    try {
      const actualCounts = {
        cashTotal: Number(actual.cashTotal) || 0,
        transferTotal: Number(actual.transferTotal) || 0,
        posTotal: Number(actual.posTotal) || 0,
        websitePaymentTotal: Number(actual.websitePaymentTotal) || 0,
        platformBreakdown: Object.fromEntries(
          platformKeys.map((p) => [p, Number(platformActuals[p]) || 0])
        ),
      };
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
        <p className="text-gray-500 text-sm mb-6">Compare what the system expects from today's paid orders (Website + Store, by payment method) against physical counts.</p>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading…</div>
        ) : expected?.isClosed ? (
          <div className="bg-gray-100 rounded-2xl p-8 text-center text-gray-600">
            <Lock size={32} className="mx-auto mb-3" />
            <p className="font-medium">Today has already been reconciled and closed.</p>
            {expected.closedRecord && (
              <div className="mt-4 text-sm text-left max-w-md mx-auto space-y-1">
                {FIELDS.map((f) => (
                  <p key={f.key}>{f.label}: expected ₦{expected.closedRecord.expected[f.key].toLocaleString()}, actual ₦{expected.closedRecord.actual[f.key].toLocaleString()} (variance {expected.closedRecord.variance[f.key] >= 0 ? '+' : ''}₦{expected.closedRecord.variance[f.key].toLocaleString()})</p>
                ))}
                {Object.entries(expected.closedRecord.platformBreakdown || {}).map(([platform, v]) => (
                  <p key={platform}>{platform}: expected ₦{v.expected.toLocaleString()}, actual ₦{v.actual.toLocaleString()} (variance {v.variance >= 0 ? '+' : ''}₦{v.variance.toLocaleString()})</p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto mb-6">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-sm">
                  <tr>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Expected (System)</th>
                    <th className="py-3 px-4">Actual (Physical / Account Count)</th>
                    <th className="py-3 px-4">Compare With</th>
                  </tr>
                </thead>
                <tbody>
                  {FIELDS.map((f) => (
                    <tr key={f.key} className="border-t border-gray-100">
                      <td className="py-3 px-4 font-medium text-gray-800 flex items-center gap-2"><f.icon size={16} className={f.iconColor} /> {f.label}</td>
                      <td className="py-3 px-4">₦{(expected?.expected?.[f.key] || 0).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min="0"
                          value={actual[f.key]}
                          onChange={(e) => setActual({ ...actual, [f.key]: e.target.value })}
                          placeholder="0"
                          className="w-32 px-3 py-1.5 border rounded-lg"
                        />
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-400">{f.hint}</td>
                    </tr>
                  ))}
                  {/* ✅ Third-party delivery platforms — one row per platform actually
                      seen today (Glovo, Chowdeck, Uber Eats, Other, or anything added
                      in the future — no code change needed when a new one shows up).
                      "Actual" here is what the platform's own dashboard/settlement
                      statement shows, so this catches a platform under/over-paying
                      versus what was rung up at POS. */}
                  {platformKeys.map((platform) => (
                    <tr key={platform} className="border-t border-gray-100 bg-indigo-50/40">
                      <td className="py-3 px-4 font-medium text-gray-800 flex items-center gap-2"><Bike size={16} className="text-indigo-600" /> {platform}</td>
                      <td className="py-3 px-4">₦{(expected.platformBreakdown[platform] || 0).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min="0"
                          value={platformActuals[platform] || ''}
                          onChange={(e) => setPlatformActuals({ ...platformActuals, [platform]: e.target.value })}
                          placeholder="0"
                          className="w-32 px-3 py-1.5 border rounded-lg"
                        />
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-400">Compare with {platform} statement/dashboard</td>
                    </tr>
                  ))}
                  <tr className="border-t border-gray-200 bg-gray-50 font-semibold">
                    <td className="py-3 px-4">Total Sales</td>
                    <td className="py-3 px-4">₦{(expected?.expected?.totalSales || 0).toLocaleString()}</td>
                    <td colSpan="2"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button onClick={handleCloseDay} disabled={closing} className="bg-[#C62828] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#B71C1C] disabled:opacity-50">
              {closing ? 'Closing Day…' : 'Submit & Close Day'}
            </button>
          </>
        )}

        {result && (
          <div className="mt-6 p-5 rounded-2xl bg-green-50 text-green-700">
            <div className="flex items-center gap-2 font-bold mb-2">
              <CheckCircle2 size={20} /> Day closed
            </div>
            <ul className="text-sm space-y-1">
              {FIELDS.map((f) => (
                <li key={f.key} className={result.variance[f.key] !== 0 ? 'text-amber-700 flex items-center gap-1' : ''}>
                  {result.variance[f.key] !== 0 && <AlertTriangle size={14} />}
                  {f.label}: expected ₦{result.expected[f.key].toLocaleString()}, actual ₦{result.actual[f.key].toLocaleString()} ({result.variance[f.key] >= 0 ? '+' : ''}₦{result.variance[f.key].toLocaleString()})
                </li>
              ))}
              {Object.entries(result.platformBreakdown || {}).map(([platform, v]) => (
                <li key={platform} className={v.variance !== 0 ? 'text-amber-700 flex items-center gap-1' : ''}>
                  {v.variance !== 0 && <AlertTriangle size={14} />}
                  {platform}: expected ₦{v.expected.toLocaleString()}, actual ₦{v.actual.toLocaleString()} ({v.variance >= 0 ? '+' : ''}₦{v.variance.toLocaleString()})
                </li>
              ))}
            </ul>
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-gray-800 mb-3">Past Reconciliations</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-sm">
                  <tr><th className="py-3 px-4">Date</th><th className="py-3 px-4">Expected</th><th className="py-3 px-4">Actual</th><th className="py-3 px-4">Variance</th></tr>
                </thead>
                <tbody>
                  {history.map((r) => {
                    const platformEntries = Object.values(r.platformBreakdown || {});
                    const totalExpected = FIELDS.reduce((s, f) => s + r.expected[f.key], 0) + platformEntries.reduce((s, v) => s + (v.expected || 0), 0);
                    const totalActual = FIELDS.reduce((s, f) => s + r.actual[f.key], 0) + platformEntries.reduce((s, v) => s + (v.actual || 0), 0);
                    const totalVariance = FIELDS.reduce((s, f) => s + (r.variance[f.key] || 0), 0) + platformEntries.reduce((s, v) => s + (v.variance || 0), 0);
                    return (
                      <tr key={r._id} className="border-t border-gray-100">
                        <td className="py-3 px-4">{r.date}</td>
                        <td className="py-3 px-4">₦{totalExpected.toLocaleString()}</td>
                        <td className="py-3 px-4">₦{totalActual.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${totalVariance === 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {totalVariance === 0 ? <><CheckCircle2 size={12} className="inline mr-1" />Matched</> : `${totalVariance >= 0 ? '+' : ''}₦${totalVariance.toLocaleString()}`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
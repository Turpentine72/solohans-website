import { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, ShoppingBag, Tag, Banknote, ArrowLeftRight, CreditCard, Wallet, X } from 'lucide-react';
import { attendance as attendanceApi } from '../../lib/api';

function StatChip({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
      <Icon size={16} className="text-gray-500" />
      <div>
        <p className="text-[10px] text-gray-400 leading-none mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-gray-800 leading-none">{value}</p>
      </div>
    </div>
  );
}

function ShiftSummaryPanel({ summary }) {
  if (!summary) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
      <StatChip icon={ShoppingBag} label="Orders Handled" value={summary.ordersHandled} />
      <StatChip icon={Tag} label="Website Tagged" value={`₦${summary.websiteOrdersTaggedTotal.toLocaleString()}`} />
      <StatChip icon={Banknote} label="Cash Sales" value={`₦${summary.cashSales.toLocaleString()}`} />
      <StatChip icon={ArrowLeftRight} label="Transfer Sales" value={`₦${summary.transferSales.toLocaleString()}`} />
      <StatChip icon={CreditCard} label="POS/Card Sales" value={`₦${summary.posCardSales.toLocaleString()}`} />
      <StatChip icon={Wallet} label="Total Sales" value={`₦${summary.grandTotal.toLocaleString()}`} />
    </div>
  );
}

export default function AttendanceWidget() {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTasksPrompt, setShowTasksPrompt] = useState(false);
  const [tasks, setTasks] = useState('');
  const [endedSummary, setEndedSummary] = useState(null); // shown right after End Work
  const [expanded, setExpanded] = useState(false);

  const load = () => attendanceApi.getToday().then(setRecord).catch(() => {});

  useEffect(() => {
    load();
    // Keep the live shift dashboard fresh as sales happen elsewhere (POS,
    // website tagging) without staff needing to refresh the page.
    const poll = setInterval(load, 10000);
    return () => clearInterval(poll);
  }, []);

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      setRecord(await attendanceApi.checkIn());
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const result = await attendanceApi.checkOut(tasks);
      setEndedSummary(result);
      setRecord(result);
      setShowTasksPrompt(false);
      setTasks('');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── End Work summary screen ──────────────────────────────────────
  if (endedSummary) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Clock size={18} /> Shift Summary</h3>
            <button onClick={() => setEndedSummary(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <p className="text-sm text-gray-500 mb-4">{endedSummary.hoursWorked}h worked today.</p>
          <ShiftSummaryPanel summary={endedSummary.summary} />
          <button onClick={() => setEndedSummary(null)} className="w-full mt-5 py-2.5 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C]">
            Done
          </button>
        </div>
      </div>
    );
  }

  if (record?.status === 'Completed') {
    return (
      <span className="flex items-center gap-2 text-sm text-gray-500">
        <Clock size={16} /> Finished for today ({record.hoursWorked}h)
      </span>
    );
  }

  if (record?.checkIn) {
    return (
      <div className="relative">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100"
          >
            <Clock size={16} /> On Shift
          </button>
          {showTasksPrompt ? (
            <>
              <input
                type="text"
                placeholder="What did you complete today?"
                value={tasks}
                onChange={(e) => setTasks(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm w-56"
              />
              <button onClick={handleCheckOut} disabled={loading} className="px-3 py-1.5 bg-[#C62828] text-white rounded-lg text-sm font-medium hover:bg-[#B71C1C] disabled:opacity-50 whitespace-nowrap">
                Confirm
              </button>
            </>
          ) : (
            <button onClick={() => setShowTasksPrompt(true)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
              <LogOut size={16} /> End Work
            </button>
          )}
        </div>

        {expanded && (
          <div className="absolute right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-lg p-4 w-80 z-40">
            <p className="text-xs font-semibold text-gray-500 mb-2">Your Shift So Far</p>
            <ShiftSummaryPanel summary={record.summary} />
          </div>
        )}
      </div>
    );
  }

  return (
    <button onClick={handleCheckIn} disabled={loading} className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
      <LogIn size={16} /> {loading ? 'Starting…' : 'Start Work'}
    </button>
  );
}
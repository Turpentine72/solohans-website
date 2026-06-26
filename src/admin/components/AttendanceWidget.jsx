import { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut } from 'lucide-react';
import { attendance as attendanceApi } from '../../lib/api';

export default function AttendanceWidget() {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTasksPrompt, setShowTasksPrompt] = useState(false);
  const [tasks, setTasks] = useState('');

  useEffect(() => {
    attendanceApi.getToday().then(setRecord).catch(() => {});
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
      setRecord(await attendanceApi.checkOut(tasks));
      setShowTasksPrompt(false);
      setTasks('');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (record?.status === 'Completed') {
    return (
      <span className="flex items-center gap-2 text-sm text-gray-500">
        <Clock size={16} /> Finished for today ({record.hoursWorked}h)
      </span>
    );
  }

  if (record?.checkIn) {
    return showTasksPrompt ? (
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="What did you complete today?"
          value={tasks}
          onChange={e => setTasks(e.target.value)}
          className="px-3 py-1.5 border rounded-lg text-sm w-56"
        />
        <button onClick={handleCheckOut} disabled={loading} className="px-3 py-1.5 bg-[#C62828] text-white rounded-lg text-sm font-medium hover:bg-[#B71C1C] disabled:opacity-50 whitespace-nowrap">
          Confirm
        </button>
      </div>
    ) : (
      <button onClick={() => setShowTasksPrompt(true)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
        <LogOut size={16} /> Finish For Today
      </button>
    );
  }

  return (
    <button onClick={handleCheckIn} disabled={loading} className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
      <LogIn size={16} /> {loading ? 'Starting…' : 'Start Work'}
    </button>
  );
}

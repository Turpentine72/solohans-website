import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Bell, Check, Trash2, ShoppingBag, CreditCard, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { notifications as notificationsApi } from '../../lib/api';

const typeIcons = {
  new_order: <ShoppingBag size={18} />,
  payment_receipt: <CreditCard size={18} />,
  payment_approved: <CheckCircle size={18} />,
  order_status: <RefreshCw size={18} />,
};

const typeColors = {
  new_order: 'bg-blue-50 text-blue-600',
  payment_receipt: 'bg-yellow-50 text-yellow-600',
  payment_approved: 'bg-green-50 text-green-600',
  order_status: 'bg-purple-50 text-purple-600',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationsApi.getAll();
      const items = Array.isArray(data) ? data : (data.notifications || []);
      setNotifications(items);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter((n) => n.type === filter);

  const markAsRead = async (id) => {
    if (!id) return;
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const deleteNotification = async (id) => {
    if (!id) {
      console.error('Cannot delete: ID is undefined');
      return;
    }
    try {
      await notificationsApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  return (
    <>
      <Helmet>
        <title>Notifications – Solohans Admin</title>
      </Helmet>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-[#C62828] text-white text-xs font-bold px-3 py-1 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            onClick={markAllAsRead}
            className="text-sm text-[#C62828] font-medium hover:underline flex items-center gap-1"
            disabled={loading || unreadCount === 0}
          >
            <Check size={16} />
            Mark all as read
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'new_order', 'payment_receipt', 'payment_approved', 'order_status'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === type
                  ? 'bg-[#C62828] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-[#C62828]'
              }`}
            >
              {type === 'all' ? 'All' : type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Loading / Error / List */}
        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-500 mb-4">Loading notifications…</p>
            <button onClick={fetchNotifications} className="px-4 py-2 bg-[#C62828] text-white rounded-full text-sm font-semibold hover:bg-[#B71C1C]">Refresh Data</button>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <AlertTriangle size={32} className="mx-auto text-yellow-500 mb-2" />
            <p className="text-gray-500">{error}</p>
            <button
              onClick={fetchNotifications}
              className="mt-4 text-[#C62828] font-medium hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 text-gray-500">
            <Bell size={32} className="mx-auto text-gray-300 mb-2" />
            No notifications.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => (
              <div
                key={notif._id}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-colors ${
                  notif.read ? 'bg-white border-gray-100' : 'bg-white border-[#C62828]/20 shadow-sm'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeColors[notif.type]}`}>
                  {typeIcons[notif.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notif.read ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(notif.date).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!notif.read && (
                    <button
                      onClick={() => markAsRead(notif._id)}
                      className="text-xs text-gray-500 hover:text-[#C62828] font-medium"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notif._id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
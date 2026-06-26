import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChefHat, CheckCircle2 } from 'lucide-react';
import { orders as ordersApi } from '../../lib/api';

export default function ChefDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const all = await ordersApi.getAll();
      // Kitchen needs to see anything that's been confirmed/paid and isn't
      // finished prepping yet.
      const queue = all.filter(o => ['Confirmed', 'Processing'].includes(o.status));
      setOrders(queue);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleMarkPrepared = async (order) => {
    const nextStatus = order.delivery_method === 'pickup' ? 'Ready for Pickup' : 'Out for Delivery';
    try {
      await ordersApi.updateStatus(order._id, order.status === 'Confirmed' ? 'Processing' : nextStatus);
      fetchOrders();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    }
  };

  const producedToday = orders.filter(o => o.status === 'Processing').length;

  return (
    <>
      <Helmet><title>Kitchen – Solohans Admin</title></Helmet>
      <div>
        <div className="flex items-center gap-3 mb-1">
          <ChefHat size={28} className="text-[#C62828]" />
          <h1 className="text-3xl font-bold text-gray-800">Kitchen</h1>
        </div>
        <p className="text-gray-500 text-sm mb-6">Incoming orders and prep queue. Mark each one prepared as it's done.</p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 flex gap-8">
          <div><p className="text-xs text-gray-500">In Queue</p><p className="text-2xl font-bold">{orders.length}</p></div>
          <div><p className="text-xs text-gray-500">Currently Prepping</p><p className="text-2xl font-bold">{producedToday}</p></div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No orders in the queue right now.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {orders.map(o => (
              <div key={o._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-[#C62828]">#{o.order_id}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${o.status === 'Processing' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{o.status}</span>
                </div>
                <ul className="text-sm space-y-1 mb-4">
                  {o.items?.map((item, i) => <li key={i}>• {item.name} × {item.quantity}</li>)}
                </ul>
                {o.notes && <p className="text-xs bg-amber-50 text-amber-700 p-2 rounded-lg mb-3">📝 {o.notes}</p>}
                <button onClick={() => handleMarkPrepared(o)} className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C]">
                  <CheckCircle2 size={18} /> {o.status === 'Confirmed' ? 'Start Preparing' : 'Mark Prepared'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

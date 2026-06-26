import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Truck, CheckCircle2, Phone, MapPin } from 'lucide-react';
import { orders as ordersApi } from '../../lib/api';

export default function DeliveryDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const all = await ordersApi.getAll();
      setOrders(all.filter(o => o.status === 'Out for Delivery'));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleMarkDelivered = async (order) => {
    if (!window.confirm(`Mark order #${order.order_id} as delivered?`)) return;
    try {
      await ordersApi.updateStatus(order._id, 'Delivered');
      fetchOrders();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    }
  };

  return (
    <>
      <Helmet><title>Deliveries – Solohans Admin</title></Helmet>
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Truck size={28} className="text-[#C62828]" />
          <h1 className="text-3xl font-bold text-gray-800">My Deliveries</h1>
        </div>
        <p className="text-gray-500 text-sm mb-6">Orders currently out for delivery. Mark each one delivered once it's handed over.</p>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No orders out for delivery right now.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {orders.map(o => (
              <div key={o._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-[#C62828]">#{o.order_id}</span>
                  <span className="font-semibold">₦{Number(o.totalAmount).toLocaleString()}</span>
                </div>
                <p className="font-medium text-gray-800 mb-1">{o.customerName}</p>
                <p className="text-sm text-gray-500 flex items-center gap-2 mb-1"><Phone size={14} /> {o.phone}</p>
                <p className="text-sm text-gray-500 flex items-start gap-2 mb-4"><MapPin size={14} className="mt-0.5 flex-shrink-0" /> {o.address}</p>
                <button onClick={() => handleMarkDelivered(o)} className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C]">
                  <CheckCircle2 size={18} /> Mark Delivered
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

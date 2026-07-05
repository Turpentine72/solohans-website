import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Search, Eye, X, CreditCard, AlertTriangle, History,
  Trash2, RefreshCw, Calendar, ArrowRight,
  Banknote, ArrowLeftRight, Globe, Store, UtensilsCrossed, Truck, Home, Receipt, FileText, SplitSquareHorizontal,
  CheckCircle, Clock, Lock, UserCircle,
} from 'lucide-react';
import { orders as ordersApi, payments as paymentsApi } from '../../lib/api';
import { PAYMENT_TAGS } from '../../lib/pricing';
import { useNavigate } from 'react-router-dom';

const PAYMENT_TAG_ICONS = { Banknote, ArrowLeftRight, CreditCard, Globe, SplitSquareHorizontal };

function PaymentTagBadge({ order }) {
  const tag = PAYMENT_TAGS[order.paymentMethod] || PAYMENT_TAGS['WEBSITE PAYMENT'];
  const Icon = PAYMENT_TAG_ICONS[tag.icon] || CreditCard;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${tag.color}`}>
      <Icon size={12} /> {tag.label}
    </span>
  );
}

// Store sales (POS) show Shop Sale / Restaurant Sale — never Delivery/Pickup.
// Website orders keep showing Delivery / Pickup, as before.
function OrderTypeLabel({ order }) {
  if (order.source === 'store') {
    return order.pos_sale_type === 'restaurant'
      ? <span className="inline-flex items-center gap-1"><UtensilsCrossed size={14} /> Restaurant Sale</span>
      : <span className="inline-flex items-center gap-1"><Store size={14} /> Shop Sale</span>;
  }
  return order.delivery_method === 'pickup'
    ? <span className="inline-flex items-center gap-1"><Home size={14} /> Pickup</span>
    : <span className="inline-flex items-center gap-1"><Truck size={14} /> Delivery</span>;
}

// ✅ Salesperson accountability tag — permanent record of who handled the
// sale. POS orders are auto-tagged with the cashier who rang it up
// (staffNameSnapshot); website orders show whoever clicked "Tag Me"
// (taggedStaffName). Neither is ever cleared once set.
function getSalespersonName(order) {
  return order.staffNameSnapshot || order.taggedStaffName || '';
}

function SalespersonTag({ order }) {
  const name = getSalespersonName(order);
  return name
    ? <span className="inline-flex items-center gap-1 text-gray-700"><UserCircle size={14} className="text-gray-400" /> {name}</span>
    : <span className="inline-flex items-center gap-1 text-gray-400 italic"><UserCircle size={14} /> Unassigned Seller</span>;
}

const statusColor = (status) => {
  switch (status) {
    case 'Delivered': return 'bg-green-50 text-green-700';
    case 'Out for Delivery': return 'bg-indigo-50 text-indigo-700';
    case 'Processing': return 'bg-blue-50 text-blue-700';
    case 'Paid': return 'bg-purple-50 text-purple-700';
    case 'Pending': return 'bg-yellow-50 text-yellow-700';
    default: return 'bg-gray-50 text-gray-700';
  }
};

const deliveryNextStatus = {
  'Pending': ['Confirmed', 'Processing', 'Cancelled'],
  'Confirmed': ['Processing', 'Cancelled'],
  'Processing': ['Out for Delivery', 'Cancelled'],
  'Out for Delivery': ['Delivered'],
  'Delivered': [],
  'Cancelled': [],
  // Legacy bridge for orders created before payment/verification were split
  // out from the fulfillment status field.
  'Paid': ['Confirmed', 'Processing', 'Cancelled'],
};

const pickupNextStatus = {
  'Pending': ['Processing', 'Cancelled'],
  'Processing': ['Ready for Pickup', 'Cancelled'],
  'Ready for Pickup': ['Completed'],
  'Completed': [],
  'Cancelled': [],
  'Paid': ['Processing', 'Cancelled'],
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [recoveryRef, setRecoveryRef] = useState('');
  const [recovering, setRecovering] = useState(false);

  const handleAdminVerify = async (order) => {
    if (!recoveryRef.trim()) {
      alert('Paste the Paystack reference for this payment first.');
      return;
    }
    setRecovering(true);
    try {
      const result = await paymentsApi.adminVerify(recoveryRef.trim(), order._id);
      if (result.success) {
        alert(result.alreadyPaid ? 'This order was already marked paid.' : 'Payment confirmed and order marked paid!');
        setRecoveryRef('');
        setSelectedOrder(null);
        fetchOrders();
      } else {
        alert(result.message || 'Could not verify this reference.');
      }
    } catch (err) {
      alert(err.message || 'Verification failed.');
    } finally {
      setRecovering(false);
    }
  };
  const [updatingFee, setUpdatingFee] = useState(false);

  // Month / year filter
  const [selectedMonth, setSelectedMonth] = useState(null); // 0‑based index or null
  const [selectedYear, setSelectedYear] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = showDeleted ? { deleted: 'true' } : {};
      const data = await ordersApi.getAll(params);
      setOrders(Array.isArray(data) ? data : data.orders || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [showDeleted]);

  const updateStatus = async (orderId, newStatus) => {
    if (!window.confirm(`Change order status to "${newStatus}"?`)) return;
    setUpdating(true);
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      await fetchOrders();
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const updatePaymentStatus = async (orderId, payment_status) => {
    const verb = payment_status === 'paid' ? 'Mark as Paid (this also permanently locks Verification)' : 'Mark as Unpaid';
    if (!window.confirm(`${verb}?`)) return;
    setUpdating(true);
    try {
      await ordersApi.setPaymentStatus(orderId, payment_status);
      await fetchOrders();
    } catch (err) {
      alert(err.message || 'Failed to update payment status');
    } finally {
      setUpdating(false);
    }
  };

  const updateDeliveryFee = async (orderId, newFee) => {
    setUpdatingFee(true);
    try {
      await ordersApi.updateDeliveryFee(orderId, newFee);
      await fetchOrders();
      alert('Delivery fee updated');
    } catch (err) {
      alert('Failed to update delivery fee');
    } finally {
      setUpdatingFee(false);
    }
  };

  const softDelete = async (orderId) => {
    if (!window.confirm('Move this order to trash?')) return;
    try {
      await ordersApi.delete(orderId);
      fetchOrders();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const restoreOrder = async (orderId) => {
    try {
      await ordersApi.restore(orderId);
      fetchOrders();
    } catch (err) {
      alert('Failed to restore');
    }
  };

  const permanentDelete = async (orderId) => {
    if (!window.confirm('Permanently delete this order? This cannot be undone.')) return;
    try {
      await ordersApi.permanentDelete(orderId);
      fetchOrders();
    } catch (err) {
      alert('Failed to delete permanently');
    }
  };

  // Apply all filters: search, status, month/year
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      (order.order_id || order._id).toLowerCase().includes(search.toLowerCase()) ||
      (order.customerName || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;

    let matchesMonth = true;
    if (selectedMonth !== null && selectedYear !== null) {
      const orderDate = new Date(order.createdAt);
      matchesMonth =
        orderDate.getMonth() === selectedMonth &&
        orderDate.getFullYear() === selectedYear;
    }

    return matchesSearch && matchesStatus && matchesMonth;
  });

  const getOrderId = (order) => order.order_id || order._id?.slice(-6).toUpperCase() || 'N/A';

  const setCurrentMonth = () => {
    const now = new Date();
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
  };

  const resetMonthFilter = () => {
    setSelectedMonth(null);
    setSelectedYear(null);
  };

  return (
    <>
      <Helmet><title>Order Management – Solohans Admin</title></Helmet>
      <div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-2">
          <h1 className="text-3xl font-bold text-gray-800">Order Management</h1>
          <button
            onClick={() => navigate('/admin/payments')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-full text-sm font-semibold hover:bg-green-700 transition-colors"
          >
            <CreditCard size={16} />
            Payment Verification
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by Order ID or customer..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl bg-white"
          >
            {['All', 'Pending', 'Paid', 'Processing', 'Out for Delivery', 'Delivered'].map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className={`px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
              showDeleted ? 'bg-[#C62828] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {showDeleted ? 'Showing All (incl. Archived)' : 'Show Archived'}
          </button>
        </div>

        {/* Month / Year filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-white rounded-xl border">
          <Calendar size={18} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by month:</span>

          <select
            value={selectedMonth !== null ? selectedMonth : ''}
            onChange={e => {
              const val = e.target.value;
              if (val === '') {
                setSelectedMonth(null);
                setSelectedYear(null);
              } else {
                setSelectedMonth(parseInt(val));
                if (selectedYear === null) setSelectedYear(new Date().getFullYear());
              }
            }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm"
          >
            <option value="">Any month</option>
            {MONTHS.map((month, idx) => (
              <option key={idx} value={idx}>{month}</option>
            ))}
          </select>

          <select
            value={selectedYear !== null ? selectedYear : ''}
            onChange={e => {
              const val = e.target.value;
              if (val === '') {
                setSelectedYear(null);
              } else {
                setSelectedYear(parseInt(val));
              }
            }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm"
          >
            <option value="">Any year</option>
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <button
            onClick={setCurrentMonth}
            className="px-4 py-2 bg-[#C62828] text-white rounded-full text-sm font-semibold hover:bg-[#B71C1C] transition-colors"
          >
            This Month
          </button>

          {(selectedMonth !== null || selectedYear !== null) && (
            <button
              onClick={resetMonthFilter}
              className="text-sm text-gray-500 hover:text-[#C62828] underline"
            >
              Clear
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl border">
            <p className="text-gray-500 mb-4">Loading orders…</p>
            <button onClick={fetchOrders} className="px-4 py-2 bg-[#C62828] text-white rounded-full text-sm font-semibold hover:bg-[#B71C1C]">Refresh Data</button>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-2xl border">
            <AlertTriangle size={32} className="mx-auto text-yellow-500 mb-2" />
            <p className="text-gray-500">{error}</p>
            <button onClick={fetchOrders} className="mt-4 text-[#C62828] font-medium hover:underline">Try again</button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="py-4 px-4">Order ID</th>
                  <th className="py-4 px-4">Customer</th>
                  <th className="py-4 px-4">Type</th>
                  <th className="py-4 px-4">Salesperson</th>
                  <th className="py-4 px-4">Payment</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-8 text-gray-500">No orders found.</td></tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order._id} className={`border-b hover:bg-gray-50 ${order.isDeleted ? 'bg-gray-50/60' : ''}`}>
                      <td className="py-4 px-4 font-medium text-[#C62828]">
                        {getOrderId(order)}
                        {order.isDeleted && <span className="ml-2 text-xs text-gray-400">(archived)</span>}
                      </td>
                      <td className="py-4 px-4">{order.customerName || 'Guest'}</td>
                      <td className="py-4 px-4"><OrderTypeLabel order={order} /></td>
                      <td className="py-4 px-4"><SalespersonTag order={order} /></td>
                      <td className="py-4 px-4">
                        <PaymentTagBadge order={order} />
                        {order.paymentMethod === 'SPLIT' && order.splitPayments?.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {order.splitPayments.map((sp, i) => (
                              <p key={i} className="text-[11px] text-gray-500 whitespace-nowrap">
                                {PAYMENT_TAGS[sp.method]?.label || sp.method}: ₦{sp.amount.toLocaleString()}
                              </p>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(order.status)}`}>{order.status}</span></td>
                      <td className="py-4 px-4 text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 px-4 flex items-center gap-3 flex-wrap">
                        {!order.isDeleted ? (
                          <>
                            <button onClick={() => { setSelectedOrder(order); setDeliveryFee(order.delivery_fee || 0); }} className="text-[#C62828] hover:underline flex items-center gap-1"><Eye size={16} /> View</button>
                            <button onClick={() => softDelete(order._id)} className="text-red-500 hover:underline flex items-center gap-1"><Trash2 size={16} /> Delete</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => restoreOrder(order._id)} className="text-green-600 hover:underline flex items-center gap-1"><RefreshCw size={16} /> Restore</button>
                            <button onClick={() => permanentDelete(order._id)} className="text-red-500 hover:underline flex items-center gap-1"><Trash2 size={16} /> Delete Forever</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Order detail modal – unchanged */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
                <h3 className="text-xl font-bold">{getOrderId(selectedOrder)}</h3>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                  <div><p className="text-xs text-gray-500">Customer</p><p className="font-medium">{selectedOrder.customerName || 'Guest'}</p></div>
                  <div><p className="text-xs text-gray-500">Phone</p><p className="font-medium">{selectedOrder.phone || 'N/A'}</p></div>
                  <div><p className="text-xs text-gray-500">Email</p><p className="font-medium">{selectedOrder.customerEmail || 'N/A'}</p></div>
                  <div><p className="text-xs text-gray-500">Address</p><p className="font-medium">{selectedOrder.address || 'N/A'}</p></div>
                  <div><p className="text-xs text-gray-500">Order Channel</p><p className="font-medium flex items-center gap-1">{selectedOrder.order_channel === 'whatsapp' ? <><CreditCard size={14} /> WhatsApp</> : <><Globe size={14} /> Online</>}</p></div>
                  <div><p className="text-xs text-gray-500">Order Type</p><p className="font-medium"><OrderTypeLabel order={selectedOrder} /></p></div>
                  <div><p className="text-xs text-gray-500">Salesperson</p><p className="font-medium"><SalespersonTag order={selectedOrder} /></p></div>
                  <div><p className="text-xs text-gray-500">Food Total</p><p className="font-medium">₦{selectedOrder.items_subtotal?.toLocaleString() ?? selectedOrder.totalAmount?.toLocaleString()}</p></div>
                  {selectedOrder.tax_enabled && (
                    <div><p className="text-xs text-gray-500 flex items-center gap-1"><Receipt size={12} /> VAT ({selectedOrder.tax_rate}%)</p><p className="font-medium">₦{selectedOrder.tax_amount?.toLocaleString()}</p></div>
                  )}
                  <div><p className="text-xs text-gray-500">Grand Total</p><p className="font-medium">₦{selectedOrder.totalAmount?.toLocaleString()}</p></div>
                </div>

                {selectedOrder.source === 'store' ? null : selectedOrder.delivery_method === 'pickup' ? (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <p className="text-sm font-medium text-gray-600 flex items-center gap-2"><Home size={16} /> Pickup order – no delivery fee applies.</p>
                  </div>
                ) : selectedOrder.freeDelivery ? (
                  <div className="border rounded-lg p-4 bg-green-50">
                    <p className="text-sm font-medium text-green-700 flex items-center gap-2"><Truck size={16} /> Free delivery was applied – no delivery fee to set.</p>
                  </div>
                ) : (
                  <div className="border rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Fee (₦)</label>
                    <div className="flex gap-2">
                      <input type="number" value={deliveryFee} onChange={e => setDeliveryFee(Number(e.target.value))} className="flex-1 px-4 py-2 border rounded-xl" />
                      <button onClick={() => updateDeliveryFee(selectedOrder._id, deliveryFee)} disabled={updatingFee} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50">Save</button>
                    </div>
                  </div>
                )}

                {selectedOrder.notes && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-sm">
                    <p className="text-xs text-amber-700 font-semibold mb-1 flex items-center gap-1"><FileText size={12} /> Customer Note</p>
                    <p className="text-amber-900">{selectedOrder.notes}</p>
                  </div>
                )}

                <div className="border rounded-xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Payment Tag</p>
                    <PaymentTagBadge order={selectedOrder} />
                    {selectedOrder.paymentMethod === 'SPLIT' && selectedOrder.splitPayments?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {selectedOrder.splitPayments.map((sp, i) => {
                          const spTag = PAYMENT_TAGS[sp.method];
                          const SpIcon = PAYMENT_TAG_ICONS[spTag.icon] || CreditCard;
                          return (
                            <div key={i} className="flex items-center justify-between text-xs text-gray-600 gap-4">
                              <span className="flex items-center gap-1"><SpIcon size={11} /> {spTag.label}</span>
                              <span className="font-medium">₦{sp.amount.toLocaleString()}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">Payment</p>
                    <p className="font-medium flex items-center gap-1">
                      {selectedOrder.payment_status === 'paid' ? <><CheckCircle size={14} className="text-green-600" /> Paid</> : <><Clock size={14} className="text-amber-500" /> Unpaid</>}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Verification</p>
                    <p className={`font-medium flex items-center gap-1 ${selectedOrder.verification_status === 'Verified' ? 'text-green-600' : 'text-gray-500'}`}>
                      {selectedOrder.verification_status === 'Verified' ? <><Lock size={14} /> Verified (locked)</> : 'Not Verified'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {selectedOrder.verification_status !== 'Verified' && (
                      <>
                        <button
                          onClick={() => updatePaymentStatus(selectedOrder._id, 'paid')}
                          disabled={updating}
                          className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
                        >
                          Mark as Paid
                        </button>
                        {selectedOrder.payment_status === 'paid' && (
                          <button
                            onClick={() => updatePaymentStatus(selectedOrder._id, 'unpaid')}
                            disabled={updating}
                            className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
                          >
                            Mark as Unpaid
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {selectedOrder.payment_status !== 'paid' && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-sm space-y-2">
                    <p className="text-xs text-red-700 font-semibold">
                      ⚠️ Not yet marked paid. If the customer says they paid but it's not showing here,
                      check the Paystack dashboard for a matching transaction and paste its reference below.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Paystack reference (e.g. order_...)"
                        value={recoveryRef}
                        onChange={(e) => setRecoveryRef(e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      />
                      <button
                        onClick={() => handleAdminVerify(selectedOrder)}
                        disabled={recovering}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
                      >
                        {recovering ? 'Checking...' : 'Verify & Mark Paid'}
                      </button>
                    </div>
                  </div>
                )}

                <div><p className="text-sm font-medium text-gray-700 mb-1">Items</p><ul className="list-disc list-inside space-y-1">{selectedOrder.items?.map((item, idx) => <li key={idx}>{item.name} × {item.quantity} – ₦{item.price.toLocaleString()}</li>)}</ul></div>
                {selectedOrder.statusHistory?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2"><History size={16} className="text-gray-500" /><p className="text-sm font-medium text-gray-700">Status History</p></div>
                    <div className="space-y-2 text-xs text-gray-600 max-h-48 overflow-y-auto">
                      {selectedOrder.statusHistory.map((entry, idx) => (
                        <div key={idx} className="border-l-2 border-gray-200 pl-3 py-1">
                          <span className="font-medium">{entry.status}</span>{entry.previousStatus && <> (from {entry.previousStatus})</>}<br />
                          <span className="text-gray-400">{new Date(entry.timestamp).toLocaleString()} by {entry.changedBy}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
                  {(() => {
                    const nextStatusMap = selectedOrder.delivery_method === 'pickup' ? pickupNextStatus : deliveryNextStatus;
                    const isTerminal = selectedOrder.status === 'Delivered' || selectedOrder.status === 'Completed' || selectedOrder.status === 'Cancelled';
                    if (isTerminal) {
                      return <div className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-500 text-sm">{selectedOrder.status}</div>;
                    }
                    if (nextStatusMap[selectedOrder.status]?.length === 0) {
                      return <div className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-500 text-sm">No changes available</div>;
                    }
                    return (
                      <select value={selectedOrder.status} onChange={e => updateStatus(selectedOrder._id, e.target.value)} disabled={updating} className="w-full px-4 py-3 border rounded-xl">
                        <option value={selectedOrder.status} disabled>Current: {selectedOrder.status}</option>
                        {nextStatusMap[selectedOrder.status]?.map(nextStatus => <option key={nextStatus} value={nextStatus}>{nextStatus}</option>)}
                      </select>
                    );
                  })()}
                </div>
              </div>
              <div className="flex justify-end p-5 border-t"><button onClick={() => setSelectedOrder(null)} className="px-6 py-3 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C]">Close</button></div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Eye, X, Package, Calendar, Phone, Mail, MapPin, User } from 'lucide-react';
import { orders as ordersApi } from '../../lib/api';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const allOrders = await ordersApi.getAll();
      const validOrders = allOrders.filter(order => order.status !== 'Cancelled');
      
      const customerMap = new Map();
      
      validOrders.forEach(order => {
        const key = order.email || order.phone || order.customer_name || order.customerName;
        if (!customerMap.has(key)) {
          customerMap.set(key, {
            id: key,
            name: order.customer_name || order.customerName || 'Guest',
            email: order.email || 'N/A',
            phone: order.phone || 'N/A',
            address: order.address || 'N/A',
            totalOrders: 0,
            lastOrderDate: null,
            orderHistory: [],
          });
        }
        
        const customer = customerMap.get(key);
        customer.totalOrders += 1;
        
        const orderDate = new Date(order.createdAt);
        if (!customer.lastOrderDate || orderDate > new Date(customer.lastOrderDate)) {
          customer.lastOrderDate = order.createdAt;
        }
        
        // ✅ Check ALL possible field names for the order total
        const totalAmount = order.totalAmount ?? order.total_amount ?? order.total ?? order.amount ?? 0;
        
        customer.orderHistory.push({
          id: order._id,
          order_id: order.order_id || order._id?.slice(-6).toUpperCase() || 'N/A',
          date: order.createdAt,
          total: totalAmount,
          status: order.status || 'Unknown',
          paymentStatus: order.payment_status || 'N/A',
        });
      });
      
      const customersArray = Array.from(customerMap.values())
        .sort((a, b) => b.totalOrders - a.totalOrders);
      
      setCustomers(customersArray);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customer data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer =>
    (customer.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (customer.email?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (customer.phone?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NG');
  };

  return (
    <>
      <Helmet>
        <title>Customer Management – Solohans Admin</title>
      </Helmet>
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Customer Management</h1>

        {/* Search */}
        <div className="relative max-w-md mb-6">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828] bg-white"
          />
        </div>

        {/* Loading / Error / Table */}
        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl border">
            <p className="text-gray-500 mb-4">Loading customers…</p>
            <button onClick={fetchCustomers} className="px-4 py-2 bg-[#C62828] text-white rounded-full text-sm font-semibold hover:bg-[#B71C1C]">Refresh Data</button>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-2xl border">
            <p className="text-red-500">{error}</p>
            <button onClick={fetchCustomers} className="mt-2 text-[#C62828] font-medium hover:underline">
              Retry
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 border-b">
                  <th className="py-4 px-4 font-medium">Name</th>
                  <th className="py-4 px-4 font-medium">Email</th>
                  <th className="py-4 px-4 font-medium">Phone</th>
                  <th className="py-4 px-4 font-medium">Total Orders</th>
                  <th className="py-4 px-4 font-medium">Last Order</th>
                  <th className="py-4 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500">
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium">{customer.name}</td>
                      <td className="py-4 px-4 text-gray-600">{customer.email}</td>
                      <td className="py-4 px-4">{customer.phone}</td>
                      <td className="py-4 px-4">{customer.totalOrders}</td>
                      <td className="py-4 px-4 text-gray-500">{formatDate(customer.lastOrderDate)}</td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="flex items-center gap-1 text-[#C62828] hover:underline"
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Customer Details Modal with Order History */}
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
                <h3 className="text-xl font-bold text-gray-800">Customer Details</h3>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-5 space-y-5">
                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <User size={18} className="text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="font-medium">{selectedCustomer.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={18} className="text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium">{selectedCustomer.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={18} className="text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="font-medium">{selectedCustomer.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="font-medium">{selectedCustomer.address}</p>
                    </div>
                  </div>
                </div>

                {/* Order History */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Package size={18} />
                    Order History ({selectedCustomer.totalOrders} orders)
                  </h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {selectedCustomer.orderHistory
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map(order => (
                        <div key={order.id} className="border rounded-lg p-3 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-mono text-sm font-bold text-[#C62828]">
                                {order.order_id}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(order.date)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">
                                ₦{(order.total ?? 0).toLocaleString()}
                              </p>
                              <p className="text-xs mt-1">
                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                  order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                  order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {order.status}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end p-5 border-t">
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="px-6 py-3 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
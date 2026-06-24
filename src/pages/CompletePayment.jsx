import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, CreditCard, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { orders as ordersApi, payments as paymentsApi } from '../lib/api';
import { initializePaystack } from '../lib/paystack';

export default function CompletePayment() {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('order_id') || '');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const lookupOrder = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const data = await ordersApi.getPaymentInfo({ order_id: orderId, email });
      setOrder(data);
      if (data.payment_status === 'paid') setPaid(true);
    } catch (err) {
      setError(err.message || 'Order not found');
    } finally {
      setLoading(false);
    }
  };

  // Auto-lookup if both came pre-filled from the email link
  useEffect(() => {
    if (searchParams.get('order_id') && searchParams.get('email')) {
      lookupOrder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePay = () => {
    if (!order) return;
    setPaying(true);
    initializePaystack({
      email: order.customerEmail,
      amount: order.totalAmount,
      orderId: `order_${order._id}_${Date.now()}`,
      onSuccess: async (transaction) => {
        try {
          const result = await paymentsApi.verify(transaction.reference, order._id);
          if (result.success) {
            setPaid(true);
          } else {
            setError(result.message || 'Payment verification failed. Please contact support.');
          }
        } catch (err) {
          setError(err.message || 'Could not verify payment. Please contact support.');
        } finally {
          setPaying(false);
        }
      },
      onClose: () => setPaying(false),
    });
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] py-16 px-4">
      <Helmet>
        <title>Complete Payment – Solohans Delicious Meals</title>
        <meta name="description" content="Complete payment for your Solohans Delicious Meals order once your delivery fee has been confirmed." />
      </Helmet>

      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-[#222222] mb-2 text-center">Complete Your Payment</h1>
        <p className="text-gray-500 text-center mb-8">Enter your order ID and email to pay your final amount.</p>

        <form onSubmit={lookupOrder} className="bg-white rounded-2xl shadow-md p-6 space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-[#444] mb-1">Order ID</label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. SLH-0001"
              required
              className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-[#C62828]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#444] mb-1">Email Used at Checkout</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-[#C62828]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C] disabled:opacity-70"
          >
            <Search size={18} /> {loading ? 'Searching...' : 'Find My Order'}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm mb-6">{error}</div>
        )}

        {order && paid && (
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <CheckCircle2 size={48} className="text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#222222] mb-2">Payment Successful!</h2>
            <p className="text-gray-500 mb-4">Order #{order.order_id} is confirmed. We'll start preparing it right away.</p>
            <Link to={`/track/${order.order_id}`} className="text-[#C62828] underline text-sm">Track your order</Link>
          </div>
        )}

        {order && !paid && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="font-bold text-[#222222] mb-4">Order #{order.order_id}</h2>

            <div className="space-y-2 mb-4">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{item.name} × {item.quantity}</span>
                  <span>₦{(Number(item.price) * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Items Total</span>
                <span>₦{Number(order.items_subtotal).toLocaleString()}</span>
              </div>

              {order.delivery_method === 'pickup' ? (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Delivery</span>
                  <span>Pickup at restaurant – no fee</span>
                </div>
              ) : order.delivery_fee_set ? (
                <div className="flex justify-between text-sm">
                  <span>Delivery Fee</span>
                  <span>₦{Number(order.delivery_fee).toLocaleString()}</span>
                </div>
              ) : null}

              {order.delivery_method === 'delivery' && !order.delivery_fee_set ? (
                <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-sm flex items-start gap-2 mt-3">
                  <Clock size={18} className="mt-0.5 flex-shrink-0" />
                  <span>Our team is still reviewing your delivery location and will set your delivery fee shortly. You'll receive an email the moment it's ready, then you can come back here to pay.</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-lg font-bold pt-2">
                    <span>Total Due</span>
                    <span className="text-[#C62828]">₦{Number(order.totalAmount).toLocaleString()}</span>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl mt-4">
                    <p className="text-sm font-medium mb-2 flex items-center gap-2"><CreditCard size={18} /> Pay securely with Paystack</p>
                    <div className="flex items-center gap-2 text-xs text-green-700"><ShieldCheck size={16} className="text-green-600" /> All payments are secured with SSL encryption.</div>
                  </div>

                  <button
                    onClick={handlePay}
                    disabled={paying}
                    className="w-full py-3 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C] disabled:opacity-70 mt-3"
                  >
                    {paying ? 'Processing...' : `Pay ₦${Number(order.totalAmount).toLocaleString()} with Paystack`}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
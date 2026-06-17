import { useState } from 'react';
import {
  X, Minus, Plus, Trash2, ShoppingCart, CreditCard, ShieldCheck,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { usePromos } from '../context/PromoContext';
import { useNavigate, Link } from 'react-router-dom';
import { orders as ordersApi } from '../lib/api';
import { initializePaystack } from '../lib/paystack';
import cardimg from '../assets/images.png';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function CartSidebar() {
  const {
    cartItems, isOpen, closeCart, removeFromCart,
    increaseQuantity, decreaseQuantity, subtotal, itemCount, clearCart,
  } = useCart();

  const { activePromos } = usePromos();
  const navigate = useNavigate();
  const [step, setStep] = useState('cart');

  const loadSavedInfo = () => {
    try {
      const saved = localStorage.getItem('solohans_checkout_info');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { name: '', phone: '', email: '', address: '' };
  };

  const [form, setForm] = useState(() => ({ ...loadSavedInfo(), remember: false }));
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formErrors, setFormErrors] = useState('');
  const [orderResult, setOrderResult] = useState(null);
  const [processing, setProcessing] = useState(false);

  // ─── Promo calculations ─────────────────────────────────────────────────
  let discountAmount = 0;
  let freeDelivery = false;
  const freeItems = [];

  for (const promo of activePromos) {
    const isApplicable =
      promo.scope === 'all' ||
      (promo.scope === 'selected' && promo.applicableItems?.some(promoItem => {
        const promoItemId = typeof promoItem === 'string' ? promoItem : promoItem._id?.toString();
        return cartItems.some(item => item.id === promoItemId);
      }));

    if (!isApplicable) continue;

    if (promo.type === 'percentage' && promo.discountPercentage) {
      discountAmount += subtotal * (promo.discountPercentage / 100);
    }

    if (promo.type === 'freeDelivery') {
      freeDelivery = true;
    }

    if (promo.type === 'freeItem' && promo.triggerItems?.length && promo.freeItem) {
      const hasTrigger = cartItems.some(item =>
        promo.triggerItems.some(t => (typeof t === 'string' ? t : t._id?.toString()) === item.id)
      );
      if (hasTrigger) {
        const freeId = typeof promo.freeItem === 'string' ? promo.freeItem : promo.freeItem._id;
        if (!freeItems.some(f => f.id === freeId)) {
          freeItems.push({
            id: freeId,
            name: promo.freeItem.name || 'Free Item',
            image: promo.freeItem.image || '',
            price: 0,
            quantity: 1,
          });
        }
      }
    }
  }

  const discountedSubtotal = subtotal - discountAmount;
  // ─────────────────────────────────────────────────────────────────────────

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const validateForm = () => {
    const errors = [];
    if (!form.name.trim()) errors.push('Full name');
    if (!form.phone.trim()) errors.push('Phone number');
    if (!form.email.trim()) errors.push('Email');
    if (!form.address.trim()) errors.push('Delivery address');
    if (!agreedToTerms) errors.push('agree to the policies');
    if (errors.length > 0) return `Please fill in: ${errors.join(', ')}.`;
    return null;
  };

  // Helper: create order (with paymentStatus: 'pending')
  const createOrder = async () => {
    const orderItems = cartItems.map(item => ({
      menu_item_id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: parseFloat(typeof item.price === 'string' ? item.price.replace(/[₦,]/g, '') : item.price),
    }));

    freeItems.forEach(free => {
      orderItems.push({
        menu_item_id: free.id,
        name: free.name,
        quantity: 1,
        price: 0,
      });
    });

    const newOrder = await ordersApi.create({
      customerName: form.name,
      customerEmail: form.email,
      phone: form.phone,
      address: form.address,
      order_type: 'online',
      items: orderItems,
      totalAmount: discountedSubtotal,
      paymentStatus: 'pending',
    });

    return newOrder;
  };

  // 🟢 Single payment handler – opens Paystack popup for ALL payment methods
  const handlePaystackPayment = async () => {
    const error = validateForm();
    if (error) { setFormErrors(error); return; }
    setFormErrors('');

    if (form.remember) {
      const { remember, ...info } = form;
      localStorage.setItem('solohans_checkout_info', JSON.stringify(info));
    } else {
      localStorage.removeItem('solohans_checkout_info');
    }

    setProcessing(true);
    try {
      const newOrder = await createOrder();
      const safeRef = `order_${newOrder._id}_${Date.now()}`;

      initializePaystack({
        email: form.email || 'customer@solohans.com',
        amount: discountedSubtotal,
        orderId: safeRef,
        metadata: { orderId: newOrder._id },
        onSuccess: async (transaction) => {
          try {
            // ✅ Absolute URL — hits Express on port 5000, not Vite's dev server
            const res = await fetch(`${API_BASE}/payments/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                reference: transaction.reference,
                orderId: newOrder._id,
              }),
            });

            const data = await res.json();

            if (data.success) {
              // ✅ No markPaid call — backend's verify route handles it atomically
              // ✅ Friendly ID (e.g. SLH-0036) comes from backend response
              setOrderResult({
                orderId: data.order_id ?? newOrder.order_id,
                items: cartItems,
                total: discountedSubtotal,
                freeItems,
              });
              clearCart();
              setStep('receipt');
            } else {
              alert(data.message || 'Payment verification failed. Please contact support.');
            }
          } catch (err) {
            console.error('Verify fetch error:', err);
            alert('Could not verify payment. Please contact support.');
          }
        },
        onClose: () => {},
      });
    } catch (err) {
      console.error('Order creation error:', err);
      alert('Could not create order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePlaceOrder = () => {
    clearCart();
    setStep('cart');
    setOrderResult(null);
    setForm(prev => ({ ...loadSavedInfo(), remember: prev.remember }));
    setAgreedToTerms(false);
    setFormErrors('');
    closeCart();
  };

  const handleExploreMenu = () => { closeCart(); navigate('/menu'); };

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={closeCart} />}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md z-50 bg-white shadow-2xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold uppercase tracking-wide text-[#222222]">
            {step === 'cart' && 'Your Order'}
            {step === 'checkout' && 'Checkout'}
            {step === 'receipt' && 'Order Confirmed'}
          </h2>
          <button onClick={closeCart} className="text-[#222222] hover:text-[#C62828]"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4" style={{ height: 'calc(100% - 140px)' }}>
          {step === 'cart' && (
            cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-24 h-24 rounded-full bg-[#FFF8F0] flex items-center justify-center mb-6"><ShoppingCart size={48} className="text-[#C62828]" /></div>
                <h3 className="text-xl font-bold text-[#222222] mb-2">Your Cart Is Empty</h3>
                <p className="text-gray-500 mb-6">Add delicious meals to your cart and start your order.</p>
                <button onClick={handleExploreMenu} className="px-6 py-3 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C]">Explore Menu</button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex items-center gap-4 bg-[#FFF8F0] p-3 rounded-xl">
                      <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[#222222] truncate">{item.name}</h4>
                        <span className="text-sm font-bold text-[#C62828]">{item.price}</span>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => decreaseQuantity(item.id)} className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-100"><Minus size={14} /></button>
                          <span className="font-medium text-sm">{item.quantity}</span>
                          <button onClick={() => increaseQuantity(item.id)} className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-100"><Plus size={14} /></button>
                          <button onClick={() => removeFromCart(item.id)} className="ml-auto text-gray-400 hover:text-[#C62828]"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {freeItems.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="text-sm font-semibold text-green-700 mb-2">🎁 Free Items</h4>
                    <div className="space-y-2">
                      {freeItems.map(free => (
                        <div key={free.id} className="flex items-center gap-3 bg-green-50 p-2 rounded-lg">
                          <img src={free.image} alt={free.name} className="w-10 h-10 rounded-lg object-cover" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{free.name}</p>
                            <p className="text-xs text-green-700">FREE</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal (food only)</span>
                    <span>₦{subtotal.toLocaleString()}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-700">
                      <span>Promo discount</span>
                      <span>-₦{Math.round(discountAmount).toLocaleString()}</span>
                    </div>
                  )}
                  {freeDelivery && (
                    <div className="bg-green-50 text-green-700 p-2 rounded-lg text-xs font-medium">
                      🚚 Free Delivery Applied!
                    </div>
                  )}
                  <div className="bg-amber-50 p-3 rounded-lg text-xs text-amber-700">
                    💡 Delivery fee is paid separately in cash to the rider{freeDelivery ? ' (FREE)' : ''}.
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total to pay now</span>
                    <span className="text-[#C62828]">₦{discountedSubtotal.toLocaleString()}</span>
                  </div>
                </div>
              </>
            )
          )}

          {step === 'checkout' && (
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-[#444] mb-1">Full Name</label><input type="text" name="name" required value={form.name} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-[#C62828]" /></div>
              <div><label className="block text-sm font-medium text-[#444] mb-1">Phone Number</label><input type="tel" name="phone" required value={form.phone} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-[#C62828]" /></div>
              <div><label className="block text-sm font-medium text-[#444] mb-1">Email</label><input type="email" name="email" required value={form.email} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-[#C62828]" /></div>
              <div><label className="block text-sm font-medium text-[#444] mb-1">Delivery Address</label><textarea name="address" rows="2" required value={form.address} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-[#C62828] resize-none" /></div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-sm font-medium mb-3 flex items-center gap-2"><CreditCard size={18} /> Pay securely with Paystack</p>
                <div className="mb-2"><img src={cardimg} alt="Accepted Cards" className="h-8 object-contain" /></div>
                <p className="text-xs text-gray-600">You can pay with Card, Bank Transfer, or USSD.</p>
                <div className="flex items-center gap-2 text-xs text-green-700 mt-2"><ShieldCheck size={16} className="text-green-600" /> All payments are secured with SSL encryption.</div>
              </div>

              <label className="flex items-start gap-3 text-sm cursor-pointer">
                <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#C62828] focus:ring-[#C62828]" />
                <span className="text-gray-700">I have read and agree to the <Link to="/privacy" className="text-[#C62828] underline">Privacy Policy</Link>, <Link to="/terms" className="text-[#C62828] underline">Terms of Service</Link>, and <Link to="/payment-policy" className="text-[#C62828] underline">Payment Policy</Link>.</span>
              </label>

              <label className="flex items-center gap-3 text-sm cursor-pointer">
                <input type="checkbox" name="remember" checked={form.remember} onChange={handleFormChange} className="w-4 h-4 rounded border-gray-300 text-[#C62828] focus:ring-[#C62828]" />
                Remember my details for future orders
              </label>

              <div className="bg-amber-50 p-3 rounded-lg text-xs text-amber-700">🚚 Delivery fee is paid separately in cash when your order arrives{freeDelivery ? ' (FREE today!)' : ''}.</div>

              {formErrors && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm">{formErrors}</div>}

              <button
                onClick={handlePaystackPayment}
                disabled={processing}
                className="w-full py-3 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C] disabled:opacity-70"
              >
                {processing ? 'Processing...' : `Pay ₦${discountedSubtotal.toLocaleString()} with Paystack`}
              </button>
            </div>
          )}

          {step === 'receipt' && orderResult && (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-[#C62828]/10 rounded-full flex items-center justify-center mx-auto mb-4"><ShoppingCart size={32} className="text-[#C62828]" /></div>
                <h3 className="text-xl font-bold text-[#222222]">Order #{orderResult.orderId}</h3>
                <p className="text-gray-500">Thank you, {form.name}!</p>
                <p className="text-sm mt-2">Payment: Online</p>
                {freeDelivery && <p className="text-green-600 text-sm mt-1">🚚 Free delivery applied</p>}
              </div>

              <div className="bg-[#FFF8F0] rounded-xl p-4 mb-6 text-left space-y-2">
                {orderResult.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name} × {item.quantity}</span>
                    <span>₦{(parseFloat(typeof item.price === 'string' ? item.price.replace(/[₦,]/g, '') : item.price) * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                {orderResult.freeItems?.map(free => (
                  <div key={free.id} className="flex justify-between text-sm text-green-700"><span>🎁 {free.name}</span><span>FREE</span></div>
                ))}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Promo discount</span>
                    <span>-₦{Math.round(discountAmount).toLocaleString()}</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between font-medium"><span>Delivery</span><span className="text-amber-600">{freeDelivery ? 'FREE' : 'Paid on delivery'}</span></div>
                <div className="flex justify-between font-bold"><span>Total</span><span className="text-[#C62828]">₦{orderResult.total.toLocaleString()}</span></div>
              </div>

              <button onClick={handlePlaceOrder} className="w-full py-3 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C]">Close & Continue Shopping</button>
            </div>
          )}
        </div>

        {step === 'cart' && cartItems.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
            <div className="flex items-center justify-between mb-2"><span>{itemCount} items</span><span className="font-bold text-[#C62828]">₦{discountedSubtotal.toLocaleString()}</span></div>
            <button onClick={() => setStep('checkout')} className="w-full py-3 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C]">Checkout</button>
          </div>
        )}
      </div>
    </>
  );
}
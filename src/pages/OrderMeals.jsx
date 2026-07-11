import { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Plus, Trash2, ShoppingBag, CheckCircle2, FileText, Receipt, Home } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import {
  MEAL_TYPES, MEAL_LABELS, PROTEIN_PRICES, PROTEIN_LABELS, CHICKEN_PROTEINS, TURKEY_PROTEINS,
  isComboAllowed, priceCart,
} from '../lib/pricing';
import { websiteCheckout, payments as paymentsApi, deliveryZones as deliveryZonesApi, inventory as inventoryApi } from '../lib/api';
import { initializePaystack } from '../lib/paystack';

function emptyMealPackage() {
  return { meals: [], protein: 'none', extraPortions: [] };
}

export default function OrderMeals() {
  const { settings } = useSettings();
  const taxEnabled = !!settings?.tax?.enabled;
  const taxRate = settings?.tax?.rate || 0;
  const [mealPackages, setMealPackages] = useState([emptyMealPackage()]);
  const [extras, setExtras] = useState({});
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('delivery'); // 'delivery' | 'pickup'
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [deliveryZoneId, setDeliveryZoneId] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);
  const [paid, setPaid] = useState(false);
  const [paying, setPaying] = useState(false);

  const [extrasCatalog, setExtrasCatalog] = useState({});

  useEffect(() => {
    deliveryZonesApi.getActive().then(setDeliveryZones).catch(() => setDeliveryZones([]));
    const loadExtras = () => inventoryApi.getPublicExtras().then(setExtrasCatalog).catch(() => setExtrasCatalog({}));
    loadExtras();
    // Same live source as POS/admin — an extra added, repriced, or restocked
    // in Meal Inventory shows up here automatically within a few seconds.
    const poll = setInterval(loadExtras, 15000);
    return () => clearInterval(poll);
  }, []);

  const selectedZoneFee = deliveryZones.find((z) => z._id === deliveryZoneId)?.fee || 0;
  const deliveryFeeForDisplay = deliveryMethod === 'pickup' ? 0 : selectedZoneFee;

  const priced = useMemo(() => {
    const extrasArr = Object.entries(extras).filter(([, qty]) => qty > 0).map(([item, qty]) => ({ item, qty }));
    return priceCart({ mealPackages, extras: extrasArr, extrasCatalog, deliveryFee: deliveryFeeForDisplay });
  }, [mealPackages, extras, extrasCatalog, deliveryFeeForDisplay]);

  const itemsSubtotal = priced.mealsTotal + priced.extrasTotal;
  const taxAmount = taxEnabled ? Math.round(itemsSubtotal * (taxRate / 100)) : 0;
  const grandTotal = itemsSubtotal + taxAmount + (deliveryMethod === 'pickup' ? 0 : (deliveryZoneId ? selectedZoneFee : 0));

  const toggleMeal = (idx, meal) => {
    setMealPackages((prev) => prev.map((mp, i) => {
      if (i !== idx) return mp;
      let meals = mp.meals.includes(meal) ? mp.meals.filter((m) => m !== meal) : [...mp.meals, meal];
      if (meals.length > 2) return mp;
      return { ...mp, meals, extraPortions: mp.extraPortions.filter((p) => meals.includes(p)) };
    }));
  };

  const setProtein = (idx, protein) => setMealPackages((prev) => prev.map((mp, i) => (i === idx ? { ...mp, protein } : mp)));

  const toggleExtraPortion = (idx, meal) => {
    setMealPackages((prev) => prev.map((mp, i) => {
      if (i !== idx) return mp;
      const extraPortions = mp.extraPortions.includes(meal) ? mp.extraPortions.filter((m) => m !== meal) : [...mp.extraPortions, meal];
      return { ...mp, extraPortions };
    }));
  };

  const addMealPackage = () => setMealPackages((prev) => [...prev, emptyMealPackage()]);
  const removeMealPackage = (idx) => setMealPackages((prev) => prev.filter((_, i) => i !== idx));
  const setExtraQty = (key, qty) => setExtras((prev) => ({ ...prev, [key]: Math.max(0, Number(qty) || 0) }));

  const allValid = mealPackages.length > 0 && mealPackages.every((mp) => isComboAllowed(mp.meals));

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');
    if (!allValid) return setError('Each meal must have 1–2 items from an allowed combo (e.g. Jollof + Spaghetti).');
    if (!customerEmail || !customerEmail.includes('@')) return setError('A valid email is required.');
    if (deliveryMethod === 'delivery' && !address.trim()) return setError('Please enter a delivery address, or switch to Pickup.');

    setPlacing(true);
    try {
      const extrasArr = Object.entries(extras).filter(([, qty]) => qty > 0).map(([item, qty]) => ({ item, qty }));
      const cart = { mealPackages, extras: extrasArr };
      const res = await websiteCheckout.create({
        cart, customerName, customerEmail, phone, address, notes,
        deliveryMethod,
        deliveryZoneId: deliveryMethod === 'delivery' ? (deliveryZoneId || null) : null,
      });
      setPlacedOrder(res.order);
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  const handlePay = () => {
    if (!placedOrder) return;
    setPaying(true);
    initializePaystack({
      email: placedOrder.customerEmail,
      amount: placedOrder.totalAmount,
      orderId: `order_${placedOrder._id}_${Date.now()}`,
      onSuccess: async (transaction) => {
        try {
          const result = await paymentsApi.verify(transaction.reference, placedOrder._id);
          if (result.success) setPaid(true);
          else setError(result.message || 'Payment verification failed. Please contact support.');
        } catch (err) {
          setError(err.message || 'Could not verify payment.');
        } finally {
          setPaying(false);
        }
      },
      onClose: () => setPaying(false),
    });
  };

  if (placedOrder && paid) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] py-16 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-[#222222] mb-2">Payment Successful</h2>
          <p className="text-gray-500 mb-6">
            Order <strong>#{placedOrder.order_id}</strong> is confirmed and being prepared.
            A confirmation has been sent to {placedOrder.customerEmail}.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to={`/track/${placedOrder.order_id}`}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 border-2 border-[#C62828] text-[#C62828] rounded-full font-semibold hover:bg-[#FFF8F0]"
            >
              <Receipt size={18} /> Track Order
            </Link>
            <Link
              to="/order-meal"
              onClick={() => window.location.reload()}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C]"
            >
              <ShoppingBag size={18} /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] py-12 px-4">
      <Helmet><title>Order a Meal – Solohans Delicious Meals</title></Helmet>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-[#222222] mb-1 text-center">Build Your Meal</h1>
        <p className="text-gray-500 text-center mb-8">Choose 1 meal, or mix a maximum of 2 (e.g. Jollof + Spaghetti).</p>

        {!placedOrder ? (
          <form onSubmit={handlePlaceOrder} className="space-y-6">
            {mealPackages.map((mp, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800">Meal {idx + 1}</h3>
                  {mealPackages.length > 1 && (
                    <button type="button" onClick={() => removeMealPackage(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {MEAL_TYPES.map((meal) => (
                    <button
                      type="button" key={meal}
                      onClick={() => toggleMeal(idx, meal)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold border ${mp.meals.includes(meal) ? 'bg-[#C62828] text-white border-[#C62828]' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                    >
                      {MEAL_LABELS[meal]}
                    </button>
                  ))}
                </div>
                {mp.meals.length > 0 && !isComboAllowed(mp.meals) && (
                  <p className="text-red-600 text-xs mb-3">That combination isn't allowed. Choose max 2 meals.</p>
                )}

                <p className="text-xs text-gray-500 mb-2">Add Protein</p>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Chicken</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {CHICKEN_PROTEINS.map((p) => (
                    <button
                      type="button" key={p}
                      onClick={() => setProtein(idx, p)}
                      className={`px-3 py-2 rounded-lg text-sm border text-left ${mp.protein === p ? 'bg-red-50 border-[#C62828] text-[#C62828] font-semibold' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      {PROTEIN_LABELS[p]}<br /><span className="text-xs text-gray-500">₦{PROTEIN_PRICES[p].toLocaleString()}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Turkey</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {TURKEY_PROTEINS.map((p) => (
                    <button
                      type="button" key={p}
                      onClick={() => setProtein(idx, p)}
                      className={`px-3 py-2 rounded-lg text-sm border text-left ${mp.protein === p ? 'bg-red-50 border-[#C62828] text-[#C62828] font-semibold' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      {PROTEIN_LABELS[p]}<br /><span className="text-xs text-gray-500">₦{PROTEIN_PRICES[p].toLocaleString()}</span>
                    </button>
                  ))}
                </div>

                {mp.meals.length > 0 && (
                  <>
                    <p className="text-xs text-gray-500 mb-2">Extra Portion (+₦1,500 each)</p>
                    <div className="flex flex-wrap gap-2">
                      {mp.meals.map((meal) => (
                        <label key={meal} className="flex items-center gap-2 text-sm border border-gray-200 rounded-lg px-3 py-1.5 cursor-pointer">
                          <input type="checkbox" checked={mp.extraPortions.includes(meal)} onChange={() => toggleExtraPortion(idx, meal)} />
                          Extra {MEAL_LABELS[meal]}
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}

            <button type="button" onClick={addMealPackage} className="flex items-center gap-2 mx-auto border border-gray-300 px-5 py-2 rounded-full text-sm font-semibold hover:bg-white">
              <Plus size={16} /> Add Another Meal
            </button>

            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-3">Extras</h3>
              {Object.keys(extrasCatalog).length === 0 ? (
                <p className="text-sm text-gray-400">No extras available right now.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(extrasCatalog).map(([key, c]) => {
                    const outOfStock = c.remaining <= 0;
                    return (
                      <div key={key} className={`border rounded-lg p-3 ${outOfStock ? 'border-red-200 bg-red-50/40' : 'border-gray-200'}`}>
                        <p className="text-sm font-semibold text-gray-800">{c.label}</p>
                        <p className="text-xs text-gray-500 mb-1">₦{c.price.toLocaleString()} each</p>
                        {outOfStock && <p className="text-xs text-red-600 font-semibold mb-2">Out of stock</p>}
                        <input
                          type="number" min="0" max={c.remaining > 0 ? c.remaining : 0}
                          value={extras[key] || ''}
                          onChange={(e) => setExtraQty(key, Math.min(Number(e.target.value) || 0, Math.max(0, c.remaining)))}
                          placeholder="Qty" disabled={outOfStock}
                          className="w-full border rounded-lg px-2 py-1 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
              <h3 className="font-bold text-gray-800 mb-1">Your Details</h3>
              <input type="text" placeholder="Full name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
              <input type="email" required placeholder="Email (for order tracking)" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
              <input type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />

              <div className="flex gap-2">
                <button type="button" onClick={() => setDeliveryMethod('delivery')} className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${deliveryMethod === 'delivery' ? 'bg-[#C62828] text-white border-[#C62828]' : 'border-gray-200 text-gray-700'}`}>Delivery</button>
                <button type="button" onClick={() => setDeliveryMethod('pickup')} className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${deliveryMethod === 'pickup' ? 'bg-[#C62828] text-white border-[#C62828]' : 'border-gray-200 text-gray-700'}`}>Pickup</button>
              </div>

              {deliveryMethod === 'delivery' && (
                <>
                  <select value={deliveryZoneId} onChange={(e) => setDeliveryZoneId(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm">
                    <option value="">Select your area…</option>
                    {deliveryZones.map((z) => (
                      <option key={z._id} value={z._id}>{z.name} — ₦{z.fee.toLocaleString()}</option>
                    ))}
                  </select>
                  {!deliveryZoneId && (
                    <p className="text-xs text-amber-600">Don't see your area? You can still place the order — our team will confirm your delivery fee before payment.</p>
                  )}
                  <textarea required placeholder="Delivery address" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" rows="2" />
                </>
              )}

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1">
                  <FileText size={14} /> Additional Notes (optional)
                </label>
                <textarea
                  placeholder="e.g. No onions, extra spicy, call on arrival"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                  rows="2"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="space-y-1 text-sm mb-3">
                {priced.mealPackages.map((mp, i) => (
                  <div key={i} className="flex justify-between text-gray-600">
                    <span>{mp.meals.map((m) => MEAL_LABELS[m]).join(' + ')} ({PROTEIN_LABELS[mp.protein]})</span>
                    <span>₦{mp.lineTotal.toLocaleString()}</span>
                  </div>
                ))}
                {priced.extras.map((e, i) => (
                  <div key={i} className="flex justify-between text-gray-600">
                    <span>{e.label} × {e.qty}</span>
                    <span>₦{e.total.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  {deliveryMethod === 'pickup' ? (
                    <span>₦0 (Pickup)</span>
                  ) : deliveryZoneId ? (
                    <span>₦{selectedZoneFee.toLocaleString()}</span>
                  ) : (
                    <span className="text-amber-600">To be confirmed</span>
                  )}
                </div>
                {taxEnabled && (
                  <div className="flex justify-between text-gray-600">
                    <span className="flex items-center gap-1"><Receipt size={14} /> VAT ({taxRate}%)</span>
                    <span>₦{taxAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-3">
                <span>Total{deliveryMethod === 'delivery' && !deliveryZoneId ? ' (excl. delivery)' : ''}</span>
                <span className="text-[#C62828]">₦{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button type="submit" disabled={placing || !allValid} className="w-full flex items-center justify-center gap-2 py-3 bg-[#C62828] text-white rounded-full font-bold hover:bg-[#B71C1C] disabled:opacity-50">
              <ShoppingBag size={18} /> {placing ? 'Placing Order…' : 'Place Order'}
            </button>
          </form>
        ) : (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="font-bold text-[#222222] mb-4">Order #{placedOrder.order_id}</h2>
            {placedOrder.delivery_fee_set ? (
              <>
                <div className="flex justify-between text-lg font-bold border-t pt-4 mb-4">
                  <span>Total Due</span>
                  <span className="text-[#C62828]">₦{Number(placedOrder.totalAmount).toLocaleString()}</span>
                </div>
                {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
                <button onClick={handlePay} disabled={paying} className="w-full py-3 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C] disabled:opacity-70">
                  {paying ? 'Processing…' : `Pay ₦${Number(placedOrder.totalAmount).toLocaleString()} with Paystack`}
                </button>
              </>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                Your order (₦{Number(placedOrder.items_subtotal).toLocaleString()} for items) has been received.
                Since your area wasn't in our delivery list, our team will confirm your exact delivery fee shortly —
                you'll get a payment link once it's set. You can also call us to pay directly.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
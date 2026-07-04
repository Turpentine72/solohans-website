import { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Trash2, CheckCircle, Store, UtensilsCrossed, Minus, Package, Banknote, ArrowLeftRight, CreditCard, Globe } from 'lucide-react';
import { pos as posApi, menuItems as menuItemsApi } from '../../lib/api';
import {
  MEAL_TYPES, MEAL_LABELS, PROTEIN_PRICES, PROTEIN_LABELS,
  RICE_TYPES, isComboAllowed, priceCart, PAYMENT_TAGS,
} from '../../lib/pricing';

const PAYMENT_TAG_ICONS = { Banknote, ArrowLeftRight, CreditCard, Globe };

const EXTRAS_CATALOG_FALLBACK = {
  hotdog: { label: 'Hotdog', price: 1000 },
  water: { label: 'Water', price: 500 },
  drinks: { label: 'Drinks', price: 1000 },
  plantain: { label: 'Plantain', price: 1000 },
  salad: { label: 'Salad', price: 1000 },
  coleslaw: { label: 'Coleslaw', price: 1000 },
};

function emptyMealPackage() {
  return { meals: [], protein: 'none', extraPortions: [] };
}

export default function POS() {
  const [mealPackages, setMealPackages] = useState([emptyMealPackage()]);
  const [extras, setExtras] = useState({}); // { hotdog: qty } — flat-priced standalone extras
  const [menuCatalog, setMenuCatalog] = useState([]); // Shawarma, Hotdog (as a menu item), or anything else from MenuItem
  const [menuCatalogLoading, setMenuCatalogLoading] = useState(true);
  const [selectedMenuItems, setSelectedMenuItems] = useState({}); // { menuItemId: qty }
  const [paymentMethod, setPaymentMethod] = useState('');
  const [posSaleType, setPosSaleType] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [placing, setPlacing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    menuItemsApi.getAll({ available: true })
      .then((data) => setMenuCatalog(Array.isArray(data) ? data : data.items || []))
      .catch(() => setMenuCatalog([]))
      .finally(() => setMenuCatalogLoading(false));
  }, []);

  const setMenuItemQty = (id, qty) => {
    const q = Math.max(0, Number(qty) || 0);
    setSelectedMenuItems((prev) => {
      const next = { ...prev };
      if (q === 0) delete next[id];
      else next[id] = q;
      return next;
    });
  };

  const menuItemsTotal = useMemo(() => {
    return Object.entries(selectedMenuItems).reduce((sum, [id, qty]) => {
      const item = menuCatalog.find((m) => m._id === id);
      return sum + (item ? item.price * qty : 0);
    }, 0);
  }, [selectedMenuItems, menuCatalog]);

  const priced = useMemo(() => {
    const extrasArr = Object.entries(extras).filter(([, qty]) => qty > 0).map(([item, qty]) => ({ item, qty }));
    return priceCart({ mealPackages, extras: extrasArr, extrasCatalog: EXTRAS_CATALOG_FALLBACK });
  }, [mealPackages, extras]);

  const toggleMeal = (idx, meal) => {
    setMealPackages((prev) => prev.map((mp, i) => {
      if (i !== idx) return mp;
      let meals = mp.meals.includes(meal) ? mp.meals.filter((m) => m !== meal) : [...mp.meals, meal];
      if (meals.length > 2) return mp; // max 2
      return { ...mp, meals, extraPortions: mp.extraPortions.filter((p) => meals.includes(p)) };
    }));
  };

  const setProtein = (idx, protein) => {
    setMealPackages((prev) => prev.map((mp, i) => (i === idx ? { ...mp, protein } : mp)));
  };

  const toggleExtraPortion = (idx, meal) => {
    setMealPackages((prev) => prev.map((mp, i) => {
      if (i !== idx) return mp;
      const extraPortions = mp.extraPortions.includes(meal)
        ? mp.extraPortions.filter((m) => m !== meal)
        : [...mp.extraPortions, meal];
      return { ...mp, extraPortions };
    }));
  };

  const addMealPackage = () => setMealPackages((prev) => [...prev, emptyMealPackage()]);
  const removeMealPackage = (idx) => setMealPackages((prev) => prev.filter((_, i) => i !== idx));

  const setExtraQty = (key, qty) => setExtras((prev) => ({ ...prev, [key]: Math.max(0, Number(qty) || 0) }));

  // A meal-package "slot" only counts if the staff actually picked meals in
  // it — the default empty slot doesn't force a rice/spaghetti meal onto
  // every sale (e.g. a Shawarma-only sale has zero meal packages).
  const usedMealPackages = mealPackages.filter((mp) => mp.meals.length > 0);
  const hasAnyExtras = Object.values(extras).some((qty) => qty > 0);
  const hasAnyMenuItems = Object.keys(selectedMenuItems).length > 0;
  const allValid =
    usedMealPackages.every((mp) => isComboAllowed(mp.meals)) &&
    (usedMealPackages.length > 0 || hasAnyExtras || hasAnyMenuItems);

  const handleCompleteSale = async () => {
    setError('');
    if (!allValid) return setError('Add at least one meal, menu item, or extra — and make sure any meal combo is 1–2 allowed items.');
    if (!posSaleType) return setError('Select an Order Type (Shop Sale or Restaurant Sale) before completing the sale.');
    if (!paymentMethod) return setError('Select a payment method (Cash, Transfer or POS) before completing the sale.');

    setPlacing(true);
    try {
      const extrasArr = Object.entries(extras).filter(([, qty]) => qty > 0).map(([item, qty]) => ({ item, qty }));
      const menuItemsArr = Object.entries(selectedMenuItems).map(([menuItemId, quantity]) => ({ menuItemId, quantity }));
      const cart = { mealPackages: usedMealPackages, extras: extrasArr, menuItems: menuItemsArr, deliveryFee: 0 };
      const res = await posApi.checkout({ cart, paymentMethod, customerName, posSaleType });
      setResult(res);
      setMealPackages([emptyMealPackage()]);
      setExtras({});
      setSelectedMenuItems({});
      setPaymentMethod('');
      setPosSaleType('');
      setCustomerName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <>
      <Helmet><title>POS – New Sale | Solohans Admin</title></Helmet>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800">New Sale (POS)</h1>
            <button onClick={addMealPackage} className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-50">
              <Plus size={16}/> Add Another Meal
            </button>
          </div>

          {mealPackages.map((mp, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800">Meal {idx + 1}</h3>
                {mealPackages.length > 1 && (
                  <button onClick={() => removeMealPackage(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={18}/></button>
                )}
              </div>

              <p className="text-xs text-gray-500 mb-2">Choose 1 meal, or mix a maximum of 2</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {MEAL_TYPES.map((meal) => (
                  <button
                    key={meal}
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

              <p className="text-xs text-gray-500 mb-2">Protein (determines package price)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {Object.keys(PROTEIN_PRICES).map((p) => (
                  <button
                    key={p}
                    onClick={() => setProtein(idx, p)}
                    className={`px-3 py-2 rounded-lg text-sm border text-left ${mp.protein === p ? 'bg-red-50 border-[#C62828] text-[#C62828] font-semibold' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    {PROTEIN_LABELS[p]}<br/><span className="text-xs text-gray-500">₦{PROTEIN_PRICES[p].toLocaleString()}</span>
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

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Package size={18} /> Menu Items (Shawarma, Hotdog, etc.)</h3>
            {menuCatalogLoading ? (
              <p className="text-sm text-gray-400">Loading menu…</p>
            ) : menuCatalog.length === 0 ? (
              <p className="text-sm text-gray-400">No menu items available yet — add some in Menu Management.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {menuCatalog.map((item) => {
                  const qty = selectedMenuItems[item._id] || 0;
                  return (
                    <div key={item._id} className={`border rounded-lg p-3 ${qty > 0 ? 'border-[#C62828] bg-[#FFF8F0]' : 'border-gray-200'}`}>
                      <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500 mb-2">₦{item.price.toLocaleString()} each</p>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setMenuItemQty(item._id, qty - 1)} className="w-7 h-7 flex items-center justify-center border rounded-full text-gray-500 hover:bg-gray-50"><Minus size={14} /></button>
                        <span className="w-8 text-center font-semibold">{qty}</span>
                        <button type="button" onClick={() => setMenuItemQty(item._id, qty + 1)} className="w-7 h-7 flex items-center justify-center border rounded-full text-gray-500 hover:bg-gray-50"><Plus size={14} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-3">Extras</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(EXTRAS_CATALOG_FALLBACK).map(([key, c]) => (
                <div key={key} className="border border-gray-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-gray-800">{c.label}</p>
                  <p className="text-xs text-gray-500 mb-2">₦{c.price.toLocaleString()} each</p>
                  <input type="number" min="0" value={extras[key] || ''} onChange={(e) => setExtraQty(key, e.target.value)} placeholder="Qty" className="w-full border rounded-lg px-2 py-1 text-sm" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Checkout panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 h-fit sticky top-4">
          <h3 className="font-bold text-gray-800 mb-4">Checkout</h3>

          <input
            type="text" placeholder="Customer name (optional)"
            value={customerName} onChange={(e) => setCustomerName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mb-4 text-sm"
          />

          <div className="space-y-1 text-sm mb-4">
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
            {Object.entries(selectedMenuItems).map(([id, qty]) => {
              const item = menuCatalog.find((m) => m._id === id);
              if (!item) return null;
              return (
                <div key={id} className="flex justify-between text-gray-600">
                  <span>{item.name} × {qty}</span>
                  <span>₦{(item.price * qty).toLocaleString()}</span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between font-bold text-lg border-t pt-3 mb-4">
            <span>Total</span>
            <span className="text-[#C62828]">₦{(priced.totalAmount + menuItemsTotal).toLocaleString()}</span>
          </div>

          <p className="text-xs text-gray-500 mb-2 font-semibold">Order Type (Required)</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              type="button" onClick={() => setPosSaleType('shop')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border ${posSaleType === 'shop' ? 'bg-[#C62828] text-white border-[#C62828]' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              <Store size={16} /> Shop Sale
            </button>
            <button
              type="button" onClick={() => setPosSaleType('restaurant')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border ${posSaleType === 'restaurant' ? 'bg-[#C62828] text-white border-[#C62828]' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              <UtensilsCrossed size={16} /> Restaurant Sale
            </button>
          </div>

          <p className="text-xs text-gray-500 mb-2 font-semibold">Payment Method (Required)</p>
          <div className="space-y-2 mb-4">
            {['CASH', 'TRANSFER', 'POS'].map((m) => {
              const tag = PAYMENT_TAGS[m];
              const TagIcon = PAYMENT_TAG_ICONS[tag.icon] || CreditCard;
              return (
                <label key={m} className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer text-sm">
                  <input type="radio" name="paymentMethod" checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} />
                  <TagIcon size={14} /> {m}
                </label>
              );
            })}
          </div>

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          <button
            onClick={handleCompleteSale}
            disabled={placing || !allValid}
            className="w-full bg-[#C62828] text-white py-3 rounded-full font-bold hover:bg-[#B71C1C] disabled:opacity-50"
          >
            {placing ? 'Saving…' : 'Complete Sale'}
          </button>

          {result && (() => {
            const tag = PAYMENT_TAGS[result.order.paymentMethod] || PAYMENT_TAGS['WEBSITE PAYMENT'];
            const TagIcon = PAYMENT_TAG_ICONS[tag.icon] || CreditCard;
            return (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 text-sm">
                <p className="flex items-center gap-2 font-semibold text-green-700 mb-1"><CheckCircle size={16}/> Sale completed</p>
                <p>Order #{result.order.order_id}</p>
                <p className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${tag.color}`}><TagIcon size={12} /> {tag.label}</p>
                <p>Amount: ₦{result.order.totalAmount.toLocaleString()}</p>
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
}
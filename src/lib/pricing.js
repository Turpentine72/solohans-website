// src/lib/pricing.js
// Mirrors backend/utils/pricing.js — keep both in sync.

export const MEAL_TYPES = ['jollof', 'friedRice', 'spaghetti'];
export const RICE_TYPES = ['jollof', 'friedRice'];

export const MEAL_LABELS = {
  jollof: 'Jollof Rice',
  friedRice: 'Fried Rice',
  spaghetti: 'Spaghetti',
};

export const ALLOWED_COMBOS = [
  ['jollof'],
  ['friedRice'],
  ['spaghetti'],
  ['jollof', 'friedRice'],
  ['jollof', 'spaghetti'],
  ['friedRice', 'spaghetti'],
];

export const PROTEIN_PRICES = {
  none: 3000,
  regularChicken: 4500,
  bigChicken: 5500,
  extraBigChicken: 6500,
  regularTurkey: 6500,
  bigTurkey: 8500,
};

export const PROTEIN_LABELS = {
  none: 'Meal Only',
  regularChicken: 'Regular Chicken',
  bigChicken: 'Big Chicken',
  extraBigChicken: 'Extra Big Chicken',
  regularTurkey: 'Regular Turkey',
  bigTurkey: 'Big Turkey',
};

// ✅ Chicken and Turkey are deliberately separate groups — never combined
// into one flat list — so the UI can render two clearly labeled sections.
export const CHICKEN_PROTEINS = ['none', 'regularChicken', 'bigChicken', 'extraBigChicken'];
export const TURKEY_PROTEINS = ['regularTurkey', 'bigTurkey'];

export const EXTRA_PORTION_PRICE = 1500;

export function isComboAllowed(meals) {
  const uniq = Array.from(new Set(meals));
  if (uniq.length === 0 || uniq.length > 2) return false;
  return ALLOWED_COMBOS.some((c) => c.length === uniq.length && c.every((m) => uniq.includes(m)));
}

function portionsFor(meals) {
  const uniq = Array.from(new Set(meals));
  const scoopDeductions = {};
  let spaghettiPlastics = 0;
  if (uniq.length === 1) {
    const only = uniq[0];
    if (only === 'spaghetti') spaghettiPlastics = 2;
    else scoopDeductions[only] = 4;
  } else {
    uniq.forEach((m) => {
      if (m === 'spaghetti') spaghettiPlastics = 1;
      else scoopDeductions[m] = 2;
    });
  }
  return { scoopDeductions, spaghettiPlastics };
}

function extraPortionDeduction(mealType) {
  if (mealType === 'spaghetti') return { scoopDeductions: {}, spaghettiPlastics: 1 };
  return { scoopDeductions: { [mealType]: 2 }, spaghettiPlastics: 0 };
}

/** Prices one meal package (client-side mirror; server re-validates & is authoritative). */
export function priceMealPackage({ meals = [], protein = 'none', extraPortions = [] }) {
  if (!isComboAllowed(meals)) return null;
  const basePrice = PROTEIN_PRICES[protein] ?? PROTEIN_PRICES.none;
  const { scoopDeductions, spaghettiPlastics } = portionsFor(meals);

  let totalScoops = { ...scoopDeductions };
  let totalPlastics = spaghettiPlastics;
  extraPortions.forEach((mealType) => {
    const d = extraPortionDeduction(mealType);
    Object.entries(d.scoopDeductions).forEach(([k, v]) => { totalScoops[k] = (totalScoops[k] || 0) + v; });
    totalPlastics += d.spaghettiPlastics;
  });

  const extraPortionsTotal = extraPortions.length * EXTRA_PORTION_PRICE;

  return {
    meals,
    protein,
    basePrice,
    extraPortions,
    extraPortionsTotal,
    scoopDeductions: totalScoops,
    spaghettiPlastics: totalPlastics,
    lineTotal: basePrice + extraPortionsTotal,
    lunchBoxUsed: 1,
  };
}

export function priceCart({ mealPackages = [], extras = [], extrasCatalog = {}, deliveryFee = 0 }) {
  const pricedMeals = mealPackages.map(priceMealPackage).filter(Boolean);
  const pricedExtras = extras.map(({ item, qty }) => {
    const cat = extrasCatalog[item];
    if (!cat) return null;
    const quantity = Math.max(1, Number(qty) || 1);
    return { item, label: cat.label, qty: quantity, unitPrice: cat.price, total: cat.price * quantity };
  }).filter(Boolean);

  const mealsTotal = pricedMeals.reduce((s, m) => s + m.lineTotal, 0);
  const extrasTotal = pricedExtras.reduce((s, e) => s + e.total, 0);

  return {
    mealPackages: pricedMeals,
    extras: pricedExtras,
    mealsTotal,
    extrasTotal,
    deliveryFee,
    totalAmount: mealsTotal + extrasTotal + Number(deliveryFee || 0),
  };
}

// Icon keys map to lucide-react components at render time — see
// PaymentTagBadge in Orders.jsx / POS.jsx. No emojis anywhere in the app.
export const PAYMENT_TAGS = {
  CASH: { label: 'CASH', icon: 'Banknote', color: 'bg-green-100 text-green-700' },
  TRANSFER: { label: 'TRANSFER', icon: 'ArrowLeftRight', color: 'bg-blue-100 text-blue-700' },
  POS: { label: 'POS', icon: 'CreditCard', color: 'bg-purple-100 text-purple-700' },
  SPLIT: { label: 'SPLIT PAYMENT', icon: 'SplitSquareHorizontal', color: 'bg-orange-100 text-orange-700' },
  'WEBSITE PAYMENT': { label: 'WEBSITE PAYMENT', icon: 'Globe', color: 'bg-teal-100 text-teal-700' },
  PLATFORM: { label: 'PLATFORM PAYMENT', icon: 'Bike', color: 'bg-indigo-100 text-indigo-700' },
};
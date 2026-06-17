// component/PromoBanner.jsx
import { usePromos } from '../context/PromoContext';
import { X } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function PromoBanner() {
  const { activePromos } = usePromos();
  const [dismissed, setDismissed] = useState(false);

  const tickerText = useMemo(() => {
    if (!activePromos || activePromos.length === 0) return '';
    return activePromos
      .map((promo) => {
        if (promo.type === 'freeDelivery') return '🚚 Free Delivery on all orders!';
        if (promo.type === 'percentage') return `${promo.title} – ${promo.discountPercentage}% OFF`;
        if (promo.type === 'freeItem') return `🎁 ${promo.title}`;
        return promo.title;
      })
      .join('   •   ');
  }, [activePromos]);

  if (dismissed || !tickerText) return null;

  // We repeat the text 4× so there's always content filling the viewport
  const repeated = `${tickerText}   •   ${tickerText}   •   ${tickerText}   •   ${tickerText}   •   `;

  return (
    <div className="bg-[#C62828] text-white relative h-9 flex items-center overflow-hidden">
      <div
        className="whitespace-nowrap text-sm font-semibold will-change-transform"
        style={{ animation: 'promoscroll 40s linear infinite', display: 'inline-block' }}
      >
        {repeated}
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-white z-10 bg-[#C62828] rounded-full p-0.5 hover:bg-white/20 transition-colors"
        aria-label="Dismiss banner"
      >
        <X size={15} />
      </button>

      <style>{`
        @keyframes promoscroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import defaultLogo from '../assets/5e82d2b1-ebb5-4e77-8fa1-91fae5baab69.png';

export default function Preloader({ onFinish }) {
  const { settings, loading } = useSettings();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onFinish) onFinish();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  if (!visible || loading) return null;

  const logoUrl = settings?.logo || defaultLogo;
  const name = settings?.name || 'Solohans';
  const tagline = settings?.tagline || 'Delicious Meals';

  return (
    <div className="fixed inset-0 z-[9999] bg-[#FFF8F0] flex flex-col items-center justify-center transition-opacity duration-500">
      <img
        src={logoUrl}
        alt="Logo"
        className="w-24 h-24 md:w-32 md:h-32 object-contain animate-bounce"
      />
      <h2 className="mt-4 text-2xl md:text-3xl font-bold text-[#7A1F1F] tracking-wide">
        {name}
      </h2>
      <p className="text-sm text-[#444] font-semibold uppercase tracking-widest mt-1">
        {tagline}
      </p>
      <div className="mt-6 flex gap-2">
        <span className="w-3 h-3 bg-[#C62828] rounded-full animate-bounce [animation-delay:0s]" />
        <span className="w-3 h-3 bg-[#C62828] rounded-full animate-bounce [animation-delay:0.2s]" />
        <span className="w-3 h-3 bg-[#C62828] rounded-full animate-bounce [animation-delay:0.4s]" />
      </div>
    </div>
  );
}
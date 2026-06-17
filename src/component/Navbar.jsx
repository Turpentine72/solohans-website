import { Menu, X, Home, UtensilsCrossed, Info, Star, Mail, ShoppingCart, Image } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import defaultLogo from '../assets/5e82d2b1-ebb5-4e77-8fa1-91fae5baab69.png';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { openCart, itemCount } = useCart();
  const { settings } = useSettings();

  const logoUrl = settings?.logo || defaultLogo;
  const businessName = settings?.name || 'Solohans';
  const tagline = settings?.tagline || 'Delicious Meals';

  const navLinks = [
    { label: 'Home', href: '/', icon: <Home size={18} /> },
    { label: 'About', href: '/about', icon: <Info size={18} /> },
    { label: 'Menu', href: '/menu', icon: <UtensilsCrossed size={18} /> },
    { label: 'Gallery', href: '/gallery', icon: <Image size={18} /> },   // ✅ Gallery link
    { label: 'Testimonials', href: '/reviews', icon: <Star size={18} /> },
    { label: 'Contact', href: '/contact', icon: <Mail size={18} /> },
  ];

  return (
    <nav className="bg-[#FFF8F0] shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logoUrl}
              alt="Logo"
              className="h-16 md:h-20 w-auto object-contain"
            />
            <div className="leading-tight">
              <h1 className="text-lg md:text-xl font-black text-[#7A1F1F]">
                {businessName}
              </h1>
              <p className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-[#444]">
                {tagline}
              </p>
            </div>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="flex items-center gap-1.5 text-[#222222] font-medium hover:text-[#C62828] transition duration-300"
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            <button
              onClick={openCart}
              className="flex items-center gap-2 bg-[#C62828] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#B71C1C] transition duration-300 shadow-md relative"
            >
              <ShoppingCart size={18} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-[#C62828] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
              Order Now
            </button>
          </div>

          {/* Mobile button */}
          <button
            className="md:hidden text-[#222222]"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={30} /> : <Menu size={30} />}
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden pb-6">
            <div className="pt-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 py-2 px-4 text-[#222222] font-medium hover:text-[#C62828] rounded-lg"
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </div>
            <button
              onClick={() => {
                openCart();
                setIsOpen(false);
              }}
              className="mt-6 flex items-center justify-center gap-2 bg-[#C62828] text-white px-5 py-3 rounded-full font-semibold hover:bg-[#B71C1C] w-full relative"
            >
              <ShoppingCart size={18} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-[#C62828] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
              Order Now
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
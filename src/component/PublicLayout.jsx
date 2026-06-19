import { useState, useEffect } from 'react';
import Preloader from './Preloader';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingWhatsApp from './FloatingWhatsApp';
import CartSidebar from './CartSidebar';
import PromoBanner from './PromoBanner';   // ✅ promo banner

export default function PublicLayout({ children }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Preloader />;
  }

  return (
    <>
      <PromoBanner />            {/* ✅ displays active promo at the very top */}
      <Navbar />
      {children}
      <Footer />
      <FloatingWhatsApp />
      <CartSidebar />
    </>
  );
}
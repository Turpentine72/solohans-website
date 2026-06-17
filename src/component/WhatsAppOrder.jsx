import { MessageCircle } from 'lucide-react';

const submitWhatsAppOrder = (item) => {
  // In a real app, POST to backend to create order record
  const orderId = 'SLH-' + Math.floor(100000 + Math.random() * 900000);
  // WhatsApp order triggered
  return orderId;
};

export default function WhatsAppOrderButton({ item }) {
  const handleOrder = () => {
    const orderId = submitWhatsAppOrder(item);
    const message = `Hello, I want to order ${item.name}. Order ID: ${orderId}`;
    const url = `https://wa.me/2348081941298?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <button
      onClick={handleOrder}
      className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
    >
      <MessageCircle size={16} />
      WhatsApp
    </button>
  );
}
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { Search, Clock, Copy, Check, Receipt, Truck, Home, Store, UtensilsCrossed } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import heroImage from '../assets/photo-1540189549336-e6e99c3679fe.avif';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const deliveryStatusSteps = [
  { key: 'Pending', label: 'Placed' },
  { key: 'Confirmed', label: 'Confirmed' },
  { key: 'Processing', label: 'Preparing' },
  { key: 'Out for Delivery', label: 'On the way' },
  { key: 'Delivered', label: 'Delivered' },
];

const pickupStatusSteps = [
  { key: 'Pending', label: 'Placed' },
  { key: 'Processing', label: 'Preparing' },
  { key: 'Ready for Pickup', label: 'Ready for Pickup' },
  { key: 'Completed', label: 'Completed' },
];

export default function TrackOrder() {
  const { settings } = useSettings();
  const { orderId: orderIdFromUrl } = useParams();
  const [orderId, setOrderId] = useState(orderIdFromUrl || '');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ─── Scroll to top on mount ──────────────────────────────────────────────
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleTrack = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const res = await fetch(`${API_BASE}/orders/track?order_id=${encodeURIComponent(orderId)}&email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Order not found');
      setOrder(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const statusSteps = order?.delivery_method === 'pickup' ? pickupStatusSteps : deliveryStatusSteps;

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    // Legacy orders created before payment/verification were split out may
    // still have status: 'Paid' stored as a fulfillment stage — treat that
    // the same as the first post-pending stage for the progress bar.
    const effectiveStatus = order.status === 'Paid'
      ? (order.delivery_method === 'pickup' ? 'Processing' : 'Confirmed')
      : order.status;
    const found = statusSteps.findIndex(s => s.key === effectiveStatus);
    return found >= 0 ? found : 0;
  };

  // Social links from settings or defaults
  const socialLinks = {
    facebook: settings?.social?.facebook || 'https://www.facebook.com/SoloHansDelicious',
    instagram: settings?.social?.instagram || 'https://www.instagram.com/solohansdeliciousmeal50',
    tiktok: settings?.social?.tiktok || 'https://www.tiktok.com/@solohans.delicious.meals',
    snapchat: settings?.social?.snapchat || 'https://www.snapchat.com/add/solohans1?share_id=6VsKV86KQai7SkT5PWdSVA&locale=en_US',
  };

  const heroWords = ['Track', 'Your', 'Order'];

  return (
    <>
      <Helmet><title>Track Order – Solohans Delicious Meals</title></Helmet>

      {/* Hero Section – full screen like Menu & Gallery */}
      <section className="relative h-screen overflow-hidden">
        <img src={heroImage} alt="Track your order" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
          <div className="text-center px-4">
            <h1
              className="text-4xl md:text-6xl font-light uppercase tracking-[4px] text-white"
              style={{ fontFamily: "'Playfair', serif" }}
            >
              {heroWords.map((word, i) => (
                <span
                  key={i}
                  className="inline-block mr-4"
                  style={{
                    animation: 'heroWordIn 0.8s ease forwards',
                    animationDelay: `${0.2 + i * 0.15}s`,
                    opacity: 0,
                  }}
                >
                  {word}
                </span>
              ))}
            </h1>
            <p
              className="mt-4 text-lg md:text-xl text-[#E7D3A7] font-light tracking-wide max-w-2xl mx-auto"
              style={{ animation: 'heroWordIn 0.8s ease forwards', animationDelay: '0.65s', opacity: 0 }}
            >
              Enter your order ID and email to see real-time updates.
            </p>
            <div
              className="mt-6 w-24 h-0.5 bg-[#C62828] mx-auto"
              style={{ animation: 'heroWordIn 0.8s ease forwards', animationDelay: '0.8s', opacity: 0 }}
            />
          </div>
        </div>
        <style>{`
          @keyframes heroWordIn {
            from { opacity: 0; transform: translateY(30px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </section>

      {/* Track Form & Results – same background as Menu/Gallery */}
      <section className="bg-[#FFF8F0] py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <form onSubmit={handleTrack} className="bg-white rounded-2xl shadow-md border p-6 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Order ID (e.g., SLH 0001)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                required
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-[#C62828]"
              />
              <input
                type="email"
                placeholder="Email used at checkout"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-[#C62828]"
              />
            </div>
            {orderIdFromUrl && !order && (
              <p className="text-xs text-gray-500 mt-2">Order ID filled in for you — just add the email you used at checkout.</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C] disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? 'Searching…' : <><Search size={18} /> Track Order</>}
            </button>
            {error && <p className="text-red-600 text-sm mt-3 text-center">{error}</p>}
          </form>

          {order && (
            <div className="bg-white rounded-2xl shadow-md border p-6 space-y-6">
              <div className="flex flex-wrap justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">Order #{order.order_id}</h2>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(order.order_id).then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      });
                    }}
                    className="inline-flex items-center gap-1 text-xs text-[#C62828] hover:underline"
                  >
                    {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Order ID</>}
                  </button>
                  <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`px-4 py-2 font-bold rounded-full text-sm ${order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-[#C62828]/10 text-[#C62828]'}`}>
                  {order.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Order Status</p>
                  <p className="font-semibold text-sm mt-1">{order.status}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Payment Status</p>
                  <p className="font-semibold text-sm mt-1">{order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Verification</p>
                  <p className={`font-semibold text-sm mt-1 ${order.verification_status === 'Verified' ? 'text-green-600' : ''}`}>
                    {order.verification_status === 'Verified' ? '✅ Verified' : 'Not Verified'}
                  </p>
                </div>
              </div>

              {/* Status progress bar — skipped for cancelled orders */}
              {order.status !== 'Cancelled' && (
              <div className="flex items-center justify-between mt-4">
                {statusSteps.map((step, idx) => {
                  const isCompleted = idx <= getCurrentStepIndex();
                  const isCurrent = idx === getCurrentStepIndex();
                  return (
                    <div key={step.key} className="flex-1 flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCompleted ? 'bg-[#C62828] text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <p className={`text-xs mt-1 text-center ${isCurrent ? 'text-[#C62828] font-medium' : 'text-gray-400'}`}>{step.label}</p>
                    </div>
                  );
                })}
              </div>
              )}

              <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Customer</p>
                  <p className="font-medium">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Food Total</p>
                  <p className="font-medium">₦{(order.items_subtotal ?? order.totalAmount)?.toLocaleString()}</p>
                </div>
                {order.tax_enabled && order.tax_amount > 0 && (
                  <div>
                    <p className="text-gray-500 flex items-center gap-1"><Receipt size={12} /> VAT ({order.tax_rate}%)</p>
                    <p className="font-medium">₦{order.tax_amount.toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">Delivery Fee</p>
                  <p className="font-medium">₦{order.delivery_fee?.toLocaleString() || '0'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Grand Total</p>
                  <p className="font-medium">₦{order.totalAmount?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Order Type</p>
                  <p className="font-medium flex items-center gap-1">
                    {order.source === 'store' ? (
                      order.pos_sale_type === 'restaurant'
                        ? <><UtensilsCrossed size={14} /> Restaurant Sale</>
                        : <><Store size={14} /> Shop Sale</>
                    ) : order.delivery_method === 'pickup' ? (
                      <><Home size={14} /> Pickup</>
                    ) : (
                      <><Truck size={14} /> Delivery</>
                    )}
                  </p>
                </div>
              </div>

              {order.items?.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Items</h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {order.items.map((item, idx) => (
                      <li key={idx}>{item.name} × {item.quantity} – ₦{item.price?.toLocaleString()}</li>
                    ))}
                  </ul>
                </div>
              )}

              {order.statusHistory?.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-1"><Clock size={16} /> Order Updates</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {order.statusHistory.map((entry, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#C62828] mt-1.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">{entry.status}</span>
                          <span className="text-gray-400 ml-2">{new Date(entry.date).toLocaleString()}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="text-center mt-2">
                <Link to="/" className="text-[#C62828] hover:underline text-sm">← Back to Home</Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Call‑to‑Action Section – same as Menu & Gallery */}
      <section className="bg-[#FFF8F0] py-16 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-light tracking-[4px] text-[#222222] uppercase mb-4" style={{ fontFamily: "'Playfair', serif" }}>
            Craving Something Delicious?
          </h2>
          <p className="text-[#444] max-w-2xl mx-auto mb-8">
            Browse our full menu and order your favourite meals now. Fresh, tasty, and delivered with love.
          </p>
          <Link
            to="/menu"
            className="inline-block px-8 py-3 bg-[#C62828] text-white rounded-full font-semibold text-lg hover:bg-[#B71C1C] transition-colors shadow-md"
          >
            Buy from Us – Order Now
          </Link>

          {/* Social Media Links */}
          <div className="mt-10 flex flex-col items-center gap-4">
            <p className="text-sm text-gray-500 uppercase tracking-widest">Follow Us</p>
            <div className="flex items-center gap-6">
              <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#C62828] transition-colors">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#C62828] transition-colors">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#C62828] transition-colors">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
              </a>
              <a href={socialLinks.snapchat} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#C62828] transition-colors">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12.206.793c.357-.011.715.015 1.072.058 1.978.256 3.894.964 5.489 2.072 1.81 1.264 3.118 3.048 3.697 5.162.576 2.109.451 4.385-.145 6.511-.215.772-.468 1.482-.877 2.118-.238.372-.513.724-.85 1.017-.353.308-.747.542-1.133.786-1.698 1.074-3.645 1.649-5.606 1.95-1.309.2-2.636.22-3.953.066-1.739-.203-3.43-.683-4.996-1.374-.384-.171-.752-.376-1.085-.639-.374-.294-.711-.626-1.001-1.004-.661-.863-1.068-1.911-1.21-2.983-.07-.523-.092-1.052-.036-1.577.107-.998.458-1.959 1.016-2.788.616-.913 1.394-1.721 2.256-2.408.365-.29.741-.549 1.139-.784.384-.226.786-.401 1.201-.533.386-.123.78-.192 1.174-.202.316-.009.623.027.919.109.405.113.791.272 1.156.466.31.166.593.371.843.612.168.162.309.346.42.549.269.49.468 1.021.588 1.567.1.453.166.915.196 1.379.025.392.032.783.03 1.174-.002.258.006.516.003.774-.001.062-.019.125-.048.179-.029.054-.082.082-.132.094-.111.027-.225-.014-.31-.093-.373-.348-.771-.668-1.186-.968-.538-.39-1.122-.712-1.731-.986-1.119-.504-2.313-.805-3.525-.921-.364-.035-.692.164-.795.466-.062.182-.046.355.038.502.14.246.373.434.637.571.703.363 1.463.612 2.227.832.359.103.721.201 1.065.338.201.081.396.18.56.313.116.094.193.215.207.36.014.145-.021.282-.066.417-.028.084-.067.161-.116.231-.145.208-.332.38-.549.516-.365.228-.767.379-1.176.502-.409.123-.825.206-1.246.252-.747.082-1.501.054-2.241-.072-.497-.085-.984-.209-1.454-.393-.292-.115-.577-.24-.86-.374-.19-.09-.368-.201-.521-.344-.103-.096-.182-.214-.23-.344-.041-.113-.025-.22.031-.308.056-.088.144-.136.236-.148.14-.019.282.024.412.073.218.082.436.162.658.23.215.066.434.116.654.157.344.063.694.09 1.042.088.204-.002.407-.02.609-.052.073-.012.145-.026.213-.052.052-.02.086-.068.086-.124 0-.057-.027-.104-.075-.134-.102-.064-.216-.108-.33-.147-.271-.093-.546-.173-.824-.24-.543-.13-1.095-.212-1.649-.254-.216-.017-.434-.018-.65-.006-.336.019-.669.069-1 .13-.251.047-.502.097-.751.161-.141.036-.283.075-.423.119-.05.015-.099.034-.141.066-.031.023-.054.058-.059.099-.005.041.008.08.034.107.09.096.205.165.325.221.329.151.675.267 1.021.383.706.238 1.429.419 2.156.564.587.117 1.182.179 1.78.187.315.004.631-.008.944-.039.244-.024.486-.062.725-.113.177-.038.352-.083.523-.138.159-.052.316-.117.461-.199.119-.067.23-.153.319-.262.078-.095.134-.206.16-.325.023-.102.025-.206.009-.307-.026-.165-.102-.311-.217-.423-.235-.23-.532-.382-.837-.509-.468-.195-.955-.326-1.447-.432-.399-.086-.801-.151-1.202-.22-.401-.069-.802-.141-1.191-.24-.369-.094-.735-.203-1.081-.36-.193-.087-.381-.187-.551-.311-.112-.082-.211-.182-.291-.298-.068-.099-.11-.215-.118-.339-.007-.124.025-.242.082-.347.15-.282.448-.454.739-.448.273.005.544.068.802.17.352.14.69.309 1.019.491.17.094.336.195.5.299.082.052.16.109.239.166.09.065.196.102.302.099h.031c.094-.01.176-.062.229-.139.053-.077.073-.173.056-.263-.015-.085-.049-.162-.101-.223-.089-.104-.196-.186-.309-.255-.455-.278-.944-.48-1.449-.643-.416-.135-.84-.229-1.27-.286-.152-.021-.306-.03-.459-.034-.091-.003-.182.006-.273.012-.043.003-.086.008-.127.02-.039.01-.068.034-.08.072-.012.038-.004.07.011.094.068.108.176.184.297.233.587.235 1.221.362 1.855.453.478.069.959.1 1.44.096.196-.002.392-.014.587-.034.161-.017.321-.039.48-.069.355-.067.705-.168 1.041-.306.212-.088.416-.196.601-.331.105-.077.199-.169.27-.28.054-.086.088-.185.09-.288.002-.103-.028-.199-.081-.283-.151-.237-.397-.391-.654-.503-.446-.194-.912-.314-1.383-.409-.317-.064-.637-.106-.958-.128zm0 0"/></svg>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
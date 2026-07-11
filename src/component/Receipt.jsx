import { Printer, Share2, Link as LinkIcon, Check } from 'lucide-react';
import { useState } from 'react';

const naira = (n) => `₦${Number(n || 0).toLocaleString('en-NG')}`;

function lineItems(order) {
  const rows = [];
  (order.items || []).forEach((i) => rows.push({ name: i.name, qty: i.quantity || 1, unitPrice: i.price ?? (i.total && i.quantity ? i.total / i.quantity : 0), total: i.total ?? (i.price || 0) * (i.quantity || 1) }));
  (order.mealPackages || []).forEach((m) => rows.push({ name: m.label || m.name || 'Meal Package', qty: m.quantity || 1, unitPrice: m.unitPrice ?? m.price ?? 0, total: m.total ?? ((m.unitPrice ?? m.price ?? 0) * (m.quantity || 1)) }));
  (order.storeExtras || []).forEach((e) => rows.push({ name: e.label || e.item || 'Extra', qty: e.qty || e.quantity || 1, unitPrice: e.unitPrice ?? e.price ?? 0, total: e.total ?? ((e.unitPrice ?? e.price ?? 0) * (e.qty || e.quantity || 1)) }));
  return rows;
}

export default function Receipt({ order, business, showActions = true }) {
  const [copied, setCopied] = useState(false);
  if (!order) return null;

  const items = lineItems(order);
  const dateObj = new Date(order.createdAt);
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/receipt/${order._id}` : '';

  const handlePrint = () => window.print();

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Receipt ${order.order_id}`, text: `Your Solohans receipt for order ${order.order_id}`, url: shareUrl });
        return;
      } catch { /* user cancelled — fall through to copy */ }
    }
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-md mx-auto">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .receipt-printable, .receipt-printable * { visibility: visible; }
          .receipt-printable { position: absolute; top: 0; left: 0; width: 100%; box-shadow: none; border: none; }
        }
      `}</style>
      {showActions && (
        <div className="flex gap-2 mb-4 print:hidden">
          <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 bg-[#C62828] text-white py-2.5 rounded-full font-semibold text-sm hover:bg-[#B71C1C]">
            <Printer size={16} /> Print / Save as PDF
          </button>
          <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 border border-gray-200 py-2.5 rounded-full font-semibold text-sm hover:bg-gray-50">
            {copied ? <><Check size={16} /> Link Copied</> : navigator.share ? <><Share2 size={16} /> Share</> : <><LinkIcon size={16} /> Copy Link</>}
          </button>
        </div>
      )}

      <div className="receipt-printable bg-white rounded-2xl shadow-sm border border-gray-100 p-6 font-mono text-sm text-gray-800">
        <div className="text-center mb-4">
          {business?.logo && <img src={business.logo} alt="" className="h-14 mx-auto mb-2 object-contain" />}
          <p className="font-bold text-base">{business?.name || 'Solohans Delicious Meals'}</p>
          {business?.tagline && <p className="text-xs text-gray-500 italic">{business.tagline}</p>}
          {business?.address && <p className="text-xs text-gray-500">{business.address}</p>}
          {business?.phone && <p className="text-xs text-gray-500">{business.phone}</p>}
          {business?.email && <p className="text-xs text-gray-500">{business.email}</p>}
        </div>

        <div className="border-t border-dashed border-gray-300 my-3" />

        <div className="space-y-0.5 text-xs">
          <div className="flex justify-between"><span className="text-gray-500">Order ID</span><span className="font-semibold">{order.order_id}</span></div>
          {order.invoiceNumber && <div className="flex justify-between"><span className="text-gray-500">Invoice No.</span><span className="font-semibold">{order.invoiceNumber}</span></div>}
          <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{dateObj.toLocaleDateString('en-GB')} {dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span></div>
          {order.customerName && <div className="flex justify-between"><span className="text-gray-500">Customer</span><span>{order.customerName}</span></div>}
          {order.staffNameSnapshot && <div className="flex justify-between"><span className="text-gray-500">Served by</span><span>{order.staffNameSnapshot}</span></div>}
          {order.platform && order.platform !== 'Walk-in' && (
            <div className="flex justify-between"><span className="text-gray-500">Platform</span><span>{order.platform} #{order.externalOrderId}</span></div>
          )}
        </div>

        <div className="border-t border-dashed border-gray-300 my-3" />

        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500">
              <th className="text-left font-normal pb-1">Item</th>
              <th className="text-center font-normal pb-1">Qty</th>
              <th className="text-right font-normal pb-1">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx}>
                <td className="py-0.5">{it.name}</td>
                <td className="py-0.5 text-center">{it.qty}</td>
                <td className="py-0.5 text-right">{naira(it.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-dashed border-gray-300 my-3" />

        <div className="space-y-0.5 text-xs">
          {order.items_subtotal > 0 && <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{naira(order.items_subtotal)}</span></div>}
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-green-700"><span>{order.discount_label || 'Discount'}</span><span>−{naira(order.discount_amount)}</span></div>
          )}
          {order.tax_amount > 0 && <div className="flex justify-between"><span className="text-gray-500">VAT ({order.tax_rate}%)</span><span>{naira(order.tax_amount)}</span></div>}
          {order.delivery_fee > 0 && <div className="flex justify-between"><span className="text-gray-500">Delivery Fee</span><span>{naira(order.delivery_fee)}</span></div>}
          <div className="flex justify-between text-base font-bold pt-1"><span>Total</span><span>{naira(order.totalAmount)}</span></div>
        </div>

        <div className="border-t border-dashed border-gray-300 my-3" />

        <div className="text-xs space-y-0.5">
          <div className="flex justify-between"><span className="text-gray-500">Payment Method</span><span>{order.paymentMethod || '—'}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Payment Status</span><span className={order.payment_status === 'paid' ? 'text-green-600 font-semibold' : 'text-amber-600 font-semibold'}>{order.payment_status || 'unpaid'}</span></div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">Thank you for choosing {business?.name || 'Solohans Delicious Meals'}! 🙏</p>
      </div>
    </div>
  );
}
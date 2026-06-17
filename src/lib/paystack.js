import PaystackPop from '@paystack/inline-js';

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

export const initializePaystack = ({
  email,
  amount,
  orderId,
  onSuccess,
  onClose,
}) => {
  if (!PAYSTACK_PUBLIC_KEY) {
    alert('Paystack public key is missing');
    return;
  }

  if (!email || !email.includes('@')) {
    alert('Valid email is required');
    return;
  }

  if (!amount || amount <= 0) {
    alert('Invalid amount');
    return;
  }

  const paystack = new PaystackPop();

  // 🔍 THIS WILL PRINT THE REAL KEY TO THE CONSOLE
  console.log('🔑 LIVE KEY CHECK:', PAYSTACK_PUBLIC_KEY);

  paystack.newTransaction({
    key: PAYSTACK_PUBLIC_KEY,
    email: email.trim(),
    amount: Math.round(Number(amount) * 100),
    ref: String(orderId),
    currency: 'NGN',
    channels: ['bank', 'card', 'ussd', 'qr'],
    metadata: {
      order_id: orderId,
    },
    onSuccess: (transaction) => {
      console.log('✅ Paystack success:', transaction);
      onSuccess?.(transaction);
    },
    onClose: () => {
      console.log('❌ Paystack closed');
      onClose?.();
    },
    onError: (error) => {
      console.error('Paystack error:', error);
      alert(error?.message || 'Payment failed');
    },
  });
};
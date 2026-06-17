import { useState, useEffect } from 'react';

const AdminPayout = () => {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Create recipient form
  const [recipientForm, setRecipientForm] = useState({
    name: '',
    account_number: '',
    bank_code: '',
  });

  // Transfer form
  const [transferForm, setTransferForm] = useState({
    recipient_code: '',
    amount: '',
    reason: '',
  });

  // OTP form (shown if transfer requires OTP)
  const [otpRequired, setOtpRequired] = useState(false);
  const [transferCode, setTransferCode] = useState('');
  const [otp, setOtp] = useState('');

  // Load banks on mount
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await fetch('/api/transfer/banks');
        const { data } = await res.json();
        setBanks(data || []);
      } catch (err) {
        console.error('Failed to load banks', err);
      }
    };
    fetchBanks();
  }, []);

  // ---- Create Recipient ----
  const handleCreateRecipient = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/transfer/recipient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipientForm),
      });
      const result = await res.json();
      if (result.success) {
        setMessage(`Recipient created! Code: ${result.data.recipient_code}`);
        // Auto-fill the transfer form with this code
        setTransferForm(prev => ({ ...prev, recipient_code: result.data.recipient_code }));
      } else {
        setMessage('Error: ' + result.message);
      }
    } catch (err) {
      setMessage('Network error');
    } finally {
      setLoading(false);
    }
  };

  // ---- Initiate Transfer ----
  const handleInitiateTransfer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setOtpRequired(false);
    try {
      const res = await fetch('/api/transfer/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferForm),
      });
      const result = await res.json();
      if (!result.success) {
        setMessage('Transfer failed: ' + result.message);
      } else if (result.data.status === 'otp_required') {
        setOtpRequired(true);
        setTransferCode(result.data.transfer_code);
        setMessage('OTP is required to finalize the transfer. Enter it below.');
      } else {
        setMessage('Transfer initiated successfully!');
      }
    } catch (err) {
      setMessage('Network error');
    } finally {
      setLoading(false);
    }
  };

  // ---- Finalize Transfer with OTP ----
  const handleFinalizeTransfer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/transfer/transfer/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transfer_code: transferCode, otp }),
      });
      const result = await res.json();
      if (result.success) {
        setMessage('Transfer completed successfully!');
        setOtpRequired(false);
      } else {
        setMessage('Finalization failed: ' + result.message);
      }
    } catch (err) {
      setMessage('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem' }}>
      <h2>Admin Payout (Bank Transfer)</h2>

      {/* ---- Create Recipient Section ---- */}
      <section style={{ border: '1px solid #ddd', padding: '1rem', marginBottom: '2rem' }}>
        <h3>Create Recipient</h3>
        <form onSubmit={handleCreateRecipient}>
          <input
            type="text"
            placeholder="Account Name"
            value={recipientForm.name}
            onChange={e => setRecipientForm({ ...recipientForm, name: e.target.value })}
            required
            style={{ display: 'block', margin: '0.5rem 0', width: '100%', padding: '8px' }}
          />
          <input
            type="text"
            placeholder="Account Number"
            value={recipientForm.account_number}
            onChange={e => setRecipientForm({ ...recipientForm, account_number: e.target.value })}
            required
            style={{ display: 'block', margin: '0.5rem 0', width: '100%', padding: '8px' }}
          />
          <select
            value={recipientForm.bank_code}
            onChange={e => setRecipientForm({ ...recipientForm, bank_code: e.target.value })}
            required
            style={{ display: 'block', margin: '0.5rem 0', width: '100%', padding: '8px' }}
          >
            <option value="">Select Bank</option>
            {banks.map(bank => (
              <option key={bank.code} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </select>
          <button type="submit" disabled={loading} style={{ padding: '10px 20px' }}>
            {loading ? 'Creating...' : 'Create Recipient'}
          </button>
        </form>
      </section>

      {/* ---- Transfer Section ---- */}
      <section style={{ border: '1px solid #ddd', padding: '1rem' }}>
        <h3>Send Transfer</h3>
        <form onSubmit={handleInitiateTransfer}>
          <input
            type="text"
            placeholder="Recipient Code (RCP_...)"
            value={transferForm.recipient_code}
            onChange={e => setTransferForm({ ...transferForm, recipient_code: e.target.value })}
            required
            style={{ display: 'block', margin: '0.5rem 0', width: '100%', padding: '8px' }}
          />
          <input
            type="number"
            placeholder="Amount (₦)"
            value={transferForm.amount}
            onChange={e => setTransferForm({ ...transferForm, amount: e.target.value })}
            required
            style={{ display: 'block', margin: '0.5rem 0', width: '100%', padding: '8px' }}
          />
          <input
            type="text"
            placeholder="Reason (optional)"
            value={transferForm.reason}
            onChange={e => setTransferForm({ ...transferForm, reason: e.target.value })}
            style={{ display: 'block', margin: '0.5rem 0', width: '100%', padding: '8px' }}
          />
          <button type="submit" disabled={loading} style={{ padding: '10px 20px' }}>
            {loading ? 'Sending...' : 'Send Transfer'}
          </button>
        </form>

        {/* ---- OTP Section (conditionally shown) ---- */}
        {otpRequired && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9f9f9' }}>
            <h4>Enter OTP to Finalize</h4>
            <form onSubmit={handleFinalizeTransfer}>
              <input
                type="text"
                placeholder="OTP"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                style={{ display: 'block', margin: '0.5rem 0', width: '100%', padding: '8px' }}
              />
              <button type="submit" disabled={loading} style={{ padding: '10px 20px' }}>
                {loading ? 'Finalizing...' : 'Finalize Transfer'}
              </button>
            </form>
          </div>
        )}
      </section>

      {message && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#eef', border: '1px solid blue' }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default AdminPayout;
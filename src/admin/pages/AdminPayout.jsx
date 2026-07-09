import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { transfer as transferApi } from '../../lib/api';

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
        const data = await transferApi.getBanks();
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
      const data = await transferApi.createRecipient(recipientForm);
      setMessage(`Recipient created! Code: ${data.recipient_code}`);
      // Auto-fill the transfer form with this code
      setTransferForm(prev => ({ ...prev, recipient_code: data.recipient_code }));
    } catch (err) {
      setMessage('Error: ' + err.message);
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
      const data = await transferApi.initiateTransfer(transferForm);
      if (data.status === 'otp_required') {
        setOtpRequired(true);
        setTransferCode(data.transfer_code);
        setMessage('OTP is required to finalize the transfer. Enter it below.');
      } else {
        setMessage('Transfer initiated successfully!');
      }
    } catch (err) {
      setMessage('Transfer failed: ' + err.message);
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
      await transferApi.finalizeTransfer({ transfer_code: transferCode, otp });
      setMessage('Transfer completed successfully!');
      setOtpRequired(false);
    } catch (err) {
      setMessage('Finalization failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Payouts – Solohans Admin</title></Helmet>
      <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem' }}>
      <h2>Admin Payout (Bank Transfer)</h2>
      <p style={{ color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '0.75rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
        ⚠️ This sends real money out of the business Paystack balance. Admin-only, and every action here is recorded in the Audit Log.
      </p>

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
    </>
  );
};

export default AdminPayout;
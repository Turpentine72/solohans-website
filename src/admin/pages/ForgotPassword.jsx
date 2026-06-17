import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Mail, ArrowLeft } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext'; // ✅ dynamic logo

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const FALLBACK_LOGO = 'https://via.placeholder.com/64?text=Logo'; // optional fallback

export default function ForgotPassword() {
  const { settings } = useSettings();        // get site settings
  const logo = settings?.logo || FALLBACK_LOGO; // dynamic logo URL

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const goToReset = () => {
    navigate(`/admin/reset-password?email=${encodeURIComponent(email)}`);
  };

  return (
    <>
      <Helmet><title>Forgot Password – Solohans Admin</title></Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="text-center mb-8">
            <img
              src={logo}
              alt="Logo"
              className="h-16 w-16 mx-auto rounded-full object-cover"
            />
            <h1 className="text-2xl font-bold text-[#222222] mt-4">Forgot Password</h1>
            <p className="text-gray-500 text-sm mt-1">We'll send an OTP to your email</p>
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

          {!sent ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828]"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C] transition-colors disabled:opacity-70"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
              <Link to="/admin/login" className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-[#C62828]">
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </form>
          ) : (
            <div className="text-center">
              <p className="text-green-600 mb-4">OTP sent to {email}</p>
              <p className="text-sm text-gray-500 mb-6">(Check console for the OTP in development)</p>
              <button onClick={goToReset} className="w-full py-3 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C] transition-colors">
                Enter OTP & Reset Password
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { auth as authApi } from '../../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [showPasswords, setShowPasswords] = useState(false);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendsLeft, setResendsLeft] = useState(3);

  const handleRequestChange = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.requestChangePassword(form.currentPassword, form.newPassword, form.confirmPassword);
      setStep('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendsLeft <= 0) {
      setError('Maximum resend limit reached — please start again');
      return;
    }
    try {
      await authApi.resendChangePasswordOtp();
      setResendsLeft(r => r - 1);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.verifyChangePassword(otp);
      alert('Password changed successfully. Please log in again.');
      logout();
      navigate('/admin/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>My Profile – Solohans Admin</title></Helmet>
      <div className="max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">My Profile</h1>
        <p className="text-gray-500 text-sm mb-6">{session?.name || session?.email} — {session?.role}</p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><KeyRound size={20} /> Change Password</h2>

          {step === 'form' ? (
            <form onSubmit={handleRequestChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={form.currentPassword}
                    onChange={e => setForm({ ...form, currentPassword: e.target.value })}
                    required
                    className="w-full px-4 py-3 border rounded-xl pr-10"
                  />
                  <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={e => setForm({ ...form, newPassword: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  required
                  className="w-full px-4 py-3 border rounded-xl"
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full py-3 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C] disabled:opacity-50">
                {loading ? 'Sending code…' : 'Send Verification Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-sm text-gray-600">We sent a 6-digit code to your email. It expires in 5 minutes.</p>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                maxLength={6}
                className="w-full px-4 py-3 border rounded-xl text-center text-2xl tracking-widest"
              />
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full py-3 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C] disabled:opacity-50">
                {loading ? 'Verifying…' : 'Confirm Password Change'}
              </button>
              <button type="button" onClick={handleResend} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700">
                Resend code ({resendsLeft} left)
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

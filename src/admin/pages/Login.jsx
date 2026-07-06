import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import defaultLogo from '../../assets/5e82d2b1-ebb5-4e77-8fa1-91fae5baab69.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { settings } = useSettings(); // ✅ dynamic settings
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ✅ If we were just force-logged-out (deactivated account, or session
  // invalidated from another device), show exactly why — this is the
  // message request() in lib/api.js redirected here with.
  useEffect(() => {
    const sessionMsg = searchParams.get('sessionMsg');
    if (sessionMsg) setError(sessionMsg);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/admin', { replace: true });
    } catch (err) {
      // Show the real backend message — this is what surfaces the exact
      // "Your account has been deactivated..." text when a deactivated
      // staff member tries to log in.
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // Use settings logo if available, otherwise fallback to default
  const logo = settings?.logo || defaultLogo;

  return (
    <>
      <Helmet><title>Admin Login – Solohans</title></Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="text-center mb-8">
            <img
              src={logo}
              alt="Logo"
              className="h-16 w-16 mx-auto rounded-full object-cover"
            />
            <h1 className="text-2xl font-bold text-[#222222] mt-4">Admin Login</h1>
            <p className="text-gray-500 text-sm mt-1">Welcome back</p>
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/admin/forgot-password" className="text-sm text-[#C62828] hover:underline">Forgot Password?</Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C] transition-colors disabled:opacity-70"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
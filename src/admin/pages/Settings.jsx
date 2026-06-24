import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Save, Upload, X, Mail, Lock, CreditCard, Globe, Eye, EyeOff, Unlock } from 'lucide-react';
import { settingsApi, uploadFile } from '../../lib/api';
import { useSettings } from '../../context/SettingsContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function Settings() {
  const { refetch } = useSettings();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // General settings (business + social)
  const [general, setGeneral] = useState({
    name: '',
    logo: '',
    tagline: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    mapUrl: '',
    workingHours: '',
    businessHours: { enabled: false, openTime: '08:00', closeTime: '22:00' },
    tax: { enabled: false, rate: 0 },
    social: {
      facebook: '',
      instagram: '',
      tiktok: '',
      snapchat: '',
    }
  });

  // Payment settings
  const [payment, setPayment] = useState({
    paystackPublicKey: '',
    paystackSecretKey: '',
  });

  // Logo upload states
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Account management
  const [accountForm, setAccountForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    newEmail: '',
    otp: '',
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpAction, setOtpAction] = useState(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [accountSuccess, setAccountSuccess] = useState('');

  // Payment keys unlock
  const [paymentUnlocked, setPaymentUnlocked] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  // Password visibility toggles for Account tab
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await settingsApi.getAdmin();
      setGeneral({
        name: data.name || '',
        logo: data.logo || '',
        tagline: data.tagline || '',
        phone: data.phone || '',
        whatsapp: data.whatsapp || '',
        email: data.email || '',
        address: data.address || '',
        mapUrl: data.mapUrl || '',
        workingHours: data.workingHours || '',
        businessHours: {
          enabled: data.businessHours?.enabled || false,
          openTime: data.businessHours?.openTime || '08:00',
          closeTime: data.businessHours?.closeTime || '22:00',
        },
        tax: {
          enabled: data.tax?.enabled || false,
          rate: data.tax?.rate || 0,
        },
        social: data.social || { facebook: '', instagram: '', tiktok: '', snapchat: '' },
      });
      setPayment({
        paystackPublicKey: data.payment?.paystackPublicKey || '',
        paystackSecretKey: data.payment?.paystackSecretKey || '',
      });
      if (data.logo) setLogoPreview(data.logo);
    } catch (err) {
      console.error(err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('social.')) {
      const socialKey = name.split('.')[1];
      setGeneral(prev => ({
        ...prev,
        social: { ...prev.social, [socialKey]: value }
      }));
    } else {
      setGeneral(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePaymentChange = (e) => {
    setPayment(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setGeneral(prev => ({ ...prev, logo: '' }));
  };

  const saveGeneral = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      let logoUrl = general.logo;
      if (logoFile) {
        setUploadingLogo(true);
        const uploadedUrl = await uploadFile(logoFile, 'settings');
        if (uploadedUrl) logoUrl = uploadedUrl;
        else throw new Error('Logo upload failed');
        setUploadingLogo(false);
      }
      const dataToSave = { ...general, logo: logoUrl };
      await settingsApi.update(dataToSave);
      await refetch();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setLogoFile(null);
    } catch (err) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
      setUploadingLogo(false);
    }
  };

  const savePayment = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await settingsApi.update({ payment });
      await refetch();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  };

  const sendOtp = async (action) => {
    setSendingOtp(true);
    setAccountError('');
    setAccountSuccess('');
    try {
      const token = localStorage.getItem('solohans_token');
      const res = await fetch(`${API_BASE}/admin/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ purpose: action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOtpSent(true);
      setOtpAction(action);
      alert(`OTP sent to your registered email`);
    } catch (err) {
      setAccountError(err.message);
    } finally {
      setSendingOtp(false);
    }
  };

  const changeEmail = async () => {
    if (!accountForm.newEmail) {
      setAccountError('Please enter new email');
      return;
    }
    if (!accountForm.otp) {
      setAccountError('Please enter OTP');
      return;
    }
    setSaving(true);
    setAccountError('');
    setAccountSuccess('');
    try {
      const token = localStorage.getItem('solohans_token');
      const res = await fetch(`${API_BASE}/admin/change-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ newEmail: accountForm.newEmail, otp: accountForm.otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      localStorage.setItem('solohans_token', data.token);
      if (data.user) localStorage.setItem('solohans_user', JSON.stringify(data.user));

      setAccountSuccess('Email updated successfully! Page will refresh.');
      setAccountForm(prev => ({ ...prev, newEmail: '', otp: '' }));
      setOtpSent(false);
      setOtpAction(null);
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      setAccountError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!accountForm.currentPassword || !accountForm.newPassword) {
      setAccountError('Please fill all password fields');
      return;
    }
    if (accountForm.newPassword !== accountForm.confirmPassword) {
      setAccountError('New passwords do not match');
      return;
    }
    if (!accountForm.otp) {
      setAccountError('Please enter OTP');
      return;
    }
    setSaving(true);
    setAccountError('');
    setAccountSuccess('');
    try {
      const token = localStorage.getItem('solohans_token');
      const res = await fetch(`${API_BASE}/admin/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          currentPassword: accountForm.currentPassword,
          newPassword: accountForm.newPassword,
          otp: accountForm.otp
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setAccountSuccess('Password updated successfully!');
      setAccountForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        otp: ''
      }));
      setOtpSent(false);
      setOtpAction(null);
      // Also hide passwords after successful change
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      setAccountError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ─── Unlock payment settings ────────────────────────────────────────────────
  const handleUnlockPayment = async (e) => {
    e.preventDefault();
    if (!unlockPassword) return setUnlockError('Enter your password');
    setVerifyingPassword(true);
    setUnlockError('');
    try {
      const token = localStorage.getItem('solohans_token');
      const res = await fetch(`${API_BASE}/admin/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: unlockPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification failed');
      setPaymentUnlocked(true);
      setUnlockPassword('');
    } catch (err) {
      setUnlockError(err.message);
    } finally {
      setVerifyingPassword(false);
    }
  };

  const lockPayment = () => {
    setPaymentUnlocked(false);
    setUnlockPassword('');
    setUnlockError('');
    setShowSecret(false);
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <>
      <Helmet><title>Settings – Solohans Admin</title></Helmet>
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Settings</h1>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-6">
            {[
              { id: 'general', label: 'General', icon: <Globe size={18} /> },
              { id: 'payments', label: 'Payments', icon: <CreditCard size={18} /> },
              { id: 'account', label: 'Account', icon: <Lock size={18} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-[#C62828] text-[#C62828]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* General Tab */}
        {activeTab === 'general' && (
          <form onSubmit={saveGeneral} className="space-y-6 max-w-2xl">
            {error && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm">{error}</div>}
            
            <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-5">
              <h2 className="text-xl font-bold">Business Information</h2>
              <div><label>Restaurant Name</label><input type="text" name="name" value={general.name} onChange={handleGeneralChange} className="w-full px-4 py-3 border rounded-xl" /></div>
              
              <div>
                <label>Logo</label>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {logoPreview && <div className="relative"><img src={logoPreview} className="h-20 w-20 rounded-xl object-cover border" /><button type="button" onClick={removeLogo} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X size={14} /></button></div>}
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl cursor-pointer"><Upload size={18} /> Upload Logo<input type="file" accept="image/*" onChange={handleLogoFileChange} className="hidden" /></label>
                  <span className="text-xs text-gray-400">or</span>
                  <input type="url" name="logo" value={general.logo} onChange={handleGeneralChange} placeholder="Logo URL" className="flex-1 px-4 py-2 border rounded-xl text-sm" />
                </div>
              </div>

              <div><label>Tagline</label><input type="text" name="tagline" value={general.tagline} onChange={handleGeneralChange} className="w-full px-4 py-3 border rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-4"><div><label>Phone</label><input type="tel" name="phone" value={general.phone} onChange={handleGeneralChange} className="w-full px-4 py-3 border rounded-xl" /></div><div><label>WhatsApp</label><input type="tel" name="whatsapp" value={general.whatsapp} onChange={handleGeneralChange} className="w-full px-4 py-3 border rounded-xl" /></div></div>
              <div><label>Email</label><input type="email" name="email" value={general.email} onChange={handleGeneralChange} className="w-full px-4 py-3 border rounded-xl" /></div>
              <div><label>Address</label><textarea name="address" rows={2} value={general.address} onChange={handleGeneralChange} className="w-full px-4 py-3 border rounded-xl" /></div>
              <div><label>Google Maps Embed URL</label><input type="url" name="mapUrl" value={general.mapUrl} onChange={handleGeneralChange} className="w-full px-4 py-3 border rounded-xl" /></div>
              <div><label>Working Hours (HTML allowed)</label><textarea name="workingHours" rows={2} value={general.workingHours} onChange={handleGeneralChange} className="w-full px-4 py-3 border rounded-xl" /></div>

              <div className="border rounded-xl p-4 bg-gray-50">
                <label className="flex items-center gap-3 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={general.businessHours.enabled}
                    onChange={(e) => setGeneral(prev => ({ ...prev, businessHours: { ...prev.businessHours, enabled: e.target.checked } }))}
                    className="w-5 h-5"
                  />
                  <span className="font-medium">Enforce business hours (auto-decline orders outside these hours)</span>
                </label>
                {general.businessHours.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1">Opening Time (Lagos time)</label>
                      <input
                        type="time"
                        value={general.businessHours.openTime}
                        onChange={(e) => setGeneral(prev => ({ ...prev, businessHours: { ...prev.businessHours, openTime: e.target.value } }))}
                        className="w-full px-3 py-2 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Closing Time (Lagos time)</label>
                      <input
                        type="time"
                        value={general.businessHours.closeTime}
                        onChange={(e) => setGeneral(prev => ({ ...prev, businessHours: { ...prev.businessHours, closeTime: e.target.value } }))}
                        className="w-full px-3 py-2 border rounded-xl"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="border rounded-xl p-4 bg-gray-50">
                <label className="flex items-center gap-3 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={general.tax.enabled}
                    onChange={(e) => setGeneral(prev => ({ ...prev, tax: { ...prev.tax, enabled: e.target.checked } }))}
                    className="w-5 h-5"
                  />
                  <span className="font-medium">Charge tax on orders (off by default)</span>
                </label>
                {general.tax.enabled && (
                  <div>
                    <label className="block text-sm mb-1">Tax Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={general.tax.rate}
                      onChange={(e) => setGeneral(prev => ({ ...prev, tax: { ...prev.tax, rate: Number(e.target.value) } }))}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-5">
              <h2 className="text-xl font-bold">Social Media Links</h2>
              <div><label>Facebook</label><input type="url" name="social.facebook" value={general.social.facebook} onChange={handleGeneralChange} className="w-full px-4 py-3 border rounded-xl" /></div>
              <div><label>Instagram</label><input type="url" name="social.instagram" value={general.social.instagram} onChange={handleGeneralChange} className="w-full px-4 py-3 border rounded-xl" /></div>
              <div><label>TikTok</label><input type="url" name="social.tiktok" value={general.social.tiktok} onChange={handleGeneralChange} className="w-full px-4 py-3 border rounded-xl" /></div>
              <div><label>Snapchat</label><input type="url" name="social.snapchat" value={general.social.snapchat} onChange={handleGeneralChange} className="w-full px-4 py-3 border rounded-xl" /></div>
            </div>

            <div className="flex items-center gap-4">
              <button type="submit" disabled={saving || uploadingLogo} className="flex items-center gap-2 bg-[#C62828] text-white px-6 py-3 rounded-full font-semibold disabled:opacity-50"><Save size={18} /> {saving ? 'Saving...' : 'Save General Settings'}</button>
              {saved && <span className="text-green-600 text-sm">Saved!</span>}
            </div>
          </form>
        )}

        {/* Payments Tab – locked until password verified */}
        {activeTab === 'payments' && (
          <div className="space-y-6 max-w-2xl">
            {error && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm">{error}</div>}
            <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <CreditCard size={20} /> Paystack Configuration
                </h2>
                {paymentUnlocked ? (
                  <button
                    type="button"
                    onClick={lockPayment}
                    className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                  >
                    <Lock size={16} /> Lock again
                  </button>
                ) : (
                  <Lock size={20} className="text-gray-400" />
                )}
              </div>

              {!paymentUnlocked ? (
                /* LOCKED STATE */
                <form onSubmit={handleUnlockPayment} className="space-y-4 border-t pt-4">
                  <p className="text-sm text-gray-500">Enter your admin password to view or edit payment keys.</p>
                  {unlockError && <div className="bg-red-50 text-red-700 p-2 rounded-lg text-sm">{unlockError}</div>}
                  <input
                    type="password"
                    placeholder="Your admin password"
                    value={unlockPassword}
                    onChange={e => setUnlockPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={verifyingPassword}
                    className="flex items-center gap-2 bg-[#C62828] text-white px-5 py-2 rounded-full font-semibold disabled:opacity-50"
                  >
                    <Unlock size={18} /> {verifyingPassword ? 'Verifying...' : 'Unlock Keys'}
                  </button>
                </form>
              ) : (
                /* UNLOCKED STATE – editable fields */
                <form onSubmit={savePayment} className="space-y-4 border-t pt-4">
                  <div>
                    <label>Public Key</label>
                    <input
                      type="text"
                      name="paystackPublicKey"
                      value={payment.paystackPublicKey}
                      onChange={handlePaymentChange}
                      className="w-full px-4 py-3 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label>Secret Key</label>
                    <div className="relative">
                      <input
                        type={showSecret ? 'text' : 'password'}
                        name="paystackSecretKey"
                        value={payment.paystackSecretKey}
                        onChange={handlePaymentChange}
                        className="w-full px-4 py-3 pr-12 border rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        tabIndex={-1}
                      >
                        {showSecret ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 bg-[#C62828] text-white px-6 py-3 rounded-full font-semibold disabled:opacity-50"
                    >
                      <Save size={18} /> {saving ? 'Saving...' : 'Save Payment Settings'}
                    </button>
                    {saved && <span className="text-green-600 text-sm">Saved!</span>}
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="space-y-6 max-w-2xl">
            {accountError && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm">{accountError}</div>}
            {accountSuccess && <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm">{accountSuccess}</div>}

            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Mail size={20} /> Change Email</h2>
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="New Email"
                  value={accountForm.newEmail}
                  onChange={e => setAccountForm({ ...accountForm, newEmail: e.target.value })}
                  disabled={saving || sendingOtp}
                  className="w-full px-4 py-3 border rounded-xl disabled:bg-gray-100"
                />
                {!otpSent || otpAction !== 'email' ? (
                  <button
                    type="button"
                    onClick={() => sendOtp('email')}
                    disabled={sendingOtp || saving}
                    className="bg-gray-200 px-4 py-2 rounded-xl disabled:opacity-50"
                  >
                    {sendingOtp ? 'Sending...' : 'Send OTP'}
                  </button>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Enter OTP"
                      value={accountForm.otp}
                      onChange={e => setAccountForm({ ...accountForm, otp: e.target.value })}
                      disabled={saving}
                      className="w-full px-4 py-3 border rounded-xl disabled:bg-gray-100"
                    />
                    <button
                      type="button"
                      onClick={changeEmail}
                      disabled={saving}
                      className="bg-[#C62828] text-white px-6 py-2 rounded-full disabled:opacity-50"
                    >
                      {saving ? 'Updating...' : 'Confirm Email Change'}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Lock size={20} /> Change Password</h2>
              <div className="space-y-4">
                {/* Current Password with eye icon */}
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Current Password"
                    value={accountForm.currentPassword}
                    onChange={e => setAccountForm({ ...accountForm, currentPassword: e.target.value })}
                    disabled={saving || sendingOtp}
                    className="w-full px-4 py-3 pr-12 border rounded-xl disabled:bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* New Password with eye icon */}
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="New Password"
                    value={accountForm.newPassword}
                    onChange={e => setAccountForm({ ...accountForm, newPassword: e.target.value })}
                    disabled={saving || sendingOtp}
                    className="w-full px-4 py-3 pr-12 border rounded-xl disabled:bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Confirm Password with eye icon */}
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm New Password"
                    value={accountForm.confirmPassword}
                    onChange={e => setAccountForm({ ...accountForm, confirmPassword: e.target.value })}
                    disabled={saving || sendingOtp}
                    className="w-full px-4 py-3 pr-12 border rounded-xl disabled:bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {!otpSent || otpAction !== 'password' ? (
                  <button
                    type="button"
                    onClick={() => sendOtp('password')}
                    disabled={sendingOtp || saving}
                    className="bg-gray-200 px-4 py-2 rounded-xl disabled:opacity-50"
                  >
                    {sendingOtp ? 'Sending...' : 'Send OTP'}
                  </button>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Enter OTP"
                      value={accountForm.otp}
                      onChange={e => setAccountForm({ ...accountForm, otp: e.target.value })}
                      disabled={saving}
                      className="w-full px-4 py-3 border rounded-xl disabled:bg-gray-100"
                    />
                    <button
                      type="button"
                      onClick={changePassword}
                      disabled={saving}
                      className="bg-[#C62828] text-white px-6 py-2 rounded-full disabled:opacity-50"
                    >
                      {saving ? 'Updating...' : 'Confirm Password Change'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
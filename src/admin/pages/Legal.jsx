import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Save } from 'lucide-react';
import { settingsApi } from '../../lib/api';

export default function Legal() {
  const [privacyPolicy, setPrivacyPolicy] = useState('');
  const [termsOfService, setTermsOfService] = useState('');
  const [paymentPolicy, setPaymentPolicy] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await settingsApi.get();
      setPrivacyPolicy(data.privacyPolicy || '');
      setTermsOfService(data.termsOfService || '');
      setPaymentPolicy(data.paymentPolicy || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsApi.update({
        privacyPolicy,
        termsOfService,
        paymentPolicy,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <>
      <Helmet><title>Legal Pages – Solohans Admin</title></Helmet>
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Legal Pages</h1>

        <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">Privacy Policy</h2>
            <textarea
              value={privacyPolicy}
              onChange={(e) => setPrivacyPolicy(e.target.value)}
              rows={15}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-[#C62828]"
              placeholder="Enter your privacy policy (HTML allowed)..."
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">Terms of Service</h2>
            <textarea
              value={termsOfService}
              onChange={(e) => setTermsOfService(e.target.value)}
              rows={15}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-[#C62828]"
              placeholder="Enter your terms of service (HTML allowed)..."
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">Payment Policy</h2>
            <textarea
              value={paymentPolicy}
              onChange={(e) => setPaymentPolicy(e.target.value)}
              rows={15}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-[#C62828]"
              placeholder="Enter your payment policy (HTML allowed)..."
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-[#C62828] text-white px-6 py-3 rounded-full font-semibold disabled:opacity-50"
            >
              <Save size={18} /> {saving ? 'Saving...' : 'Save All Changes'}
            </button>
            {saved && <span className="text-green-600 text-sm">Saved!</span>}
          </div>
        </form>
      </div>
    </>
  );
}
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

const replacePlaceholders = (template, settings) => {
  if (!template) return '';
  return template
    .replace(/\{\{name\}\}/g, settings?.name || '')
    .replace(/\{\{email\}\}/g, settings?.email || '')
    .replace(/\{\{phone\}\}/g, settings?.phone || '')
    .replace(/\{\{address\}\}/g, settings?.address || '')
    .replace(/\{\{whatsapp\}\}/g, settings?.whatsapp || '')
    .replace(/\{\{tagline\}\}/g, settings?.tagline || '');
};

export default function Privacy() {
  const { settings } = useSettings();
  const rawContent = settings?.privacyPolicy || '';
  const content = replacePlaceholders(rawContent, settings);

  return (
    <>
      <Helmet><title>Privacy Policy – Solohans</title></Helmet>
      <div className="max-w-4xl mx-auto py-16 px-6">
        <Link to="/" className="text-[#C62828] hover:underline text-sm mb-8 inline-block">← Back to Home</Link>
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        {content ? (
          <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <p className="text-gray-500">No privacy policy has been set yet.</p>
        )}
      </div>
    </>
  );
}
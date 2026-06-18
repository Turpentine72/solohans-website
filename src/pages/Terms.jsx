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

export default function Terms() {
  const { settings } = useSettings();
  const rawContent = settings?.termsOfService || '';
  const content = replacePlaceholders(rawContent, settings);

  return (
    <>
      <Helmet>
        <title>Terms of Service – Solohans Delicious Meals | Food Delivery Lagos</title>
        <meta name="description" content="Read the terms of service for Solohans Delicious Meals. Order fresh Nigerian food online in Lagos with confidence – know your rights and our commitments." />
      </Helmet>
      <div className="max-w-4xl mx-auto py-16 px-6">
        <Link to="/" className="text-[#C62828] hover:underline text-sm mb-8 inline-block">← Back to Home</Link>
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
        {content ? (
          <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <p className="text-gray-500">No terms of service have been set yet.</p>
        )}
      </div>
    </>
  );
}
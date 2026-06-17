import { Helmet } from 'react-helmet-async';
import { Phone, Mail, MapPin, ShoppingCart, Send, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { contacts } from '../lib/api';
import { useSettings } from '../context/SettingsContext';
import heroImage from '../assets/photo-1540189549336-e6e99c3679fe.avif';

const Contact = () => {
  const { settings, loading: settingsLoading } = useSettings();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  useEffect(() => {
    const orderItem = searchParams.get('order');
    if (orderItem) {
      setFormData((prev) => ({
        ...prev,
        message: `Hello, I would like to order ${orderItem} from ${settings?.name || 'Solohans Delicious Meals'}.`,
      }));
    }
  }, [searchParams, settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await contacts.send(formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const heroWords = ['Get', 'In', 'Touch'];

  if (settingsLoading) return <div className="text-center py-12">Loading...</div>;

  const name = settings?.name || 'Solohans Delicious Meals';
  const phone = settings?.phone || '+234 808 194 1298';
  const email = settings?.email || 'info@solohans.com';
  const address = settings?.address || 'Adeniran Ogunsanya Street, Surulere, Lagos, Nigeria';
  const workingHours = settings?.workingHours || 'Monday – Sunday<br />8:00 AM – 10:00 PM';
  const mapUrl = settings?.mapUrl || 'https://maps.google.com/maps?q=Adeniran%20Ogunsanya%20Street%2C%20Surulere%2C%20Lagos&output=embed';

  return (
    <>
      <Helmet>
        <title>Contact {name} – Get in Touch, {address.split(',')[1]?.trim() || 'Surulere, Lagos'}</title>
        <meta name="description" content={`Contact ${name} at ${address}. Call ${phone} or email ${email}.`} />
        <meta name="keywords" content={`contact ${name}, restaurant contact Lagos, phone number ${name}, address ${address.split(',')[0]}`} />
        <link rel="canonical" href="https://www.solohansmeals.com/contact" />
        <meta property="og:title" content={`Contact ${name}`} />
        <meta property="og:description" content="Get in touch – call, email, or visit us." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.solohansmeals.com/contact" />
        <meta property="og:image" content="https://www.solohansmeals.com/contact-og.jpg" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "name": `Contact ${name}`,
            "description": "Get in touch with our restaurant.",
            "about": {
              "@type": "Restaurant",
              "name": name,
              "address": { "@type": "PostalAddress", "streetAddress": address.split(',')[0], "addressLocality": address.split(',')[1]?.trim() || "Surulere", "addressRegion": "Lagos", "postalCode": "100001", "addressCountry": "NG" },
              "telephone": phone,
              "email": email
            }
          })}
        </script>
      </Helmet>

      {/* Hero */}
      <section className="relative h-screen overflow-hidden">
        <img src={heroImage} alt="Contact us" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-4xl md:text-6xl font-light tracking-[4px] text-white uppercase" style={{ fontFamily: "'Playfair', serif" }}>
              {heroWords.map((word, i) => (
                <span key={i} className="inline-block mr-4" style={{ animation: "heroWordIn 0.8s ease forwards", animationDelay: `${0.2 + i * 0.15}s`, opacity: 0 }}>{word}</span>
              ))}
            </h1>
            <p className="mt-4 text-lg md:text-xl text-[#E7D3A7] font-light tracking-wide" style={{ animation: "heroWordIn 0.8s ease forwards", animationDelay: "0.7s", opacity: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
              Reach us for orders, delivery support, or event catering.
            </p>
            <div className="mt-4 w-24 h-0.5 bg-[#C62828] mx-auto" style={{ animation: "heroWordIn 0.8s ease forwards", animationDelay: "0.85s", opacity: 0 }} />
          </div>
        </div>
        <style>{`
          @keyframes heroWordIn {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </section>

      {/* Form + Info */}
      <section className="bg-[#FFF8F0] py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-wide text-[#222222] mb-6" style={{ fontFamily: "'Playfair', serif" }}>Send a Message</h2>
            {submitted ? (
              <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-xl">✅ Thank you! Your message has been received. We'll get back to you shortly.</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">{error}</div>}
                <div><label className="block text-sm font-medium text-[#444] mb-1">Your Name</label><input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828]" /></div>
                <div><label className="block text-sm font-medium text-[#444] mb-1">Email Address</label><input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828]" /></div>
                <div><label className="block text-sm font-medium text-[#444] mb-1">Message</label><textarea name="message" rows="4" value={formData.message} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828] resize-none" placeholder="I'd like to place an order..." /></div>
                <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 bg-[#C62828] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#B71C1C] disabled:opacity-70"><Send size={18} />{submitting ? "Sending..." : "Send Message"}</button>
              </form>
            )}
          </div>

          {/* Business Info Card */}
          <div className="bg-white rounded-2xl shadow-md p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-wide text-[#222222] mb-6" style={{ fontFamily: "'Playfair', serif" }}>Contact Info</h2>
            <ul className="space-y-6">
              <li className="flex items-start gap-4"><div className="w-12 h-12 rounded-full bg-[#C62828]/10 flex items-center justify-center shrink-0 text-[#C62828]"><MapPin size={24} /></div><div><h3 className="font-bold text-[#222222]">Our Address</h3><p className="text-[#444] mt-1">{address}</p></div></li>
              <li className="flex items-start gap-4"><div className="w-12 h-12 rounded-full bg-[#C62828]/10 flex items-center justify-center shrink-0 text-[#C62828]"><Phone size={24} /></div><div><h3 className="font-bold text-[#222222]">Phone</h3><a href={`tel:${phone}`} className="text-[#C62828] hover:underline mt-1 inline-block">{phone}</a></div></li>
              <li className="flex items-start gap-4"><div className="w-12 h-12 rounded-full bg-[#C62828]/10 flex items-center justify-center shrink-0 text-[#C62828]"><Mail size={24} /></div><div><h3 className="font-bold text-[#222222]">Email</h3><a href={`mailto:${email}`} className="text-[#C62828] hover:underline mt-1 inline-block">{email}</a></div></li>
              <li className="flex items-start gap-4"><div className="w-12 h-12 rounded-full bg-[#C62828]/10 flex items-center justify-center shrink-0 text-[#C62828]"><Clock size={24} /></div><div><h3 className="font-bold text-[#222222]">Working Hours</h3><p className="text-[#444] mt-1" dangerouslySetInnerHTML={{ __html: workingHours }} /></div></li>
            </ul>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-3xl overflow-hidden shadow-lg" style={{ height: "28rem" }}>
            <iframe title={`${name} location`} src={mapUrl} className="w-full h-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
          <div className="rounded-3xl bg-[#FFF8F0] p-8 shadow-lg">
            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-wide text-[#222222] mb-6" style={{ fontFamily: "'Playfair', serif" }}>Find Us on the Map</h2>
            <p className="text-[#444] leading-7 mb-5">We're located at <strong>{address}</strong>. Visit us for a delicious meal or place your delivery order from anywhere in the city.</p>
            <div className="space-y-4 text-sm text-[#444]">
              <div className="flex items-start gap-3"><span className="text-[#C62828] mt-1"><MapPin size={22} /></span><div><p className="font-semibold text-[#222222]">Address</p><p>{address}</p></div></div>
              <div className="flex items-start gap-3"><span className="text-[#C62828] mt-1"><Phone size={22} /></span><div><p className="font-semibold text-[#222222]">Phone</p><a href={`tel:${phone}`} className="text-[#C62828] hover:underline">{phone}</a></div></div>
              <div className="flex items-start gap-3"><span className="text-[#C62828] mt-1"><Mail size={22} /></span><div><p className="font-semibold text-[#222222]">Email</p><a href={`mailto:${email}`} className="text-[#C62828] hover:underline">{email}</a></div></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#222222] py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-light tracking-[4px] text-white uppercase mb-6" style={{ fontFamily: "'Playfair', serif" }}>Ready to Order?</h2>
          <p className="text-gray-400 text-lg mb-8">Skip the form and go straight to our menu. Your next meal is just a tap away.</p>
          <Link to="/menu" className="inline-flex items-center gap-2 bg-[#C62828] text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#B71C1C] transition-all shadow-lg"><ShoppingCart size={20} />Explore Menu</Link>
        </div>
      </section>
    </>
  );
};

export default Contact;
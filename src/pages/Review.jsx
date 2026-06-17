import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, ShoppingCart } from "lucide-react";
import { reviews as reviewsApi } from "../lib/api";
import { useSettings } from "../context/SettingsContext";       // ✅ for WhatsApp number
import heroImage from "../assets/photo-1552566626-52f8b828add9.avif";

const StarRating = ({ rating }) => (
  <div className="flex gap-1">
    {[...Array(5)].map((_, i) => (
      <Star key={i} size={16} className={i < rating ? "fill-[#C62828] text-[#C62828]" : "text-gray-300"} />
    ))}
  </div>
);

const Review = () => {
  const [reviewList, setReviewList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", rating: 5, text: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const { settings } = useSettings();                          // ✅ get settings

  useEffect(() => { fetchApprovedReviews(); }, []);

  const fetchApprovedReviews = async () => {
    setLoading(true);
    try {
      const data = await reviewsApi.getApproved();
      setReviewList(Array.isArray(data) ? data : data.reviews || []);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await reviewsApi.create({
        customer_name: form.name,
        email: form.email,
        rating: form.rating,
        text: form.text,
        status: "Pending",
        featured: false,
      });
      setSubmitted(true);
      setForm({ name: "", email: "", rating: 5, text: "" });
    } catch (err) {
      setError(err.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviewList.length > 0
    ? (reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length).toFixed(1)
    : "4.8";

  const whatsapp = settings?.whatsapp || settings?.phone || "2348081941298";  // ✅ fallback

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Solohans Delicious Meals",
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": avgRating, "reviewCount": reviewList.length },
    "review": reviewList.map((r) => ({
      "@type": "Review",
      "author": r.customer_name,
      "reviewRating": { "@type": "Rating", "ratingValue": r.rating },
      "reviewBody": r.text,
    })),
  };

  const heroWords = ["What", "Our", "Customers", "Say"];

  return (
    <>
      <Helmet>
        <title>Customer Reviews – Solohans Delicious Meals, Surulere, Lagos</title>
        <meta name="description" content="Read what our customers say about Solohans Delicious Meals in Surulere, Lagos." />
        <link rel="canonical" href="https://www.solohansmeals.com/reviews" />
        <meta property="og:title" content="Customer Reviews – Solohans Delicious Meals" />
        <meta property="og:description" content="Real reviews from Surulere, Lagos." />
        <meta property="og:image" content="https://www.solohansmeals.com/reviews-og.jpg" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Hero */}
      <section className="relative h-screen overflow-hidden">
        <img src={heroImage} alt="Happy customers" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center px-4">
            <h1
              className="text-3xl md:text-5xl lg:text-6xl font-light tracking-[4px] text-white uppercase"
              style={{ fontFamily: "'Playfair', serif" }}
            >
              {heroWords.map((word, i) => (
                <span
                  key={i}
                  className="inline-block mr-3 md:mr-4"
                  style={{
                    animation: "heroWordIn 0.8s ease forwards",
                    animationDelay: `${0.2 + i * 0.15}s`,
                    opacity: 0,
                  }}
                >
                  {word}
                </span>
              ))}
            </h1>
            <p
              className="mt-4 text-lg md:text-xl text-[#E7D3A7] font-light tracking-wide"
              style={{ animation: "heroWordIn 0.8s ease forwards", animationDelay: "0.85s", opacity: 0 }}
            >
              Real stories from happy diners in Surulere.
            </p>
            <div
              className="mt-4 w-24 h-0.5 bg-[#C62828] mx-auto"
              style={{ animation: "heroWordIn 0.8s ease forwards", animationDelay: "1s", opacity: 0 }}
            />
          </div>
        </div>
        <style>{`
          @keyframes heroWordIn {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </section>

      {/* Write a Review */}
      <section className="bg-[#FFF8F0] pt-12 md:pt-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          {!showForm ? (
            <button
              onClick={() => { setShowForm(true); setSubmitted(false); }}
              className="px-6 py-3 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C] transition-colors"
            >
              Write a Review
            </button>
          ) : submitted ? (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl max-w-lg mx-auto">
              ✅ Thank you! Your review has been submitted and will appear after approval.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white p-6 rounded-2xl shadow-md space-y-4 text-left">
              <h3 className="text-xl font-bold text-gray-800 text-center" style={{ fontFamily: "'Playfair', serif" }}>Share Your Experience</h3>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Email</label>
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button type="button" key={star} onClick={() => setForm({ ...form, rating: star })} className={`p-1 ${star <= form.rating ? "text-[#C62828]" : "text-gray-300"}`}>
                      <Star size={24} fill={star <= form.rating ? "#C62828" : "none"} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
                <textarea rows={4} placeholder="Tell us about your experience..." required value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828] resize-none" />
              </div>
              <button type="submit" disabled={submitting} className="w-full py-3 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C] disabled:opacity-70">
                {submitting ? "Submitting…" : "Submit Review"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="bg-[#FFF8F0] pb-16 md:pb-24 pt-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading reviews…</div>
          ) : reviewList.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No reviews yet. Be the first to share your experience!</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {reviewList.map((review) => (
                <div key={review._id || review.id} className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-[#C62828]/10 text-[#C62828] flex items-center justify-center font-bold text-lg uppercase border-2 border-[#C62828]">
                      {review.customer_name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#222222]">{review.customer_name}</h3>
                      <StarRating rating={review.rating} />
                    </div>
                  </div>
                  {/* ✅ Review image (if any) */}
                  {review.image && (
                    <img src={review.image} alt="review" className="w-full h-40 object-cover rounded-lg mb-3" />
                  )}
                  <p className="text-[#444] text-sm leading-relaxed italic">"{review.text}"</p>
                  {review.reply && (
                    <div className="mt-3 bg-[#FFF8F0] p-3 rounded-lg text-sm text-gray-700 border border-gray-100">
                      <span className="font-medium">Reply from Solohans:</span> {review.reply}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Social Ordering Note */}
      <section className="bg-[#C62828]/5 border-t border-[#C62828]/20 py-10 md:py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#222222] mb-3">
            Order via Social Media Too!
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto mb-6">
            You can also place your order directly on WhatsApp, Instagram, Facebook, or any of our social media platforms.
            We'll respond quickly and confirm your order.
          </p>
          <a
            href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-700 transition-colors"
          >
            Order on WhatsApp
          </a>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#222222] py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2
            className="text-3xl md:text-4xl font-light tracking-[4px] text-white uppercase mb-6"
            style={{ fontFamily: "'Playfair', serif" }}
          >
            Ready to Join the Happy Customers?
          </h2>
          <p className="text-gray-400 text-lg mb-8">Order your meal now and taste the difference.</p>
          <Link to="/menu" className="inline-flex items-center gap-2 bg-[#C62828] text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#B71C1C] transition-all shadow-lg">
            <ShoppingCart size={20} />
            Order Now
          </Link>
        </div>
      </section>
    </>
  );
};

export default Review;
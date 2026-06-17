import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Leaf, Heart, Zap, ShoppingCart } from "lucide-react";
import heroImage from "../assets/photo-1504674900247-0877df9cc836 (1).avif";
import heroImage2 from "../assets/789326272235345091.jfif";
import AnimatedHeading from "../component/AnimatedHeading";

const About = () => {
  const heroWords = "Our Story".split(" ");

  return (
    <>
      <Helmet>
        <title>About Solohans Delicious Meals – Our Story & Location in Surulere, Lagos</title>
        <meta name="description" content="Learn about Solohans Delicious Meals, our passion for fresh food, and visit us at Adeniran Ogunsanya Street, Surulere, Lagos. Call +234 808 194 1298." />
        <meta name="keywords" content="about Solohans, restaurant Surulere Lagos, food story Lagos, best meals Surulere" />
        <link rel="canonical" href="https://www.solohansmeals.com/about" />
        <meta property="og:title" content="About Solohans Delicious Meals – Surulere, Lagos" />
        <meta property="og:description" content="Fresh meals made with love. Discover our story and visit us in Surulere." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.solohansmeals.com/about" />
        <meta property="og:image" content="https://www.solohansmeals.com/about-og.jpg" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "name": "About Solohans Delicious Meals",
            "description": "Learn about our story and commitment to fresh, tasty meals.",
            "about": {
              "@type": "Restaurant",
              "name": "Solohans Delicious Meals",
              "address": { "@type": "PostalAddress", "streetAddress": "Adeniran Ogunsanya Street", "addressLocality": "Surulere", "addressRegion": "Lagos", "postalCode": "100001", "addressCountry": "NG" },
              "telephone": "+234-808-194-1298",
              "email": "info@solohans.com"
            }
          })}
        </script>
      </Helmet>

      {/* Hero Banner – full screen with animated heading */}
      <section className="relative h-screen overflow-hidden">
        <img src={heroImage} alt="About Solohans" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-4xl md:text-6xl font-light tracking-[4px] text-white uppercase" style={{ fontFamily: "'Playfair', serif" }}>
              {heroWords.map((word, i) => (
                <span
                  key={i}
                  className="inline-block mr-4"
                  style={{
                    animation: `heroWordIn 0.8s ease forwards`,
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
              style={{ animation: "heroWordIn 0.8s ease forwards", animationDelay: "0.6s", opacity: 0 }}
            >
              Bringing fresh, delicious meals to your table
            </p>
          </div>
        </div>

        <style>{`
          @keyframes heroWordIn {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </section>

      {/* Story Section */}
      <section className="bg-[#FFF8F0] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <AnimatedHeading
              text="How It All Began"
              tag="h2"
              className="text-3xl md:text-4xl font-light tracking-[4px] text-[#222222] uppercase mb-6"
            />
            <div className="w-16 h-0.5 bg-[#C62828] mb-6" />
            <p className="text-[#444] leading-7 mb-4">
              SOLOHANS DELICIOUS MEALS  was born out of a deep love for food and the joy it brings to
              people. What started as a small kitchen in Surulere, Lagos, quickly became a local
              favorite for its honest, flavourful cooking.
            </p>
            <p className="text-[#444] leading-7 mb-4">
              Our founder, SOLOHANS, believed that great food doesn't need to be complicated — just
              fresh ingredients, skilful preparation, and a whole lot of passion. That philosophy
              still guides every plate we serve today.
            </p>
            <p className="text-[#444] leading-7">
              From jollof rice to grilled chicken, we've expanded our menu while staying true to
              our roots. Every meal is prepared daily with locally sourced produce, ensuring that
              every bite tastes like home.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img src={heroImage2} alt="Fresh juice glass" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <AnimatedHeading
              text="What We Stand For"
              tag="h2"
              className="text-3xl md:text-4xl font-light tracking-[4px] text-[#222222] uppercase"
            />
            <div className="mt-4 w-24 h-0.5 bg-[#C62828] mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Leaf size={40} />, title: "Freshness", desc: "We source the best ingredients daily from trusted local markets, ensuring every dish is as fresh as possible." },
              { icon: <Heart size={40} />, title: "Passion", desc: "Cooking is our art. Every recipe is carefully crafted and cooked with love to make you feel at home with every bite." },
              { icon: <Zap size={40} />, title: "Speed", desc: "We know you're hungry. That's why we guarantee fast, reliable delivery so your meal arrives hot and fresh, always on time." },
            ].map((item, i) => (
              <div key={i} className="bg-[#FFF8F0] p-8 rounded-2xl text-center">
                <div className="mx-auto text-[#C62828] mb-4 flex justify-center">{item.icon}</div>
                <h3 className="text-xl font-bold text-[#222222] mb-2">{item.title}</h3>
                <p className="text-[#444] text-sm leading-6">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#222222] py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <AnimatedHeading
            text="Ready to Taste the Difference?"
            tag="h2"
            className="text-3xl md:text-4xl font-light tracking-[4px] text-white uppercase mb-6"
          />
          <p className="text-gray-400 text-lg mb-8">
            Order your favourite meals now and experience the Solohans difference.
          </p>
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 bg-[#C62828] text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#B71C1C] transition-all shadow-lg"
          >
            <ShoppingCart size={20} />
            Order Now
          </Link>
        </div>
      </section>
    </>
  );
};

export default About;

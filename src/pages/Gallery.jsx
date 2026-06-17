import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { gallery as galleryApi } from '../lib/api';
import { useSettings } from '../context/SettingsContext';
import heroImage from "../assets/photo-1504674900247-0877df9cc836 (1).avif";

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const { settings } = useSettings();

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const data = await galleryApi.getPublic();
        setImages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  const heroWords = ["Our", "Gallery"];

  // Social links from settings or defaults
  const socialLinks = {
    facebook: settings?.social?.facebook || 'https://www.facebook.com/SoloHansDelicious',
    instagram: settings?.social?.instagram || 'https://www.instagram.com/solohansdeliciousmeal50',
    tiktok: settings?.social?.tiktok || 'https://www.tiktok.com/@solohans.delicious.meals',
    snapchat: settings?.social?.snapchat || 'https://www.snapchat.com/add/solohans1?share_id=6VsKV86KQai7SkT5PWdSVA&locale=en_US',
  };

  return (
    <>
      <Helmet><title>Gallery – Solohans</title></Helmet>

      {/* Hero Section – full screen like Menu page */}
      <section className="relative h-screen overflow-hidden">
        <img src={heroImage} alt="Our gallery" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-4xl md:text-6xl font-light uppercase tracking-[4px] text-white" style={{ fontFamily: "'Playfair', serif" }}>
              {heroWords.map((word, i) => (
                <span
                  key={i}
                  className="inline-block mr-4"
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
              className="mt-4 text-lg md:text-xl text-[#E7D3A7] font-light tracking-wide max-w-2xl mx-auto"
              style={{ animation: "heroWordIn 0.8s ease forwards", animationDelay: "0.55s", opacity: 0 }}
            >
              A taste of what we create — moments captured from our kitchen to your table.
            </p>
            <div
              className="mt-6 w-24 h-0.5 bg-[#C62828] mx-auto"
              style={{ animation: "heroWordIn 0.8s ease forwards", animationDelay: "0.7s", opacity: 0 }}
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

      {/* Gallery Grid – matches Menu's card style */}
      <section className="bg-[#FFF8F0] py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-bold text-center mb-10 text-[#222222]" style={{ fontFamily: "'Playfair', serif" }}>
            Explore Our Creations
          </h2>

          {loading ? (
            <div className="text-center py-20 text-gray-500">Loading gallery…</div>
          ) : images.length === 0 ? (
            <p className="text-center text-[#444]">No images yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {images.map(img => (
                <div
                  key={img._id}
                  className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 cursor-pointer"
                  onClick={() => setSelected(img)}
                >
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={img.image}
                      alt={img.caption || 'Gallery'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {img.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <p className="text-white text-sm font-medium">{img.caption}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <img src={selected.image} alt={selected.caption || 'Gallery'} className="max-w-full max-h-[80vh] rounded-xl" />
            {selected.caption && <p className="text-white text-center mt-4">{selected.caption}</p>}
            <button
              className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300"
              onClick={() => setSelected(null)}
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Call‑to‑Action Section – same as Menu page */}
      <section className="bg-[#FFF8F0] py-16 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-light tracking-[4px] text-[#222222] uppercase mb-4" style={{ fontFamily: "'Playfair', serif" }}>
            Craving Something Delicious?
          </h2>
          <p className="text-[#444] max-w-2xl mx-auto mb-8">
            Browse our full menu and order your favourite meals now. Fresh, tasty, and delivered with love.
          </p>
          <Link
            to="/menu"
            className="inline-block px-8 py-3 bg-[#C62828] text-white rounded-full font-semibold text-lg hover:bg-[#B71C1C] transition-colors shadow-md"
          >
            Buy from Us – Order Now
          </Link>

          {/* Social Media Links – same as Menu */}
          <div className="mt-10 flex flex-col items-center gap-4">
            <p className="text-sm text-gray-500 uppercase tracking-widest">Follow Us</p>
            <div className="flex items-center gap-6">
              <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#C62828] transition-colors">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#C62828] transition-colors">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#C62828] transition-colors">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
              </a>
              <a href={socialLinks.snapchat} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#C62828] transition-colors">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12.206.793c.357-.011.715.015 1.072.058 1.978.256 3.894.964 5.489 2.072 1.81 1.264 3.118 3.048 3.697 5.162.576 2.109.451 4.385-.145 6.511-.215.772-.468 1.482-.877 2.118-.238.372-.513.724-.85 1.017-.353.308-.747.542-1.133.786-1.698 1.074-3.645 1.649-5.606 1.95-1.309.2-2.636.22-3.953.066-1.739-.203-3.43-.683-4.996-1.374-.384-.171-.752-.376-1.085-.639-.374-.294-.711-.626-1.001-1.004-.661-.863-1.068-1.911-1.21-2.983-.07-.523-.092-1.052-.036-1.577.107-.998.458-1.959 1.016-2.788.616-.913 1.394-1.721 2.256-2.408.365-.29.741-.549 1.139-.784.384-.226.786-.401 1.201-.533.386-.123.78-.192 1.174-.202.316-.009.623.027.919.109.405.113.791.272 1.156.466.31.166.593.371.843.612.168.162.309.346.42.549.269.49.468 1.021.588 1.567.1.453.166.915.196 1.379.025.392.032.783.03 1.174-.002.258.006.516.003.774-.001.062-.019.125-.048.179-.029.054-.082.082-.132.094-.111.027-.225-.014-.31-.093-.373-.348-.771-.668-1.186-.968-.538-.39-1.122-.712-1.731-.986-1.119-.504-2.313-.805-3.525-.921-.364-.035-.692.164-.795.466-.062.182-.046.355.038.502.14.246.373.434.637.571.703.363 1.463.612 2.227.832.359.103.721.201 1.065.338.201.081.396.18.56.313.116.094.193.215.207.36.014.145-.021.282-.066.417-.028.084-.067.161-.116.231-.145.208-.332.38-.549.516-.365.228-.767.379-1.176.502-.409.123-.825.206-1.246.252-.747.082-1.501.054-2.241-.072-.497-.085-.984-.209-1.454-.393-.292-.115-.577-.24-.86-.374-.19-.09-.368-.201-.521-.344-.103-.096-.182-.214-.23-.344-.041-.113-.025-.22.031-.308.056-.088.144-.136.236-.148.14-.019.282.024.412.073.218.082.436.162.658.23.215.066.434.116.654.157.344.063.694.09 1.042.088.204-.002.407-.02.609-.052.073-.012.145-.026.213-.052.052-.02.086-.068.086-.124 0-.057-.027-.104-.075-.134-.102-.064-.216-.108-.33-.147-.271-.093-.546-.173-.824-.24-.543-.13-1.095-.212-1.649-.254-.216-.017-.434-.018-.65-.006-.336.019-.669.069-1 .13-.251.047-.502.097-.751.161-.141.036-.283.075-.423.119-.05.015-.099.034-.141.066-.031.023-.054.058-.059.099-.005.041.008.08.034.107.09.096.205.165.325.221.329.151.675.267 1.021.383.706.238 1.429.419 2.156.564.587.117 1.182.179 1.78.187.315.004.631-.008.944-.039.244-.024.486-.062.725-.113.177-.038.352-.083.523-.138.159-.052.316-.117.461-.199.119-.067.23-.153.319-.262.078-.095.134-.206.16-.325.023-.102.025-.206.009-.307-.026-.165-.102-.311-.217-.423-.235-.23-.532-.382-.837-.509-.468-.195-.955-.326-1.447-.432-.399-.086-.801-.151-1.202-.22-.401-.069-.802-.141-1.191-.24-.369-.094-.735-.203-1.081-.36-.193-.087-.381-.187-.551-.311-.112-.082-.211-.182-.291-.298-.068-.099-.11-.215-.118-.339-.007-.124.025-.242.082-.347.15-.282.448-.454.739-.448.273.005.544.068.802.17.352.14.69.309 1.019.491.17.094.336.195.5.299.082.052.16.109.239.166.09.065.196.102.302.099h.031c.094-.01.176-.062.229-.139.053-.077.073-.173.056-.263-.015-.085-.049-.162-.101-.223-.089-.104-.196-.186-.309-.255-.455-.278-.944-.48-1.449-.643-.416-.135-.84-.229-1.27-.286-.152-.021-.306-.03-.459-.034-.091-.003-.182.006-.273.012-.043.003-.086.008-.127.02-.039.01-.068.034-.08.072-.012.038-.004.07.011.094.068.108.176.184.297.233.587.235 1.221.362 1.855.453.478.069.959.1 1.44.096.196-.002.392-.014.587-.034.161-.017.321-.039.48-.069.355-.067.705-.168 1.041-.306.212-.088.416-.196.601-.331.105-.077.199-.169.27-.28.054-.086.088-.185.09-.288.002-.103-.028-.199-.081-.283-.151-.237-.397-.391-.654-.503-.446-.194-.912-.314-1.383-.409-.317-.064-.637-.106-.958-.128zm0 0"/></svg>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
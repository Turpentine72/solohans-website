import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowUp } from "lucide-react";

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const [visible, setVisible] = useState(false);

  // Route-change: scroll smoothly to the matching category section once it
  // has rendered (categories load asynchronously), or to the top if no
  // category/hash is present.
  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      let attempts = 0;
      const maxAttempts = 30; // retry for up to ~3s while data loads

      const tryScroll = () => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        } else if (attempts < maxAttempts) {
          attempts += 1;
          setTimeout(tryScroll, 100);
        }
      };

      tryScroll();
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname, hash]);

  // Show/hide floating button
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollUp = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <button
      onClick={scrollUp}
      aria-label="Scroll to top"
      className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[#C62828] text-white shadow-lg flex items-center justify-center transition-all duration-500 hover:bg-[#B71C1C] hover:scale-110 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"
      }`}
    >
      <ArrowUp size={20} />
    </button>
  );
};

export default ScrollToTop;
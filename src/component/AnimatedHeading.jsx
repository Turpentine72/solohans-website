/**
 * AnimatedHeading – word-by-word fade + slide-up animation.
 * Usage: <AnimatedHeading text="Our Story" className="..." tag="h1" />
 */
import { useEffect, useRef, useState } from "react";

export default function AnimatedHeading({ text, className = "", tag: Tag = "h1", delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const words = text.split(" ");

  return (
    <Tag ref={ref} className={`overflow-hidden ${className}`} aria-label={text} style={{ fontFamily: "'Playfair', serif" }}>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block mr-[0.3em] transition-all duration-700"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(32px)",
            transitionDelay: `${delay + i * 80}ms`,
          }}
        >
          {word}
        </span>
      ))}
    </Tag>
  );
}

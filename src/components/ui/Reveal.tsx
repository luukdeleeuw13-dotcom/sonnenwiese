"use client";

import { useEffect, useRef } from "react";

// Laat een blok zachtjes omhoog komen zodra het in beeld scrollt. Eén keer,
// geen herhaling als je terugscrollt — dat wordt op een lange pagina snel
// vermoeiend.
//
// Het verbergen zelf gebeurt in CSS (.reveal in globals.css), en alleen achter
// `scripting: enabled` en `prefers-reduced-motion: no-preference`. Zo blijft de
// tekst gewoon staan als JavaScript uitvalt of als iemand animaties heeft
// uitgezet; dit component hoeft dan niets te doen.
export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  /** Milliseconden vertraging, om onderdelen na elkaar te laten binnenkomen. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Oude browsers zonder IntersectionObserver zouden het blok anders voor
    // altijd verborgen houden. Dan liever meteen zichtbaar zonder animatie.
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("reveal-in");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.classList.add("reveal-in");
        observer.disconnect();
      },
      // Pas als er een stukje van het blok echt in beeld is, en niet meteen
      // op de laatste pixel onderaan het scherm.
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

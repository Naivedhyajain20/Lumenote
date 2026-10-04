"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function Reveal({ children, className = "", delay = 0 }: RevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    element.classList.add("reveal-ready");

    if (!("IntersectionObserver" in window)) {
      element.classList.add("reveal-in");
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("reveal-in");
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.14, rootMargin: "0px 0px -32px 0px" });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={elementRef} className={`reveal ${className}`} style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  );
}

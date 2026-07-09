import { useEffect } from "react";

/**
 * Attach a single IntersectionObserver that adds the "is-in" class to every
 * [data-reveal] element as it scrolls into view. Re-runs whenever `active`
 * flips true so the observer attaches after the real content mounts rather
 * than during a loading render. Respects prefers-reduced-motion by revealing
 * everything immediately.
 */
export function useReveal(active: boolean): void {
  useEffect(() => {
    if (!active) {
      return;
    }

    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      elements.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [active]);
}

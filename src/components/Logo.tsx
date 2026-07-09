interface LogoProps {
  /** "full" renders the mark plus the wordmark; "mark" renders the mark only. */
  variant?: "full" | "mark";
  /**
   * Which surface the logo sits on. "onDark" uses the light-coloured artwork
   * (for dark backgrounds); "onLight" uses the ink artwork (for light ones).
   */
  tone?: "onDark" | "onLight";
  /** Sizing classes; set the height, e.g. "h-7". Width follows the aspect. */
  className?: string;
}

/**
 * Beacon logo lockup. Renders the brand artwork from `public/`, choosing the
 * light or ink version by the surface it sits on. The asset already carries the
 * exact mark and wordmark, so no colour is applied here.
 */
export default function Logo({
  variant = "full",
  tone = "onLight",
  className = "h-8",
}: LogoProps) {
  const kind = variant === "mark" ? "mark" : "wordmark";
  const surface = tone === "onDark" ? "dark" : "light";
  const src = `${import.meta.env.BASE_URL}beacon-${kind}-${surface}.png`;
  return (
    <img
      src={src}
      alt="Beacon"
      loading="eager"
      decoding="async"
      className={`block w-auto object-contain ${className}`}
    />
  );
}

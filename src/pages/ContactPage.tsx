import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Check,
  Copy,
  Globe,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Moon,
  Phone,
  Sun,
} from "lucide-react";
import { getCardBySlug } from "../lib/cards";
import { useAuth } from "../context/AuthContext";
import { useReveal } from "../hooks/useReveal";
import Logo from "../components/Logo";
import {
  downloadVCard,
  fetchVCardPhoto,
  phoneHref,
  whatsappNumber,
  type VCardPhoto,
} from "../lib/vcard";
import type { ContactProfile } from "../types";

type Theme = "dark" | "light";

function placeholderPortrait(slug: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(slug)}/640/800`;
}

/** A copy-to-clipboard button with transient confirmation. */
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[color:var(--line)] text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
    >
      {copied ? (
        <Check className="h-4 w-4 text-[var(--bronze)]" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}

function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: Theme;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[color:var(--line)] text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
    >
      {theme === "dark" ? (
        <Sun className="h-[18px] w-[18px]" aria-hidden="true" />
      ) : (
        <Moon className="h-[18px] w-[18px]" aria-hidden="true" />
      )}
    </button>
  );
}

function LoadingScreen() {
  return (
    <div className="beacon-card flex min-h-screen items-center justify-center">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-[color:var(--line-strong)] border-t-[var(--fg)] motion-reduce:animate-none"
        role="status"
        aria-label="Loading card"
      />
    </div>
  );
}

function NotFoundScreen({ slug }: { slug: string }) {
  return (
    <div
      className="beacon-card relative flex min-h-screen items-center justify-center overflow-hidden px-6 text-center"
      data-theme="light"
    >
      <div className="beacon-grid" aria-hidden="true" />
      <div className="relative z-10 max-w-md">
        <Logo variant="mark" tone="onLight" className="mx-auto h-16 w-auto sm:h-20" />
        <h1 className="mt-8 font-display text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
          Nothing at /contact/{slug}
        </h1>
        <p className="mt-4 text-[var(--muted)]">
          This link is not published, or the profile name is unknown.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-xl border border-[color:var(--line-strong)] px-5 py-2.5 text-sm font-semibold transition hover:bg-[var(--surface)]"
        >
          Go home
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

/** A single contact row: icon, label, value, and a copy or open action. */
function ContactRow({
  icon,
  label,
  value,
  href,
  external,
  copyValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
  external?: boolean;
  copyValue?: string;
}) {
  return (
    <div
      data-reveal
      className="flex items-center justify-between gap-3 px-5 py-4"
    >
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className="group flex min-w-0 flex-1 items-center gap-4"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[color:var(--line)] text-[var(--fg)] transition group-hover:border-[color:var(--line-strong)]">
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block text-xs font-medium text-[var(--faint)]">
            {label}
          </span>
          <span className="block truncate text-[0.95rem] font-medium text-[var(--fg)]">
            {value}
          </span>
        </span>
      </a>
      {copyValue ? (
        <CopyButton value={copyValue} label={label} />
      ) : external ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${label} in a new tab`}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[color:var(--line)] text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
        >
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </a>
      ) : null}
    </div>
  );
}

function CardView({ card }: { card: ContactProfile }) {
  useReveal(true);
  // Open in the app's light editorial look; the toggle still offers dark.
  const [theme, setTheme] = useState<Theme>("light");

  const eyebrow = [card.title, card.company].filter(Boolean).join("  ·  ");
  const portrait = card.portraitUrl || placeholderPortrait(card.slug);

  // Pre-fetch and encode the real portrait so "Save contact" can embed it into
  // the vCard synchronously (an async gap in the click handler would break the
  // download on iOS Safari). Only a genuine portraitUrl is embedded, not the
  // random placeholder. Falls back to a photo-less vCard on CORS failure.
  const [photo, setPhoto] = useState<VCardPhoto | undefined>(undefined);
  useEffect(() => {
    if (!card.portraitUrl) {
      setPhoto(undefined);
      return;
    }
    let active = true;
    fetchVCardPhoto(card.portraitUrl).then((result) => {
      if (active) {
        setPhoto(result);
      }
    });
    return () => {
      active = false;
    };
  }, [card.portraitUrl]);

  const aboutChips = [
    card.company ? { label: "Company", value: card.company } : null,
    card.languages.length
      ? { label: "Languages", value: card.languages.join(", ") }
      : null,
    card.hours ? { label: "Hours", value: card.hours } : null,
  ].filter((chip): chip is { label: string; value: string } => chip !== null);

  const contactRows = [
    card.phone && {
      key: "phone",
      icon: <Phone className="h-[18px] w-[18px]" aria-hidden="true" />,
      label: "Phone",
      value: card.phone,
      href: `tel:${phoneHref(card.phone)}`,
      copyValue: card.phone,
    },
    card.email && {
      key: "email",
      icon: <Mail className="h-[18px] w-[18px]" aria-hidden="true" />,
      label: "Email",
      value: card.email,
      href: `mailto:${card.email}`,
      copyValue: card.email,
    },
    card.website && {
      key: "website",
      icon: <Globe className="h-[18px] w-[18px]" aria-hidden="true" />,
      label: "Website",
      value: card.website.replace(/^https?:\/\//, ""),
      href: card.website,
      external: true,
    },
    card.linkedin && {
      key: "linkedin",
      icon: <Linkedin className="h-[18px] w-[18px]" aria-hidden="true" />,
      label: "LinkedIn",
      value: card.linkedin.replace(/^https?:\/\//, ""),
      href: card.linkedin,
      external: true,
    },
    card.phone && {
      key: "whatsapp",
      icon: <MessageCircle className="h-[18px] w-[18px]" aria-hidden="true" />,
      label: "WhatsApp",
      value: card.phone,
      href: `https://wa.me/${whatsappNumber(card.phone)}`,
      external: true,
    },
  ].filter(Boolean) as {
    key: string;
    icon: React.ReactNode;
    label: string;
    value: string;
    href: string;
    external?: boolean;
    copyValue?: string;
  }[];

  return (
    <div
      className="beacon-card relative min-h-screen overflow-hidden"
      data-theme={theme === "light" ? "light" : undefined}
    >
      <div className="beacon-grid" aria-hidden="true" />

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-[color:var(--line)] bg-[var(--bg)]/85 backdrop-blur">
        <nav className="mx-auto flex w-[min(64rem,calc(100%-2rem))] items-center justify-between py-3.5">
          <div>
            {card.logoUrl && (
              <img
                src={card.logoUrl}
                alt={`${card.name} logo`}
                className="h-14 w-auto object-contain sm:h-16"
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle
              theme={theme}
              onToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            />
            <button
              type="button"
              onClick={() => downloadVCard(card, photo)}
              className="inline-flex items-center rounded-xl bg-[var(--btn-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--btn-fg)] transition hover:opacity-90"
            >
              Save contact
            </button>
          </div>
        </nav>
      </header>

      <main className="relative z-10 mx-auto w-[min(64rem,calc(100%-2rem))] pb-24">
        {/* Hero */}
        <section className="grid items-center gap-12 py-16 md:grid-cols-[1.25fr_0.75fr] md:py-24">
          <div data-reveal>
            {eyebrow && (
              <p className="flex items-center gap-3 text-sm font-medium text-[var(--muted)]">
                <span
                  className="h-px w-8 bg-[var(--bronze)]"
                  aria-hidden="true"
                />
                {eyebrow}
              </p>
            )}
            <h1 className="mt-5 font-display text-[clamp(2.75rem,7vw,5rem)] font-extrabold leading-[0.98] tracking-[-0.03em] text-balance">
              {card.name}
            </h1>
            {card.tagline && (
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--muted)] text-pretty">
                {card.tagline}
              </p>
            )}

            <div className="mt-9 flex flex-wrap gap-3">
              {card.phone && (
                <a
                  href={`tel:${phoneHref(card.phone)}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--btn-bg)] px-5 py-3 text-sm font-semibold text-[var(--btn-fg)] transition hover:opacity-90"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  Call directly
                </a>
              )}
              {card.email && (
                <a
                  href={`mailto:${card.email}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--line-strong)] px-5 py-3 text-sm font-semibold text-[var(--fg)] transition hover:bg-[var(--surface)]"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  Send email
                </a>
              )}
            </div>

            {card.location && (
              <p className="mt-7 inline-flex items-center gap-2 text-sm text-[var(--faint)]">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {card.location}
              </p>
            )}
          </div>

          <div data-reveal className="flex justify-center md:justify-end">
            <div className="relative">
              <div
                className="absolute -right-3 -top-3 h-24 w-24 border-r-2 border-t-2 border-[var(--bronze)]"
                aria-hidden="true"
              />
              <img
                src={portrait}
                alt={`Portrait of ${card.name}`}
                loading="lazy"
                className="relative h-80 w-64 rounded-2xl border border-[color:var(--line-strong)] object-cover sm:h-[22rem] sm:w-[17rem]"
              />
            </div>
          </div>
        </section>

        {/* About + contact */}
        <section className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <div
            data-reveal
            className="rounded-2xl border border-[color:var(--line)] bg-[var(--surface)] p-7"
          >
            <h2 className="font-display text-2xl font-bold tracking-[-0.01em]">
              About
            </h2>
            {card.bio && (
              <p className="mt-4 leading-relaxed text-[var(--muted)] text-pretty">
                {card.bio}
              </p>
            )}
            {aboutChips.length > 0 && (
              <dl className="mt-6 space-y-3 border-t border-[color:var(--line)] pt-5">
                {aboutChips.map((chip) => (
                  <div key={chip.label} className="flex gap-3 text-sm">
                    <dt className="w-24 shrink-0 text-[var(--faint)]">
                      {chip.label}
                    </dt>
                    <dd className="text-[var(--fg)]">{chip.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {contactRows.length > 0 && (
            <div
              data-reveal
              className="divide-y divide-[color:var(--line)] overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[var(--surface)]"
            >
              {contactRows.map((row) => (
                <ContactRow
                  key={row.key}
                  icon={row.icon}
                  label={row.label}
                  value={row.value}
                  href={row.href}
                  external={row.external}
                  copyValue={row.copyValue}
                />
              ))}
            </div>
          )}
        </section>

        {/* Focus */}
        {card.focus.length > 0 && (
          <section className="mt-20">
            <h2
              data-reveal
              className="font-display text-2xl font-bold tracking-[-0.01em]"
            >
              Where I spend my energy
            </h2>
            <div className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {card.focus.map((item, index) => (
                <article
                  key={`${item.k}-${index}`}
                  data-reveal
                  className="border-t border-[color:var(--line-strong)] pt-5"
                >
                  <span className="font-display text-sm font-bold text-[var(--bronze)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-[var(--fg)]">
                    {item.k}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    {item.d}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* CTA band */}
        <section
          data-reveal
          className="mt-20 flex flex-col items-start justify-between gap-6 rounded-2xl border border-[color:var(--line)] bg-[var(--surface)] p-8 sm:flex-row sm:items-center sm:p-10"
        >
          <div>
            <h2 className="font-display text-2xl font-bold tracking-[-0.01em] sm:text-3xl">
              Let us stay in touch
            </h2>
            <p className="mt-2 text-[var(--muted)]">
              Save my details or reach out directly.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {card.phone && (
              <a
                href={`tel:${phoneHref(card.phone)}`}
                className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--line-strong)] px-5 py-3 text-sm font-semibold text-[var(--fg)] transition hover:bg-[var(--surface-2)]"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call
              </a>
            )}
            <button
              type="button"
              onClick={() => downloadVCard(card, photo)}
              className="inline-flex items-center rounded-xl bg-[var(--btn-bg)] px-5 py-3 text-sm font-semibold text-[var(--btn-fg)] transition hover:opacity-90"
            >
              Save my contact
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 flex flex-col gap-4 border-t border-[color:var(--line)] pt-8 text-sm text-[var(--faint)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            {card.logoUrl && (
              <img
                src={card.logoUrl}
                alt={`${card.name} logo`}
                className="h-10 w-auto object-contain sm:h-11"
              />
            )}
            <span>
              {card.name}
              {card.company ? ` · ${card.company}` : ""}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {card.website && (
              <a
                href={card.website}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-[var(--fg)]"
              >
                Website
              </a>
            )}
            {card.linkedin && (
              <a
                href={card.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-[var(--fg)]"
              >
                LinkedIn
              </a>
            )}
            {card.email && (
              <a
                href={`mailto:${card.email}`}
                className="transition hover:text-[var(--fg)]"
              >
                Email
              </a>
            )}
          </div>
        </footer>
      </main>
    </div>
  );
}

export default function ContactPage() {
  const { slug = "" } = useParams();
  const { isSuperadmin } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["card", slug],
    queryFn: () => getCardBySlug(slug),
    enabled: slug.length > 0,
  });

  // Keep the document title in sync with the loaded card.
  useEffect(() => {
    if (data) {
      document.title = `${data.name} - Beacon`;
    }
    return () => {
      document.title = "Beacon";
    };
  }, [data]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const visible = data && (data.published || isSuperadmin);
  if (!visible) {
    return <NotFoundScreen slug={slug} />;
  }

  return <CardView card={data} />;
}

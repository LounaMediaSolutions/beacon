# Design

Visual system for Beacon. Monochrome, geometric, quietly confident. This file is
the source of truth for tokens; keep it in sync with `tailwind.config.js` and
`src/index.css`.

## Theme

Monochrome identity in two temperatures. The product UI (login, admin, dialogs)
is a single light theme on white/cream. The public contact card ships a **dark
default** and a **light editorial** variant that share one layout and type
system, switched by `data-theme` on the card root.

## Color

Values authored in intent as OKLCH; hex given for the token table. A single
bronze accent is used only for focus, active state, and hairline emphasis.

### Core (light product UI)

| Token        | Hex       | Use |
|--------------|-----------|-----|
| `ink`        | `#141414` | Primary text, primary buttons, the mark |
| `ink-soft`   | `#5c5c5c` | Secondary text (>=4.5:1 on white/cream) |
| `ink-faint`  | `#8a8a8a` | Tertiary labels, meta (large/secondary only) |
| `paper`      | `#ffffff` | App background |
| `cream`      | `#f5f2ec` | Warm secondary surface (panels, cards) |
| `line`       | `#e6e4df` | Hairline borders |
| `bronze`     | `#9c7c52` | Focus ring, active underline, accent hairline |

### Public card themes (CSS variables on `.beacon-card`)

Dark (default) / Light (`[data-theme="light"]`):

| Variable        | Dark        | Light      |
|-----------------|-------------|------------|
| `--bg`          | `#111112`   | `#ffffff`  |
| `--fg`          | `#f6f5f3`   | `#141414`  |
| `--muted`       | `#a8a7a3`   | `#5c5c5c`  |
| `--faint`       | `#7e7d79`   | `#8a8a8a`  |
| `--surface`     | `#1a1a1c`   | `#f5f2ec`  |
| `--surface-2`   | `#202023`   | `#ece8df`  |
| `--line`        | `rgba(255,255,255,.12)` | `#e6e4df` |
| `--line-strong` | `rgba(255,255,255,.22)` | `#d9d6cf` |
| `--btn-bg`      | `#f6f5f3`   | `#141414`  |
| `--btn-fg`      | `#141414`   | `#ffffff`  |
| `--bronze`      | `#c19a63`   | `#9c7c52`  |

Contrast: `--muted` on `--bg` and `ink-soft` on cream both clear 4.5:1.

## Typography

**Single family, weight contrast.** `Manrope` (Google Fonts, 300-800) carries
the whole app. Chosen deliberately: geometric-humanist with circular bowls that
echo the beacon wordmark, and a plain, legible read that suits the brand value
"clarity". Not the geometric reflex (Poppins/Inter). The wordmark is set in
Manrope 800, lowercase, tracking -0.03em.

- Display / hero: Manrope 700-800, `clamp()` fluid, tracking -0.02 to -0.03em,
  `text-wrap: balance`.
- Body: Manrope 400-500, line-length capped ~68ch, `text-wrap: pretty`.
- Labels / eyebrows: Manrope 600, used sparingly (not above every section).

Modular scale, ratio >=1.25, fluid `clamp()` for headings. Display ceiling
<= 6rem. Letter-spacing floor -0.03em.

## Iconography & Logo

- `Logo` component renders the beacon "b" mark (geometric stencil-cut) plus the
  lowercase wordmark; `variant="mark"` for icon-only, `variant="full"` for the
  lockup. Colors inherit via `currentColor`.
- UI icons: `lucide-react`, 1.5px stroke, sized to the type.
- Favicon: `public/beacon-mark.svg` (the "b" mark).

## Layout & Spacing

- Content width: `min(64rem, 100% - 2rem)` for the card; `max-w-4xl` for admin.
- Generous, varied vertical rhythm with `clamp()`; tight groupings inside,
  generous separations between sections.
- Grids: flex-wrap for 1D, grid for 2D; `repeat(auto-fit, minmax(...))` for
  breakpoint-free responsive grids.
- Radii: `rounded-xl`/`rounded-2xl` for surfaces, `rounded-full` avoided except
  small controls; beacon leans rectilinear.

## Motion

Restrained. One calm staggered fade-up reveal on load (`[data-reveal]`), plus
button/hover transitions. No blobs, floats, glass blur, or noise. Ease-out
curves, no bounce. Every animation collapses to instant under
`prefers-reduced-motion`.

## Components

- **Logo**: mark / full variants, size prop.
- **Buttons**: primary (ink fill on light / paper fill on dark), secondary
  (hairline outline), all with bronze focus ring.
- **Modal**: white panel, hairline header, ink title, ghost close.
- **Card editor / delete / QR dialogs**: light product theme, cream fields.
- **Public card**: themed via CSS variables; hero, contact list, focus,
  CTA, footer; theme toggle in the nav.

## Anti-patterns (do not ship)

Side-stripe borders, gradient text, decorative glassmorphism, hero-metric
template, identical card grids, uppercase tracked eyebrow above every section,
numbered section scaffolding, emoji, text overflow at any breakpoint.

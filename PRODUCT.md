# Product

## Register

product

The app is primarily a tool (auth, dashboard, editor: design SERVES the task).
The one brand surface inside it is the public `/contact/<slug>` card, which is
treated with brand-register care because it is what a cardholder's audience
actually sees. When working the public card, design IS the product; everywhere
else, design serves the workflow.

## Users

Two audiences, one product:

- **Cardholders** (signed-in): professionals who sign in with Google (or email)
  to author and publish their own digital business card. Context: a few focused
  minutes to set up or edit a card, then share its link and QR. They are not
  power users; the editor must be legible and forgiving.
- **Recipients** (anonymous): whoever opens a shared `/contact/<slug>` link,
  usually on a phone, often just met the cardholder. Their one job: understand
  who this is and save the contact. Speed and clarity beat decoration.

## Product Purpose

Beacon turns a person's professional details into a single, elegant, shareable
page with a downloadable vCard (photo embedded) and QR codes. It exists so a
professional can hand over a link instead of a paper card, and the recipient can
save them in one tap. Success: a recipient lands on a card and saves the contact
without friction; a cardholder publishes a card they are proud to share.

## Brand Personality

Beacon is **clear, geometric, and quietly confident**. The identity is
monochrome by conviction: near-black ink, white, and a warm cream, with a single
whisper of bronze. Nothing shouts. The wordmark is lowercase and geometric; the
"b" mark reads as a stencil-cut beacon. Voice: plain, precise, unhurried
("Clarity drives extraordinary results"). The interface should feel like a
well-machined object, not a decorated one.

## Anti-references

- The app's own prior look: dark navy + teal glassmorphism, blurred blobs,
  noise textures, floating portraits, Playfair Display display serif. All of it
  is off-brand and is being removed.
- Generic SaaS-cream landing pages, gradient-accented hero-metric templates.
- Neon/dark-tech dashboards, heavy shadows, candy gradients.
- Decorative glass cards and rounded-icon-above-every-heading templates.

## Design Principles

1. **Monochrome is the brand.** Hierarchy comes from weight, scale, and space,
   not color. Bronze is a whisper (focus, active, a hairline), never a fill.
2. **Clarity over decoration.** Every element earns its place; when in doubt,
   remove it. The recipient's path to "save contact" is never obscured.
3. **The mark leads.** The beacon "b" and lowercase wordmark anchor every
   surface, at consistent proportions and clear space.
4. **Geometry and air.** Generous whitespace, aligned to a calm grid; type set
   with intent; nothing cramped.
5. **Same voice, two temperatures.** The public card ships a dark default and a
   light editorial variant that share one layout and type system.

## Accessibility & Inclusion

- WCAG 2.1 AA: body text >=4.5:1, large text >=3:1, verified on both card
  themes and the light admin UI.
- Visible focus rings (bronze) on every interactive element; icon-only buttons
  carry aria-labels; inputs tie to labels.
- Honour `prefers-reduced-motion`: reveal/entrance motion collapses to instant.
- Fully responsive with no horizontal scroll at 375 / 768 / 1024 / 1440.
- No emoji anywhere. Accents preserved in non-English (French, Arabic) copy.

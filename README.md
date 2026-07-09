# Digital Business Cards

A small React + Firebase app for authoring shareable digital business cards.
Anyone can sign in with Google (or email/password) and manage their own cards in
a private dashboard; each card is served publicly at `/contact/<slug>` with a
"Save contact" vCard download and scannable QR codes.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- react-router-dom (public `/contact/:slug`, `/login`, `/admin`)
- Firebase Firestore (web SDK v10, modular) and Firebase Authentication
- @tanstack/react-query for server state
- lucide-react icons, qrcode.react for QR codes
- Fonts: Playfair Display (display) and Plus Jakarta Sans (body)

## Data model

Cards live in the Firestore collection `contactCards`, using the slug as the
document id so uniqueness is enforced natively. See `src/types.ts` for the full
`ContactProfile` shape.

## Environment variables

Copy `.env.example` to `.env` and fill in your Firebase web app config:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

These come from the Firebase console under Project settings > General > Your
apps > SDK setup and configuration.

## Enabling sign-in providers

In the Firebase console under Authentication > Sign-in method, enable:

- **Google** (the primary sign-in used by the app). No extra config is needed
  for local development; `localhost` is an authorized domain by default. For a
  deployed site, add your hosting domain under Authentication > Settings >
  Authorized domains.
- **Email/Password** (optional secondary sign-in, and how a superadmin signs
  in).

## Authentication and ownership

- Any signed-in user can create cards and manage only the cards they own. A
  card's owner is recorded in its `createdBy` field (the user's uid).
- A superadmin (custom claim `role: "superadmin"`) can see and manage every
  card. Granting the claim is optional and only needed for that global view.

## Install and run

```
npm install
npm run dev
```

The app runs at http://localhost:5173. Type checking: `npm run lint`.
Production build: `npm run build`, preview with `npm run preview`.

## Granting the superadmin role (optional)

A superadmin can see and manage every card, not just their own. This is a
Firebase Auth custom claim `role: "superadmin"`. Set it with the one-off Admin
SDK script:

1. In the Firebase console, create an email/password user (Authentication >
   Users) if you have not already.
2. Download a service account key (Project settings > Service accounts >
   Generate new private key) and save it as `serviceAccountKey.json` in the
   project root. This file is gitignored; never commit it.
3. Run:

   ```
   npm run grant-superadmin -- user@example.com
   ```

4. The user signs out and back in. The app forces a token refresh on auth state
   change, so the claim is picked up on the next sign-in.

## Seeding an example card

With `serviceAccountKey.json` in place:

```
npm run seed
```

This creates a published card at `/contact/djoudi` so the app renders something
immediately.

## Security rules

`firestore.rules` allows public reads of published cards, lets each signed-in
user read and write only the cards they own, and gives superadmins full access:

```
allow read: if resource.data.published == true || isSuper() || isOwner();
allow create: if isSuper() || isCreatingOwn();
allow update: if isSuper() || (isOwner() && ownership unchanged);
allow delete: if isSuper() || isOwner();
```

Deploy them with `firebase deploy --only firestore:rules`.

## Deploying to Firebase Hosting

`firebase.json` configures an SPA rewrite so deep links such as
`/contact/<slug>` resolve to `index.html`.

```
npm run build
firebase deploy
```

(Run `firebase login` and `firebase use <project-id>` first if needed.)

## Accessibility and motion

Text meets 4.5:1 contrast, icon-only buttons carry `aria-label`, inputs have
associated labels, and focus rings are visible. All decorative animation on the
public card is disabled under `prefers-reduced-motion`.

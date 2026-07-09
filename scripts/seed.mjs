// Seed one example card (slug "djoudi") so the app renders something
// immediately. Uses the Admin SDK, which bypasses security rules.
//
// Usage:
//   1. Place serviceAccountKey.json in the project root (see grantSuperadmin).
//   2. node scripts/seed.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const here = dirname(fileURLToPath(import.meta.url));
const keyPath = resolve(here, "..", "serviceAccountKey.json");

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(keyPath, "utf8"));
} catch {
  console.error(
    "Could not read serviceAccountKey.json in the project root. See the header of this script.",
  );
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const card = {
  slug: "djoudi",
  name: "Djoudi Benali",
  title: "Founder and Managing Director",
  company: "Louna Studio",
  phone: "+33 6 12 34 56 78",
  email: "djoudi@louna.tv",
  website: "https://louna.tv",
  linkedin: "https://www.linkedin.com/in/djoudi",
  location: "Paris, France",
  tagline: "Building thoughtful products for broadcast and beyond.",
  bio: "I lead a small studio focused on media technology, design, and the systems that hold them together. I care about clarity, craft, and shipping work that lasts.",
  languages: ["English", "French", "Arabic"],
  hours: "Mon to Fri, 9:00 to 18:00 CET",
  focus: [
    { k: "Product strategy", d: "Turning fuzzy goals into shippable roadmaps." },
    { k: "Design systems", d: "Consistent, accessible interfaces at scale." },
    { k: "Team building", d: "Hiring and mentoring small, senior teams." },
  ],
  portraitUrl: null,
  published: true,
  createdBy: null,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
};

await db.collection("contactCards").doc(card.slug).set(card);
console.log(`Seeded card /contact/${card.slug}.`);
process.exit(0);

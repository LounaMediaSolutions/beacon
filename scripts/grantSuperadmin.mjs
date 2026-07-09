// One-off script to grant the `superadmin` custom claim to a user by email.
//
// Usage:
//   1. Download a service account key from the Firebase console
//      (Project settings > Service accounts > Generate new private key) and
//      save it as serviceAccountKey.json in the project root.
//   2. node scripts/grantSuperadmin.mjs user@example.com
//
// The user must sign out and back in (or the app must force a token refresh,
// which it does on auth state change) for the new claim to take effect.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const here = dirname(fileURLToPath(import.meta.url));
const keyPath = resolve(here, "..", "serviceAccountKey.json");

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/grantSuperadmin.mjs <email>");
  process.exit(1);
}

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

const auth = getAuth();
const user = await auth.getUserByEmail(email);
await auth.setCustomUserClaims(user.uid, { role: "superadmin" });

console.log(`Granted role=superadmin to ${email} (uid ${user.uid}).`);
console.log("The user must sign out and back in for the claim to apply.");
process.exit(0);

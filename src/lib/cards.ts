import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type DocumentSnapshot,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import type { ContactProfile, ContactProfileInput, FocusArea } from "../types";

const COLLECTION = "contactCards";

/** Raised when a create is attempted with a slug that already exists. */
export class DuplicateSlugError extends Error {
  constructor(slug: string) {
    super(`The profile name "${slug}" is already taken.`);
    this.name = "DuplicateSlugError";
  }
}

function toMillis(value: unknown): number | null {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  return null;
}

/** Convert a Firestore snapshot to the ContactProfile type. */
function fromSnapshot(
  snapshot: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
): ContactProfile {
  const data = snapshot.data() ?? {};
  return {
    slug: (data.slug as string) ?? snapshot.id,
    name: (data.name as string) ?? "",
    title: (data.title as string | null) ?? null,
    company: (data.company as string | null) ?? null,
    phone: (data.phone as string | null) ?? null,
    email: (data.email as string | null) ?? null,
    website: (data.website as string | null) ?? null,
    linkedin: (data.linkedin as string | null) ?? null,
    location: (data.location as string | null) ?? null,
    tagline: (data.tagline as string | null) ?? null,
    bio: (data.bio as string | null) ?? null,
    languages: Array.isArray(data.languages) ? (data.languages as string[]) : [],
    hours: (data.hours as string | null) ?? null,
    focus: Array.isArray(data.focus) ? (data.focus as FocusArea[]) : [],
    portraitUrl: (data.portraitUrl as string | null) ?? null,
    published: data.published !== false,
    createdBy: (data.createdBy as string | null) ?? null,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

/** Normalise the writable fields of a profile for persistence. */
function toDocData(input: ContactProfileInput) {
  return {
    slug: input.slug,
    name: input.name,
    title: input.title ?? null,
    company: input.company ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    website: input.website ?? null,
    linkedin: input.linkedin ?? null,
    location: input.location ?? null,
    tagline: input.tagline ?? null,
    bio: input.bio ?? null,
    languages: input.languages ?? [],
    hours: input.hours ?? null,
    focus: input.focus ?? [],
    portraitUrl: input.portraitUrl ?? null,
    published: input.published,
  };
}

/**
 * List cards, newest first. A superadmin sees every card; any other signed-in
 * user sees only the cards they own (matched on createdBy). Owned cards are
 * sorted client-side to avoid needing a composite Firestore index.
 */
export async function listCards(opts: {
  uid: string | null;
  isSuperadmin: boolean;
}): Promise<ContactProfile[]> {
  if (opts.isSuperadmin) {
    const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(fromSnapshot);
  }
  if (!opts.uid) {
    return [];
  }
  const q = query(collection(db, COLLECTION), where("createdBy", "==", opts.uid));
  const snap = await getDocs(q);
  return snap.docs
    .map(fromSnapshot)
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

/** Fetch a single card by slug (document id). Returns null when absent. */
export async function getCardBySlug(
  slug: string,
): Promise<ContactProfile | null> {
  const ref = doc(db, COLLECTION, slug);
  const snap = await getDoc(ref);
  return snap.exists() ? fromSnapshot(snap) : null;
}

/** Create a new card. Throws DuplicateSlugError when the slug is taken. */
export async function createCard(
  input: ContactProfileInput,
): Promise<ContactProfile> {
  const ref = doc(db, COLLECTION, input.slug);
  const uid = auth.currentUser?.uid ?? null;

  await runTransaction(db, async (tx) => {
    const existing = await tx.get(ref);
    if (existing.exists()) {
      throw new DuplicateSlugError(input.slug);
    }
    tx.set(ref, {
      ...toDocData(input),
      createdBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  const created = await getCardBySlug(input.slug);
  if (!created) {
    throw new Error("Card was created but could not be read back.");
  }
  return created;
}

/** Update an existing card. Refreshes updatedAt. */
export async function updateCard(
  slug: string,
  patch: Partial<ContactProfileInput>,
): Promise<void> {
  const ref = doc(db, COLLECTION, slug);
  const { slug: _ignored, ...rest } = patch;
  void _ignored;
  await updateDoc(ref, {
    ...rest,
    updatedAt: serverTimestamp(),
  });
}

/** Delete a card by slug. */
export async function deleteCard(slug: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, slug));
}

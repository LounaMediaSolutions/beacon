export interface FocusArea {
  /** Heading. */
  k: string;
  /** Detail. */
  d: string;
}

export interface ContactProfile {
  slug: string;
  name: string;
  title: string | null;
  company: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  linkedin: string | null;
  location: string | null;
  tagline: string | null;
  bio: string | null;
  languages: string[];
  hours: string | null;
  focus: FocusArea[];
  portraitUrl: string | null;
  logoUrl: string | null;
  published: boolean;
  createdBy: string | null;
  createdAt: number | null;
  updatedAt: number | null;
}

/** Shape accepted by create/update. Timestamps and audit fields are managed by the data layer. */
export type ContactProfileInput = Omit<
  ContactProfile,
  "createdAt" | "updatedAt" | "createdBy"
>;

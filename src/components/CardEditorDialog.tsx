import { useMemo, useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import Modal from "./Modal";
import PortraitField from "./PortraitField";
import { toSlug } from "../lib/vcard";
import { createCard, updateCard, DuplicateSlugError } from "../lib/cards";
import { useToast } from "../context/ToastContext";
import type { ContactProfile, ContactProfileInput, FocusArea } from "../types";

interface CardEditorDialogProps {
  /** The card being edited, or null when creating a new one. */
  card: ContactProfile | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  name: string;
  slug: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  linkedin: string;
  location: string;
  hours: string;
  tagline: string;
  bio: string;
  languages: string;
  portraitUrl: string;
  focus: FocusArea[];
  published: boolean;
}

function emptyForm(): FormState {
  return {
    name: "",
    slug: "",
    title: "",
    company: "",
    phone: "",
    email: "",
    website: "",
    linkedin: "",
    location: "",
    hours: "",
    tagline: "",
    bio: "",
    languages: "",
    portraitUrl: "",
    focus: [],
    published: true,
  };
}

function fromCard(card: ContactProfile): FormState {
  return {
    name: card.name,
    slug: card.slug,
    title: card.title ?? "",
    company: card.company ?? "",
    phone: card.phone ?? "",
    email: card.email ?? "",
    website: card.website ?? "",
    linkedin: card.linkedin ?? "",
    location: card.location ?? "",
    hours: card.hours ?? "",
    tagline: card.tagline ?? "",
    bio: card.bio ?? "",
    languages: card.languages.join(", "),
    portraitUrl: card.portraitUrl ?? "",
    focus: card.focus.map((f) => ({ ...f })),
    published: card.published,
  };
}

/** Trim to a value or null so empty inputs are stored as null. */
function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition focus:border-ink focus:outline-none focus:ring-2 focus:ring-bronze/30";
const labelClass = "block text-sm font-medium text-ink";

export default function CardEditorDialog({
  card,
  onClose,
  onSaved,
}: CardEditorDialogProps) {
  const isEdit = card !== null;
  const [form, setForm] = useState<FormState>(() =>
    card ? fromCard(card) : emptyForm(),
  );
  // Track whether the user has manually edited the slug so auto-fill stops.
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [pending, setPending] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const { showToast } = useToast();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleNameChange(value: string) {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugTouched ? prev.slug : toSlug(value),
    }));
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    update("slug", toSlug(value));
  }

  function addFocus() {
    update("focus", [...form.focus, { k: "", d: "" }]);
  }

  function updateFocus(index: number, key: keyof FocusArea, value: string) {
    update(
      "focus",
      form.focus.map((item, i) =>
        i === index ? { ...item, [key]: value } : item,
      ),
    );
  }

  function removeFocus(index: number) {
    update(
      "focus",
      form.focus.filter((_, i) => i !== index),
    );
  }

  const validSlug = useMemo(() => toSlug(form.slug) === form.slug && form.slug.length > 0, [form.slug]);
  const canSave =
    form.name.trim().length > 0 && validSlug && !pending && !uploadBusy;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSave) {
      return;
    }
    setPending(true);

    const cleanedFocus = form.focus
      .map((f) => ({ k: f.k.trim(), d: f.d.trim() }))
      .filter((f) => f.k.length > 0 || f.d.length > 0);

    const payload: ContactProfileInput = {
      slug: form.slug,
      name: form.name.trim(),
      title: orNull(form.title),
      company: orNull(form.company),
      phone: orNull(form.phone),
      email: orNull(form.email),
      website: orNull(form.website),
      linkedin: orNull(form.linkedin),
      location: orNull(form.location),
      tagline: orNull(form.tagline),
      bio: orNull(form.bio),
      languages: form.languages
        .split(",")
        .map((l) => l.trim())
        .filter((l) => l.length > 0),
      hours: orNull(form.hours),
      focus: cleanedFocus,
      portraitUrl: orNull(form.portraitUrl),
      published: form.published,
    };

    try {
      if (isEdit && card) {
        await updateCard(card.slug, payload);
        showToast("success", "Card updated.");
      } else {
        await createCard(payload);
        showToast("success", "Card created.");
      }
      onSaved();
      onClose();
    } catch (error) {
      if (error instanceof DuplicateSlugError) {
        showToast("error", "That profile name is already taken.");
      } else {
        showToast("error", "Could not save the card. Please try again.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      title={isEdit ? "Edit card" : "New card"}
      onClose={onClose}
      size="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="f-name" className={labelClass}>
            Display name <span className="text-red-500">*</span>
          </label>
          <input
            id="f-name"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="f-slug" className={labelClass}>
            URL name
          </label>
          <input
            id="f-slug"
            value={form.slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            disabled={isEdit}
            aria-describedby="slug-help"
            className={`${fieldClass} ${isEdit ? "cursor-not-allowed bg-cream" : ""}`}
          />
          <p id="slug-help" className="mt-1.5 text-xs text-ink-faint">
            {isEdit
              ? "The URL name cannot be changed after creation."
              : validSlug
                ? `Public link: /contact/${form.slug}`
                : "Enter a name to generate a URL."}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="f-title" className={labelClass}>
              Title
            </label>
            <input
              id="f-title"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="f-company" className={labelClass}>
              Company
            </label>
            <input
              id="f-company"
              value={form.company}
              onChange={(e) => update("company", e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="f-phone" className={labelClass}>
              Phone
            </label>
            <input
              id="f-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="f-email" className={labelClass}>
              Email
            </label>
            <input
              id="f-email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="f-website" className={labelClass}>
              Website
            </label>
            <input
              id="f-website"
              type="url"
              placeholder="https://"
              value={form.website}
              onChange={(e) => update("website", e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="f-linkedin" className={labelClass}>
              LinkedIn
            </label>
            <input
              id="f-linkedin"
              type="url"
              placeholder="https://"
              value={form.linkedin}
              onChange={(e) => update("linkedin", e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="f-location" className={labelClass}>
              Location
            </label>
            <input
              id="f-location"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="f-hours" className={labelClass}>
              Office hours
            </label>
            <input
              id="f-hours"
              value={form.hours}
              onChange={(e) => update("hours", e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="f-tagline" className={labelClass}>
            Tagline
          </label>
          <input
            id="f-tagline"
            value={form.tagline}
            onChange={(e) => update("tagline", e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="f-bio" className={labelClass}>
            About / bio
          </label>
          <textarea
            id="f-bio"
            rows={4}
            value={form.bio}
            onChange={(e) => update("bio", e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="f-languages" className={labelClass}>
            Languages
          </label>
          <input
            id="f-languages"
            value={form.languages}
            onChange={(e) => update("languages", e.target.value)}
            placeholder="English, French, Arabic"
            className={fieldClass}
          />
          <p className="mt-1.5 text-xs text-ink-faint">Comma-separated.</p>
        </div>

        <PortraitField
          value={form.portraitUrl}
          onChange={(url) => update("portraitUrl", url)}
          onBusyChange={setUploadBusy}
        />

        <fieldset>
          <div className="flex items-center justify-between">
            <legend className="text-sm font-medium text-ink">
              Focus areas
            </legend>
            <button
              type="button"
              onClick={addFocus}
              className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink transition hover:bg-cream"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {form.focus.length === 0 && (
              <p className="text-xs text-ink-faint">No focus areas yet.</p>
            )}
            {form.focus.map((item, index) => (
              <div
                key={index}
                className="rounded-xl border border-line p-3"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <input
                      value={item.k}
                      onChange={(e) => updateFocus(index, "k", e.target.value)}
                      placeholder="Heading"
                      aria-label={`Focus area ${index + 1} heading`}
                      className={fieldClass.replace("mt-1 ", "")}
                    />
                    <input
                      value={item.d}
                      onChange={(e) => updateFocus(index, "d", e.target.value)}
                      placeholder="Detail"
                      aria-label={`Focus area ${index + 1} detail`}
                      className={fieldClass.replace("mt-1 ", "")}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFocus(index)}
                    aria-label={`Remove focus area ${index + 1}`}
                    className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </fieldset>

        <label className="flex items-center gap-3 rounded-xl border border-line p-3.5">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => update("published", e.target.checked)}
            className="h-4 w-4 rounded border-line accent-ink"
          />
          <span className="text-sm text-ink">
            Published
            <span className="block text-xs text-ink-faint">
              When off, the public link shows nothing to visitors.
            </span>
          </span>
        </label>

        <div className="flex justify-end gap-3 border-t border-line pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-cream"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition hover:bg-ink/90 disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

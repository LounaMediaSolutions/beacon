import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ExternalLink,
  LogOut,
  Pencil,
  Plus,
  QrCode,
  Trash2,
} from "lucide-react";
import { listCards } from "../lib/cards";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import CardEditorDialog from "../components/CardEditorDialog";
import QrDialog from "../components/QrDialog";
import DeleteDialog from "../components/DeleteDialog";
import type { ContactProfile } from "../types";

type Dialog =
  | { kind: "editor"; card: ContactProfile | null }
  | { kind: "qr"; card: ContactProfile }
  | { kind: "delete"; card: ContactProfile }
  | null;

export default function AdminPage() {
  // Beacon admin: single light theme; the public card owns the dark treatment.
  const { signOutUser, user, isSuperadmin } = useAuth();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<Dialog>(null);

  const { data: cards, isLoading, isError } = useQuery({
    queryKey: ["cards", isSuperadmin ? "all" : user?.uid],
    queryFn: () => listCards({ uid: user?.uid ?? null, isSuperadmin }),
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["cards"] });
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Logo variant="full" tone="onLight" className="h-8 w-auto sm:h-9" />
          <div className="flex items-center gap-3">
            {user?.email && (
              <span className="hidden text-xs text-ink-faint sm:inline">
                {isSuperadmin ? "Superadmin · " : ""}
                {user.email}
              </span>
            )}
            <button
              type="button"
              onClick={() => signOutUser()}
              className="inline-flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm font-semibold text-ink transition hover:bg-cream"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[clamp(1.9rem,4vw,2.5rem)] font-extrabold tracking-[-0.02em] text-ink">
              {isSuperadmin ? "All business cards" : "Your business cards"}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
              Each card is served publicly at{" "}
              <code className="rounded bg-paper px-1.5 py-0.5 text-xs text-ink ring-1 ring-line">
                /contact/&lt;name&gt;
              </code>{" "}
              with a downloadable vCard and QR codes for the URL and the offline
              contact.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDialog({ kind: "editor", card: null })}
            className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition hover:bg-ink/90"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New card
          </button>
        </div>

        <section className="mt-9">
          {isLoading && (
            <div className="flex justify-center py-16">
              <div
                className="h-8 w-8 animate-spin rounded-full border-4 border-line border-t-ink motion-reduce:animate-none"
                role="status"
                aria-label="Loading cards"
              />
            </div>
          )}

          {isError && (
            <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              Could not load cards. Check your connection and permissions.
            </p>
          )}

          {cards && cards.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
              <h2 className="font-display text-lg font-semibold text-ink">
                No cards yet
              </h2>
              <p className="mt-2 text-sm text-ink-soft">
                Create your first digital business card to get started.
              </p>
              <button
                type="button"
                onClick={() => setDialog({ kind: "editor", card: null })}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink/90"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                New card
              </button>
            </div>
          )}

          {cards && cards.length > 0 && (
            <ul className="space-y-3">
              {cards.map((card) => {
                const subtitle = [card.title, card.company]
                  .filter(Boolean)
                  .join(" . ");
                return (
                  <li
                    key={card.slug}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-paper p-5 transition hover:border-ink/20"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="font-display text-lg font-bold tracking-[-0.01em] text-ink">
                          {card.name}
                        </span>
                        {!card.published && (
                          <span className="rounded-md border border-line bg-cream px-2 py-0.5 text-xs font-medium text-ink-soft">
                            Draft
                          </span>
                        )}
                      </div>
                      {subtitle && (
                        <p className="text-sm text-ink-soft">{subtitle}</p>
                      )}
                      <a
                        href={`/contact/${card.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-ink-faint transition hover:text-ink"
                      >
                        /contact/{card.slug}
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDialog({ kind: "qr", card })}
                        aria-label={`Show QR codes for ${card.name}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-cream"
                      >
                        <QrCode className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden sm:inline">QR</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDialog({ kind: "editor", card })}
                        aria-label={`Edit ${card.name}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-cream"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDialog({ kind: "delete", card })}
                        aria-label={`Delete ${card.name}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      {dialog?.kind === "editor" && (
        <CardEditorDialog
          card={dialog.card}
          onClose={() => setDialog(null)}
          onSaved={refresh}
        />
      )}
      {dialog?.kind === "qr" && (
        <QrDialog card={dialog.card} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === "delete" && (
        <DeleteDialog
          card={dialog.card}
          onClose={() => setDialog(null)}
          onDeleted={refresh}
        />
      )}
    </div>
  );
}

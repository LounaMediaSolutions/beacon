import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";
import { deleteCard } from "../lib/cards";
import { useToast } from "../context/ToastContext";
import type { ContactProfile } from "../types";

interface DeleteDialogProps {
  card: ContactProfile;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteDialog({
  card,
  onClose,
  onDeleted,
}: DeleteDialogProps) {
  const [pending, setPending] = useState(false);
  const { showToast } = useToast();

  async function handleDelete() {
    setPending(true);
    try {
      await deleteCard(card.slug);
      showToast("success", "Card deleted.");
      onDeleted();
      onClose();
    } catch {
      showToast("error", "Could not delete the card.");
      setPending(false);
    }
  }

  return (
    <Modal title="Delete card" onClose={onClose} size="max-w-md">
      <div className="flex gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm leading-relaxed text-ink-soft">
            Delete the card for{" "}
            <span className="font-semibold text-ink">{card.name}</span>? The
            public link{" "}
            <code className="rounded bg-cream px-1.5 py-0.5 text-xs text-ink">
              /contact/{card.slug}
            </code>{" "}
            will stop working immediately. This cannot be undone.
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-cream"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
        >
          {pending ? "Deleting..." : "Delete"}
        </button>
      </div>
    </Modal>
  );
}

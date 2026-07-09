import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Copy, Download } from "lucide-react";
import Modal from "./Modal";
import {
  buildVCard,
  contactUrl,
  downloadVCard,
  fetchVCardPhoto,
  type VCardPhoto,
} from "../lib/vcard";
import { useToast } from "../context/ToastContext";
import type { ContactProfile } from "../types";

interface QrDialogProps {
  card: ContactProfile;
  onClose: () => void;
}

/** Download the QR canvas found inside `container` as a PNG. */
function downloadCanvasPng(
  container: HTMLElement | null,
  filename: string,
): void {
  const canvas = container?.querySelector("canvas");
  if (!canvas) {
    return;
  }
  const url = canvas.toDataURL("image/png");
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

export default function QrDialog({ card, onClose }: QrDialogProps) {
  const urlRef = useRef<HTMLDivElement>(null);
  const vcardRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const url = contactUrl(card.slug);
  // The QR references the portrait by URL (tiny, keeps the code scannable)
  // rather than embedding it; embedded base64 would exceed the QR byte limit.
  // The downloaded .vcf still embeds the real image for offline use.
  const vcard = buildVCard(card, undefined, {
    photoUrl: card.portraitUrl ?? undefined,
  });

  const [photo, setPhoto] = useState<VCardPhoto | undefined>(undefined);
  useEffect(() => {
    if (!card.portraitUrl) {
      setPhoto(undefined);
      return;
    }
    let active = true;
    fetchVCardPhoto(card.portraitUrl).then((result) => {
      if (active) {
        setPhoto(result);
      }
    });
    return () => {
      active = false;
    };
  }, [card.portraitUrl]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      showToast("success", "Link copied.");
    } catch {
      showToast("error", "Could not copy the link.");
    }
  }

  return (
    <Modal title={`QR codes for ${card.name}`} onClose={onClose} size="max-w-2xl">
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Online profile URL QR */}
        <div className="flex flex-col items-center rounded-xl border border-line p-5">
          <h3 className="text-sm font-semibold text-ink">
            Online profile URL
          </h3>
          <p className="mt-1 text-center text-xs text-ink-faint break-all">
            {url}
          </p>
          <div ref={urlRef} className="mt-4 rounded-lg bg-white p-2">
            <QRCodeCanvas value={url} size={180} level="M" includeMargin />
          </div>
          <div className="mt-4 flex w-full gap-2">
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink transition hover:bg-cream"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              Copy link
            </button>
            <button
              type="button"
              onClick={() =>
                downloadCanvasPng(urlRef.current, `${card.slug}-url-qr.png`)
              }
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink transition hover:bg-cream"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Download PNG
            </button>
          </div>
        </div>

        {/* Offline vCard QR */}
        <div className="flex flex-col items-center rounded-xl border border-line p-5">
          <h3 className="text-sm font-semibold text-ink">
            Offline vCard
          </h3>
          <p className="mt-1 text-center text-xs text-ink-faint">
            Scan to add contact without visiting the page.
          </p>
          <div ref={vcardRef} className="mt-4 rounded-lg bg-white p-2">
            <QRCodeCanvas value={vcard} size={180} level="M" includeMargin />
          </div>
          <div className="mt-4 flex w-full gap-2">
            <button
              type="button"
              onClick={() =>
                downloadCanvasPng(vcardRef.current, `${card.slug}-vcard-qr.png`)
              }
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink transition hover:bg-cream"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Download PNG
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-line pt-4">
        <button
          type="button"
          onClick={() => downloadVCard(card, photo)}
          className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink transition hover:bg-cream"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Download .vcf
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink/90"
        >
          Done
        </button>
      </div>
    </Modal>
  );
}

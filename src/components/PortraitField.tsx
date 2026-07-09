import { useEffect, useRef, useState } from "react";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import {
  isCloudinaryConfigured,
  uploadPortrait,
  UploadError,
} from "../lib/cloudinary";
import { useToast } from "../context/ToastContext";

interface PortraitFieldProps {
  /** Current portrait URL, or "" when unset. */
  value: string;
  onChange: (url: string) => void;
  /** Signals the parent to block saving while an upload is in flight. */
  onBusyChange?: (busy: boolean) => void;
}

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition focus:border-ink focus:outline-none focus:ring-2 focus:ring-bronze/30";
const labelClass = "block text-sm font-medium text-ink";

/**
 * Portrait picker. Uploads to Cloudinary when configured, showing a live
 * preview and progress; always keeps a manual URL field as a fallback so a
 * portrait can be set even without upload credentials.
 */
export default function PortraitField({
  value,
  onChange,
  onBusyChange,
}: PortraitFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const { showToast } = useToast();
  const uploading = progress !== null;

  useEffect(() => {
    onBusyChange?.(uploading);
  }, [uploading, onBusyChange]);

  async function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }
    setProgress(0);
    try {
      const url = await uploadPortrait(file, setProgress);
      onChange(url);
      showToast("success", "Portrait uploaded.");
    } catch (error) {
      const message =
        error instanceof UploadError
          ? error.message
          : "Could not upload the image. Please try again.";
      showToast("error", message);
    } finally {
      setProgress(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div>
      <span className={labelClass}>Portrait</span>

      {isCloudinaryConfigured && (
        <div className="mt-1.5 flex items-center gap-4">
          <span
            className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-cream"
            aria-hidden={!value}
          >
            {value ? (
              <img
                src={value}
                alt="Portrait preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon className="h-6 w-6 text-ink-faint" aria-hidden="true" />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm font-semibold text-ink transition hover:bg-cream disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Upload className="h-4 w-4" aria-hidden="true" />
                )}
                {uploading
                  ? "Uploading..."
                  : value
                    ? "Replace photo"
                    : "Upload photo"}
              </button>

              {value && !uploading && (
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-ink-soft transition hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Remove
                </button>
              )}
            </div>

            {uploading ? (
              <div className="mt-2.5">
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-cream"
                  role="progressbar"
                  aria-label="Upload progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round((progress ?? 0) * 100)}
                >
                  <div
                    className="h-full rounded-full bg-bronze transition-[width] duration-150 ease-out"
                    style={{ width: `${Math.round((progress ?? 0) * 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-ink-faint">
                JPG, PNG, WebP, or GIF up to 8 MB.
              </p>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      )}

      <div className={isCloudinaryConfigured ? "mt-3" : "mt-1.5"}>
        <label htmlFor="f-portrait" className="text-xs font-medium text-ink-soft">
          {isCloudinaryConfigured ? "Or paste an image URL" : "Portrait image URL"}
        </label>
        <input
          id="f-portrait"
          type="url"
          placeholder="https://"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={uploading}
          className={`${fieldClass} disabled:opacity-50`}
        />
      </div>
    </div>
  );
}

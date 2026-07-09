/**
 * Cloudinary unsigned upload. The app has no backend to sign requests, so it
 * relies on an unsigned upload preset scoped to a single folder. Only the cloud
 * name and preset are exposed to the client; neither is a secret.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const FOLDER = import.meta.env.VITE_CLOUDINARY_FOLDER;

/** Whether Cloudinary credentials are present; gates the upload affordance. */
export const isCloudinaryConfigured = Boolean(CLOUD_NAME && UPLOAD_PRESET);

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Raised for any recoverable upload problem with a message safe to show. */
export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

/** Validate a file before upload; throws UploadError with a friendly message. */
function validate(file: File) {
  if (!ACCEPTED.includes(file.type)) {
    throw new UploadError("Choose a JPG, PNG, WebP, or GIF image.");
  }
  if (file.size > MAX_BYTES) {
    throw new UploadError("Image is larger than 8 MB. Choose a smaller file.");
  }
}

/**
 * Upload an image to Cloudinary and resolve with its secure URL. Reports
 * progress as a 0-1 fraction so the caller can render a determinate bar.
 */
export function uploadPortrait(
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  if (!isCloudinaryConfigured) {
    return Promise.reject(
      new UploadError("Image uploads are not configured yet."),
    );
  }
  validate(file);

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);
  if (FOLDER) {
    form.append("folder", FOLDER);
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);

    xhr.upload.onprogress = (event) => {
      if (onProgress && event.lengthComputable) {
        onProgress(event.loaded / event.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as { secure_url?: string };
          if (data.secure_url) {
            resolve(data.secure_url);
          } else {
            reject(new UploadError("Upload succeeded but returned no URL."));
          }
        } catch {
          reject(new UploadError("Could not read the upload response."));
        }
      } else {
        reject(new UploadError("Upload failed. Please try again."));
      }
    };

    xhr.onerror = () =>
      reject(new UploadError("Network error while uploading. Please try again."));

    xhr.send(form);
  });
}

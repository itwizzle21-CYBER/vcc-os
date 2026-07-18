const DB_NAME = "vcc-os-private-evidence";
const STORE_NAME = "attachments";
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

interface StoredAttachment {
  id: string;
  name: string;
  type: string;
  blob: Blob;
}

export async function saveEvidenceAttachment(file: File): Promise<string> {
  if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
    throw new Error("Evidence attachments must be JPEG, PNG, WebP, or PDF files.");
  }
  if (file.size <= 0 || file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error("Evidence attachments must be between 1 byte and 10 MB.");
  }
  const id = `evidence-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const db = await openEvidenceDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put({ id, name: file.name, type: file.type, blob: file } satisfies StoredAttachment);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
  return id;
}

export async function openEvidenceAttachment(id: string): Promise<boolean> {
  const db = await openEvidenceDatabase();
  const attachment = await new Promise<StoredAttachment | undefined>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result as StoredAttachment | undefined);
    request.onerror = () => reject(request.error);
  });
  db.close();
  if (!attachment) return false;
  const url = URL.createObjectURL(attachment.blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}

function openEvidenceDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

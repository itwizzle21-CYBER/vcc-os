import { parseReceiptText, type ReceiptDraft } from "./receiptParser";

export type ReceiptReadStage = "preparing" | "loading" | "reading" | "checking";
export type ReceiptReadProgress = { stage: ReceiptReadStage; progress: number; label: string };
export type ReceiptImageQuality = { brightness: number; contrast: number; sharpness: number; warnings: string[] };
export type ReceiptReadResult = { draft: ReceiptDraft; quality: ReceiptImageQuality; passes: number };

type ProgressHandler = (progress: ReceiptReadProgress) => void;
type OcrCandidate = { text: string; confidence: number; draft: ReceiptDraft };

export async function readReceiptImage(
  file: File,
  languages: string,
  detectedBarcodes: string[],
  onProgress: ProgressHandler,
): Promise<ReceiptReadResult> {
  onProgress({ stage: "preparing", progress: 0.03, label: "Straightening and enhancing receipt…" });
  const prepared = await prepareReceiptImage(file);
  const { createWorker, OEM, PSM } = await import("tesseract.js");
  let pass = 1;
  const worker = await createWorker(languages.split("+"), OEM.LSTM_ONLY, {
    logger: (message) => {
      if (!Number.isFinite(message.progress)) return;
      const base = pass === 1 ? 0.08 : 0.56;
      const span = pass === 1 ? 0.46 : 0.34;
      onProgress({
        stage: message.status.includes("recognizing") ? "reading" : "loading",
        progress: Math.min(0.92, base + message.progress * span),
        label: receiptProgressLabel(message.status),
      });
    },
  });

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      preserve_interword_spaces: "1",
      user_defined_dpi: "300",
    });
    const enhanced = await worker.recognize(prepared.enhanced, { rotateAuto: true });
    const candidates: OcrCandidate[] = [toCandidate(enhanced.data.text, enhanced.data.confidence, detectedBarcodes)];

    if (needsFallbackPass(candidates[0])) {
      pass = 2;
      onProgress({ stage: "checking", progress: 0.55, label: "Checking faint print and item rows…" });
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,
        preserve_interword_spaces: "1",
        user_defined_dpi: "300",
      });
      const natural = await worker.recognize(prepared.natural, { rotateAuto: true });
      candidates.push(toCandidate(natural.data.text, natural.data.confidence, detectedBarcodes));
    }

    onProgress({ stage: "checking", progress: 0.96, label: "Organizing totals, items, and codes…" });
    return { draft: chooseBestReceiptCandidate(candidates).draft, quality: prepared.quality, passes: candidates.length };
  } finally {
    await worker.terminate();
  }
}

export function scoreReceiptCandidate(candidate: Pick<OcrCandidate, "text" | "confidence" | "draft">): number {
  const { draft, text, confidence } = candidate;
  return Math.max(0, confidence)
    + draft.confidence
    + (draft.merchant && draft.merchant !== "Receipt" ? 35 : 0)
    + (draft.amount ? 45 : 0)
    + (draft.date ? 18 : 0)
    + Math.min(40, draft.items.length * 6)
    + Math.min(18, draft.barcodes.length * 6)
    + Math.min(20, text.split("\n").filter(Boolean).length * 2);
}

function chooseBestReceiptCandidate(candidates: OcrCandidate[]): OcrCandidate {
  return [...candidates].sort((left, right) => scoreReceiptCandidate(right) - scoreReceiptCandidate(left))[0];
}

function toCandidate(text: string, confidence: number, detectedBarcodes: string[]): OcrCandidate {
  return { text, confidence, draft: parseReceiptText(text, detectedBarcodes) };
}

function needsFallbackPass(candidate: OcrCandidate): boolean {
  const lineCount = candidate.text.split("\n").filter((line) => line.trim()).length;
  return candidate.confidence < 72
    || lineCount < 5
    || !candidate.draft.amount
    || candidate.draft.merchant === "Receipt"
    || (!candidate.draft.items.length && lineCount > 7);
}

async function prepareReceiptImage(file: File): Promise<{ natural: HTMLCanvasElement; enhanced: HTMLCanvasElement; quality: ReceiptImageQuality }> {
  const source = await decodeImage(file);
  const longestSide = Math.max(source.width, source.height);
  const targetScale = Math.min(3, Math.max(1, 2200 / Math.max(longestSide, 1)));
  const width = Math.max(1, Math.round(source.width * targetScale));
  const height = Math.max(1, Math.round(source.height * targetScale));
  const natural = document.createElement("canvas");
  natural.width = width;
  natural.height = height;
  const naturalContext = natural.getContext("2d", { willReadFrequently: true });
  if (!naturalContext) throw new Error("Receipt image processing is unavailable on this device.");
  naturalContext.fillStyle = "#fff";
  naturalContext.fillRect(0, 0, width, height);
  naturalContext.imageSmoothingEnabled = true;
  naturalContext.imageSmoothingQuality = "high";
  naturalContext.drawImage(source.image, 0, 0, width, height);
  source.close();

  const naturalData = naturalContext.getImageData(0, 0, width, height);
  const quality = measureReceiptQuality(naturalData);
  const bounds = findLikelyReceiptBounds(naturalData);
  const crop = bounds || { x: 0, y: 0, width, height };
  const enhanced = document.createElement("canvas");
  enhanced.width = crop.width;
  enhanced.height = crop.height;
  const enhancedContext = enhanced.getContext("2d", { willReadFrequently: true });
  if (!enhancedContext) throw new Error("Receipt image enhancement is unavailable on this device.");
  enhancedContext.drawImage(natural, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
  const enhancedData = enhancedContext.getImageData(0, 0, crop.width, crop.height);
  enhanceThermalPrint(enhancedData);
  enhancedContext.putImageData(enhancedData, 0, 0);
  return { natural, enhanced, quality };
}

async function decodeImage(file: File): Promise<{ image: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { image: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      // Fall through to the browser image decoder for formats such as HEIC when available.
    }
  }

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("This receipt image format could not be opened."));
      image.src = objectUrl;
    });
    return { image, width: image.naturalWidth, height: image.naturalHeight, close: () => URL.revokeObjectURL(objectUrl) };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

function enhanceThermalPrint(image: ImageData) {
  const histogram = new Uint32Array(256);
  const gray = new Uint8Array(image.width * image.height);
  for (let pixel = 0, index = 0; pixel < image.data.length; pixel += 4, index += 1) {
    const value = Math.round(image.data[pixel] * 0.299 + image.data[pixel + 1] * 0.587 + image.data[pixel + 2] * 0.114);
    gray[index] = value;
    histogram[value] += 1;
  }
  const low = percentile(histogram, gray.length, 0.02);
  const high = Math.max(low + 24, percentile(histogram, gray.length, 0.98));
  for (let pixel = 0, index = 0; pixel < image.data.length; pixel += 4, index += 1) {
    const normalized = Math.max(0, Math.min(255, ((gray[index] - low) * 255) / (high - low)));
    const boosted = normalized < 175 ? Math.max(0, normalized * 0.72) : Math.min(255, normalized * 1.08);
    image.data[pixel] = boosted;
    image.data[pixel + 1] = boosted;
    image.data[pixel + 2] = boosted;
    image.data[pixel + 3] = 255;
  }
}

function percentile(histogram: Uint32Array, count: number, ratio: number): number {
  const target = count * ratio;
  let total = 0;
  for (let value = 0; value < histogram.length; value += 1) {
    total += histogram[value];
    if (total >= target) return value;
  }
  return 255;
}

function measureReceiptQuality(image: ImageData): ReceiptImageQuality {
  let total = 0;
  let squared = 0;
  let edgeTotal = 0;
  let samples = 0;
  const stride = Math.max(4, Math.floor(Math.min(image.width, image.height) / 240));
  for (let y = stride; y < image.height; y += stride) {
    for (let x = stride; x < image.width; x += stride) {
      const index = (y * image.width + x) * 4;
      const left = index - stride * 4;
      const above = index - stride * image.width * 4;
      const value = image.data[index] * 0.299 + image.data[index + 1] * 0.587 + image.data[index + 2] * 0.114;
      const leftValue = image.data[left] * 0.299 + image.data[left + 1] * 0.587 + image.data[left + 2] * 0.114;
      const aboveValue = image.data[above] * 0.299 + image.data[above + 1] * 0.587 + image.data[above + 2] * 0.114;
      total += value;
      squared += value * value;
      edgeTotal += Math.abs(value - leftValue) + Math.abs(value - aboveValue);
      samples += 1;
    }
  }
  const brightness = samples ? total / samples : 0;
  const contrast = samples ? Math.sqrt(Math.max(0, squared / samples - brightness * brightness)) : 0;
  const sharpness = samples ? edgeTotal / samples : 0;
  const warnings: string[] = [];
  if (brightness < 65) warnings.push("Image is dark—use brighter, even light.");
  if (brightness > 238) warnings.push("Image is washed out—avoid glare on the paper.");
  if (contrast < 28) warnings.push("Print contrast is faint—move closer and keep the receipt flat.");
  if (sharpness < 18) warnings.push("Image may be blurry—hold the phone steady and tap to focus.");
  return { brightness: Math.round(brightness), contrast: Math.round(contrast), sharpness: Math.round(sharpness), warnings };
}

function findLikelyReceiptBounds(image: ImageData): { x: number; y: number; width: number; height: number } | null {
  const stride = Math.max(2, Math.floor(Math.min(image.width, image.height) / 300));
  let minX = image.width;
  let minY = image.height;
  let maxX = 0;
  let maxY = 0;
  let bright = 0;
  let sampled = 0;
  for (let y = 0; y < image.height; y += stride) {
    for (let x = 0; x < image.width; x += stride) {
      const index = (y * image.width + x) * 4;
      const value = image.data[index] * 0.299 + image.data[index + 1] * 0.587 + image.data[index + 2] * 0.114;
      sampled += 1;
      if (value < 170) continue;
      bright += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (!bright || bright / sampled < 0.12 || bright / sampled > 0.92) return null;
  const paddingX = Math.round(image.width * 0.025);
  const paddingY = Math.round(image.height * 0.025);
  const x = Math.max(0, minX - paddingX);
  const y = Math.max(0, minY - paddingY);
  const width = Math.min(image.width - x, maxX - minX + paddingX * 2);
  const height = Math.min(image.height - y, maxY - minY + paddingY * 2);
  if (width * height < image.width * image.height * 0.2) return null;
  return { x, y, width, height };
}

function receiptProgressLabel(status: string): string {
  if (status.includes("loading language")) return "Loading receipt language model…";
  if (status.includes("initializing")) return "Starting the receipt reader…";
  if (status.includes("recognizing")) return "Reading merchant, items, and totals…";
  return "Preparing receipt reader…";
}

import Tesseract from "tesseract.js";

export interface ParsedReceipt {
  amount?: string;
  merchant?: string;
  date?: string;
  rawText?: string;
}

export async function runOcr(
  imageDataUrl: string,
  onProgress?: (p: number) => void
): Promise<string> {
  const result = await Tesseract.recognize(imageDataUrl, "eng", {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(m.progress);
      }
    },
  });
  return result.data.text || "";
}

/**
 * Extract structured data from raw OCR text.
 * - Amount: largest decimal-looking number (prefers lines with "total")
 * - Date: first DD/MM/YYYY-style match (also dashes & dots)
 * - Merchant: first non-empty meaningful line
 */
export function extractReceiptData(rawText: string): ParsedReceipt {
  const text = rawText || "";
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // ---- Amount ----
  const amountRe = /(\d{1,6}(?:[.,]\d{2}))/g;
  let amount: string | undefined;

  // Prefer lines containing total/amount/grand
  const totalLine = lines.find((l) =>
    /\b(grand\s*total|total|amount\s*due|balance)\b/i.test(l)
  );
  if (totalLine) {
    const matches = totalLine.match(amountRe);
    if (matches?.length) {
      amount = normalizeAmount(matches[matches.length - 1]);
    }
  }

  // Fallback: largest amount in entire text
  if (!amount) {
    const all = text.match(amountRe) || [];
    const nums = all
      .map((s) => ({ raw: s, val: parseFloat(normalizeAmount(s)) }))
      .filter((x) => !isNaN(x.val) && x.val > 0);
    if (nums.length) {
      nums.sort((a, b) => b.val - a.val);
      amount = nums[0].val.toFixed(2);
    }
  }

  // ---- Date ----
  let date: string | undefined;
  const dateMatch = text.match(
    /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/
  );
  if (dateMatch) {
    date = normalizeDate(dateMatch[1], dateMatch[2], dateMatch[3]);
  }

  // ---- Merchant ----
  let merchant: string | undefined;
  for (const l of lines) {
    // Skip lines that are mostly digits, dates, or look like totals
    if (/^[\d\s.,:\/\-]+$/.test(l)) continue;
    if (l.length < 3) continue;
    if (/receipt|invoice|tax|cashier|order/i.test(l)) continue;
    merchant = l.replace(/[*_=]+/g, "").slice(0, 60).trim();
    break;
  }

  return { amount, merchant, date, rawText: text };
}

function normalizeAmount(s: string): string {
  // Convert "1.234,56" -> "1234.56" and "1,234.56" -> "1234.56"
  let cleaned = s.replace(/\s/g, "");
  if (cleaned.includes(",") && cleaned.includes(".")) {
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (cleaned.includes(",")) {
    // Likely European decimal
    const parts = cleaned.split(",");
    if (parts[parts.length - 1].length === 2) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  }
  const n = parseFloat(cleaned);
  return isNaN(n) ? "" : n.toFixed(2);
}

function normalizeDate(d: string, m: string, y: string): string {
  let year = parseInt(y, 10);
  if (year < 100) year += 2000;
  let day = parseInt(d, 10);
  let month = parseInt(m, 10);
  // Heuristic: if first part > 12, it's day-first (already correct).
  // If second > 12, swap (US format M/D/Y)
  if (month > 12 && day <= 12) {
    [day, month] = [month, day];
  }
  if (day < 1 || day > 31 || month < 1 || month > 12) return "";
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

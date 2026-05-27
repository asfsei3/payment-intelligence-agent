import Papa from "papaparse";
import { REQUIRED_COLUMNS, type RawTransaction, type SafetyReport } from "./types";

// PAN-like value detection (Luhn-valid 13-19 digit numbers).
// We do not store or echo back the matched value — only the fact it was found.
const DIGIT_RUN = /\b(?:\d[ -]?){13,19}\b/g;

function luhnValid(digits: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48;
    if (n < 0 || n > 9) return false;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0 && digits.length >= 13 && digits.length <= 19;
}

export function containsPanLike(text: string): boolean {
  const matches = text.match(DIGIT_RUN);
  if (!matches) return false;
  for (const m of matches) {
    const digits = m.replace(/[^\d]/g, "");
    if (digits.length >= 13 && digits.length <= 19 && luhnValid(digits)) {
      return true;
    }
  }
  return false;
}

export interface ParsedCsv {
  rows: RawTransaction[];
  headers: string[];
  rawText: string;
  errors: string[];
}

export function parseCsv(text: string): ParsedCsv {
  const result = Papa.parse<RawTransaction>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return {
    rows: result.data as RawTransaction[],
    headers: (result.meta.fields ?? []).map((h) => h.trim()),
    rawText: text,
    errors: result.errors.map(
      (e) => `行${(e.row ?? 0) + 1}: ${e.code} ${e.message}`,
    ),
  };
}

export function safetyCheck(parsed: ParsedCsv): SafetyReport {
  const missing_columns = REQUIRED_COLUMNS.filter(
    (c) => !parsed.headers.includes(c),
  );

  // Scan a sample of cell values for PAN-like content. We scan ALL cells but
  // only across the first ~200 rows to keep this fast on the demo path.
  const sample = parsed.rows.slice(0, 200);
  let pan_like_detected = false;
  for (const row of sample) {
    for (const v of Object.values(row)) {
      if (typeof v === "string" && containsPanLike(v)) {
        pan_like_detected = true;
        break;
      }
    }
    if (pan_like_detected) break;
  }

  const notes: string[] = [];
  if (missing_columns.length > 0) {
    notes.push(
      `必須カラムが不足しています: ${missing_columns.join(", ")}`,
    );
  }
  if (pan_like_detected) {
    notes.push(
      "PANらしき値（カード番号と推定される桁数の数値）を検出しました。安全のため分析を停止しました。マスク済みCSVをご利用ください。",
    );
  }
  if (notes.length === 0) {
    notes.push("必須カラムが揃っており、PANらしき値も検出されませんでした。");
  }

  return {
    blocked: pan_like_detected || missing_columns.length > 0,
    pan_like_detected,
    missing_columns,
    total_rows: parsed.rows.length,
    notes,
  };
}

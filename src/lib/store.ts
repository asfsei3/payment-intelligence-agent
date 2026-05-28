// In-memory analysis store. Persisted only for the process lifetime.
// Sufficient for a hackathon demo running on a single Container Apps instance.
//
// We attach the Map to globalThis on purpose: in Next.js dev mode (and across
// some HMR boundaries), route bundles can get distinct module instances. A
// plain module-scoped Map would therefore mean the writer and reader see
// different stores. globalThis is shared across all bundles in the process.

import type { AnalysisResult } from "./types";

const MAX_ITEMS = 50;

type Entry = { value: AnalysisResult; touched: number };

const GLOBAL_KEY = "__pia_analysis_store__";

type GlobalWithStore = typeof globalThis & {
  [GLOBAL_KEY]?: Map<string, Entry>;
};
const g = globalThis as GlobalWithStore;
const map: Map<string, Entry> = g[GLOBAL_KEY] ?? (g[GLOBAL_KEY] = new Map());

export function putAnalysis(result: AnalysisResult): void {
  map.set(result.id, { value: result, touched: Date.now() });
  if (map.size > MAX_ITEMS) {
    // evict oldest
    let oldestKey: string | null = null;
    let oldestT = Infinity;
    for (const [k, e] of map) {
      if (e.touched < oldestT) {
        oldestT = e.touched;
        oldestKey = k;
      }
    }
    if (oldestKey) map.delete(oldestKey);
  }
}

export function getAnalysis(id: string): AnalysisResult | undefined {
  const e = map.get(id);
  if (!e) return undefined;
  e.touched = Date.now();
  return e.value;
}

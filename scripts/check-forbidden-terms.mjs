// Forbidden-term scanner for user-facing surfaces.
// Run with: npm run check:forbidden
//
// Scans src/ (UI + lib), sample/ (data), README.md, and docs/.
// Allow-lists:
// - The shared system prompt in src/lib/ai.ts (must list forbidden terms TO the model).
// - docs/architecture.md, docs/prompts.md, docs/submission-checklist.md (meta-references).
//
// Exit code 1 if any disallowed occurrence is found.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

const FORBIDDEN = [
  "自動再請求",
  "完全自動回収",
  "回収保証",
  "AIが学習",
  "機械学習モデル",
  "高度なAIリトライ",
  "AIが最適なリトライを判断",
  "AIが売上を自動回収",
  "RecoverAI",
];
// Brand/product names — case-sensitive whole-word match.
const FORBIDDEN_BRANDS = ["Visa", "Cybersource"];

const SCAN_ROOTS = ["src", "sample", "docs", "README.md"];
const SCAN_EXTS = new Set([".ts", ".tsx", ".md", ".csv", ".json"]);

// Files where forbidden terms are allowed because they ARE the do-not-use list,
// or they reference forbidden terms as meta-instructions to the human reviewer.
const ALLOWLIST_FILES = new Set([
  "src/lib/ai.ts",                              // System prompt lists forbidden terms TO the model
  "docs/architecture.md",                       // Documents the forbidden-term policy
  "docs/prompts.md",                            // Documents the system prompt
  "docs/submission-checklist.md",               // Shows the grep command to verify
  "docs/zenn-article-draft.md",                 // Explains "these terms are forbidden" to readers
  "docs/zenn-publish-checklist.md",             // Shows the grep command for publish-time verification
  "docs/submission-form-draft.md",              // Explains the policy as a differentiator
  "scripts/check-forbidden-terms.mjs",          // This file itself
]);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      yield* walk(p);
    } else if (SCAN_EXTS.has(extname(entry))) {
      yield p;
    }
  }
}

const candidates = [];
for (const r of SCAN_ROOTS) {
  const abs = join(ROOT, r);
  try {
    const st = statSync(abs);
    if (st.isDirectory()) candidates.push(...walk(abs));
    else if (SCAN_EXTS.has(extname(r))) candidates.push(abs);
  } catch {
    /* ignore */
  }
}

const failures = [];
for (const file of candidates) {
  const rel = relative(ROOT, file);
  if (ALLOWLIST_FILES.has(rel)) continue;
  const text = readFileSync(file, "utf8");
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const term of FORBIDDEN) {
      if (line.includes(term)) {
        failures.push({ rel, line: i + 1, term, snippet: line.trim().slice(0, 120) });
      }
    }
    for (const brand of FORBIDDEN_BRANDS) {
      const re = new RegExp(`\\b${brand}\\b`);
      if (re.test(line)) {
        failures.push({ rel, line: i + 1, term: brand, snippet: line.trim().slice(0, 120) });
      }
    }
  }
}

if (failures.length === 0) {
  console.log(`✓ Forbidden-term scan: clean (${candidates.length} files checked, ${ALLOWLIST_FILES.size} allowlisted).`);
  process.exit(0);
}

console.error(`✗ Forbidden-term scan: ${failures.length} occurrence(s) found:\n`);
for (const f of failures) {
  console.error(`  ${f.rel}:${f.line}  [${f.term}]`);
  console.error(`    ${f.snippet}`);
}
process.exit(1);

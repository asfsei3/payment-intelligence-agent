"use client";

import { useState } from "react";

interface Props {
  markdown: string;
}

export function BriefingActions({ markdown }: Props) {
  const [copied, setCopied] = useState<"md" | "slack" | null>(null);

  async function copy(kind: "md" | "slack") {
    let text = markdown;
    if (kind === "slack") {
      // light conversion: ## → *bold*, - → •
      text = markdown
        .replace(/^###\s+(.*)$/gm, "*$1*")
        .replace(/^##\s+(.*)$/gm, "*$1*")
        .replace(/^#\s+(.*)$/gm, "*$1*")
        .replace(/^-\s+/gm, "• ");
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      // ignore — clipboard requires secure context
    }
  }

  function exportMd() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "revenue-leakage-briefing.md";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => void copy("md")}
        className="btn-secondary text-xs px-3 py-1.5"
      >
        {copied === "md" ? "コピーしました" : "Markdownをコピー"}
      </button>
      <button
        type="button"
        onClick={() => void copy("slack")}
        className="btn-secondary text-xs px-3 py-1.5"
      >
        {copied === "slack" ? "コピーしました" : "Slack/Notion用にコピー"}
      </button>
      <button
        type="button"
        onClick={exportMd}
        className="btn-ghost text-xs"
      >
        .md書き出し
      </button>
    </div>
  );
}

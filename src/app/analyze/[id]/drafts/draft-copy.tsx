"use client";

import { useState } from "react";

interface Props {
  subject: string;
  body: string;
}

export function DraftCopy({ subject, body }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(`件名: ${subject}\n\n${body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copyAll()}
      className="btn-secondary text-xs px-2.5 py-1"
    >
      {copied ? "コピーしました" : "下書きをコピー"}
    </button>
  );
}

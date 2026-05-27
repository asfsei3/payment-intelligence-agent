"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface Props {
  analysisId: string;
}

const TABS: { href: string; label: string }[] = [
  { href: "dashboard", label: "ダッシュボード" },
  { href: "action-plan", label: "Today's Action Plan" },
  { href: "briefing", label: "経営ブリーフィング" },
  { href: "scenario", label: "Scenario Simulator" },
  { href: "drafts", label: "顧客対応下書き" },
  { href: "prevention", label: "再発防止" },
];

export function AnalysisTabs({ analysisId }: Props) {
  const pathname = usePathname();
  const search = useSearchParams();
  const scenarioQuery = search.get("scenario");
  const qs = scenarioQuery ? `?scenario=${scenarioQuery}` : "";

  return (
    <nav className="overflow-x-auto -mx-1">
      <ul className="inline-flex items-center gap-1 px-1 min-w-full">
        {TABS.map((t) => {
          const href = `/analyze/${analysisId}/${t.href}${qs}`;
          const active = pathname?.startsWith(
            `/analyze/${analysisId}/${t.href}`,
          );
          return (
            <li key={t.href}>
              <Link
                href={href}
                className={
                  active
                    ? "inline-block px-3.5 py-2 text-sm font-medium rounded-md bg-ink-700 border border-gold-500/30 text-gold-300"
                    : "inline-block px-3.5 py-2 text-sm font-medium rounded-md text-moss-200 hover:text-gold-300 hover:bg-ink-700/60 border border-transparent"
                }
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Scenario } from "@/lib/types";
import { SCENARIO_LABEL_JA } from "@/lib/scenario";

const SCENARIOS: Scenario[] = ["cx_first", "revenue_first", "risk_min"];

export function ScenarioSwitcher({ current }: { current: Scenario }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  function setScenario(s: Scenario) {
    const params = new URLSearchParams(search.toString());
    params.set("scenario", s);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    router.refresh();
  }

  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-md bg-ink-800 border border-gold-500/15">
      {SCENARIOS.map((s) => {
        const active = s === current;
        return (
          <button
            key={s}
            type="button"
            onClick={() => setScenario(s)}
            className={
              active
                ? "px-3 py-1.5 text-xs font-medium rounded bg-gradient-to-b from-gold-400 to-gold-500 text-ink-950"
                : "px-3 py-1.5 text-xs font-medium rounded text-moss-200 hover:text-gold-300"
            }
          >
            {SCENARIO_LABEL_JA[s]}
          </button>
        );
      })}
    </div>
  );
}

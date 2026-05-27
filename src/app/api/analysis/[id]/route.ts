import { getAnalysis } from "@/lib/store";
import { applyScenario } from "@/lib/pipeline";
import type { Scenario } from "@/lib/types";

export const runtime = "nodejs";

function isScenario(s: string | null): s is Scenario {
  return s === "cx_first" || s === "revenue_first" || s === "risk_min";
}

export async function GET(
  req: Request,
  context: { params: { id: string } },
): Promise<Response> {
  const id = context.params.id;
  const existing = getAnalysis(id);
  if (!existing) {
    return Response.json(
      { error: "指定の分析IDが見つかりませんでした。" },
      { status: 404 },
    );
  }
  const url = new URL(req.url);
  const scenarioParam = url.searchParams.get("scenario");
  const scenario = isScenario(scenarioParam) ? scenarioParam : existing.scenario;
  const out = applyScenario(existing, scenario);
  return Response.json({ result: out });
}

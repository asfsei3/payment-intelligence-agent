import { runAnalysis } from "@/lib/pipeline";
import { putAnalysis } from "@/lib/store";
import type { Scenario } from "@/lib/types";

export const runtime = "nodejs";

interface AnalyzePayload {
  csv?: string;
  scenario?: Scenario;
}

function isScenario(s: string | undefined): s is Scenario {
  return s === "cx_first" || s === "revenue_first" || s === "risk_min";
}

export async function POST(req: Request): Promise<Response> {
  let payload: AnalyzePayload;
  try {
    payload = (await req.json()) as AnalyzePayload;
  } catch {
    return Response.json(
      { error: "リクエスト本文の解析に失敗しました。" },
      { status: 400 },
    );
  }
  const csv = payload.csv;
  if (typeof csv !== "string" || csv.trim().length === 0) {
    return Response.json(
      { error: "csvフィールドが空です。" },
      { status: 400 },
    );
  }
  if (csv.length > 2_000_000) {
    return Response.json(
      { error: "ファイルサイズが大きすぎます（2MB上限）。" },
      { status: 413 },
    );
  }
  const scenario = isScenario(payload.scenario) ? payload.scenario : "cx_first";
  try {
    const result = await runAnalysis(csv, { scenario });
    putAnalysis(result);
    return Response.json({ id: result.id, result });
  } catch (err) {
    console.error("[api/analyze] failed:", err);
    return Response.json(
      { error: "分析中にエラーが発生しました。", detail: String(err) },
      { status: 500 },
    );
  }
}

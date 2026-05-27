import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

export async function GET(req: Request): Promise<Response> {
  try {
    const path = join(process.cwd(), "sample", "payment_failures_sample.csv");
    const text = await readFile(path, "utf8");
    const url = new URL(req.url);
    const forceDownload = url.searchParams.get("download") === "1";
    const headers: Record<string, string> = {
      "content-type": "text/csv; charset=utf-8",
      "cache-control": "no-store",
    };
    if (forceDownload) {
      headers["content-disposition"] =
        'attachment; filename="payment_failures_sample.csv"';
    }
    return new Response(text, { headers });
  } catch (err) {
    console.error("[api/sample] failed:", err);
    return Response.json(
      { error: "サンプルCSVを読み込めませんでした。" },
      { status: 500 },
    );
  }
}

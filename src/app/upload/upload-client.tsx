"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { parseCsv, safetyCheck } from "@/lib/csv";
import type { SafetyReport } from "@/lib/types";

type Status = "idle" | "loaded" | "analyzing" | "error";

export function UploadClient() {
  const router = useRouter();
  const params = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [safety, setSafety] = useState<SafetyReport | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  const wantSample = params.get("sample") === "1";
  const [autoLoaded, setAutoLoaded] = useState(false);
  const triedSampleRef = useRef(false);

  useEffect(() => {
    if (wantSample && !csvText && !triedSampleRef.current) {
      triedSampleRef.current = true;
      setAutoLoaded(true);
      void loadSample();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantSample]);

  function ingestCsv(text: string, source: string) {
    setError("");
    setCsvText(text);
    setFileName(source);
    const parsed = parseCsv(text);
    setPreviewHeaders(parsed.headers);
    setPreviewRows(parsed.rows.slice(0, 5) as unknown as Record<string, string>[]);
    setSafety(safetyCheck(parsed));
    setStatus("loaded");
  }

  async function loadSample() {
    try {
      const res = await fetch("/api/sample");
      if (!res.ok) throw new Error(`status ${res.status}`);
      const text = await res.text();
      ingestCsv(text, "payment_failures_sample.csv");
    } catch (e) {
      setError(`サンプルCSVの読み込みに失敗しました: ${String(e)}`);
      setStatus("error");
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_000_000) {
      setError("ファイルサイズが2MBを超えています。");
      setStatus("error");
      return;
    }
    // User picked their own file → hide the auto-loaded banner
    setAutoLoaded(false);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      ingestCsv(text, file.name);
    };
    reader.onerror = () => {
      setError("ファイルの読み込みに失敗しました。");
      setStatus("error");
    };
    reader.readAsText(file, "utf-8");
  }

  async function startAnalysis() {
    if (!csvText || (safety && safety.blocked)) return;
    setStatus("analyzing");
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ csv: csvText, scenario: "cx_first" }),
      });
      const json = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !json.id) {
        throw new Error(json.error || `status ${res.status}`);
      }
      router.push(`/analyze/${json.id}/timeline`);
    } catch (e) {
      setError(`分析に失敗しました: ${String(e)}`);
      setStatus("error");
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      <div className="flex flex-col gap-6">
        {/* Auto-loaded notice */}
        {autoLoaded && status === "loaded" && (
          <div className="card border-gold-500/30 bg-gold-500/5 p-4 flex items-start gap-3">
            <span className="text-gold-300 text-base leading-none mt-0.5">ℹ</span>
            <div className="flex-1">
              <div className="text-sm text-moss-100 font-medium">
                デモ用にサンプルCSVを自動で読み込みました
              </div>
              <p className="text-xs text-moss-200/85 mt-1 leading-relaxed">
                実際の業務では、ご自身のマスク済みCSVをアップロードします。
                右上の「ファイルを選択」で差し替え可能です。
                <a
                  href="/api/sample?download=1"
                  download="payment_failures_sample.csv"
                  className="text-gold-300 underline underline-offset-2 hover:text-gold-400 ml-1"
                >
                  サンプルCSVをダウンロード
                </a>
                して中身を確認することもできます。
              </p>
            </div>
          </div>
        )}

        {/* Drop zone / picker */}
        <div className="card-elev p-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="heading-2">ファイル選択</h2>
              <p className="text-sm text-moss-200 mt-1">
                CSV形式（UTF-8）。最大2MB。
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => void loadSample()}
              >
                サンプルCSVを読み込む
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => inputRef.current?.click()}
              >
                ファイルを選択
              </button>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={onFileChange}
              />
            </div>
          </div>
          {fileName && (
            <div className="text-xs text-moss-200">
              選択中: <span className="text-gold-300">{fileName}</span>
              {" "}
              ({safety?.total_rows ?? 0}件)
            </div>
          )}
        </div>

        {/* Preview */}
        {previewHeaders.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="heading-2">プレビュー（先頭5件）</h2>
              <span className="text-xs text-moss-200/80">
                {previewHeaders.length}カラム
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr>
                    {previewHeaders.map((h) => (
                      <th
                        key={h}
                        className="text-left text-gold-400/80 font-medium uppercase tracking-wider py-2 pr-4 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-t border-gold-500/5 text-moss-200"
                    >
                      {previewHeaders.map((h) => (
                        <td key={h} className="py-2 pr-4 whitespace-nowrap">
                          {String(row[h] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && (
          <div className="card p-4 border-danger/30 text-danger text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Right column: safety + start */}
      <aside className="flex flex-col gap-4">
        <div className="card-elev p-5 flex flex-col gap-3">
          <span className="section-title">Safety Agent (事前チェック)</span>
          {!safety && (
            <p className="text-sm text-moss-200/80">
              CSVを読み込むと、PANらしき値と必須カラムを自動チェックします。
            </p>
          )}
          {safety && (
            <>
              <div className="flex items-center gap-2">
                {safety.blocked ? (
                  <span className="badge-danger">分析を停止</span>
                ) : (
                  <span className="badge-ok">問題なし</span>
                )}
                <span className="text-xs text-moss-200/80">
                  {safety.total_rows}件を確認
                </span>
              </div>
              <ul className="text-xs text-moss-200 flex flex-col gap-1.5 mt-1">
                {safety.notes.map((n, i) => (
                  <li
                    key={i}
                    className={
                      safety.blocked
                        ? "text-danger leading-snug"
                        : "text-moss-200 leading-snug"
                    }
                  >
                    ・ {n}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <button
          type="button"
          className="btn-primary justify-center text-base py-3"
          disabled={
            !csvText || !!safety?.blocked || status === "analyzing"
          }
          onClick={() => void startAnalysis()}
        >
          {status === "analyzing"
            ? "分析を実行中…"
            : "分析を開始"}
        </button>
        <p className="text-[11px] text-moss-200/60 leading-relaxed">
          分析を開始するとCSVはサーバー上で集計され、Agent Timelineが表示されます。
          PSPへの再請求やお客様への送信は行いません。
        </p>
      </aside>
    </div>
  );
}

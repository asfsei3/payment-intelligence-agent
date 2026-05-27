import { Suspense } from "react";
import { UploadClient } from "./upload-client";

export default function UploadPage() {
  return (
    <div className="flex flex-col gap-6 pt-2 md:pt-4">
      <div>
        <span className="section-title">Step 1 / 4</span>
        <h1 className="heading-1 mt-1">CSVをアップロード</h1>
        <p className="text-moss-200 mt-2 max-w-2xl">
          マスク済みの決済エラーCSVをアップロードしてください。
          PANらしき値や必須カラム不足を検出した場合、安全のため分析を停止します。
        </p>
      </div>

      <Suspense
        fallback={
          <div className="card p-8 text-moss-200 text-sm">読み込み中…</div>
        }
      >
        <UploadClient />
      </Suspense>
    </div>
  );
}

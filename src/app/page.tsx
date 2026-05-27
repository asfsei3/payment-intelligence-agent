import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-12 pt-4 md:pt-10">
      {/* Hero */}
      <section className="grid md:grid-cols-[1.2fr_1fr] gap-10 items-start">
        <div className="flex flex-col gap-5">
          <span className="badge-gold w-fit">
            Microsoft Agent Hackathon 2026 Prototype
          </span>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-moss-100 leading-[1.1]">
            Payment Intelligence Agent
          </h1>
          <p className="text-xl text-gold-300 font-medium leading-snug">
            決済エラー対応を、AI Revenue Ops Deskに。
          </p>
          <p className="text-moss-200 leading-relaxed max-w-2xl">
            サブスク事業者の決済エラー対応は、PSP管理画面・CSV・顧客対応・経営報告に
            <strong className="text-moss-100">分断</strong>されがちです。
            Payment Intelligence Agentは、マスク済みCSVを入力すると、
            <strong className="text-gold-300">7つのAIエージェント</strong>が
            安全確認 → 分類 → 売上影響 → 顧客対応 → 経営報告 → 再発防止までを
            <strong className="text-moss-100">1つのワークフロー</strong>で整理します。
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-1">
            <Link
              href="/upload?sample=1"
              className="btn-primary text-base px-5 py-3"
            >
              ▶ サンプルCSVで30秒デモを開始
            </Link>
            <Link href="/upload" className="btn-secondary">
              CSVをアップロード
            </Link>
            <a
              href="/api/sample?download=1"
              download="payment_failures_sample.csv"
              className="btn-ghost text-sm"
            >
              ↓ サンプルCSVをダウンロード
            </a>
          </div>
          <p className="text-[11px] text-moss-200/60 -mt-2">
            ダウンロードして中身を確認してから自分でアップロードすることもできます。
          </p>

          <div className="grid grid-cols-2 gap-3 mt-2 max-w-2xl">
            <div className="card p-3.5 text-xs text-moss-200 border-moss-400/20">
              <div className="text-moss-200/70 mb-1">このアプリは</div>
              <ul className="flex flex-col gap-1">
                <li className="flex gap-1.5"><span className="text-moss-300">✓</span>マスク済みCSVを分析</li>
                <li className="flex gap-1.5"><span className="text-moss-300">✓</span>優先タスクと下書きを生成</li>
                <li className="flex gap-1.5"><span className="text-moss-300">✓</span>経営者向け要約を生成</li>
              </ul>
            </div>
            <div className="card p-3.5 text-xs text-moss-200 border-danger/20">
              <div className="text-danger/90 mb-1">このアプリは行いません</div>
              <ul className="flex flex-col gap-1">
                <li className="flex gap-1.5"><span className="text-danger">✗</span>決済処理・リトライ実行</li>
                <li className="flex gap-1.5"><span className="text-danger">✗</span>顧客への自動送信</li>
                <li className="flex gap-1.5"><span className="text-danger">✗</span>PSP APIの呼び出し</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Sidebar: 7-Agent Workflow */}
        <aside className="card-elev p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="section-title">7-Agent Workflow</span>
            <span className="text-[10px] text-moss-200/60 tabular-nums">
              avg ~6s
            </span>
          </div>
          <ol className="flex flex-col gap-2">
            {AGENT_OVERVIEW.map((a, i) => (
              <li key={a.name} className="flex gap-3 items-start">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ink-700 border border-gold-500/20 text-base">
                  {a.icon}
                </span>
                <span className="leading-tight">
                  <span className="text-moss-100 font-medium text-sm">
                    {i + 1}. {a.name}
                  </span>
                  <span className="block text-moss-200/75 text-xs mt-0.5">
                    {a.role_ja}
                  </span>
                  <span
                    className={
                      a.ai
                        ? "inline-block mt-1 text-[10px] text-gold-300/90"
                        : "inline-block mt-1 text-[10px] text-moss-300/80"
                    }
                  >
                    {a.ai ? "● Azure OpenAI" : "● rule-based"}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </aside>
      </section>

      {/* What you'll see — 4-step visual */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="heading-2">30秒で見える流れ</h2>
          <span className="text-xs text-moss-200/70">
            サンプルCSV(80件)で全機能をすぐに体験できます
          </span>
        </div>
        <ol className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {FLOW_STEPS.map((s, i) => (
            <li key={s.title} className="card p-5 relative">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-gold-300 text-xs font-mono">
                  STEP {i + 1}
                </span>
                <span className="text-[10px] text-moss-200/60">
                  {s.path}
                </span>
              </div>
              <div className="text-base font-semibold text-moss-100">
                {s.title}
              </div>
              <p className="text-xs text-moss-200/85 leading-relaxed mt-1.5">
                {s.body}
              </p>
              {i < FLOW_STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 text-gold-500/40"
                >
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* Design principles */}
      <section className="card-elev p-6 md:p-8">
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <span className="section-title">Rule-first, AI-assisted</span>
            <p className="mt-2 text-sm text-moss-200 leading-relaxed">
              安全確認・分類・売上影響・優先度判定は決定的ルール。
              Azure OpenAIは経営者向けブリーフィング・推奨文言・下書き生成のみに使います。
              <strong className="text-moss-100">AIはルールベース分類を上書きしません。</strong>
            </p>
          </div>
          <div>
            <span className="section-title">Azure Native</span>
            <p className="mt-2 text-sm text-moss-200 leading-relaxed">
              Azure App Service上で動作し、Azure OpenAIを呼び出します。
              環境変数が未設定の場合はmock応答にフォールバックし、
              <strong className="text-moss-100">デモが必ず動作</strong>します。
            </p>
          </div>
          <div>
            <span className="section-title">Operations First</span>
            <p className="mt-2 text-sm text-moss-200 leading-relaxed">
              Today&apos;s Action Plan・Executive Briefing・Scenario Simulator・
              Customer Support Drafts・Prevention Suggestions の
              <strong className="text-moss-100">5つの実務アウトプット</strong>を
              1つのワークフローで生成します。
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="text-center flex flex-col items-center gap-3 pt-2">
        <span className="text-xs text-moss-200/70 uppercase tracking-[0.2em]">
          ハッカソン審査員の方へ
        </span>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <Link
            href="/upload?sample=1"
            className="btn-primary text-base px-6 py-3"
          >
            ▶ サンプルCSVで30秒デモを開始
          </Link>
          <a
            href="/api/sample?download=1"
            download="payment_failures_sample.csv"
            className="btn-secondary text-sm"
          >
            ↓ サンプルCSVをダウンロード
          </a>
        </div>
        <p className="text-xs text-moss-200/60 max-w-xl mx-auto">
          認証不要・環境変数不要(Azure OpenAI未設定時はmock応答で動作)。
          サンプル80件のマスク済みCSVが同梱されています。
          中身を確認してから自分でアップロードすることもできます。
        </p>
      </section>
    </div>
  );
}

const AGENT_OVERVIEW: {
  name: string;
  role_ja: string;
  icon: string;
  ai: boolean;
}[] = [
  { name: "Safety Agent", role_ja: "PANらしき値・必須カラムを確認", icon: "🛡", ai: false },
  { name: "Classification Agent", role_ja: "エラーを4カテゴリに分類", icon: "🧭", ai: false },
  { name: "Revenue Impact Agent", role_ja: "売上影響と対応余地を集計", icon: "📊", ai: false },
  { name: "Customer Recovery Agent", role_ja: "顧客対応下書きを生成", icon: "✉", ai: true },
  { name: "Ops Task Agent", role_ja: "優先タスクを作成", icon: "📋", ai: false },
  { name: "Executive Reporting Agent", role_ja: "経営ブリーフィング", icon: "📈", ai: true },
  { name: "Prevention Agent", role_ja: "次月の改善提案", icon: "🔁", ai: true },
];

const FLOW_STEPS: { title: string; body: string; path: string }[] = [
  {
    title: "CSVを安全に取り込む",
    body: "PANらしき値・必須カラムをSafety Agentが事前検査。問題があれば分析を停止します。",
    path: "/upload",
  },
  {
    title: "7エージェントが順に処理",
    body: "Agent Timelineで各エージェントの所要時間とAI利用有無をリアルタイム表示。",
    path: "/analyze/.../timeline",
  },
  {
    title: "ダッシュボードと優先タスク",
    body: "KPI・カテゴリ別売上影響・Today's Action Planで「今日着手すべきこと」が見えます。",
    path: "/analyze/.../dashboard",
  },
  {
    title: "経営報告と再発防止まで",
    body: "Markdown経営ブリーフィング・顧客対応下書き・Scenario Simulator・再発防止提案を生成。",
    path: "/analyze/.../briefing",
  },
];

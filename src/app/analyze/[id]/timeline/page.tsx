import { notFound } from "next/navigation";
import { getAnalysis } from "@/lib/store";
import { TimelineClient } from "./timeline-client";

interface Props {
  params: { id: string };
}

export default function TimelinePage({ params }: Props) {
  const result = getAnalysis(params.id);
  if (!result) return notFound();
  return (
    <div className="flex flex-col gap-6 pt-2">
      <div>
        <span className="section-title">Step 2 / 4 · Agent Timeline</span>
        <h1 className="heading-1 mt-1">エージェントが順に処理を進めています</h1>
        <p className="text-moss-200 mt-2 max-w-2xl">
          Payment Intelligence Agentは7つのAIエージェントで構成されています。
          各エージェントの処理結果がリアルタイムで表示されます。
        </p>
      </div>
      <TimelineClient
        analysisId={result.id}
        runs={result.agent_runs}
        aiMode={result.ai_mode}
      />
    </div>
  );
}

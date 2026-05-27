import { redirect } from "next/navigation";

interface Props {
  params: { id: string };
}

export default function AnalyzeIndex({ params }: Props) {
  redirect(`/analyze/${params.id}/dashboard`);
}

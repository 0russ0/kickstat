import { useRouter } from "expo-router";
import { HistoryScreenContent } from "@/components/HistoryScreenContent";

export default function HistoryRoute() {
  const router = useRouter();
  return <HistoryScreenContent onClose={() => router.back()} />;
}

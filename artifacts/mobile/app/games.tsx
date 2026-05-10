import { useRouter } from "expo-router";
import { GamesScreenContent } from "@/components/GamesScreenContent";

export default function GamesRoute() {
  const router = useRouter();
  return <GamesScreenContent onClose={() => router.back()} />;
}

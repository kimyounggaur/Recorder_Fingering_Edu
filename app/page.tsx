import { RecorderErrorBoundary } from "@/src/features/recorder/components/RecorderErrorBoundary";
import { RecorderLearningApp } from "@/src/features/recorder/components/RecorderLearningApp";

export default function Home() {
  return (
    <RecorderErrorBoundary>
      <RecorderLearningApp />
    </RecorderErrorBoundary>
  );
}

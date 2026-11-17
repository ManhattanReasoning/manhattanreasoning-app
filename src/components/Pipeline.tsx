import type { PipelineStage, StageStatus } from "../api";

const STATUS_WORD: Record<StageStatus, string> = {
  pending: "pending",
  queued: "queued",
  running: "running",
  completed: "done",
  failed: "failed",
  cancelled: "cancelled",
  skipped: "skipped",
};

/** The build pipeline as a row of numbered steps: a check when done, "!" when failed. */
export function Pipeline({ stages }: { stages: PipelineStage[] }) {
  if (stages.length === 0) return null;
  return (
    <ol className="stepper">
      {stages.map((stage, i) => (
        <li key={stage.id} className={`step step-${stage.status}`}>
          <span className="circle" aria-hidden="true">
            {stage.status === "completed" ? "✓" : stage.status === "failed" ? "!" : i + 1}
          </span>
          <span className="step-text">
            <span className="nm">{stage.name}</span>
            <span className="st">
              {STATUS_WORD[stage.status] ?? stage.status}
              {stage.duration_formatted && stage.status !== "queued" ? ` · ${stage.duration_formatted}` : ""}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

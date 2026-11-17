import type { PipelineStage, StageStatus } from "../api";

const STATUS_WORD: Record<StageStatus, string> = {
  pending: "Not started",
  queued: "Queued",
  running: "Running",
  completed: "Done",
  failed: "Failed",
  cancelled: "Cancelled",
  skipped: "Skipped",
};

// Geometry of the routed trace: stages alternate between two tracks, joined by
// right-angle jogs, the way a signal is routed across a fabric.
const W = 1000;
const H = 56;
const TRACKS = [14, 42];

/** Centre of grid column i, so each via sits above its own label. */
function nodeX(i: number, n: number): number {
  return ((i + 0.5) / n) * W;
}

/** A segment is "reached" once the stage it leads into has started. */
function reached(status: StageStatus): boolean {
  return status === "running" || status === "completed" || status === "failed";
}

/**
 * The build pipeline, drawn as a routed wire with one via per stage. The SVG
 * is decoration; the ordered list underneath carries the same information for
 * screen readers and narrow screens.
 */
export function Pipeline({ stages }: { stages: PipelineStage[] }) {
  const n = stages.length;
  if (n === 0) return null;
  return (
    <div className="pipeline">
      <svg
        className="pipeline-wire"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {stages.slice(1).map((stage, k) => {
          const x0 = nodeX(k, n);
          const x1 = nodeX(k + 1, n);
          const y0 = TRACKS[k % 2];
          const y1 = TRACKS[(k + 1) % 2];
          const mid = (x0 + x1) / 2;
          return (
            <path
              key={stage.id}
              className={`wire ${reached(stage.status) ? `wire-${stage.status}` : "wire-pending"}`}
              d={`M ${x0} ${y0} H ${mid} V ${y1} H ${x1}`}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
      <ol className="pipeline-stages" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
        {stages.map((stage, i) => (
          <li key={stage.id} className={`stage stage-${stage.status} stage-track-${i % 2}`}>
            <span className="via" aria-hidden="true" />
            <span className="stage-name">{stage.name}</span>
            <span className="stage-status">
              {STATUS_WORD[stage.status] ?? stage.status}
              {stage.duration_formatted ? `, ${stage.duration_formatted}` : ""}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

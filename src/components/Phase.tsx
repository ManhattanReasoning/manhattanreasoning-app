import { useState } from "react";
import { ApiError, cancelJob, getJob } from "../api";
import type { PipelineStage, RecentBuild } from "../api";
import { isInFlight } from "../format";
import { PHASE_LABEL, buildPhase } from "../phase";
import { useResource } from "../useResource";
import { StatusBadge } from "./Bits";

const ROW_REFRESH_MS = 4000;

/** The badge for a status and, for a running build, the pipeline that says where it is. */
export function PhaseBadge({
  status,
  statusDisplay,
  pipeline,
}: {
  status: string;
  statusDisplay?: string;
  pipeline?: PipelineStage[];
}) {
  const phase = buildPhase(status, pipeline);
  return <StatusBadge status={phase} label={PHASE_LABEL[phase] ?? statusDisplay ?? phase} />;
}

/**
 * A list row has no pipeline, so a build that is still in flight loads its own detail (refreshed
 * while the page is visible) to learn its phase. Finished builds make no extra request.
 */
function LiveRowBadge({ build }: { build: RecentBuild }) {
  const job = useResource(() => getJob(build.job_id), build.job_id, { refreshMs: () => ROW_REFRESH_MS });
  return <PhaseBadge status={job.data?.status ?? build.status} statusDisplay={build.status_display} pipeline={job.data?.pipeline} />;
}

export function RowStatus({ build }: { build: RecentBuild }) {
  return isInFlight(build.status) ? (
    <LiveRowBadge build={build} />
  ) : (
    <PhaseBadge status={build.status} statusDisplay={build.status_display} />
  );
}

function cancelMessage(err: unknown): string {
  if (err instanceof ApiError && err.status === 409) {
    return "This build can no longer be cancelled. It may have just finished, or it is flashing the board.";
  }
  if (err instanceof ApiError && err.status === 404) return "That build no longer exists.";
  return err instanceof Error ? err.message : "Could not cancel the build.";
}

/** Two clicks, because cancelling cannot be undone. */
export function CancelButton({ jobId, onDone }: { jobId: string; onDone: () => void }) {
  const [step, setStep] = useState<"idle" | "confirm" | "working">("idle");
  const [error, setError] = useState<string | null>(null);

  const cancel = async () => {
    setStep("working");
    setError(null);
    try {
      await cancelJob(jobId);
    } catch (err) {
      setError(cancelMessage(err));
    }
    setStep("idle");
    onDone();
  };

  return (
    <span className="cancel">
      {step === "idle" ? (
        <button type="button" className="btn btn-quiet btn-danger" onClick={() => setStep("confirm")}>
          Cancel build
        </button>
      ) : (
        <span className="cancel-confirm" role="group" aria-label="Confirm cancelling this build">
          <span>Cancel this build?</span>
          <button type="button" className="btn btn-quiet btn-danger" onClick={() => void cancel()} disabled={step === "working"}>
            {step === "working" ? "Cancelling…" : "Yes, cancel"}
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => setStep("idle")} disabled={step === "working"}>
            Keep it
          </button>
        </span>
      )}
      {error ? <span className="cancel-error" role="alert">{error}</span> : null}
    </span>
  );
}

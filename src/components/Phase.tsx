import { useResource } from "../useResource";
import { getJob } from "../api";
import type { PipelineStage, RecentBuild } from "../api";
import { isFinished, isInFlight } from "../format";
import { PHASE_LABEL, buildPhase } from "../phase";
import { StatusBadge } from "./Bits";

const ROW_REFRESH_MS = 4000;

/** A status pill for a phase. Finished builds show the API's own wording when we have no label for it. */
export function PhasePill({ phase, fallbackLabel }: { phase: string; fallbackLabel?: string }) {
  return <StatusBadge status={phase} label={PHASE_LABEL[phase] ?? fallbackLabel ?? phase} />;
}

/** The pill for a status and, for a running build, the pipeline that says where it is. */
export function PhaseBadge({
  status,
  statusDisplay,
  pipeline,
}: {
  status: string;
  statusDisplay?: string;
  pipeline?: PipelineStage[];
}) {
  return <PhasePill phase={buildPhase(status, pipeline)} fallbackLabel={statusDisplay} />;
}

/**
 * A list row has no pipeline, so a build that is still in flight loads its own detail to learn its
 * phase. It refreshes while the page is visible, and stops once the build has finished.
 */
export function useLivePhase(build: RecentBuild): string {
  const job = useResource(() => getJob(build.job_id), build.job_id, {
    refreshMs: (d) => (d && isFinished(d.status) ? 0 : ROW_REFRESH_MS),
  });
  return buildPhase(job.data?.status ?? build.status, job.data?.pipeline);
}

function LiveRowBadge({ build }: { build: RecentBuild }) {
  return <PhasePill phase={useLivePhase(build)} fallbackLabel={build.status_display} />;
}

/** Status pill for a list row. Finished builds make no extra request. */
export function RowStatus({ build }: { build: RecentBuild }) {
  return isInFlight(build.status) ? (
    <LiveRowBadge build={build} />
  ) : (
    <PhasePill phase={build.status} fallbackLabel={build.status_display} />
  );
}

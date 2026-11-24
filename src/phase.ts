import type { PipelineStage } from "./api";

/**
 * The API only says a build is queued or running. A running build job covers three different
 * things, which the pipeline stages tell apart:
 *   building  synthesis, place and route, or bitstream (the cloud build)
 *   waiting   the build is done, waiting for a free board
 *   flashing  writing the bitstream to the board (cannot be cancelled)
 * "running" (executing on the board) is only possible for a run job, never a build job.
 * Any other status is returned unchanged.
 */
export type Phase = "queued" | "building" | "waiting" | "flashing" | "running" | "complete" | "failed" | "cancelled" | string;

export function buildPhase(status: string, pipeline: PipelineStage[] | undefined): Phase {
  if (status !== "running") return status;
  const stage = (id: string) => (pipeline ?? []).find((s) => s.id === id)?.status;
  if (stage("run") === "running") return "running";
  if (stage("flash_to_board") === "running") return "flashing";
  const built = ["synthesis", "place_and_route", "bitstream"].every((id) => stage(id) === "completed");
  if (built && stage("flash_to_board") === "queued") return "waiting";
  return "building";
}

export const PHASE_LABEL: Record<string, string> = {
  queued: "Queued",
  building: "Building",
  waiting: "Waiting for board",
  flashing: "Flashing",
  running: "Running",
  complete: "Complete",
  failed: "Failed",
  cancelled: "Cancelled",
};

/**
 * The API refuses (409) to cancel a build that is flashing or already running on the board, so
 * the UI only offers Cancel before the board is involved.
 */
export const canCancel = (phase: Phase) => ["queued", "building", "waiting"].includes(phase);

/** True when the build itself worked and the failure came while flashing it to the board. */
export const failedWhileFlashing = (pipeline: PipelineStage[] | undefined) =>
  (pipeline ?? []).some((s) => s.id === "flash_to_board" && s.status === "failed");

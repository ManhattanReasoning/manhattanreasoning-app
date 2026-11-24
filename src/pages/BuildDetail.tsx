import { Link, useParams } from "react-router-dom";
import { ApiError, getJob, getOverview } from "../api";
import { Loading, LoadError } from "../components/Bits";
import { CancelButton } from "../components/CancelButton";
import { Logs } from "../components/Logs";
import { PhaseBadge } from "../components/Phase";
import { Pipeline } from "../components/Pipeline";
import { boardName, formatWhen, isFinished, shortId } from "../format";
import { buildPhase, canCancel, failedWhileFlashing } from "../phase";
import { useSession } from "../session";
import { useResource } from "../useResource";

const POLL_MS = 4000;

/** One line saying what the build is doing, in plain words. */
function describe(phase: string, board: string, flashFailed: boolean): string {
  switch (phase) {
    case "queued":
      return "Waiting for a build slot";
    case "building":
      return "Building (synthesis, place and route, bitstream)";
    case "waiting":
      return "Build finished, waiting for a free board";
    case "flashing":
      return `Flashing ${board}. It cannot be cancelled until this finishes`;
    case "running":
      return `Running on ${board}`;
    case "failed":
      return flashFailed
        ? `The build worked, but flashing ${board} failed. The design never ran`
        : "Failed during the build, never ran on a board";
    case "cancelled":
      return "Cancelled";
    default:
      return board === "—" ? "Built and flashed" : `Built and flashed to ${board}`;
  }
}

export function BuildDetail() {
  const { jobId = "" } = useParams();
  const { state: session } = useSession();
  // While the build is in flight, keep the stages and timings current (paused while the tab is hidden).
  const job = useResource(() => getJob(jobId), jobId, {
    refreshMs: (d) => (d && !isFinished(d.status) ? POLL_MS : 0),
  });
  const { data, reload } = job;
  // The job detail has no project name; borrow it from the recent-builds list when the build is in it.
  const recent = useResource(() => getOverview(50), jobId);
  const project = recent.data?.recent_builds.find((b) => b.job_id === jobId)?.project ?? null;

  const notFound = job.error instanceof ApiError && job.error.status === 404;
  const phase = data ? buildPhase(data.status, data.pipeline) : "";
  const board = data ? boardName(data.board_id ?? data.fpga_id) : "—";
  const live = data ? !isFinished(data.status) : false;
  // An admin can open anyone's build, but the API only lets the owner cancel it (403 otherwise).
  const names = session.phase === "signedIn" ? [session.profile.username, session.profile.github_username] : [];
  const mine = !data?.submitted_by || names.includes(data.submitted_by);

  return (
    <>
      <p className="crumb dim">
        <Link to="/builds">Builds</Link>
        {project ? (
          <>
            {" / "}
            <Link to={`/builds?project=${encodeURIComponent(project)}`}>{project}</Link>
          </>
        ) : null}
        {" / "}#{shortId(jobId)}
      </p>

      {data ? (
        <>
          <div className="detail-head">
            <h1 className="page-title">{project ?? data.name}</h1>
            <span className="dim mono">#{shortId(data.job_id)}</span>
            <PhaseBadge status={data.status} statusDisplay={data.status_display} pipeline={data.pipeline} />
            <span className="spacer" />
            {canCancel(phase) && mine ? <CancelButton jobId={data.job_id} onDone={() => void reload()} /> : null}
          </div>
          <p className="sub">
            {describe(phase, board, failedWhileFlashing(data.pipeline))} · submitted by {data.submitted_by} · {data.relative_time ?? ""}{" "}
            ({data.submitted_at_formatted ?? formatWhen(data.submitted_at)})
          </p>

          {data.status === "failed" && data.output ? <div className="reason">{data.output}</div> : null}

          <div className="tiles">
            <div className="tile">
              <div className="label">Status</div>
              <div className="val">{data.status.charAt(0).toUpperCase() + data.status.slice(1)}</div>
            </div>
            <div className="tile">
              <div className="label">Build time</div>
              <div className="val">{data.elapsed_build_time_formatted ?? "—"}</div>
            </div>
            <div className="tile">
              <div className="label">Board time</div>
              <div className="val">
                {data.board_time_formatted ??
                  (data.status === "failed" && data.board_id == null ? "never ran" : "not recorded yet")}
              </div>
            </div>
            <div className="tile">
              <div className="label">Board</div>
              <div className="val">{board}</div>
            </div>
          </div>

          <section className="pipeline-section" aria-labelledby="pipe-h">
            <h2 id="pipe-h" className="visually-hidden">
              Pipeline
            </h2>
            <Pipeline stages={data.pipeline} />
          </section>

          <div className="cols">
            <div className="col">
              <section className="panel" aria-labelledby="in-h">
                <h2 id="in-h">Input</h2>
                <pre className="snippet">{data.command ?? "—"}</pre>
                <p className="dim small note">
                  The uploaded design is not stored after the build. Only the command and metadata are kept.
                </p>
              </section>
              <section className="panel" aria-labelledby="out-h">
                <h2 id="out-h">Output</h2>
                {data.output ? (
                  <pre className="snippet snippet-scroll">{data.output}</pre>
                ) : (
                  <p className="dim">{live ? "Waiting for the build to finish." : "No output."}</p>
                )}
              </section>
            </div>
            <div className="col">
              <Logs jobId={data.job_id} onDone={() => void reload()} />
            </div>
          </div>
        </>
      ) : job.loading ? (
        <Loading what="build" />
      ) : (
        <>
          <h1 className="page-title">{notFound ? "Build not found" : "Build"}</h1>
          <LoadError error={job.error} onRetry={() => void reload()} />
          {notFound ? (
            <p>
              <Link to="/builds">← Back to builds</Link>
            </p>
          ) : null}
        </>
      )}
    </>
  );
}

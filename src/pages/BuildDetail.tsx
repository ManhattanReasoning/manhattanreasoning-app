import { Link, useParams } from "react-router-dom";
import { getJob } from "../api";
import { Loading, LoadError } from "../components/Bits";
import { CancelButton, PhaseBadge } from "../components/Phase";
import { Logs } from "../components/Logs";
import { Pipeline } from "../components/Pipeline";
import { formatWhen, isFinished } from "../format";
import { buildPhase, canCancel } from "../phase";
import { useResource } from "../useResource";

const POLL_MS = 4000;

export function BuildDetail() {
  const { jobId = "" } = useParams();
  // While the build is in flight, keep the stages and timings current (paused while the tab is hidden).
  const job = useResource(() => getJob(jobId), jobId, {
    refreshMs: (d) => (d && !isFinished(d.status) ? POLL_MS : 0),
  });
  const { data, reload } = job;
  const phase = data ? buildPhase(data.status, data.pipeline) : "";

  return (
    <>
      <p className="crumb">
        <Link to="/builds">Builds</Link>
      </p>
      {data ? (
        <>
          <div className="detail-head">
            <h1 className="page-title">{data.name}</h1>
            <PhaseBadge status={data.status} statusDisplay={data.status_display} pipeline={data.pipeline} />
            {canCancel(phase) ? <CancelButton jobId={data.job_id} onDone={() => void reload()} /> : null}
          </div>
          <p className="mono dim job-id">{data.job_id}</p>

          <section aria-labelledby="pipe-h">
            <h2 id="pipe-h" className="visually-hidden">
              Pipeline
            </h2>
            <Pipeline stages={data.pipeline} />
          </section>

          <dl className="facts">
            <div>
              <dt>Submitted</dt>
              <dd title={data.relative_time ?? undefined}>
                {data.submitted_at_formatted ?? formatWhen(data.submitted_at)}
              </dd>
            </div>
            <div>
              <dt>Build time</dt>
              <dd className="mono">{data.elapsed_build_time_formatted ?? "—"}</dd>
            </div>
            <div>
              <dt>Board time</dt>
              <dd className="mono">{data.board_time_formatted ?? "—"}</dd>
            </div>
            <div>
              <dt>Board</dt>
              <dd className="mono">{data.board_id ?? data.fpga_id ?? "—"}</dd>
            </div>
            <div>
              <dt>Submitted by</dt>
              <dd className="mono">{data.submitted_by}</dd>
            </div>
            {data.command ? (
              <div className="facts-wide">
                <dt>Command</dt>
                <dd className="mono">{data.command}</dd>
              </div>
            ) : null}
          </dl>

          <Logs jobId={data.job_id} onDone={() => void reload()} />

          {data.output ? (
            <section aria-labelledby="out-h">
              <h2 id="out-h">Output</h2>
              <pre className="snippet snippet-scroll">{data.output}</pre>
            </section>
          ) : null}
        </>
      ) : job.loading ? (
        <Loading what="build" />
      ) : (
        <LoadError error={job.error} onRetry={() => void reload()} />
      )}
    </>
  );
}

import { Link, useSearchParams } from "react-router-dom";
import { getAdminBuilds, type AdminBuild } from "../../api";
import { Empty, Loading, LoadError, MoreButton, StatusBadge } from "../../components/Bits";
import { PHASE_LABEL } from "../../phase";
import { boardName, formatSeconds, formatWhen, shortId, stageLabel } from "../../format";
import { usePaged } from "../../usePaged";

const STATUSES: [string, string][] = [
  ["", "All"],
  ["queued", "Queued"],
  ["running", "In progress"],
  ["complete", "Complete"],
  ["failed", "Failed"],
  ["cancelled", "Cancelled"],
];

/** The API's `display_status` splits "running" into building / waiting_for_board / flashing. */
const DISPLAY: Record<string, string> = { ...PHASE_LABEL, waiting_for_board: "Waiting for board" };

function Row({ b }: { b: AdminBuild }) {
  const shown = b.display_status in DISPLAY ? DISPLAY[b.display_status] : b.display_status;
  const tone = b.display_status === "waiting_for_board" ? "building" : b.display_status;
  return (
    <tr>
      <th scope="row">
        <Link to={`/builds/${b.job_id}`} className="build-link">#{shortId(b.job_id)}</Link>
      </th>
      <td>{b.owner}</td>
      <td>{b.project ?? b.filename ?? "—"}</td>
      <td>
        <StatusBadge status={tone} label={shown} />
        {b.failed_stage ? <span className="dim small"> {stageLabel(b.failed_stage)}</span> : null}
      </td>
      <td>{boardName(b.fpga_id)}</td>
      <td>{formatSeconds(b.total_seconds)}</td>
      <td>{formatSeconds(b.build_seconds)}</td>
      <td title={formatWhen(b.created_at)}>{formatWhen(b.created_at)}</td>
    </tr>
  );
}

export function AdminBuilds() {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "";
  const user = params.get("user") ?? "";
  const board = params.get("fpga_id") ?? "";
  const list = usePaged(
    (cursor) => getAdminBuilds({ status, user, fpga_id: board, cursor }),
    `${status}|${user}|${board}`,
  );

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <>
      <h1 className="page-title">All builds</h1>
      <p className="sub">
        Everyone's builds, newest first. Total time runs from submit until the build is on a board; build time is the cloud build only.
      </p>
      <div className="filters">
        <label>
          Status
          <select value={status} onChange={(e) => set("status", e.target.value)}>
            {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label>
          User
          <input type="search" value={user} placeholder="GitHub handle" onChange={(e) => set("user", e.target.value.trim())} />
        </label>
        <label>
          Board
          <select value={board} onChange={(e) => set("fpga_id", e.target.value)}>
            <option value="">All</option>
            {[0, 1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{boardName(n)}</option>)}
          </select>
        </label>
      </div>
      {list.loading ? (
        <Loading what="builds" />
      ) : list.error && list.items.length === 0 ? (
        <LoadError error={list.error} onRetry={() => void list.reload()} />
      ) : list.items.length === 0 ? (
        <Empty><p>No builds match these filters.</p></Empty>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Build</th>
                  <th scope="col">User</th>
                  <th scope="col">Project</th>
                  <th scope="col">Status</th>
                  <th scope="col">Board</th>
                  <th scope="col">Total time</th>
                  <th scope="col">Build time</th>
                  <th scope="col">Submitted</th>
                </tr>
              </thead>
              <tbody>{list.items.map((b) => <Row key={b.job_id} b={b} />)}</tbody>
            </table>
          </div>
          <MoreButton hasMore={list.hasMore} busy={list.loadingMore} onMore={() => void list.more()} />
        </>
      )}
    </>
  );
}

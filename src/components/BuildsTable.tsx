import { Link } from "react-router-dom";
import type { RecentBuild } from "../api";
import { formatWhen, shortId } from "../format";
import { RowStatus } from "./Phase";

export function BuildsTable({ builds }: { builds: RecentBuild[] }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Build</th>
            <th scope="col">Status</th>
            <th scope="col">Submitted</th>
            <th scope="col" className="num">
              Duration
            </th>
            <th scope="col" className="num">
              Board
            </th>
          </tr>
        </thead>
        <tbody>
          {builds.map((b) => (
            <tr key={b.job_id}>
              <th scope="row">
                <Link to={`/builds/${b.job_id}`} className="build-link">
                  <span className="build-name">{b.name}</span>
                  <span className="mono dim">{shortId(b.job_id)}</span>
                </Link>
                {b.project ? <span className="dim build-project">{b.project}</span> : null}
              </th>
              <td>
                <RowStatus build={b} />
              </td>
              <td title={formatWhen(b.submitted_at)}>
                {b.relative_time ?? formatWhen(b.submitted_at)}
              </td>
              <td className="num mono">{b.duration_formatted ?? "—"}</td>
              <td className="num mono">{b.board_id ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

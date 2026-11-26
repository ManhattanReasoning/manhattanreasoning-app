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
            <th scope="col">Project</th>
            <th scope="col">Status</th>
            <th scope="col">Duration</th>
            <th scope="col">When</th>
          </tr>
        </thead>
        <tbody>
          {builds.map((b) => (
            <tr key={b.job_id}>
              <th scope="row">
                <Link to={`/builds/${b.job_id}`} className="build-link">
                  #{shortId(b.job_id)}
                </Link>
              </th>
              <td>{b.project ?? b.name}</td>
              <td>
                <RowStatus build={b} />
              </td>
              <td>{b.duration_formatted ?? "—"}</td>
              <td title={formatWhen(b.submitted_at)}>{b.relative_time ?? formatWhen(b.submitted_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

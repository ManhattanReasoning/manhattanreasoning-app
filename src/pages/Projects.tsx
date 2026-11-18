import { Link } from "react-router-dom";
import { getProjects } from "../api";
import { Empty, Loading, LoadError, StatusBadge } from "../components/Bits";
import { formatWhen } from "../format";
import { useResource } from "../useResource";

const REFRESH_MS = 30000;

export function Projects() {
  const projects = useResource(getProjects, "", { refreshMs: () => REFRESH_MS });
  return (
    <>
      <h1 className="page-title">Projects</h1>
      <p className="sub">Your designs, each grouping its builds</p>
      {projects.data ? (
        projects.data.length > 0 ? (
          projects.data.map((p) => (
            <Link key={p.name} to={`/builds?project=${encodeURIComponent(p.name)}`} className="card card-link">
              <div className="card-head">
                <div>
                  <div className="card-name">{p.name}</div>
                  <div className="dim small" title={formatWhen(p.latest_build_at)}>
                    {p.build_count} builds · last run {p.latest_build_relative}
                  </div>
                </div>
                {p.latest_build_status ? <StatusBadge status={p.latest_build_status} label={p.latest_build_status} /> : null}
              </div>
            </Link>
          ))
        ) : (
          <Empty>
            <p>No projects yet. A project appears after its first build.</p>
          </Empty>
        )
      ) : projects.loading ? (
        <Loading what="projects" />
      ) : (
        <LoadError error={projects.error} onRetry={() => void projects.reload()} />
      )}
    </>
  );
}

import { Link } from "react-router-dom";
import { getOverview, getProjects } from "../api";
import { Empty, Loading, LoadError, StatusBadge } from "../components/Bits";
import { BuildsTable } from "../components/BuildsTable";
import { formatWhen } from "../format";
import { listRefreshMs, useResource } from "../useResource";

const RECENT_LIMIT = 50; // the most the API returns in one call

export function Builds() {
  const projects = useResource(getProjects);
  const recent = useResource(() => getOverview(RECENT_LIMIT), "", { refreshMs: listRefreshMs });

  return (
    <>
      <h1 className="page-title">Builds</h1>

      <section aria-labelledby="projects-h">
        <h2 id="projects-h">Projects</h2>
        {projects.data ? (
          projects.data.length > 0 ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Project</th>
                    <th scope="col" className="num">
                      Builds
                    </th>
                    <th scope="col">Latest build</th>
                    <th scope="col">When</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.data.map((p) => (
                    <tr key={p.name}>
                      <th scope="row">{p.name}</th>
                      <td className="num mono">{p.build_count}</td>
                      <td>
                        <Link to={`/builds/${p.latest_build_id}`} className="badge-link">
                          <StatusBadge
                            status={p.latest_build_status}
                            label={p.latest_build_status}
                          />
                        </Link>
                      </td>
                      <td title={formatWhen(p.latest_build_at)}>{p.latest_build_relative}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
      </section>

      <section aria-labelledby="all-h">
        <div className="section-head">
          <h2 id="all-h">Latest builds</h2>
          {recent.data && recent.data.total_builds_count > recent.data.recent_builds.length ? (
            <p className="dim counts">
              Showing the latest {recent.data.recent_builds.length} of{" "}
              {recent.data.total_builds_count}
            </p>
          ) : null}
        </div>
        {recent.data ? (
          recent.data.recent_builds.length > 0 ? (
            <BuildsTable builds={recent.data.recent_builds} />
          ) : (
            <Empty>
              <p>No builds yet. Start one from your terminal:</p>
              <pre className="snippet">mrg run examples/app.py</pre>
            </Empty>
          )
        ) : recent.loading ? (
          <Loading what="builds" />
        ) : (
          <LoadError error={recent.error} onRetry={() => void recent.reload()} />
        )}
      </section>
    </>
  );
}

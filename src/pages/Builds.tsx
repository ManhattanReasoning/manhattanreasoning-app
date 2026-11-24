import { useSearchParams } from "react-router-dom";
import { getOverview, getProjects } from "../api";
import { Empty, Loading, LoadError } from "../components/Bits";
import { BuildsTable } from "../components/BuildsTable";
import { isInFlight } from "../format";
import { listRefreshMs, useResource } from "../useResource";

const RECENT_LIMIT = 50; // the most the API returns in one call

const STATUS_FILTERS: [string, string][] = [
  ["", "All"],
  ["live", "Live"],
  ["complete", "Complete"],
  ["failed", "Failed"],
  ["cancelled", "Cancelled"],
];

export function Builds() {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "";
  const project = params.get("project") ?? "";
  const projects = useResource(getProjects);
  const recent = useResource(() => getOverview(RECENT_LIMIT), "", { refreshMs: listRefreshMs });

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  // The API has no server-side filters, so filter the latest 50 here.
  const all = recent.data?.recent_builds ?? [];
  const rows = all.filter(
    (b) =>
      (!status || (status === "live" ? isInFlight(b.status) : b.status === status)) &&
      (!project || b.project === project),
  );

  return (
    <>
      <h1 className="page-title">Builds</h1>
      <p className="sub">
        {recent.data && recent.data.total_builds_count > all.length
          ? `Your latest ${all.length} of ${recent.data.total_builds_count} builds`
          : `Your latest ${RECENT_LIMIT} builds`}
      </p>

      <div className="filters">
        <label>
          Status
          <select value={status} onChange={(e) => setFilter("status", e.target.value)}>
            {STATUS_FILTERS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          Project
          <select value={project} onChange={(e) => setFilter("project", e.target.value)}>
            <option value="">All</option>
            {(projects.data ?? []).map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {recent.data ? (
        all.length === 0 ? (
          <Empty>
            <p>No builds yet. Start one from your terminal:</p>
            <pre className="snippet">mrg run examples/app.py</pre>
          </Empty>
        ) : rows.length > 0 ? (
          <BuildsTable builds={rows} />
        ) : (
          <Empty>
            <p>No builds match these filters.</p>
            {all.length >= RECENT_LIMIT ? (
              <p className="dim small">
                Only your latest {RECENT_LIMIT} builds are loaded, so older builds are not searched.
              </p>
            ) : null}
          </Empty>
        )
      ) : recent.loading ? (
        <Loading what="builds" />
      ) : (
        <LoadError error={recent.error} onRetry={() => void recent.reload()} />
      )}
    </>
  );
}

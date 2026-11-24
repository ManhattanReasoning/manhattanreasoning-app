import { useState } from "react";
import { Link } from "react-router-dom";
import { getOverview, getUsage } from "../api";
import { Empty, Loading, LoadError, Notice } from "../components/Bits";
import { RunCard } from "../components/RunCard";
import { UsageMeter } from "../components/UsageMeter";
import { isInFlight } from "../format";
import { membershipAction, membershipSummary, membershipWarning } from "../membership";
import { listRefreshMs, useResource } from "../useResource";

export function Overview() {
  const usage = useResource(getUsage);
  // The API returns at most 50 builds and has no status filter, so Live and History split them here.
  const overview = useResource(() => getOverview(50), "", { refreshMs: listRefreshMs });
  const [picked, setPicked] = useState<"live" | "history" | null>(null);
  const builds = overview.data?.recent_builds ?? [];
  const live = builds.filter((b) => isInFlight(b.status));
  const history = builds.filter((b) => !isInFlight(b.status));
  // Until the user picks a tab, show Live if anything is in flight, otherwise History.
  const tab = picked ?? (live.length > 0 ? "live" : "history");
  const shown = tab === "live" ? live : history;
  const warning = usage.data ? membershipWarning(usage.data) : null;
  const summary = usage.data ? membershipSummary(usage.data) : null;
  const action = usage.data ? membershipAction(usage.data) : null;

  return (
    <>
      <h1 className="page-title">Overview</h1>

      {warning ? (
        <Notice tone="bad">
          <p>
            <strong>{warning}</strong>{" "}
            <Link to="/membership">{action === "subscribe" ? "Subscribe" : "Fix your membership"}</Link>
          </p>
        </Notice>
      ) : null}

      <section aria-label="Builds" className="runs">
        {overview.data ? (
          builds.length > 0 ? (
            <>
              <div className="view-tabs" role="tablist" aria-label="Builds">
                {(["live", "history"] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={tab === id}
                    className={"view-tab" + (tab === id ? " view-tab-on" : "")}
                    onClick={() => setPicked(id)}
                  >
                    {id === "live" ? "Live" : "History"}{" "}
                    <span className="view-tab-count">{id === "live" ? live.length : history.length}</span>
                  </button>
                ))}
              </div>
              {shown.length > 0 ? (
                shown.map((b) => <RunCard key={b.job_id} build={b} onChanged={() => void overview.reload()} />)
              ) : (
                <Empty>
                  <p>{tab === "live" ? "No builds in flight. Run `mrg run` to start one." : "No finished builds yet."}</p>
                </Empty>
              )}
              <p className="more">
                <Link to="/builds">All builds</Link>
              </p>
            </>
          ) : (
            <Empty>
              <p>No builds yet. Start one from your terminal:</p>
              <pre className="snippet">mrg run examples/app.py</pre>
            </Empty>
          )
        ) : overview.loading ? (
          <Loading what="builds" />
        ) : (
          <LoadError error={overview.error} onRetry={() => void overview.reload()} />
        )}
      </section>

      <div className="split">
        <section className="panel" aria-labelledby="usage-h">
          <h2 id="usage-h">Usage this month</h2>
          {usage.data ? (
            <UsageMeter
              used={usage.data.build_minutes_used}
              limit={usage.data.build_minutes_limit}
              remaining={usage.data.build_minutes_remaining}
              month={usage.data.month}
            />
          ) : usage.loading ? (
            <Loading what="usage" />
          ) : (
            <LoadError error={usage.error} onRetry={() => void usage.reload()} />
          )}
        </section>

        <section className="panel" aria-labelledby="member-h">
          <h2 id="member-h">Membership</h2>
          {usage.data ? (
            summary ? (
              <>
                <p className={`status-line tone-${summary.tone}`}>{summary.label}</p>
                <p className="dim">{summary.detail}</p>
                <p>
                  <Link to="/membership">Membership and billing</Link>
                </p>
              </>
            ) : (
              <p className="dim">This server does not report membership.</p>
            )
          ) : usage.loading ? (
            <Loading what="membership" />
          ) : (
            <p className="dim">Membership could not be loaded.</p>
          )}
        </section>
      </div>
    </>
  );
}

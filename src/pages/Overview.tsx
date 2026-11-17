import { Link } from "react-router-dom";
import { getOverview, getUsage } from "../api";
import { Empty, Loading, LoadError, Notice } from "../components/Bits";
import { BuildsTable } from "../components/BuildsTable";
import { UsageMeter } from "../components/UsageMeter";
import { membershipAction, membershipSummary, membershipWarning } from "../membership";
import { useResource } from "../useResource";

export function Overview() {
  const usage = useResource(getUsage);
  const overview = useResource(() => getOverview(10));
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
            <Link to="/membership">
              {action === "subscribe" ? "Subscribe" : "Fix your membership"}
            </Link>
          </p>
        </Notice>
      ) : null}

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

      <section aria-labelledby="recent-h">
        <div className="section-head">
          <h2 id="recent-h">Recent builds</h2>
          {overview.data ? (
            <p className="dim counts">
              {overview.data.active_builds_count} in flight, {overview.data.total_builds_count}{" "}
              total
              {overview.data.board_time_total_formatted
                ? `, ${overview.data.board_time_total_formatted} of board time`
                : ""}
            </p>
          ) : null}
        </div>
        {overview.data ? (
          overview.data.recent_builds.length > 0 ? (
            <>
              <BuildsTable builds={overview.data.recent_builds} />
              <p className="more">
                <Link to="/builds">All builds and projects</Link>
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
    </>
  );
}

import { Link } from "react-router-dom";
import { getAdminOverview, type AdminOverview as Data } from "../../api";
import { Loading, LoadError, StateBadge } from "../../components/Bits";
import { boardName, formatSeconds, formatWhen, stageLabel } from "../../format";
import { useResource } from "../../useResource";

const REFRESH_MS = 15000;

function Chart({ days }: { days: Data["builds_per_day"] }) {
  const max = Math.max(1, ...days.map((d) => d.complete + d.failed + d.cancelled + d.in_progress));
  return (
    <div className="chart" role="img" aria-label="Builds per day, last 14 days">
      {days.map((d) => {
        const total = d.complete + d.failed + d.cancelled + d.in_progress;
        const seg = (n: number, cls: string) => (n > 0 ? <span className={`seg ${cls}`} style={{ height: `${(n / max) * 100}%` }} /> : null);
        return (
          <div key={d.day} className="chart-col" title={`${d.day}: ${total} builds (${d.complete} complete, ${d.failed} failed, ${d.cancelled} cancelled, ${d.in_progress} running)`}>
            <div className="chart-bar">
              {seg(d.in_progress, "seg-live")}
              {seg(d.cancelled, "seg-plain")}
              {seg(d.failed, "seg-bad")}
              {seg(d.complete, "seg-good")}
            </div>
            <span className="chart-day">{d.day.slice(8)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function AdminOverview() {
  const res = useResource(getAdminOverview, "", { refreshMs: () => REFRESH_MS });
  const d = res.data;
  return (
    <>
      <h1 className="page-title">Admin overview</h1>
      <p className="sub">{d ? `Updated ${formatWhen(d.generated_at)}. Each section names the period it covers.` : "Everyone's activity"}</p>
      {!d ? (
        res.loading ? <Loading what="the overview" /> : <LoadError error={res.error} onRetry={() => void res.reload()} />
      ) : (
        <>
          <section className="panel" aria-labelledby="ab-h">
            <h2 id="ab-h">Boards</h2>
            <p className="dim">
              {d.boards.total} boards:{" "}
              {Object.entries(d.boards.by_state).filter(([, n]) => n > 0).map(([s, n]) => `${n} ${s}`).join(" · ") || "none reporting"}.{" "}
              <Link to="/admin/boards">All boards</Link>
            </p>
          </section>

          <section className="panel" aria-labelledby="att-h">
            <h2 id="att-h">Needs attention</h2>
            {d.attention.boards_in_error.length === 0 && d.attention.pending_applications === 0 ? (
              <p className="dim">Nothing needs attention. A board in error or a waiting application shows up here.</p>
            ) : (
              <ul className="attn">
                {d.attention.boards_in_error.map((b) => (
                  <li key={b.fpga_id}>
                    <StateBadge state="error" /> <strong>{boardName(b.fpga_id)}</strong> {b.reason ?? "in error"}{" "}
                    <span className="dim">since {formatWhen(b.since)}</span> <Link to="/admin/boards">View</Link>
                  </li>
                ))}
                {d.attention.pending_applications > 0 ? (
                  <li>
                    <StateBadge state="pending" /> <strong>{d.attention.pending_applications}</strong> application
                    {d.attention.pending_applications === 1 ? "" : "s"} waiting <Link to="/admin/users?status=pending">Review</Link>
                  </li>
                ) : null}
              </ul>
            )}
          </section>

          <h2 className="section-h">Last 7 days</h2>
          <div className="tiles tiles-6">
            <div className="tile"><div className="label">Active users</div><div className="val">{d.last_7_days.active_users}</div></div>
            <div className="tile"><div className="label">Builds</div><div className="val">{d.last_7_days.builds}</div></div>
            <div className="tile">
              <div className="label">Failure rate</div>
              <div className="val">{d.last_7_days.failure_rate == null ? "No data" : `${Math.round(d.last_7_days.failure_rate * 100)}%`}</div>
              <div className="sub-line">{d.last_7_days.failed} failed</div>
            </div>
            <div className="tile"><div className="label">Build minutes</div><div className="val">{d.last_7_days.build_minutes.toLocaleString()}</div></div>
            <div className="tile">
              <div className="label">Estimated cost</div>
              <div className="val">≈ ${d.last_7_days.cost_estimate_usd.toFixed(2)}</div>
              <div className="sub-line">Estimate: build minutes × $0.005</div>
            </div>
            <div className="tile"><div className="label">Board time</div><div className="val">{formatSeconds(d.last_7_days.board_seconds)}</div></div>
          </div>

          <section className="panel" aria-labelledby="bpd-h">
            <h2 id="bpd-h">Builds per day</h2>
            <p className="dim small">Last 14 days, UTC. Hover a bar for the breakdown.</p>
            <Chart days={d.builds_per_day} />
            <p className="legend small dim">
              <span className="dot seg-good" /> Complete <span className="dot seg-bad" /> Failed <span className="dot seg-plain" /> Cancelled{" "}
              <span className="dot seg-live" /> Running
            </p>
          </section>

          <div className="two-col">
            <section className="panel" aria-labelledby="fail-h">
              <h2 id="fail-h">Why builds didn't finish</h2>
              {d.failures_by_stage.length === 0 ? (
                <p className="dim">No failures in this period.</p>
              ) : (
                <ul className="plain-list">
                  {d.failures_by_stage.map((f) => (
                    <li key={f.stage}>
                      <span>{stageLabel(f.stage)}</span> <strong>{f.count}</strong>
                    </li>
                  ))}
                </ul>
              )}
              <p><Link to="/admin/builds?status=failed">See failed builds</Link></p>
            </section>
            <section className="panel" aria-labelledby="top-h">
              <h2 id="top-h">Top users this month</h2>
              {d.top_users_this_month.length === 0 ? (
                <p className="dim">No builds yet this month.</p>
              ) : (
                <table className="table">
                  <thead><tr><th scope="col">User</th><th scope="col" className="num">Builds</th><th scope="col" className="num">Minutes used</th></tr></thead>
                  <tbody>
                    {d.top_users_this_month.map((u) => (
                      <tr key={u.username}>
                        <th scope="row"><Link to={`/admin/builds?user=${encodeURIComponent(u.username)}`}>{u.username}</Link></th>
                        <td className="num">{u.builds}</td>
                        <td className="num">{u.build_minutes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p className="dim small">Each member gets a monthly build-minute quota. Failed and cancelled builds count too.</p>
            </section>
          </div>
        </>
      )}
    </>
  );
}

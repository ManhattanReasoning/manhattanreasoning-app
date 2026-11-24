import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getAdminUsers, type AdminUser } from "../../api";
import { Empty, Loading, LoadError, MoreButton, StateBadge } from "../../components/Bits";
import { boardName, formatWhen } from "../../format";
import { usePaged } from "../../usePaged";

const TABS: [string, string][] = [
  ["", "All"],
  ["pending", "Applications"],
  ["active", "Active"],
  ["suspended", "Suspended"],
  ["rejected", "Rejected"],
];

function Detail({ u }: { u: AdminUser }) {
  return (
    <section className="panel" aria-labelledby="ud-h">
      <h2 id="ud-h">
        {u.username} <StateBadge state={u.status} />
      </h2>
      <p className="dim">
        <a href={`https://github.com/${encodeURIComponent(u.username)}`} rel="noreferrer">github.com/{u.username}</a>
        {u.approved_by ? ` · approved by ${u.approved_by}` : ""}
      </p>
      <dl className="facts">
        {u.full_name ? <><dt>Name</dt><dd>{u.full_name}</dd></> : null}
        {u.email ? <><dt>Email</dt><dd>{u.email}</dd></> : null}
        {u.affiliation ? <><dt>Affiliation</dt><dd>{u.affiliation}</dd></> : null}
        {u.intended_use ? <><dt>What they will build</dt><dd>{u.intended_use}</dd></> : null}
        <dt>Applied</dt><dd>{formatWhen(u.applied_at)}</dd>
        <dt>Quota used this month</dt><dd>{u.quota_used_minutes} of {u.quota_limit_minutes} minutes</dd>
        <dt>Builds this month</dt><dd>{u.builds}</dd>
        <dt>Boards at once</dt><dd>{u.max_concurrent_boards}</dd>
        <dt>Session length</dt><dd>{u.max_session_minutes} min, renewed on use</dd>
        <dt>Holding now</dt><dd>{u.boards_held.length > 0 ? u.boards_held.map(boardName).join(", ") : "nothing"}</dd>
      </dl>
      <p><Link to={`/admin/builds?user=${encodeURIComponent(u.username)}`}>See {u.username}'s builds</Link></p>
    </section>
  );
}

export function AdminUsers() {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "";
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const list = usePaged((cursor) => getAdminUsers({ status, cursor }), status);
  const counts = list.first?.counts ?? {};
  const shown = list.items.filter((u) => !q || u.username.toLowerCase().includes(q.toLowerCase()));
  const selected = list.items.find((u) => u.username === picked) ?? null;

  return (
    <>
      <h1 className="page-title">Users and applications</h1>
      <p className="sub">Quota is per calendar month.</p>
      <div className="view-tabs" role="tablist" aria-label="Filter by status">
        {TABS.map(([v, l]) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={status === v}
            className={`view-tab ${status === v ? "view-tab-on" : ""}`}
            onClick={() => setParams(v ? { status: v } : {}, { replace: true })}
          >
            {l}
            {v && counts[v] != null ? <span className="view-tab-count">{counts[v]}</span> : null}
          </button>
        ))}
      </div>
      <div className="filters">
        <label>
          Search
          <input type="search" value={q} placeholder="GitHub handle" onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>
      {list.loading ? (
        <Loading what="users" />
      ) : list.error && list.items.length === 0 ? (
        <LoadError error={list.error} onRetry={() => void list.reload()} />
      ) : shown.length === 0 ? (
        <Empty><p>{q ? `No user matches “${q}”.` : "Nobody here yet."}</p></Empty>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">User</th>
                  <th scope="col">Status</th>
                  <th scope="col">Applied</th>
                  <th scope="col">Last build</th>
                  <th scope="col" className="num">Quota used</th>
                  <th scope="col">Holding</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((u) => (
                  <tr key={u.username} className={u.username === picked ? "row-on" : ""}>
                    <th scope="row">
                      <button type="button" className="link-btn" aria-pressed={u.username === picked} onClick={() => setPicked(u.username === picked ? null : u.username)}>
                        {u.username}
                      </button>
                    </th>
                    <td><StateBadge state={u.status} /></td>
                    <td>{formatWhen(u.applied_at)}</td>
                    <td>{formatWhen(u.last_build_at)}</td>
                    <td className="num">{u.quota_used_minutes} / {u.quota_limit_minutes}</td>
                    <td>{u.boards_held.length > 0 ? u.boards_held.map(boardName).join(", ") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <MoreButton hasMore={list.hasMore} busy={list.loadingMore} onMore={() => void list.more()} />
        </>
      )}
      {selected ? <Detail u={selected} /> : null}
    </>
  );
}

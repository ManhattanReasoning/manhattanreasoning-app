import { useState } from "react";
import { Link } from "react-router-dom";
import { getAdminBoardEvents, getAdminBoards, type AdminBoard } from "../../api";
import { Loading, LoadError, MoreButton, StateBadge } from "../../components/Bits";
import { boardName, formatWhen, shortId } from "../../format";
import { usePaged } from "../../usePaged";
import { useResource } from "../../useResource";

const REFRESH_MS = 15000;

function timeLeft(expires: string | null): string {
  if (!expires) return "—";
  const ms = new Date(expires).getTime() - Date.now();
  if (Number.isNaN(ms)) return "—";
  if (ms <= 0) return "ending";
  const m = Math.round(ms / 60000);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

function BoardPanel({ board }: { board: AdminBoard }) {
  const events = usePaged(
    (cursor) => getAdminBoardEvents(board.fpga_id, cursor),
    String(board.fpga_id),
  );
  return (
    <section className="panel" aria-labelledby="bd-h">
      <h2 id="bd-h">
        {boardName(board.fpga_id)} <StateBadge state={board.state} />
      </h2>
      <dl className="facts">
        <dt>In this state since</dt>
        <dd>{formatWhen(board.state_since)}</dd>
        <dt>Held by</dt>
        <dd>{board.owner ?? "nobody"}</dd>
        <dt>Session ends</dt>
        <dd>{board.session ? formatWhen(board.session.expires_at) : "—"}</dd>
        <dt>Build</dt>
        <dd>
          {board.current_job_id ? <Link to={`/builds/${board.current_job_id}`}>#{shortId(board.current_job_id)}</Link> : "—"}
        </dd>
        <dt>JTAG / network</dt>
        <dd>
          {board.jtag_present == null ? "unknown" : board.jtag_present ? "JTAG present" : "no JTAG"} ·{" "}
          {board.network_up == null ? "unknown" : board.network_up ? "network up" : "network down"}
        </dd>
        {board.last_error ? (
          <>
            <dt>Last error</dt>
            <dd>
              {board.last_error.reason ?? "unknown"} <span className="dim">({formatWhen(board.last_error.at)})</span>
            </dd>
          </>
        ) : null}
      </dl>
      <h3>Recent on this board</h3>
      {events.items.length === 0 ? (
        <p className="dim">{events.loading ? "Loading…" : "No changes recorded yet."}</p>
      ) : (
        <ul className="plain-list">
          {events.items.map((e) => (
            <li key={e.id}>
              <span className="dim">{formatWhen(e.at)}</span> {e.from_state ?? "—"} → {e.to_state} by {e.actor}
              {e.reason ? <span className="dim"> ({e.reason})</span> : null}
            </li>
          ))}
        </ul>
      )}
      <MoreButton hasMore={events.hasMore} busy={events.loadingMore} onMore={() => void events.more()} />
    </section>
  );
}

export function AdminBoards() {
  const res = useResource(getAdminBoards, "", { refreshMs: () => REFRESH_MS });
  const [picked, setPicked] = useState<number | null>(null);
  const boards = res.data?.items ?? [];
  const selected = boards.find((b) => b.fpga_id === picked) ?? null;
  return (
    <>
      <h1 className="page-title">Boards</h1>
      <p className="sub">{boards.length > 0 ? `${boards.length} boards` : "The FPGA cluster"}. Select a board for its details.</p>
      {!res.data ? (
        res.loading ? <Loading what="boards" /> : <LoadError error={res.error} onRetry={() => void res.reload()} />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Board</th>
                  <th scope="col">State</th>
                  <th scope="col">Held by</th>
                  <th scope="col">Time left</th>
                  <th scope="col">Build</th>
                </tr>
              </thead>
              <tbody>
                {boards.map((b) => (
                  <tr key={b.fpga_id} className={b.fpga_id === picked ? "row-on" : ""}>
                    <th scope="row">
                      <button type="button" className="link-btn" onClick={() => setPicked(b.fpga_id === picked ? null : b.fpga_id)} aria-pressed={b.fpga_id === picked}>
                        {boardName(b.fpga_id)}
                      </button>
                    </th>
                    <td><StateBadge state={b.state} /></td>
                    <td>{b.owner ?? "—"}</td>
                    <td>{b.session ? timeLeft(b.session.expires_at) : "—"}</td>
                    <td>{b.current_job_id ? <Link to={`/builds/${b.current_job_id}`}>#{shortId(b.current_job_id)}</Link> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selected ? <BoardPanel board={selected} /> : null}
        </>
      )}
    </>
  );
}

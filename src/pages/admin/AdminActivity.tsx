import { useState } from "react";
import { getAdminActivity, type AdminActivity as Entry } from "../../api";
import { Empty, Loading, LoadError, MoreButton } from "../../components/Bits";
import { boardName, formatWhen } from "../../format";
import { usePaged } from "../../usePaged";

const TABS: [string, string][] = [
  ["", "All"],
  ["admin", "Admin actions"],
  ["system", "System"],
  ["user", "Users"],
];

const ACTION_LABEL: Record<string, string> = {
  board_state: "Board state changed",
  "user:approved": "Application approved",
  "user:rejected": "Application rejected",
  "user:quota_updated": "Quota updated",
};

function what(e: Entry): string {
  const base = ACTION_LABEL[e.action] ?? e.action.replace(/[:_]/g, " ");
  return e.action === "board_state" && (e.from_state || e.to_state) ? `${base}: ${e.from_state ?? "—"} → ${e.to_state ?? "—"}` : base;
}

export function AdminActivity() {
  const [type, setType] = useState("");
  const list = usePaged((cursor) => getAdminActivity({ actor_type: type, cursor }), type);
  return (
    <>
      <h1 className="page-title">Activity</h1>
      <p className="sub">Every admin action, plus the board changes the system makes on its own. Newest first.</p>
      <div className="view-tabs" role="tablist" aria-label="Filter by who acted">
        {TABS.map(([v, l]) => (
          <button key={v} type="button" role="tab" aria-selected={type === v} className={`view-tab ${type === v ? "view-tab-on" : ""}`} onClick={() => setType(v)}>
            {l}
          </button>
        ))}
      </div>
      {list.loading ? (
        <Loading what="activity" />
      ) : list.error && list.items.length === 0 ? (
        <LoadError error={list.error} onRetry={() => void list.reload()} />
      ) : list.items.length === 0 ? (
        <Empty><p>No activity yet.</p></Empty>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">When</th>
                  <th scope="col">Who</th>
                  <th scope="col">Action</th>
                  <th scope="col">Target</th>
                  <th scope="col">Reason</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((e, i) => (
                  <tr key={`${e.at}-${i}`}>
                    <td>{formatWhen(e.at)}</td>
                    <td>
                      {e.actor} <span className="dim small">{e.actor_type}</span>
                    </td>
                    <td>{what(e)}</td>
                    <td>{e.target_type === "board" ? boardName(e.target) : e.target}</td>
                    <td>{e.reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <MoreButton hasMore={list.hasMore} busy={list.loadingMore} onMore={() => void list.more()} />
        </>
      )}
    </>
  );
}

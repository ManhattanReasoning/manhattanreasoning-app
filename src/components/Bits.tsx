import type { ReactNode } from "react";
import { ApiError } from "../api";
import { statusTone } from "../format";
import { explainError } from "../messages";

/** The turnstile mark (⊢), optionally with the company name beside it. */
export function Logo({ withName = false }: { withName?: boolean }) {
  return (
    <span className="brand">
      <img className="logo-img" src="/logo.png" alt={withName ? "" : "Manhattan Reasoning"} />
      {withName ? <span>Manhattan Reasoning</span> : null}
    </span>
  );
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={`badge badge-${statusTone(status)}`}>
      <span className="badge-dot" aria-hidden="true" />
      {label ?? status}
    </span>
  );
}

export function Loading({ what }: { what: string }) {
  return (
    <p className="state" role="status">
      Loading {what}…
    </p>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="state state-empty">{children}</div>;
}

/** A failed load, with a way to try again. A 401 is handled by the session. */
export function LoadError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  if (error instanceof ApiError && error.status === 401) return null;
  return (
    <div className="state state-error" role="alert">
      <p>{explainError(error)}</p>
      <button type="button" className="btn btn-quiet" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

export function Notice({
  tone,
  children,
}: {
  tone: "warn" | "bad" | "good" | "plain";
  children: ReactNode;
}) {
  return (
    <div className={`notice notice-${tone}`} role={tone === "bad" ? "alert" : "status"}>
      {children}
    </div>
  );
}

/** The state of a board or a user, as a badge. Unknown states fall back to plain. */
export function StateBadge({ state }: { state: string }) {
  const tone: Record<string, string> = {
    idle: "good",
    active: "good",
    programming: "live",
    reserved: "live",
    dirty: "plain",
    pending: "plain",
    suspended: "bad",
    rejected: "bad",
    error: "bad",
    offline: "bad",
  };
  const label = state.charAt(0).toUpperCase() + state.slice(1).replace(/_/g, " ");
  return (
    <span className={`badge badge-${tone[state] ?? "plain"}`}>
      <span className="badge-dot" aria-hidden="true" />
      {label}
    </span>
  );
}

/** "Show more" under a paged list. */
export function MoreButton({ hasMore, busy, onMore }: { hasMore: boolean; busy: boolean; onMore: () => void }) {
  if (!hasMore) return null;
  return (
    <p className="more">
      <button type="button" className="btn" onClick={onMore} disabled={busy}>
        {busy ? "Loading…" : "Load older"}
      </button>
    </p>
  );
}

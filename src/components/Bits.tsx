import type { ReactNode } from "react";
import { ApiError } from "../api";
import { statusTone } from "../format";
import { explainError } from "../messages";

/** The two-line text logo from the marketing site, as live text. */
export function Logo() {
  return (
    <span className="logo" aria-hidden="true">
      <span className="logo-l1">
        Manhattan <span className="op">&rarr;</span> Reasoning,
      </span>
      <span className="logo-l2">
        Manhattan <span className="op">&#8866;</span> Reasoning
      </span>
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

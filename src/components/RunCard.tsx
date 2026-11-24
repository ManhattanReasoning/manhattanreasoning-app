import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, cancelJob } from "../api";
import type { RecentBuild } from "../api";
import { boardName, formatWhen, isInFlight, shortId } from "../format";
import { canCancel } from "../phase";
import { PhasePill, useLivePhase } from "./Phase";

export function cancelMessage(err: unknown): string {
  if (err instanceof ApiError && err.status === 409) {
    return "This build can no longer be cancelled. It may have just finished, or it is on the board.";
  }
  if (err instanceof ApiError && err.status === 403) return "You can only cancel your own builds.";
  if (err instanceof ApiError && err.status === 404) return "That build no longer exists.";
  return err instanceof Error ? err.message : "Could not cancel the build.";
}

/** A build as a card: status first, then what it is, when, and a menu for the secondary actions. */
export function RunCard({ build, onChanged }: { build: RecentBuild; onChanged: () => void }) {
  return isInFlight(build.status) ? (
    <LiveRunCard build={build} onChanged={onChanged} />
  ) : (
    <RunCardView build={build} phase={build.status} onChanged={onChanged} />
  );
}

function LiveRunCard({ build, onChanged }: { build: RecentBuild; onChanged: () => void }) {
  return <RunCardView build={build} phase={useLivePhase(build)} onChanged={onChanged} />;
}

function RunCardView({ build, phase, onChanged }: { build: RecentBuild; phase: string; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const live = isInFlight(build.status);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setConfirming(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setConfirming(false);
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(build.job_id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable: nothing to do
    }
  };

  const cancel = async () => {
    setBusy(true);
    setError(null);
    try {
      await cancelJob(build.job_id);
    } catch (err) {
      setError(cancelMessage(err));
    } finally {
      setBusy(false);
      setOpen(false);
      setConfirming(false);
      onChanged();
    }
  };

  return (
    <div className="card run">
      <div className="card-head">
        <div className="card-title">
          <PhasePill phase={phase} fallbackLabel={build.status_display} />
          <Link to={`/builds/${build.job_id}`} className="card-name stretch">
            {build.project || build.name}
          </Link>
          <span className="dim small mono">#{shortId(build.job_id)}</span>
        </div>
        <div className="card-side">
          <span className="dim small" title={formatWhen(build.submitted_at)}>
            {build.relative_time ?? formatWhen(build.submitted_at)}
          </span>
          <div className="kebab" ref={rootRef}>
            <button
              type="button"
              className="kebab-btn"
              aria-label={`More actions for build ${shortId(build.job_id)}`}
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={() => {
                setOpen((o) => !o);
                setConfirming(false);
              }}
            >
              ⋯
            </button>
            {open ? (
              <div className="menu" role="menu">
                <Link to={`/builds/${build.job_id}`} role="menuitem">
                  View logs
                </Link>
                <button type="button" role="menuitem" onClick={() => void copyId()}>
                  {copied ? "Copied" : "Copy ID"}
                </button>
                {canCancel(phase) ? (
                  confirming ? (
                    <button type="button" role="menuitem" className="menu-danger" onClick={() => void cancel()} disabled={busy}>
                      {busy ? "Cancelling…" : "Yes, cancel it"}
                    </button>
                  ) : (
                    <button type="button" role="menuitem" onClick={() => setConfirming(true)}>
                      Cancel build
                    </button>
                  )
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="meta">
        <span>
          {live ? "Elapsed" : "Duration"} <strong>{build.duration_formatted ?? "—"}</strong>
        </span>
        <span>
          Board <strong>{boardName(build.board_id)}</strong>
        </span>
        {build.command ? <span className="mono">{build.command}</span> : null}
      </div>
      {error ? (
        <p className="card-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

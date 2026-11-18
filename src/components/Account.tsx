import { useEffect, useRef, useState } from "react";
import type { Profile } from "../api";

/**
 * The signed-in user's GitHub photo in a circle, falling back to their initial when they have no
 * GitHub username or the picture cannot be loaded. The browser asks github.com for the picture
 * directly; `referrerPolicy` keeps this app's address out of that request.
 */
export function Avatar({ githubUsername, fallbackName }: { githubUsername: string | null; fallbackName: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [githubUsername]);

  if (githubUsername && !failed) {
    return (
      <img
        className="avatar"
        src={`https://github.com/${encodeURIComponent(githubUsername)}.png?size=64`}
        alt=""
        width={30}
        height={30}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span className="avatar avatar-initial" aria-hidden="true">
      {(githubUsername ?? fallbackName).charAt(0).toUpperCase() || "?"}
    </span>
  );
}

/** Notification placeholder and the account menu (who is signed in, sign out). */
export function Account({ profile, onSignOut }: { profile: Profile; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const name = profile.github_username ?? profile.username;

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="account" ref={rootRef}>
      <button type="button" className="iconbtn" aria-label="Notifications (coming soon)" disabled>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
      </button>
      <button
        type="button"
        className="avatar-btn"
        aria-label={`Account: ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Avatar githubUsername={profile.github_username} fallbackName={profile.username} />
      </button>
      {open ? (
        <div className="menu menu-account" role="menu">
          <p className="menu-who">
            Signed in as <strong className="mono">{name}</strong>
          </p>
          <button type="button" role="menuitem" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

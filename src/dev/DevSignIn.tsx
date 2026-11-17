// Development only. Imported behind `import.meta.env.DEV` (see Landing.tsx),
// so none of this reaches the production bundle. It lets a local API that has
// no GitHub OAuth app configured hand out a session for an existing API key.

import { useState, type FormEvent } from "react";
import { API_URL } from "../api";
import { useSession } from "../session";

export default function DevSignIn() {
  const { refresh } = useSession();
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setProblem("");
    try {
      const resp = await fetch(`${API_URL}/auth/session`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: key.trim() }),
      });
      if (!resp.ok) {
        setProblem(resp.status === 401 ? "That key was not accepted." : `The API answered ${resp.status}.`);
        return;
      }
      setKey("");
      await refresh();
    } catch {
      setProblem(`Could not reach ${API_URL}.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="dev-signin" onSubmit={submit}>
      <h2>Developer sign-in</h2>
      <p>
        Local development only, against <code>{API_URL}</code>. Not part of the production build.
      </p>
      <label htmlFor="dev-key">API key</label>
      <div className="dev-row">
        <input
          id="dev-key"
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-quiet" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </div>
      {problem ? (
        <p className="dev-problem" role="alert">
          {problem}
        </p>
      ) : null}
    </form>
  );
}

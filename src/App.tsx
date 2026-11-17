import { NavLink, Link, Route, Routes } from "react-router-dom";
import { Loading, LoadError, Logo } from "./components/Bits";
import { BuildDetail } from "./pages/BuildDetail";
import { Builds } from "./pages/Builds";
import { Landing } from "./pages/Landing";
import { Membership } from "./pages/Membership";
import { Overview } from "./pages/Overview";
import { useSession } from "./session";

export function App({ loginError }: { loginError: string | null }) {
  const { state, refresh, signOut } = useSession();

  if (state.phase === "loading") {
    return (
      <main className="page page-center">
        <Loading what="your account" />
      </main>
    );
  }
  if (state.phase === "error") {
    return (
      <main className="page page-center">
        <LoadError error={state.error} onRetry={() => void refresh()} />
      </main>
    );
  }
  if (state.phase === "signedOut") {
    return <Landing loginError={loginError} expired={state.expired} />;
  }

  const who = state.profile.github_username ?? state.profile.username;
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="top">
        <div className="top-inner">
          <Link to="/" className="brand" aria-label="Manhattan Reasoning dashboard">
            <Logo />
          </Link>
          <nav className="tabs" aria-label="Dashboard">
            <NavLink to="/" end>
              Overview
            </NavLink>
            <NavLink to="/builds">Builds</NavLink>
            <NavLink to="/membership">Membership</NavLink>
          </nav>
          <div className="who">
            <span className="mono who-name" title="Signed in as">
              {who}
            </span>
            <button type="button" className="btn btn-quiet" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="page" id="main">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/builds" element={<Builds />} />
          <Route path="/builds/:jobId" element={<BuildDetail />} />
          <Route path="/membership" element={<Membership />} />
          <Route
            path="*"
            element={
              <div className="state state-empty">
                <p>There is no page here.</p>
                <Link to="/">Go to the overview</Link>
              </div>
            }
          />
        </Routes>
      </main>
      <footer className="foot">
        <a href="https://docs.manhattanreasoning.com">Docs</a>
        <a href="https://manhattanreasoning.com">manhattanreasoning.com</a>
        <a href="mailto:hello@manhattanreasoning.com">hello@manhattanreasoning.com</a>
      </footer>
    </>
  );
}

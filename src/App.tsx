import { NavLink, Link, Route, Routes } from "react-router-dom";
import { Account } from "./components/Account";
import { Loading, LoadError, Logo } from "./components/Bits";
import { BuildDetail } from "./pages/BuildDetail";
import { Builds } from "./pages/Builds";
import { Landing } from "./pages/Landing";
import { Membership } from "./pages/Membership";
import { Overview } from "./pages/Overview";
import { Projects } from "./pages/Projects";
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
      <header className="topbar">
        <Link to="/" aria-label="Manhattan Reasoning dashboard, Overview">
          <Logo />
        </Link>
        <span className="ws">{who}</span>
        <div className="spacer" />
        <Account profile={state.profile} onSignOut={() => void signOut()} />
      </header>
      <div className="shell">
        <nav className="sidebar" aria-label="Dashboard">
          <NavLink to="/" end className="side-link">
            Overview
          </NavLink>
          <NavLink to="/projects" className="side-link">
            Projects
          </NavLink>
          <NavLink to="/builds" className="side-link">
            Builds
          </NavLink>
          <NavLink to="/membership" className="side-link">
            Membership
          </NavLink>
          <span className="side-link side-stub" aria-disabled="true" title="Coming soon">
            Secrets
            <span className="soon">soon</span>
          </span>
        </nav>
        <div className="shell-main">
          <main className="page" id="main">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/projects" element={<Projects />} />
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
        </div>
      </div>
    </>
  );
}

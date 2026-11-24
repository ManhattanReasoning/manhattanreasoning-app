import { NavLink, Link, Route, Routes } from "react-router-dom";
import { AdminOnly, AdminProvider, useIsAdmin } from "./admin";
import { Account } from "./components/Account";
import { Loading, LoadError, Logo } from "./components/Bits";
import { BuildDetail } from "./pages/BuildDetail";
import { Builds } from "./pages/Builds";
import { Landing } from "./pages/Landing";
import { Membership } from "./pages/Membership";
import { Overview } from "./pages/Overview";
import { AdminActivity } from "./pages/admin/AdminActivity";
import { AdminBoards } from "./pages/admin/AdminBoards";
import { AdminBuilds } from "./pages/admin/AdminBuilds";
import { AdminOverview } from "./pages/admin/AdminOverview";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { Projects } from "./pages/Projects";
import { useSession } from "./session";

/** The admin links, shown only once the API has said this sign-in is an admin. */
function AdminNav() {
  if (!useIsAdmin()) return null;
  return (
    <>
      <span className="side-heading">Admin</span>
      <NavLink to="/admin" end className="side-link">Overview</NavLink>
      <NavLink to="/admin/boards" className="side-link">Boards</NavLink>
      <NavLink to="/admin/builds" className="side-link">All builds</NavLink>
      <NavLink to="/admin/users" className="side-link">Users</NavLink>
      <NavLink to="/admin/activity" className="side-link">Activity</NavLink>
    </>
  );
}

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
    <AdminProvider>
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
          <AdminNav />
        </nav>
        <div className="shell-main">
          <main className="page" id="main">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/builds" element={<Builds />} />
              <Route path="/builds/:jobId" element={<BuildDetail />} />
              <Route path="/membership" element={<Membership />} />
              <Route path="/admin" element={<AdminOnly><AdminOverview /></AdminOnly>} />
              <Route path="/admin/boards" element={<AdminOnly><AdminBoards /></AdminOnly>} />
              <Route path="/admin/builds" element={<AdminOnly><AdminBuilds /></AdminOnly>} />
              <Route path="/admin/users" element={<AdminOnly><AdminUsers /></AdminOnly>} />
              <Route path="/admin/activity" element={<AdminOnly><AdminActivity /></AdminOnly>} />
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
    </AdminProvider>
  );
}

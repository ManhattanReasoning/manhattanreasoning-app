import { NavLink, Link, Route, Routes, useLocation } from "react-router-dom";
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
import type { Profile } from "./api";
import { useSession } from "./session";

/** Admin mode is the /admin part of the app; only an admin can be in it. */
function useAdminMode(): boolean {
  const isAdmin = useIsAdmin();
  return isAdmin === true && useLocation().pathname.startsWith("/admin");
}

/** A quiet marker in the top bar so nobody mistakes the admin view for their own dashboard. */
function AdminTag() {
  return useAdminMode() ? <span className="admin-tag">Admin</span> : null;
}

/** The account menu; admins get a "switch view" item in it. */
function TopbarAccount({ profile, onSignOut }: { profile: Profile; onSignOut: () => void }) {
  const isAdmin = useIsAdmin();
  const admin = useAdminMode();
  const switchView = isAdmin
    ? admin
      ? { to: "/", label: "Switch to user view" }
      : { to: "/admin", label: "Switch to admin view" }
    : undefined;
  return <Account profile={profile} onSignOut={onSignOut} switchView={switchView} />;
}

function SideNav() {
  const admin = useAdminMode();
  return admin ? (
    <nav className="sidebar" aria-label="Admin">
      <NavLink to="/admin" end className="side-link">Overview</NavLink>
      <NavLink to="/admin/boards" className="side-link">Boards</NavLink>
      <NavLink to="/admin/builds" className="side-link">All builds</NavLink>
      <NavLink to="/admin/users" className="side-link">Users</NavLink>
      <NavLink to="/admin/activity" className="side-link">Activity</NavLink>
    </nav>
  ) : (
    <nav className="sidebar" aria-label="Dashboard">
      <NavLink to="/" end className="side-link">Overview</NavLink>
      <NavLink to="/projects" className="side-link">Projects</NavLink>
      <NavLink to="/builds" className="side-link">Builds</NavLink>
      <NavLink to="/membership" className="side-link">Membership</NavLink>
      <span className="side-link side-stub" aria-disabled="true" title="Coming soon">
        Secrets
        <span className="soon">soon</span>
      </span>
    </nav>
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
        <AdminTag />
        <div className="spacer" />
        <TopbarAccount profile={state.profile} onSignOut={() => void signOut()} />
      </header>
      <div className="shell">
        <SideNav />
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

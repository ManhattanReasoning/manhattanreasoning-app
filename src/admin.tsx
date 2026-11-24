import { createContext, useContext, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { probeAdmin } from "./api";
import { Loading } from "./components/Bits";
import { useResource } from "./useResource";

/** undefined while the check is running, then true or false. */
const AdminContext = createContext<boolean | undefined>(undefined);

/** Asks the API once whether this sign-in is an admin; the admin pages and nav link hang off it. */
export function AdminProvider({ children }: { children: ReactNode }) {
  const probe = useResource(probeAdmin);
  return <AdminContext.Provider value={probe.loading ? undefined : probe.data === true}>{children}</AdminContext.Provider>;
}

export const useIsAdmin = () => useContext(AdminContext);

/** Shows its children only to admins; everyone else gets the same "no page here" as any unknown address. */
export function AdminOnly({ children }: { children: ReactNode }) {
  const isAdmin = useIsAdmin();
  if (isAdmin === undefined) return <Loading what="the admin pages" />;
  if (!isAdmin) {
    return (
      <div className="state state-empty">
        <p>There is no page here.</p>
        <Link to="/">Go to the overview</Link>
      </div>
    );
  }
  return <>{children}</>;
}

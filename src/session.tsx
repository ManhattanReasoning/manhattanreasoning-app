import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ApiError,
  getProfile,
  setUnauthorizedListener,
  signOut as apiSignOut,
  type Profile,
} from "./api";

type SessionState =
  | { phase: "loading" }
  | { phase: "signedOut"; expired: boolean }
  | { phase: "signedIn"; profile: Profile }
  | { phase: "error"; error: unknown };

interface SessionValue {
  state: SessionState;
  /** Ask the API again who is signed in (after dev sign-in, or to retry). */
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ phase: "loading" });

  const refresh = useCallback(async () => {
    try {
      const profile = await getProfile();
      setState({ phase: "signedIn", profile });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setState({ phase: "signedOut", expired: false });
      } else {
        setState({ phase: "error", error });
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Any call answering 401 while signed in means the session ended.
  useEffect(() => {
    setUnauthorizedListener(() =>
      setState((prev) =>
        prev.phase === "signedIn" ? { phase: "signedOut", expired: true } : prev,
      ),
    );
    return () => setUnauthorizedListener(null);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiSignOut();
    } finally {
      setState({ phase: "signedOut", expired: false });
    }
  }, []);

  const value = useMemo(() => ({ state, refresh, signOut }), [state, refresh, signOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession outside SessionProvider");
  return value;
}

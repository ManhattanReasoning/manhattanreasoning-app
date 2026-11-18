import { lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { signInUrl } from "../api";
import { Logo, Notice } from "../components/Bits";
import { explainLoginError, isBetaListError } from "../messages";
import { toReturnTo } from "../returnTo";

// Compiled in only for `npm run dev`. `import.meta.env.DEV` is a build-time
// constant, so the production bundle contains neither this branch nor the
// module behind it (CI greps dist/ to prove it).
const DevSignIn = import.meta.env.DEV ? lazy(() => import("../dev/DevSignIn")) : null;

export function Landing({ loginError, expired }: { loginError: string | null; expired: boolean }) {
  const location = useLocation();
  const returnTo = toReturnTo(`${location.pathname}${location.search}`);

  return (
    <main className="landing">
      <div className="landing-card">
        <Logo withName />
        <h1>Your builds, usage and membership.</h1>
        <p className="lede">
          Sign in with the GitHub account you use for <code>mrg login</code>.
        </p>

        {loginError ? (
          <Notice tone="bad">
            <p>{explainLoginError(loginError)}</p>
            {isBetaListError(loginError) ? (
              <p>
                <a href="https://manhattanreasoning.com/#beta">Request beta access</a> and we will
                add this account.
              </p>
            ) : null}
          </Notice>
        ) : expired ? (
          <Notice tone="warn">
            <p>Your session ended. Sign in again to pick up where you were.</p>
          </Notice>
        ) : null}

        <a className="btn btn-primary btn-large" href={signInUrl(returnTo)}>
          Sign in with GitHub
        </a>

        {DevSignIn ? (
          <Suspense fallback={null}>
            <DevSignIn />
          </Suspense>
        ) : null}
      </div>
    </main>
  );
}

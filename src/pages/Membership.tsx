import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getUsage, startCheckout, startPortal } from "../api";
import { Loading, LoadError, Notice } from "../components/Bits";
import { UsageMeter } from "../components/UsageMeter";
import { membershipSummary } from "../membership";
import { explainBillingError, type Explained } from "../messages";
import { useSession } from "../session";
import { useResource } from "../useResource";

// After checkout, the membership turns on when Stripe's confirmation reaches
// the API, a moment after the browser comes back. Look again a few times.
const RECHECK_MS = 2500;
const RECHECK_TIMES = 8;

type Flow = "checkout" | "portal";

export function Membership() {
  const usage = useResource(getUsage);
  const { signOut } = useSession();
  const [params] = useSearchParams();
  const returned = params.get("checkout"); // "success" | "cancelled" | null
  const [busy, setBusy] = useState<Flow | null>(null);
  const [problem, setProblem] = useState<Explained | null>(null);
  const [rechecksLeft, setRechecksLeft] = useState(returned === "success" ? RECHECK_TIMES : 0);

  const status = usage.data?.billing_status;
  const { reload } = usage;
  const confirmed = status === "active" || status === "comp";
  const waiting = returned === "success" && !confirmed && rechecksLeft > 0;

  const reloadRef = useRef(reload);
  reloadRef.current = reload;
  useEffect(() => {
    if (!waiting) return;
    const timer = window.setTimeout(() => {
      setRechecksLeft((n) => n - 1);
      void reloadRef.current();
    }, RECHECK_MS);
    return () => window.clearTimeout(timer);
  }, [waiting, rechecksLeft]);

  async function go(flow: Flow) {
    setBusy(flow);
    setProblem(null);
    try {
      const url = await (flow === "checkout" ? startCheckout() : startPortal());
      window.location.assign(url);
    } catch (err) {
      setProblem(explainBillingError(err));
      setBusy(null);
    }
  }

  const subscribe = (primary: boolean, label = "Subscribe") => (
    <button
      type="button"
      className={`btn ${primary ? "btn-primary" : "btn-quiet"}`}
      disabled={busy !== null}
      onClick={() => void go("checkout")}
    >
      {busy === "checkout" ? "Opening checkout…" : label}
    </button>
  );
  const manage = (primary: boolean) => (
    <button
      type="button"
      className={`btn ${primary ? "btn-primary" : "btn-quiet"}`}
      disabled={busy !== null}
      onClick={() => void go("portal")}
    >
      {busy === "portal" ? "Opening billing…" : "Manage billing"}
    </button>
  );

  const summary = usage.data ? membershipSummary(usage.data) : null;

  return (
    <>
      <h1 className="page-title">Membership</h1>

      {returned === "success" ? (
        confirmed ? (
          <Notice tone="good">
            <p>
              <strong>Your membership is active.</strong> You can build now.
            </p>
          </Notice>
        ) : (
          <Notice tone="plain">
            <p>
              <strong>Payment received.</strong> Your membership turns on as soon as Stripe
              confirms the payment, usually within a few seconds.{" "}
              {waiting
                ? "Checking…"
                : "It has not arrived yet. Check again in a minute; if it is still missing, write to hello@manhattanreasoning.com."}
            </p>
            {!waiting ? (
              <button type="button" className="btn btn-quiet" onClick={() => void reload()}>
                Check again
              </button>
            ) : null}
          </Notice>
        )
      ) : returned === "cancelled" ? (
        <Notice tone="plain">
          <p>
            <strong>Checkout cancelled.</strong> Nothing was charged and your membership is
            unchanged.
          </p>
        </Notice>
      ) : null}

      {problem ? (
        <Notice tone="bad">
          <p>{problem.message}</p>
          {problem.next === "portal" ? manage(false) : null}
          {problem.next === "checkout" ? subscribe(false) : null}
          {problem.next === "signin" ? (
            <button type="button" className="btn btn-quiet" onClick={() => void signOut()}>
              Sign out
            </button>
          ) : null}
        </Notice>
      ) : null}

      {usage.data ? (
        <div className="split">
          <section className="panel" aria-labelledby="status-h">
            <h2 id="status-h">Status</h2>
            {summary ? (
              <>
                <p className={`status-line tone-${summary.tone}`} role="status">
                  {summary.label}
                </p>
                <p className="dim">{summary.detail}</p>
                <div className="actions">
                  {status === "active" ? manage(true) : null}
                  {status === "none" ? subscribe(true) : null}
                  {status === "blocked" ? (
                    <>
                      {manage(true)}
                      {subscribe(false, "Subscribe again")}
                    </>
                  ) : null}
                </div>
                {status === "active" || status === "blocked" ? (
                  <p className="dim small">
                    Billing opens on Stripe, where you can change your card, download invoices or
                    cancel.
                  </p>
                ) : null}
                {status === "none" ? (
                  <p className="dim small">
                    Checkout opens on Stripe, which shows the terms before you pay.
                  </p>
                ) : null}
              </>
            ) : (
              <p className="dim">This server does not report membership.</p>
            )}
          </section>

          <section className="panel" aria-labelledby="incl-h">
            <h2 id="incl-h">Usage this month</h2>
            <UsageMeter
              used={usage.data.build_minutes_used}
              limit={usage.data.build_minutes_limit}
              remaining={usage.data.build_minutes_remaining}
              month={usage.data.month}
            />
            <p className="dim small">One build in flight at a time.</p>
          </section>
        </div>
      ) : usage.loading ? (
        <Loading what="membership" />
      ) : (
        <LoadError error={usage.error} onRetry={() => void reload()} />
      )}
    </>
  );
}

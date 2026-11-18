import { useState } from "react";
import { cancelJob } from "../api";
import { cancelMessage } from "./RunCard";

/** Two clicks, because cancelling cannot be undone. */
export function CancelButton({ jobId, onDone }: { jobId: string; onDone: () => void }) {
  const [step, setStep] = useState<"idle" | "confirm" | "working">("idle");
  const [error, setError] = useState<string | null>(null);

  const cancel = async () => {
    setStep("working");
    setError(null);
    try {
      await cancelJob(jobId);
    } catch (err) {
      setError(cancelMessage(err));
    }
    setStep("idle");
    onDone();
  };

  return (
    <span className="cancel">
      {step === "idle" ? (
        <button type="button" className="btn btn-danger" onClick={() => setStep("confirm")}>
          Cancel build
        </button>
      ) : (
        <span className="cancel-confirm" role="group" aria-label="Confirm cancelling this build">
          <span>Cancel this build?</span>
          <button type="button" className="btn btn-danger" onClick={() => void cancel()} disabled={step === "working"}>
            {step === "working" ? "Cancelling…" : "Yes, cancel"}
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => setStep("idle")} disabled={step === "working"}>
            Keep it
          </button>
        </span>
      )}
      {error ? (
        <span className="cancel-error" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}

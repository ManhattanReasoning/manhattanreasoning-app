import { useCallback, useEffect, useRef, useState } from "react";
import { openLogStream } from "../api";
import { explainError } from "../messages";

type Phase = "connecting" | "live" | "done" | "dropped" | "failed";

const MAX_LINES = 5000;

/** Live build output. Shows everything logged so far, then follows along. */
export function Logs({ jobId, onDone }: { jobId: string; onDone?: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>("connecting");
  const [problem, setProblem] = useState<string>("");
  const [attempt, setAttempt] = useState(0);
  const boxRef = useRef<HTMLPreElement>(null);
  const followRef = useRef(true);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    let cancelled = false;
    let close: (() => void) | null = null;
    setLines([]);
    setPhase("connecting");
    openLogStream(jobId, {
      onLine: (line) => {
        setPhase("live");
        setLines((prev) => {
          const next = prev.length >= MAX_LINES ? prev.slice(-MAX_LINES + 1) : prev.slice();
          next.push(line);
          return next;
        });
      },
      onDone: () => {
        setPhase("done");
        onDoneRef.current?.();
      },
      onError: () => setPhase("dropped"),
    })
      .then((c) => {
        if (cancelled) c();
        else close = c;
      })
      .catch((err) => {
        if (cancelled) return;
        setProblem(explainError(err));
        setPhase("failed");
      });
    return () => {
      cancelled = true;
      close?.();
    };
  }, [jobId, attempt]);

  // Follow the tail unless the reader has scrolled up to look at something.
  useEffect(() => {
    const box = boxRef.current;
    if (box && followRef.current) box.scrollTop = box.scrollHeight;
  }, [lines]);

  const onScroll = useCallback(() => {
    const box = boxRef.current;
    if (!box) return;
    followRef.current = box.scrollHeight - box.scrollTop - box.clientHeight < 24;
  }, []);

  const statusText =
    phase === "connecting"
      ? "connecting…"
      : phase === "live"
        ? "live"
        : phase === "done"
          ? "finished"
          : phase === "dropped"
            ? "disconnected"
            : "unavailable";

  return (
    <section className="terminal" aria-label="Build log">
      <header className="terminal-head">
        <span className="terminal-title">build log</span>
        <span className={`terminal-state terminal-${phase}`} role="status">
          {statusText}
        </span>
      </header>
      <pre
        className="terminal-body"
        ref={boxRef}
        onScroll={onScroll}
        tabIndex={0}
        aria-label="Build log output"
      >
        {lines.length > 0
          ? lines.join("\n")
          : phase === "connecting"
            ? ""
            : phase === "failed"
              ? problem
              : "No output yet."}
      </pre>
      {phase === "dropped" || phase === "failed" ? (
        <footer className="terminal-foot">
          <span>
            {phase === "dropped" ? "The log stream was interrupted." : "The log could not be opened."}
          </span>
          <button type="button" className="btn btn-on-dark" onClick={() => setAttempt((a) => a + 1)}>
            Reconnect
          </button>
        </footer>
      ) : null}
    </section>
  );
}

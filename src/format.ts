/** "0b6f3c1e": enough of a job id to recognise, short enough for a table. */
export const shortId = (id: string) => id.slice(0, 8);

/** The API names a board by its number ("0".."6"). */
export const boardName = (id: string | number | null | undefined) =>
  id == null || id === "" ? "—" : /^\d+$/.test(String(id)) ? `Board ${id}` : String(id);

/** A stable, locale-aware timestamp; the raw value if it does not parse. */
export function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "2026-11" → "November 2026". */
export function formatMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Machine job status → the tone used for its badge. */
export function statusTone(status: string): "good" | "bad" | "live" | "plain" {
  switch (status.toLowerCase()) {
    case "complete":
    case "completed":
    case "passed":
      return "good";
    case "failed":
      return "bad";
    case "running":
    case "building":
    case "waiting":
    case "flashing":
      return "live";
    default:
      return "plain";
  }
}

export const isInFlight = (status: string) => status === "queued" || status === "running";

export const isFinished = (status: string) =>
  status === "complete" || status === "failed" || status === "cancelled";

/** 5400 → "1h 30m", 90 → "1m 30s", 12 → "12s"; "—" when unknown. */
export function formatSeconds(s: number | null | undefined): string {
  if (s == null) return "—";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.round(s % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

/** The build step the backend reports ("build_gateware/nextpnr-ecp5") as a label people know. */
export function stageLabel(stage: string): string {
  if (stage.includes("yosys")) return "Synthesis";
  if (stage.includes("nextpnr")) return "Place & route";
  if (stage.includes("ecppack")) return "Bitstream";
  if (stage === "flash") return "Flashing";
  if (stage === "build") return "Build (step unknown)";
  return stage;
}

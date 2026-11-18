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

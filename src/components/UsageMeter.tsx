import { formatMonth } from "../format";

/** Build-minutes used against the monthly quota. */
export function UsageMeter({
  used,
  limit,
  remaining,
  month,
}: {
  used: number;
  limit: number;
  remaining: number;
  month?: string;
}) {
  const fraction = limit > 0 ? Math.min(1, used / limit) : 0;
  const tone = remaining <= 0 ? "bad" : remaining < limit * 0.1 ? "warn" : "ok";
  return (
    <div className="meter">
      <div className="meter-head">
        <span className="meter-figure">
          <strong>{used.toLocaleString()}</strong> of {limit.toLocaleString()} build-minutes
        </span>
        <span className={`meter-left meter-${tone}`}>
          {remaining.toLocaleString()} left
        </span>
      </div>
      <div
        className="meter-track"
        role="meter"
        aria-label="Build-minutes used this month"
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={Math.min(used, limit)}
        aria-valuetext={`${used} of ${limit} build-minutes used`}
      >
        <div className={`meter-fill meter-fill-${tone}`} style={{ width: `${fraction * 100}%` }} />
      </div>
      <p className="meter-note">
        {month ? `${formatMonth(month)}. ` : ""}Resets at the start of each month (UTC). Failed
        and cancelled builds count too.
      </p>
    </div>
  );
}

// Smoke test: the presentational pieces render the API's shapes to markup.
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { PipelineStage, RecentBuild } from "./api";
import { BuildsTable } from "./components/BuildsTable";
import { Pipeline } from "./components/Pipeline";
import { UsageMeter } from "./components/UsageMeter";

describe("rendering", () => {
  it("draws one via per pipeline stage and one wire between each pair", () => {
    const ids = ["synthesis", "place_and_route", "bitstream", "flash_to_board", "run"];
    const statuses = ["completed", "completed", "running", "pending", "pending"] as const;
    const stages: PipelineStage[] = ids.map((id, i) => ({
      id,
      name: id,
      status: statuses[i],
      duration_seconds: i < 2 ? 61 : null,
      duration_formatted: i < 2 ? "1m 1s" : null,
    }));
    const html = renderToString(<Pipeline stages={stages} />);
    expect(html.match(/class="via"/g)).toHaveLength(5);
    expect(html.match(/<path/g)).toHaveLength(4);
    expect(html).toContain("wire-running");
    expect(html).toContain("1m 1s");
  });

  it("links each build to its detail page", () => {
    const build: RecentBuild = {
      job_id: "0b6f3c1e-0000-4000-8000-000000000000",
      name: "app.py",
      project: "examples",
      status: "complete",
      status_display: "Passed",
      submitted_at: "2026-11-16T10:00:00Z",
      relative_time: "2 hours ago",
      duration_seconds: 300,
      duration_formatted: "5m 0s",
      board_id: "3",
      command: null,
    };
    const html = renderToString(
      <MemoryRouter>
        <BuildsTable builds={[build]} />
      </MemoryRouter>,
    );
    expect(html).toContain(`href="/builds/${build.job_id}"`);
    expect(html).toContain("Passed");
  });

  it("caps the meter at the limit", () => {
    const html = renderToString(<UsageMeter used={1200} limit={1000} remaining={0} month="2026-11" />);
    expect(html).toContain("width:100%");
    expect(html).toContain("meter-bad");
  });
});

// Smoke test: the presentational pieces render the API's shapes to markup.
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ApiError, type PipelineStage, type RecentBuild } from "./api";
import { Account, Avatar } from "./components/Account";
import { BuildsTable } from "./components/BuildsTable";
import { cancelMessage, RunCard } from "./components/RunCard";
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
    expect(html).toMatch(/#(<!-- -->)?0b6f3c1e/);
    expect(html).toContain("Complete");
    // Which board a build ran on is never shown to users, even if the API sends it.
    expect(html).not.toMatch(/Board/);
    expect(html).not.toContain(">3<");
    expect(html).toContain("5m 0s");
  });

  it("caps the meter at the limit", () => {
    const html = renderToString(<UsageMeter used={1200} limit={1000} remaining={0} month="2026-11" />);
    expect(html).toContain("width:100%");
    expect(html).toContain("meter-bad");
  });

  const finished: RecentBuild = {
    job_id: "0b6f3c1e-0000-4000-8000-000000000000",
    name: "app.py",
    project: "examples",
    status: "failed",
    status_display: "Failed",
    submitted_at: "2026-11-16T10:00:00Z",
    relative_time: "2h ago",
    duration_seconds: 41,
    duration_formatted: "0:41",
    command: "mrg run app.py",
  };

  it("shows a finished build as a card: status first, project as the title, no Elapsed", () => {
    const html = renderToString(
      <MemoryRouter>
        <RunCard build={finished} onChanged={() => {}} />
      </MemoryRouter>,
    );
    expect(html.indexOf("Failed")).toBeLessThan(html.indexOf("examples"));
    expect(html).toContain("Duration");
    expect(html).not.toContain("Elapsed");
    expect(html).toContain("mrg run app.py");
    expect(html).toContain(`href="/builds/${finished.job_id}"`);
    expect(html).not.toMatch(/Board/);
  });

  it("uses the GitHub photo when there is a username, without sending a referrer", () => {
    const html = renderToString(<Avatar githubUsername="octocat" fallbackName="acb2319" />);
    expect(html).toContain('src="https://github.com/octocat.png?size=64"');
    expect(html).toMatch(/referrerpolicy="no-referrer"/i);
  });

  it("falls back to the initial when there is no GitHub username", () => {
    const html = renderToString(<Avatar githubUsername={null} fallbackName="acb2319" />);
    expect(html).not.toContain("<img");
    expect(html).toContain(">A<");
  });

  it("labels the account button with who is signed in", () => {
    const html = renderToString(
      <Account
        profile={{ username: "acb2319", github_username: "octocat", status: "active", max_concurrent_boards: 2, max_session_minutes: 15 }}
        onSignOut={() => {}}
      />,
    );
    expect(html).toContain('aria-label="Account: octocat"');
    expect(html).toContain("Notifications (coming soon)");
  });
});

describe("cancelMessage", () => {
  it("explains each refusal from the API", () => {
    expect(cancelMessage(new ApiError(403, "not_job_owner", "x"))).toBe("You can only cancel your own builds.");
    expect(cancelMessage(new ApiError(409, "conflict", "x"))).toMatch(/no longer be cancelled/);
    expect(cancelMessage(new ApiError(404, "not_found", "x"))).toBe("That build no longer exists.");
  });
});

import { describe, expect, it } from "vitest";
import type { PipelineStage, StageStatus } from "./api";
import { buildPhase, canCancel, failedWhileFlashing } from "./phase";

const ids = ["synthesis", "place_and_route", "bitstream", "flash_to_board", "run"];
const stages = (...s: StageStatus[]): PipelineStage[] =>
  ids.map((id, i) => ({ id, name: id, status: s[i], duration_seconds: null, duration_formatted: null }));

describe("buildPhase", () => {
  it("leaves every status except running alone", () => {
    for (const s of ["queued", "complete", "failed", "cancelled"]) {
      expect(buildPhase(s, stages("completed", "completed", "completed", "completed", "pending"))).toBe(s);
    }
  });
  it("calls a running build with unfinished build stages building", () => {
    expect(buildPhase("running", stages("completed", "running", "queued", "queued", "queued"))).toBe("building");
  });
  it("waits for a board once built but not yet flashing", () => {
    expect(buildPhase("running", stages("completed", "completed", "completed", "queued", "queued"))).toBe("waiting");
  });
  it("is flashing while the flash stage runs", () => {
    expect(buildPhase("running", stages("completed", "completed", "completed", "running", "queued"))).toBe("flashing");
  });
  it("is running only while the run stage runs", () => {
    expect(buildPhase("running", stages("completed", "completed", "completed", "completed", "running"))).toBe("running");
  });
  it("falls back to building with no pipeline yet", () => {
    expect(buildPhase("running", undefined)).toBe("building");
  });
});

describe("canCancel", () => {
  it("refuses while flashing and once finished", () => {
    expect(canCancel("flashing")).toBe(false);
    expect(canCancel("running")).toBe(false);
    expect(canCancel("complete")).toBe(false);
    expect(canCancel("queued")).toBe(true);
    expect(canCancel("building")).toBe(true);
    expect(canCancel("waiting")).toBe(true);
  });
});

describe("failedWhileFlashing", () => {
  it("is true only when the flash stage failed", () => {
    expect(failedWhileFlashing(stages("completed", "completed", "completed", "failed", "queued"))).toBe(true);
    expect(failedWhileFlashing(stages("completed", "failed", "queued", "queued", "queued"))).toBe(false);
    expect(failedWhileFlashing(undefined)).toBe(false);
  });
});

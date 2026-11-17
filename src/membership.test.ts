import { describe, expect, it } from "vitest";
import type { Usage } from "./api";
import { membershipAction, membershipSummary, membershipWarning } from "./membership";

const usage = (over: Partial<Usage>): Usage => ({
  month: "2026-11",
  build_minutes_used: 10,
  build_minutes_limit: 1000,
  build_minutes_remaining: 990,
  builds: [],
  billing_status: "none",
  subscription_required: false,
  billing_enforced: true,
  ...over,
});

describe("membershipAction", () => {
  it("is null whenever billing is not enforced, whatever the status", () => {
    for (const billing_status of ["none", "active", "blocked", "comp"] as const) {
      const u = usage({ billing_status, subscription_required: true, billing_enforced: false });
      expect(membershipAction(u)).toBeNull();
      expect(membershipWarning(u)).toBeNull();
    }
  });

  it("asks a blocked member to fix billing", () => {
    expect(membershipAction(usage({ billing_status: "blocked" }))).toBe("fix");
  });

  it("asks for a subscription only when one is required", () => {
    expect(membershipAction(usage({ subscription_required: true }))).toBe("subscribe");
    expect(membershipAction(usage({ subscription_required: false }))).toBeNull();
  });

  it("leaves active and complimentary members alone", () => {
    expect(membershipAction(usage({ billing_status: "active", subscription_required: true }))).toBeNull();
    expect(membershipAction(usage({ billing_status: "comp", subscription_required: true }))).toBeNull();
  });

  it("is null for a server that does not report membership", () => {
    const { billing_status, subscription_required, billing_enforced, ...old } = usage({});
    void billing_status, subscription_required, billing_enforced;
    expect(membershipAction(old)).toBeNull();
    expect(membershipSummary(old)).toBeNull();
  });
});

describe("membershipSummary", () => {
  it("names the five states", () => {
    expect(membershipSummary(usage({ billing_status: "active" }))?.label).toBe("Active");
    expect(membershipSummary(usage({ billing_status: "comp" }))?.label).toBe("Active (complimentary)");
    expect(membershipSummary(usage({}))?.detail).toMatch(/not required yet/);
    expect(membershipSummary(usage({ subscription_required: true }))?.detail).toMatch(/required\./);
    expect(membershipSummary(usage({ billing_status: "blocked" }))?.label).toBe("Not active");
  });

  it("does not claim builds are refused when nothing is enforced", () => {
    const s = membershipSummary(usage({ billing_status: "blocked", billing_enforced: false }));
    expect(s?.tone).toBe("warn");
    expect(s?.detail).toMatch(/not being refused/);
  });
});

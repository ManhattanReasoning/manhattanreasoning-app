import { describe, expect, it } from "vitest";
import { ApiError, NetworkError } from "./api";
import { explainBillingError, explainError, explainLoginError, isBetaListError } from "./messages";

describe("explainLoginError", () => {
  it("has a distinct message for every code the API sends", () => {
    const codes = ["state_mismatch", "github_denied", "github_unavailable", "not_allowed", "not_configured"];
    const messages = codes.map(explainLoginError);
    expect(new Set(messages).size).toBe(codes.length);
    expect(messages).not.toContain(explainLoginError("something_new"));
  });

  it("points only the beta-list error at the signup", () => {
    expect(explainLoginError("not_allowed")).toMatch(/beta list/);
    expect(isBetaListError("not_allowed")).toBe(true);
    expect(isBetaListError("github_denied")).toBe(false);
  });
});

describe("explainBillingError", () => {
  const err = (status: number, code: string) => new ApiError(status, code, "server text");

  it("offers the right next step for each code", () => {
    expect(explainBillingError(err(409, "already_subscribed")).next).toBe("portal");
    expect(explainBillingError(err(409, "subscription_needs_attention")).next).toBe("portal");
    expect(explainBillingError(err(409, "no_membership")).next).toBe("checkout");
    expect(explainBillingError(err(409, "no_stripe_customer")).next).toBe("signin");
    expect(explainBillingError(err(503, "billing_unavailable")).next).toBe("retry");
  });

  it("falls back to the server's message for an unknown code", () => {
    expect(explainBillingError(err(500, "weird")).message).toBe("server text");
  });

  it("explains a network failure", () => {
    expect(explainBillingError(new NetworkError()).message).toMatch(/Could not reach/);
    expect(explainError(new NetworkError())).toMatch(/Could not reach/);
  });
});

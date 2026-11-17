import { describe, expect, it, vi } from "vitest";
import { signInUrl, webBillingRequest } from "./api";
import { isSafeRoute, takeLoginError, toReturnTo } from "./returnTo";

describe("toReturnTo", () => {
  it("maps an in-app route to a path under the hash", () => {
    expect(toReturnTo("/")).toBe("/#/");
    expect(toReturnTo("/builds/abc")).toBe("/#/builds/abc");
    expect(toReturnTo("/membership?checkout=success")).toBe("/#/membership?checkout=success");
  });

  it("falls back to the overview for anything that is not an in-app route", () => {
    for (const bad of [null, undefined, "", "builds", "//evil.example", "https://evil.example", "/a\\b", "/a b", "/a\nb"]) {
      expect(toReturnTo(bad)).toBe("/#/");
    }
    expect(isSafeRoute("//evil.example")).toBe(false);
    expect(toReturnTo(`/builds/${"a".repeat(600)}`)).toBe("/#/");
  });

  it("always starts with a single slash and survives encoding into the sign-in URL", () => {
    const value = toReturnTo("/builds/abc?x=1");
    expect(value.startsWith("/")).toBe(true);
    expect(value.startsWith("//")).toBe(false);
    const url = new URL(signInUrl(value));
    expect(url.pathname).toBe("/auth/github/login");
    expect(url.searchParams.get("return_to")).toBe(value);
  });
});

describe("webBillingRequest", () => {
  it("marks billing calls with a query parameter and sends no body", () => {
    const { path, init } = webBillingRequest("/billing/checkout");
    expect(path).toBe("/billing/checkout?source=web");
    expect(init.method).toBe("POST");
    expect(init.body).toBeUndefined();
  });
});

describe("takeLoginError", () => {
  it("returns the code and strips it from the URL, keeping the rest", () => {
    const replace = vi.fn();
    const code = takeLoginError(
      { search: "?login_error=not_allowed&x=1", pathname: "/", hash: "#/builds" },
      replace,
    );
    expect(code).toBe("not_allowed");
    expect(replace).toHaveBeenCalledWith("/?x=1#/builds");
  });

  it("does nothing when there is no error", () => {
    const replace = vi.fn();
    expect(takeLoginError({ search: "", pathname: "/", hash: "" }, replace)).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });
});

// Plain-language explanations for the error codes the API returns.

import { ApiError, NetworkError } from "./api";

export interface Explained {
  message: string;
  /** What to offer next, if one action resolves it. */
  next?: "portal" | "checkout" | "signin" | "retry";
}

const LOGIN_ERRORS: Record<string, string> = {
  state_mismatch:
    "The sign-in took too long or was started in another tab. Sign in again.",
  github_denied: "GitHub sign-in was cancelled. Nothing was changed.",
  github_unavailable: "GitHub did not answer. Wait a moment and sign in again.",
  not_allowed: "This GitHub account isn't on the beta list yet.",
  not_configured:
    "Sign-in with GitHub isn't set up on the server yet. Use `mrg login` from the CLI for now.",
};

/** Message for `?login_error=<code>`; unknown codes get a generic line. */
export function explainLoginError(code: string): string {
  return LOGIN_ERRORS[code] ?? "Sign-in did not complete. Sign in again.";
}

/** True when the login error should point at the beta signup. */
export const isBetaListError = (code: string) => code === "not_allowed";

const BILLING_ERRORS: Record<string, Explained> = {
  already_subscribed: {
    message: "You already have an active membership.",
    next: "portal",
  },
  subscription_needs_attention: {
    message:
      "You already have a membership, but a payment did not go through. Update your payment method instead of subscribing again.",
    next: "portal",
  },
  no_membership: {
    message: "There is no membership to manage yet.",
    next: "checkout",
  },
  no_stripe_customer: {
    message:
      "This sign-in predates billing records. Sign out and sign in again, then retry.",
    next: "signin",
  },
  billing_unavailable: {
    message: "The billing provider could not be reached. Nothing was charged.",
    next: "retry",
  },
};

/** Explain a failed billing request; falls back to the server's own message. */
export function explainBillingError(err: unknown): Explained {
  if (err instanceof ApiError) {
    return BILLING_ERRORS[err.code] ?? { message: err.message, next: "retry" };
  }
  return { message: explainError(err), next: "retry" };
}

/** A one-line message for any failed request. */
export function explainError(err: unknown): string {
  if (err instanceof NetworkError) {
    return "Could not reach the Manhattan Reasoning API. Check your connection and try again.";
  }
  if (err instanceof ApiError) {
    if (err.status === 401) return "You are signed out. Sign in to continue.";
    if (err.status === 403) return "You don't have access to this.";
    if (err.status === 404) return "That doesn't exist, or it isn't yours.";
    return err.message;
  }
  return "Something went wrong. Try again.";
}

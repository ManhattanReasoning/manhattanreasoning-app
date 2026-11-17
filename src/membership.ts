// What a member's status means and what, if anything, they must do.
// Mirrors the SDK's `membership_action` so the CLI and the dashboard never
// disagree about whether the next build will be refused.

import type { Usage } from "./api";

export type MembershipAction = "subscribe" | "fix" | null;

/**
 * "subscribe" when a membership is required and there is none, "fix" when it
 * is blocked (cancelled, or a payment is failing), otherwise null. Always null
 * when the server is not enforcing billing (nothing is refused then) and for
 * servers that do not report membership.
 */
export function membershipAction(usage: Usage): MembershipAction {
  if (!usage.billing_enforced) return null;
  if (usage.billing_status === "blocked") return "fix";
  if (usage.billing_status === "none" && usage.subscription_required) {
    return "subscribe";
  }
  return null;
}

export type Tone = "good" | "warn" | "bad" | "plain";

export interface MembershipSummary {
  label: string;
  detail: string;
  tone: Tone;
}

/** The status line, or null when the server reports no membership at all. */
export function membershipSummary(usage: Usage): MembershipSummary | null {
  const status = usage.billing_status;
  if (status === undefined) return null;
  const action = membershipAction(usage);
  switch (status) {
    case "active":
      return { label: "Active", detail: "Your membership is in good standing.", tone: "good" };
    case "comp":
      return {
        label: "Active (complimentary)",
        detail: "This membership was granted to you; nothing is charged.",
        tone: "good",
      };
    case "blocked":
      return {
        label: "Not active",
        detail: action
          ? "New builds are refused until this is fixed. Update your payment method, or subscribe again if you cancelled."
          : "Your subscription ended or a payment failed. Builds are not being refused at the moment.",
        tone: action ? "bad" : "warn",
      };
    default:
      return action === "subscribe"
        ? {
            label: "None",
            detail: "A membership is required. New builds are refused until you subscribe.",
            tone: "bad",
          }
        : {
            label: "None",
            detail: "A membership is not required yet. You can build without one.",
            tone: "plain",
          };
  }
}

/** The warning shown ahead of a refused build; null when there is nothing to do. */
export function membershipWarning(usage: Usage): string | null {
  switch (membershipAction(usage)) {
    case "subscribe":
      return "You have no membership, so your next build will be refused.";
    case "fix":
      return "Your membership is not active, so your next build will be refused.";
    default:
      return null;
  }
}

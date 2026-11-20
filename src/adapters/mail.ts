import type { MailReceipt } from "@/data/types";

/**
 * The static demo has no mail provider. Callers still go through this
 * adapter so a future server can replace it without touching ride rules.
 */
export function sendMailStub(_to: string, _template: string): MailReceipt {
  return { delivered: false, channel: "stub", reason: "NO_MAIL_PROVIDER" };
}

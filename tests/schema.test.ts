import { describe, expect, it } from "vitest";
import { SCHEMA_SQL } from "@/db/schema";

describe("schema", () => {
  it("has no payment columns", () => {
    const forbidden = /\b(price|fare|currency|payment|cost_share|payout|wallet|amount_cents)\b/i;
    expect(SCHEMA_SQL).not.toMatch(forbidden);
  });
});

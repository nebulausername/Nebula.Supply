import { describe, expect, it } from "vitest";
import { formatLeadTime } from "../leadTime";

describe("formatLeadTime", () => {
  it("returns mapping for same_day", () => {
    expect(formatLeadTime("same_day").title).toBe("Versand heute");
  });

  it("falls back to default when lead time unknown", () => {
    expect(formatLeadTime("2_days").title).toBe("Lieferzeit 2 Tage");
  });
});

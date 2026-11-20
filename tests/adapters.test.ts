import { describe, expect, it } from "vitest";
import { requestOtpStub, verifyOtpStub } from "@/adapters/otp";
import { sendMailStub } from "@/adapters/mail";
import { filterPlaces } from "@/maps/places";
import { estimateRoute } from "@/maps/estimate";
import { usableMapsKey } from "@/maps/google-key";
import { parseHash } from "@/router";

describe("stubs", () => {
  it("does not send mail or SMS", () => {
    expect(sendMailStub("a@demo.local", "requestAccepted").delivered).toBe(false);
    const otp = requestOtpStub("+23057110004");
    expect(otp.delivered).toBe(false);
    expect(verifyOtpStub(otp.demoCode)).toBe(true);
    expect(verifyOtpStub("123456")).toBe(false);
  });

  it("searches the Mauritius catalogue and ignores placeholder map keys", () => {
    expect(filterPlaces("cure").some((place) => place.label === "Curepipe")).toBe(true);
    const estimate = estimateRoute(
      { lat: -20.1609, lng: 57.5012 },
      { lat: -20.3167, lng: 57.5263 },
    );
    expect(estimate.mode).toBe("mock-estimate");
    expect(estimate.distanceKm).toBeGreaterThan(10);
    expect(estimate.distanceKm).toBeLessThan(30);
    expect(usableMapsKey("")).toBeNull();
    expect(usableMapsKey("your-key-here")).toBeNull();
    expect(usableMapsKey("AIza-real-looking")).toBe("AIza-real-looking");
  });

  it("parses hash routes", () => {
    expect(parseHash("#/rides?seats=2").path).toBe("/rides");
    expect(parseHash("#/rides?seats=2").params.get("seats")).toBe("2");
    expect(parseHash("").path).toBe("/");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkLicense, clearLicenseCache, issueLicense, readLicense } from "@/lib/license";

const secret = "test-secret-not-used-anywhere";
const key = issueLicense("sub_1Abc234", secret);

beforeEach(() => clearLicenseCache());

describe("license keys", () => {
  it("round-trip the subscription id", () => {
    expect(key).toMatch(/^hny_[\w-]+\.[\w-]{32}$/);
    expect(readLicense(key, secret)).toBe("sub_1Abc234");
  });

  it("are rejected when signed with another secret, altered, or malformed", () => {
    expect(readLicense(key, "another-secret")).toBeNull();
    expect(readLicense(key.replace("hny_", "hny_x"), secret)).toBeNull();
    expect(readLicense(`${key}x`, secret)).toBeNull();
    expect(readLicense("hny_", secret)).toBeNull();
    expect(readLicense("sub_1Abc234", secret)).toBeNull();
    expect(readLicense(`hny_${"a".repeat(500)}.sig`, secret)).toBeNull();
  });

  it("cannot be forged by re-encoding another subscription id under an old signature", () => {
    const signature = key.split(".")[1];
    const forged = `hny_${Buffer.from("sub_someone_else").toString("base64url")}.${signature}`;
    expect(readLicense(forged, secret)).toBeNull();
  });
});

describe("checkLicense", () => {
  it("fails closed when the server has no signing secret", async () => {
    expect(await checkLicense(key, { secret: undefined })).toEqual({ ok: false, reason: "not_configured" });
  });

  it("tells a missing key from an invalid one", async () => {
    expect(await checkLicense(null, { secret })).toEqual({ ok: false, reason: "missing" });
    expect(await checkLicense("hny_nope.nope", { secret })).toEqual({ ok: false, reason: "invalid" });
  });

  it("never asks Stripe about a key that is not ours", async () => {
    const getStatus = vi.fn(async () => "active");
    await checkLicense("hny_nope.nope", { secret, getStatus });
    expect(getStatus).not.toHaveBeenCalled();
  });

  it("accepts active, trialing and past_due subscriptions and refuses canceled ones", async () => {
    for (const status of ["active", "trialing", "past_due"]) {
      clearLicenseCache();
      expect(await checkLicense(key, { secret, getStatus: async () => status })).toEqual({ ok: true, subscriptionId: "sub_1Abc234" });
    }
    for (const status of ["canceled", "unpaid", "incomplete_expired", "paused"]) {
      clearLicenseCache();
      expect(await checkLicense(key, { secret, getStatus: async () => status })).toEqual({ ok: false, reason: "inactive" });
    }
  });

  it("asks Stripe once per five minutes for the same subscription", async () => {
    const getStatus = vi.fn(async () => "active");
    let now = 1_000_000;
    const deps = { secret, getStatus, now: () => now };
    await checkLicense(key, deps);
    await checkLicense(key, deps);
    expect(getStatus).toHaveBeenCalledTimes(1);
    now += 5 * 60 * 1000 + 1;
    await checkLicense(key, deps);
    expect(getStatus).toHaveBeenCalledTimes(2);
  });

  it("notices a cancellation once the cache expires", async () => {
    let status = "active";
    let now = 1_000_000;
    const deps = { secret, getStatus: async () => status, now: () => now };
    expect((await checkLicense(key, deps)).ok).toBe(true);
    status = "canceled";
    now += 6 * 60 * 1000;
    expect(await checkLicense(key, deps)).toEqual({ ok: false, reason: "inactive" });
  });

  it("does not lock a paying customer out when Stripe is unreachable", async () => {
    const down = async () => {
      throw new Error("ECONNRESET");
    };
    expect((await checkLicense(key, { secret, getStatus: down })).ok).toBe(true);
  });

  it("still refuses a known-canceled subscription while Stripe is unreachable", async () => {
    let now = 1_000_000;
    await checkLicense(key, { secret, getStatus: async () => "canceled", now: () => now });
    now += 6 * 60 * 1000;
    const down = async () => {
      throw new Error("ECONNRESET");
    };
    expect(await checkLicense(key, { secret, getStatus: down, now: () => now })).toEqual({ ok: false, reason: "inactive" });
  });
});

import bcrypt from "bcryptjs";
import { describe, expect, it, vi } from "vitest";
import { DUMMY_HASH, hashPassword, verifyPassword } from "../src/auth/password";
import { hashToken, sessionCookieOptions } from "../src/auth/session";

describe("dummy hash for unknown emails", () => {
  // T-01-22 (AC-01-2): same cost as real hashes, so timing does not reveal unknown emails.
  it("is a valid bcrypt cost-12 hash", () => {
    expect(DUMMY_HASH).toMatch(/^\$2[aby]\$12\$[./A-Za-z0-9]{53}$/);
    expect(bcrypt.getRounds(DUMMY_HASH)).toBe(12);
  });

  it("is a literal, so loading the module does no hashing", async () => {
    const hashSync = vi.spyOn(bcrypt, "hashSync");
    const hash = vi.spyOn(bcrypt, "hash");
    try {
      vi.resetModules();
      await import("../src/auth/password");
      expect(hashSync).not.toHaveBeenCalled();
      expect(hash).not.toHaveBeenCalled();
    } finally {
      hashSync.mockRestore();
      hash.mockRestore();
    }
  });
});

describe("passwords", () => {
  // T-01-01
  it("stores a bcrypt hash that verifies only the right password", async () => {
    const hash = await hashPassword("secret-pass", 4);
    expect(hash).toMatch(/^\$2[aby]\$04\$/);
    expect(hash).not.toContain("secret-pass");
    expect(await verifyPassword("secret-pass", hash)).toBe(true);
    expect(await verifyPassword("other-pass", hash)).toBe(false);
  });

  it("uses cost 12 by default", async () => {
    expect(await hashPassword("secret-pass")).toMatch(/^\$2[aby]\$12\$/);
  });
});

describe("session tokens", () => {
  // T-01-02
  it("hashes a token to 64 hex characters, deterministically", () => {
    const token = "abc123-token";
    const hash = hashToken(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toBe(token);
    expect(hashToken(token)).toBe(hash);
    expect(hashToken("other")).not.toBe(hash);
  });
});

describe("session cookie options", () => {
  // T-01-03
  it("is HttpOnly, SameSite=Lax and lasts the session length", () => {
    const options = sessionCookieOptions("development", 8);
    expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/", maxAge: 8 * 3600 * 1000 });
    expect(options.secure).toBe(false);
  });

  it("is Secure only in production", () => {
    expect(sessionCookieOptions("production", 8).secure).toBe(true);
  });
});

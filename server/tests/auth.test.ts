import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../src/auth/password";
import { hashToken, sessionCookieOptions } from "../src/auth/session";

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

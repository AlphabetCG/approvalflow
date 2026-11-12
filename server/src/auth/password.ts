// F-01 passwords: bcrypt only, never stored or logged in plain text (NFR-02).
import bcrypt from "bcryptjs";

export async function hashPassword(plain: string, cost = 12): Promise<string> {
  return bcrypt.hash(plain, cost);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Compared against when the email is unknown, so a failed login takes about as
// long whether or not the account exists. A precomputed cost-12 hash (of a
// throwaway string), so starting the server does no hashing.
export const DUMMY_HASH = "$2b$12$gnwmLrBg9d.ggkJuRQk3y.v2vA/uDA53SUEcZSyMAeiBD91LnZLsi";

export async function verifyAgainstDummy(plain: string): Promise<void> {
  await bcrypt.compare(plain, DUMMY_HASH);
}

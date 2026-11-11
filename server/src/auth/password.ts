// F-01 passwords. STUB: real implementation follows the failing tests.
export async function hashPassword(plain: string, _cost = 12): Promise<string> {
  return plain;
}

export async function verifyPassword(_plain: string, _hash: string): Promise<boolean> {
  return false;
}

export async function verifyAgainstDummy(_plain: string): Promise<void> {}

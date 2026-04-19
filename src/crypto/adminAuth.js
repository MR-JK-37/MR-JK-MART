// ═══════════════════════════════════════════
// ADMIN AUTH — PBKDF2 (Web Crypto API)
// ═══════════════════════════════════════════

const ITERATIONS = 310000; // OWASP 2023 recommended
const HASH_ALGO = 'SHA-256';
const KEY_LENGTH = 256;

/**
 * Generate a random salt
 */
export function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Derive a key from a password using PBKDF2
 */
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: HASH_ALGO,
    },
    keyMaterial,
    KEY_LENGTH
  );

  return new Uint8Array(derivedBits);
}

/**
 * Hash a password for storage
 * Returns { salt: Uint8Array, hash: Uint8Array }
 */
export async function hashPassword(password) {
  const salt = generateSalt();
  const hash = await deriveKey(password, salt);
  return {
    salt: Array.from(salt),
    hash: Array.from(hash),
  };
}

/**
 * Verify a password against stored hash
 * Timing-safe comparison
 */
export async function verifyPassword(password, storedSalt, storedHash) {
  const salt = new Uint8Array(storedSalt);
  const hash = await deriveKey(password, salt);
  const storedHashArr = new Uint8Array(storedHash);

  // Timing-safe comparison — always compare all bytes
  if (hash.length !== storedHashArr.length) return false;
  
  let result = 0;
  for (let i = 0; i < hash.length; i++) {
    result |= hash[i] ^ storedHashArr[i];
  }
  return result === 0;
}

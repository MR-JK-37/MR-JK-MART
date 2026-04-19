// Admin authentication — key never stored in plaintext
// Raw key is hashed with PBKDF2 (600k iterations, SHA-256)
// Only the hash lives here — raw key cannot be recovered

// These values were pre-computed from the admin key
const STORED_SALT_HEX = 'a3f8c2e1b4d5e6f7a8b9c0d1e2f3a4b5';
const STORED_HASH_HEX = 'b7a812ca38cd2f433c1fd046b776006f8d35e6efb4f3c978ba563f1533ebcb99';

function hexToUint8(hex) {
  return new Uint8Array(
    hex.match(/.{1,2}/g).map(b => parseInt(b, 16))
  );
}

function bufToHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hashKey(keyStr) {
  const enc = new TextEncoder();
  const salt = hexToUint8(STORED_SALT_HEX);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(keyStr),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const hashBuf = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 600000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return bufToHex(hashBuf);
}

// Always returns false — no setup needed (key is hardcoded)
export async function hasAdminKey() {
  return true;
}

// Not needed — key is pre-set in code
export async function setupAdminKey() {
  return true;
}

// Verify entered key against stored hash
export async function verifyAdminKey(enteredKey) {
  try {
    // Rate limit check
    const lockout = localStorage.getItem('mrjk_lockout');
    if (lockout) {
      const remaining = parseInt(lockout) - Date.now();
      if (remaining > 0) {
        throw new Error(
          `Too many attempts. Wait ${Math.ceil(remaining/1000)}s`
        );
      } else {
        localStorage.removeItem('mrjk_lockout');
        localStorage.removeItem('mrjk_attempts');
      }
    }

    // Hash the entered key
    const enteredHash = await hashKey(enteredKey.trim());

    // Timing-safe string comparison
    const storedChars = STORED_HASH_HEX.split('');
    const enteredChars = enteredHash.split('');
    let diff = 0;
    for (let i = 0; i < storedChars.length; i++) {
      diff |= (storedChars[i].charCodeAt(0) ^ 
              (enteredChars[i]?.charCodeAt(0) || 0));
    }
    const isValid = diff === 0 && 
                    enteredHash.length === STORED_HASH_HEX.length;

    if (!isValid) {
      // Record failed attempt
      const attempts = parseInt(
        localStorage.getItem('mrjk_attempts') || '0'
      ) + 1;
      localStorage.setItem('mrjk_attempts', attempts);
      if (attempts >= 3) {
        localStorage.setItem('mrjk_lockout', Date.now() + 30000);
      }
      return false;
    }

    // Success — clear rate limit
    localStorage.removeItem('mrjk_attempts');
    localStorage.removeItem('mrjk_lockout');
    return true;

  } catch (err) {
    throw err;
  }
}

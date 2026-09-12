const ITERATIONS = 310_000;
const KEY_LENGTH = 256;
const SALT_LENGTH = 16;
const ALGORITHM = `pbkdf2-sha256-v1:${ITERATIONS}`;

const bytesToBase64 = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes));
const base64ToBytes = (value: string) =>
  Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

async function derive(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const saltBuffer = new Uint8Array(salt).buffer as ArrayBuffer;
  return new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: ITERATIONS,
        hash: 'SHA-256',
      },
      key,
      KEY_LENGTH,
    ),
  );
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const derived = await derive(password, salt);
  return `${ALGORITHM}$${bytesToBase64(salt)}$${bytesToBase64(derived)}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, saltValue, hashValue] = encoded.split('$');
  if (algorithm !== ALGORITHM || !saltValue || !hashValue) return false;
  const expected = base64ToBytes(hashValue);
  const actual = await derive(password, base64ToBytes(saltValue));
  if (expected.length !== actual.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1)
    difference |= expected[index] ^ actual[index];
  return difference === 0;
}

export const passwordAlgorithm = ALGORITHM;

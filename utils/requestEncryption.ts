/**
 * AES-256-GCM encryption for request payloads sent to Express backend.
 *
 * Uses the browser's Web Crypto API when available (HTTPS or localhost).
 * Falls back to a server-side encryption route (/api/encrypt) on non-secure
 * contexts like http://10.1.1.181 where crypto.subtle is unavailable.
 */

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check if Web Crypto API (crypto.subtle) is available.
 */
function isWebCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined';
}

/**
 * Client-side encryption using Web Crypto API.
 */
async function encryptClientSide(data: any): Promise<string> {
  const key = process.env.NEXT_PUBLIC_RESPONSE_ENCRYPTION_KEY;
  if (!key) throw new Error('Encryption key not available');

  const plaintext = JSON.stringify(data);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const keyBuffer = hexToUint8Array(key);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    new TextEncoder().encode(plaintext)
  );

  // Web Crypto API appends authTag (16 bytes) to the end of ciphertext
  const encryptedBytes = new Uint8Array(encrypted);
  const ciphertext = encryptedBytes.slice(0, encryptedBytes.length - 16);
  const authTag = encryptedBytes.slice(encryptedBytes.length - 16);

  return `${uint8ArrayToHex(iv)}:${uint8ArrayToHex(authTag)}:${uint8ArrayToHex(ciphertext)}`;
}

/**
 * Server-side encryption fallback via Next.js API route.
 * Used when crypto.subtle is unavailable (non-HTTPS, non-localhost).
 */
async function encryptServerSide(data: any): Promise<string> {
  const response = await fetch('/api/encrypt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Server-side encryption failed');
  }

  return result.encrypted;
}

/**
 * Encrypt a request payload object.
 * Automatically selects client-side or server-side encryption.
 *
 * @param data - The request body object to encrypt
 * @returns Encrypted string in format: "iv:authTag:ciphertext" (hex-encoded)
 */
export async function encryptPayload(data: any): Promise<string> {
  if (isWebCryptoAvailable()) {
    return encryptClientSide(data);
  }
  // Fallback: encrypt on the server when crypto.subtle is not available
  return encryptServerSide(data);
}

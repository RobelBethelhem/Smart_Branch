/**
 * AES-256-GCM decryption for encrypted API responses.
 *
 * HTTPS / localhost → decrypts in browser via Web Crypto API (crypto.subtle)
 * HTTP + server IP  → falls back to server-side route (/api/decrypt)
 *                     which returns Base64-encoded data (NOT plaintext)
 *                     so the Network tab never shows sensitive data.
 */

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Check if Web Crypto API (crypto.subtle) is available.
 * It requires a "secure context": https:// or http://localhost.
 * On http://<ip-address>, crypto.subtle is undefined.
 */
function isWebCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined';
}

/**
 * Client-side decryption using Web Crypto API.
 */
async function decryptClientSide(encryptedPayload: string): Promise<any> {
  const key = process.env.NEXT_PUBLIC_RESPONSE_ENCRYPTION_KEY;
  if (!key) throw new Error('Response decryption key not available');

  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted response format');

  const [ivHex, authTagHex, ciphertextHex] = parts;

  const iv = hexToUint8Array(ivHex);
  const authTag = hexToUint8Array(authTagHex);
  const ciphertext = hexToUint8Array(ciphertextHex);

  // Web Crypto API expects authTag appended to ciphertext
  const combined = new Uint8Array(ciphertext.length + authTag.length);
  combined.set(ciphertext, 0);
  combined.set(authTag, ciphertext.length);

  const keyBuffer = hexToUint8Array(key);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    combined
  );

  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(decrypted));
}

/**
 * Server-side decryption fallback via /api/decrypt.
 * Returns Base64-encoded data — decoded only in JS memory.
 * Network tab shows:  { d: "eyJDVVNUX0FD..." }  ← not readable
 */
async function decryptServerSide(encryptedPayload: string): Promise<any> {
  const response = await fetch('/api/decrypt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ encrypted: encryptedPayload }),
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Server-side decryption failed');
  }

  // Decode Base64 in memory — plaintext never appears in Network tab
  return JSON.parse(atob(result.d));
}

/**
 * Decrypt an encrypted response payload.
 * Automatically selects client-side or server-side decryption.
 *
 * @param encryptedPayload - Format: "iv:authTag:ciphertext" (hex-encoded)
 * @returns Parsed JSON object
 */
export async function decryptResponse(encryptedPayload: string): Promise<any> {
  if (isWebCryptoAvailable()) {
    return decryptClientSide(encryptedPayload);
  }
  return decryptServerSide(encryptedPayload);
}

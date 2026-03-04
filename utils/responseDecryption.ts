/**
 * Client-side AES-256-GCM decryption using Web Crypto API.
 * Decrypts encrypted API responses from Next.js server routes.
 */

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Decrypt an encrypted response payload.
 * @param encryptedPayload - Format: "iv:authTag:ciphertext" (hex-encoded)
 * @returns Parsed JSON object
 */
export async function decryptResponse(encryptedPayload: string): Promise<any> {
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

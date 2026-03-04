/**
 * Client-side AES-256-GCM encryption using Web Crypto API.
 * Encrypts request payloads before sending to Express backend.
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
 * Encrypt a request payload object.
 * @param data - The request body object to encrypt
 * @returns Encrypted string in format: "iv:authTag:ciphertext" (hex-encoded)
 */
export async function encryptPayload(data: any): Promise<string> {
  const key = process.env.NEXT_PUBLIC_RESPONSE_ENCRYPTION_KEY;
  if (!key) throw new Error('Encryption key not available');

  console.log(`[RequestEncrypt] Key fingerprint: ${key.substring(0, 8)}... (length: ${key.length})`);

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

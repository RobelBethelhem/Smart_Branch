import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getResponseKey(): Buffer {
  const key = process.env.RESPONSE_ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error('RESPONSE_ENCRYPTION_KEY must be a 64-char hex string');
  }
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt an entire JSON response object.
 * Returns a string in format: iv:authTag:ciphertext (all hex)
 */
export function encryptResponse(data: any): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getResponseKey(), iv);
  const plaintext = JSON.stringify(data);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

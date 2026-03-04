import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getKey(): Buffer {
  const key = process.env.ACCOUNT_ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error('ACCOUNT_ENCRYPTION_KEY must be set as a 64-char hex string');
  }
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt a 16-digit account number into an opaque token.
 * Token format: iv:authTag:ciphertext (hex-encoded)
 * Embeds a timestamp for TTL enforcement on decryption.
 */
export function encryptAccountNumber(accountNumber: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const plaintext = `${accountNumber}|${Date.now()}`;
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt an opaque token back to a 16-digit account number.
 * Validates TTL and account number format.
 * Throws on invalid/expired/tampered tokens.
 */
export function decryptAccountToken(token: string): string {
  const parts = token.split(':');
  if (parts.length !== 3) throw new Error('Invalid token format');

  const [ivHex, authTagHex, ciphertextHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  const decrypted = decipher.update(ciphertext) + decipher.final('utf8');

  const [accountNumber, timestampStr] = decrypted.split('|');
  const timestamp = parseInt(timestampStr, 10);

  if (Date.now() - timestamp > TOKEN_TTL_MS) {
    throw new Error('Token expired');
  }
  if (!/^\d{16}$/.test(accountNumber)) {
    throw new Error('Invalid decrypted account number');
  }

  return accountNumber;
}

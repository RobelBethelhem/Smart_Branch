import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

// Cache the key once loaded
let _cachedKey: Buffer | null = null;

function getResponseKey(): Buffer {
  if (_cachedKey) return _cachedKey;

  let key = process.env.RESPONSE_ENCRYPTION_KEY;

  // Fallback: read directly from .env.local if process.env doesn't have it
  if (!key) {
    try {
      const envPath = path.resolve(process.cwd(), '.env.local');
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const match = envContent.match(/^RESPONSE_ENCRYPTION_KEY=(.+)$/m);
      if (match) {
        key = match[1].trim();
        console.log('RESPONSE_ENCRYPTION_KEY loaded from .env.local file directly');
      }
    } catch (e) {
      // ignore file read errors
    }
  }

  if (!key || key.length !== 64) {
    throw new Error(`RESPONSE_ENCRYPTION_KEY must be a 64-char hex string (got: ${key ? `length=${key.length}` : 'undefined'})`);
  }

  _cachedKey = Buffer.from(key, 'hex');
  return _cachedKey;
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

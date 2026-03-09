import { NextResponse } from 'next/server';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

/**
 * Server-side encryption fallback for non-HTTPS environments.
 *
 * When the app runs on http://10.1.1.181 (not localhost, not HTTPS),
 * the browser's crypto.subtle API is unavailable (requires secure context).
 * This route encrypts on the Next.js server side instead.
 */
export async function POST(request: Request) {
  try {
    const { data } = await request.json();

    if (!data) {
      return NextResponse.json({ success: false, message: 'Missing data payload' }, { status: 400 });
    }

    const key = process.env.RESPONSE_ENCRYPTION_KEY;
    if (!key || key.length !== 64) {
      return NextResponse.json({ success: false, message: 'Encryption key not configured' }, { status: 500 });
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key, 'hex'), iv);
    const plaintext = JSON.stringify(data);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const result = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;

    return NextResponse.json({ success: true, encrypted: result });
  } catch (error) {
    console.error('Server-side encryption error:', error);
    return NextResponse.json({ success: false, message: 'Encryption failed' }, { status: 500 });
  }
}

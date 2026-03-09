import { NextResponse } from 'next/server';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

/**
 * Server-side encryption fallback for non-HTTPS environments.
 *
 * SECURITY: Receives Base64-encoded data (NOT plaintext JSON).
 * The Network tab shows only encoded gibberish in both directions.
 *
 * Flow:
 *   Request:  { d: "eyJhY2NvdW50Li4u..." }              ← Base64 gibberish
 *   Response: { success: true, encrypted: "iv:tag:ct" }   ← hex gibberish
 *   Browser:  sends encrypted hex to Express backend
 */
export async function POST(request: Request) {
  try {
    const { d } = await request.json();

    if (!d || typeof d !== 'string') {
      return NextResponse.json({ success: false, message: 'Missing data payload' }, { status: 400 });
    }

    const key = process.env.RESPONSE_ENCRYPTION_KEY;
    if (!key || key.length !== 64) {
      return NextResponse.json({ success: false, message: 'Encryption key not configured' }, { status: 500 });
    }

    // Decode Base64 to get the plaintext JSON
    const plaintext = Buffer.from(d, 'base64').toString('utf8');

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key, 'hex'), iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const result = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;

    return NextResponse.json({ success: true, encrypted: result });
  } catch (error) {
    console.error('Server-side encryption error:', error);
    return NextResponse.json({ success: false, message: 'Encryption failed' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

/**
 * Server-side decryption fallback for non-HTTPS environments.
 *
 * SECURITY: Returns Base64-encoded data (NOT plaintext JSON).
 * The Network tab shows only encoded gibberish — sensitive account
 * data is decoded only in browser JS memory.
 *
 * Flow:
 *   Request:  { encrypted: "iv:authTag:ciphertext" }   ← hex gibberish
 *   Response: { success: true, d: "eyJDVVNUX0FD..." }  ← Base64 gibberish
 *   Browser:  JSON.parse(atob(d))                       ← decoded in memory only
 */
export async function POST(request: Request) {
  try {
    const { encrypted } = await request.json();

    if (!encrypted || typeof encrypted !== 'string') {
      return NextResponse.json({ success: false, message: 'Missing encrypted payload' }, { status: 400 });
    }

    const key = process.env.RESPONSE_ENCRYPTION_KEY;
    if (!key || key.length !== 64) {
      return NextResponse.json({ success: false, message: 'Decryption key not configured' }, { status: 500 });
    }

    const parts = encrypted.split(':');
    if (parts.length !== 3) {
      return NextResponse.json({ success: false, message: 'Invalid encrypted format' }, { status: 400 });
    }

    const [ivHex, authTagHex, ciphertextHex] = parts;

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(key, 'hex'),
      Buffer.from(ivHex, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(ciphertextHex, 'hex')),
      decipher.final()
    ]);

    // Return as Base64 — NOT plaintext JSON — so Network tab stays unreadable
    const base64Data = decrypted.toString('base64');

    return NextResponse.json({ success: true, d: base64Data });
  } catch (error) {
    console.error('Server-side decryption error:', error);
    return NextResponse.json({ success: false, message: 'Decryption failed' }, { status: 500 });
  }
}

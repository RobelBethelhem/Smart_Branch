import { NextResponse } from 'next/server';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

/**
 * Server-side decryption fallback for non-HTTPS environments.
 *
 * When the app runs on http://10.1.1.181 (not localhost, not HTTPS),
 * the browser's crypto.subtle API is unavailable (requires secure context).
 * This route decrypts on the Next.js server side instead.
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

    const data = JSON.parse(decrypted.toString('utf8'));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Server-side decryption error:', error);
    return NextResponse.json({ success: false, message: 'Decryption failed' }, { status: 500 });
  }
}

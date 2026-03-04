import { NextResponse } from 'next/server';
import { decryptAccountToken } from '@/lib/accountEncryption';

const BACKEND_URL = process.env.EXPRESS_BACKEND_URL || 'http://10.1.1.181:5000';

function extractCIF(accountNumber: string): string {
  // CIF is 7 digits: remove last 3, take last 7
  const withoutLast3 = accountNumber.slice(0, -3);
  return withoutLast3.slice(-7);
}

export async function POST(request: Request) {
  try {
    const { encryptedToken, fingerprint_template } = await request.json();

    if (!fingerprint_template) {
      return NextResponse.json(
        { error: true, message: 'Fingerprint template is required' },
        { status: 400 }
      );
    }

    // Derive CIF from encrypted token if provided
    let cif: string | undefined;
    if (encryptedToken) {
      try {
        const accountNumber = decryptAccountToken(encryptedToken);
        cif = extractCIF(accountNumber);
      } catch (err) {
        return NextResponse.json(
          { error: true, message: 'Invalid or expired account token' },
          { status: 400 }
        );
      }
    }

    // Forward to Express backend (server-to-server)
    const requestBody: { fingerprint_template: string; cif?: string } = { fingerprint_template };
    if (cif) requestBody.cif = cif;

    const response = await fetch(`${BACKEND_URL}/api/zsmart_branch_requests/biometric/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error('Biometric proxy error:', error);
    return NextResponse.json(
      { error: true, message: 'Biometric authentication failed' },
      { status: 500 }
    );
  }
}

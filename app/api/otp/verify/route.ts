import { NextResponse } from 'next/server';
import { decryptAccountToken } from '@/lib/accountEncryption';

const BACKEND_URL = process.env.EXPRESS_BACKEND_URL || 'http://10.1.1.181:5000';

export async function POST(request: Request) {
  try {
    const { encryptedToken, otp_code } = await request.json();

    if (!encryptedToken || !otp_code) {
      return NextResponse.json(
        { error: true, message: 'Account token and OTP code are required' },
        { status: 400 }
      );
    }

    let accountNumber: string;
    try {
      accountNumber = decryptAccountToken(encryptedToken);
    } catch (err) {
      return NextResponse.json(
        { error: true, message: 'Invalid or expired account token. Please search again.' },
        { status: 400 }
      );
    }

    // Forward to Express backend with plaintext account number (server-to-server)
    const response = await fetch(`${BACKEND_URL}/api/zsmart_branch_requests/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_number: accountNumber, otp_code }),
    });

    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error('OTP verify proxy error:', error);
    return NextResponse.json(
      { error: true, message: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}

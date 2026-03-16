import { NextResponse } from 'next/server';
import { executeQuery } from "@/lib/db";
import { AccountData } from "@/types/account";
import oracledb from 'oracledb';
import { encryptResponse } from '@/lib/responseEncryption';

const BACKEND_URL = process.env.EXPRESS_BACKEND_URL || 'http://localhost:5000';

/**
 * POST /api/account/verify-session
 *
 * Validates a session token with Express backend, then fetches
 * full account data from Oracle. The account number comes from
 * the SERVER-SIDE session (not the client), preventing OTP bypass.
 *
 * Session is CIF-based: one session covers all accounts under the same CIF.
 * If accountNumber is provided, verifies it belongs to the session's CIF.
 */
export async function POST(request: Request) {
  try {
    const { sessionToken, accountNumber } = await request.json();

    if (!sessionToken) {
      return NextResponse.json({
        success: false,
        message: 'Session token is required'
      }, { status: 400 });
    }

    // Validate session with Express backend
    const sessionRes = await fetch(`${BACKEND_URL}/api/zsmart_branch_requests/validate-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken, accountNumber }),
    });

    const sessionResult = await sessionRes.json();

    if (!sessionRes.ok || sessionResult.error) {
      return NextResponse.json({
        success: false,
        message: sessionResult.message || 'Session validation failed'
      }, { status: sessionRes.status });
    }

    // Decrypt the server-provided encrypted token to get the account number
    const { encryptedToken, cif } = sessionResult.data;

    const decryptRes = await fetch(`${BACKEND_URL}/api/zsmart_branch_requests/decrypt-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ encryptedToken }),
    });

    const decryptResult = await decryptRes.json();

    if (decryptResult.error || !decryptResult.accountNumber) {
      return NextResponse.json({
        success: false,
        message: 'Failed to resolve account from session'
      }, { status: 500 });
    }

    const verifiedAccountNumber = decryptResult.accountNumber;

    // Query Oracle for full account data using the server-verified account number
    const query = `
      SELECT * FROM (
        SELECT
          CA.BRANCH_CODE,
          CA.CUST_AC_NO AS CUST_AC_NO,
          CA.AC_DESC AS ACC_DESC,
          CA.AC_STAT_NO_DR AS NO_DEBIT,
          CA.AC_STAT_NO_CR AS NO_CREDIT,
          CA.AC_STAT_DORMANT AS DORMANT,
          CA.CUST_NO,
          CA.ACCOUNT_CLASS,
          CA.CCY AS CCY,
          AB.ACY_WITHDRAWABLE_BAL AS CURRENT_BALANCE,
          AB.ACY_WITHDRAWABLE_BAL AS AVAILABLE_BALANCE,
          AB.ACY_BLOCKED_AMT AS BLOCKED_AMOUNT,
          CI.IMAGE_TEXT AS PROFILE_IMAGE,
          SI.SIG_TEXT AS SIGN_IMAGE
        FROM fcubsprd.STTM_CUST_ACCOUNT CA
        JOIN fcubsprd.STTM_ACCOUNT_BALANCE AB ON CA.CUST_AC_NO = AB.CUST_AC_NO
        LEFT JOIN fcubsprd.STTM_CUST_IMAGE CI ON CA.CUST_NO = CI.CUSTOMER_NO
        LEFT JOIN fcubsprd.svtm_cif_sig_det SI ON CA.CUST_NO = SI.CIF_ID
        WHERE CA.CUST_AC_NO = :1
      ) WHERE ROWNUM = 1`;

    const result = await executeQuery(query, [verifiedAccountNumber], {
      fetchInfo: {
        PROFILE_IMAGE: { type: oracledb.STRING },
        SIGN_IMAGE: { type: oracledb.STRING }
      }
    });

    if (!result.success || !result.data || result.data.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Account not found'
      }, { status: 404 });
    }

    const rawData = result.data[0] as any;
    const accountData: AccountData = {
      BRANCH_CODE: rawData.BRANCH_CODE,
      CUST_AC_NO: rawData.CUST_AC_NO,
      ACC_DESC: rawData.ACC_DESC,
      NO_DEBIT: rawData.NO_DEBIT,
      NO_CREDIT: rawData.NO_CREDIT,
      DORMANT: rawData.DORMANT,
      CUST_NO: rawData.CUST_NO,
      ACCOUNT_CLASS: rawData.ACCOUNT_CLASS,
      CCY: rawData.CCY,
      CURRENT_BALANCE: Number(rawData.CURRENT_BALANCE),
      AVAILABLE_BALANCE: Number(rawData.AVAILABLE_BALANCE),
      BLOCKED_AMOUNT: Number(rawData.BLOCKED_AMOUNT),
      PROFILE_IMAGE: rawData.PROFILE_IMAGE ? `data:image/jpeg;base64,${rawData.PROFILE_IMAGE}` : null,
      SIGN_IMAGE: rawData.SIGN_IMAGE
    };

    const encrypted = encryptResponse(accountData);
    return NextResponse.json({
      success: true,
      encrypted,
      sessionToken, // Pass back so frontend can store it
      cif
    });

  } catch (error) {
    console.error('Verify-session error:', error);
    return NextResponse.json({
      success: false,
      message: `Session verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { executeQuery } from "@/lib/db";
import { encryptResponse } from '@/lib/responseEncryption';

export async function POST(req: Request) {
  try {
    const { custNo } = await req.json();

    const query = `
      SELECT 
        CA.CCY,
        CA.CUST_AC_NO,
        CA.AC_DESC as ACC_DESC,
        AB.ACY_WITHDRAWABLE_BAL as AVAILABLE_BALANCE
      FROM fcubsprd.STTM_CUST_ACCOUNT CA
      JOIN fcubsprd.STTM_ACCOUNT_BALANCE AB 
        ON CA.CUST_AC_NO = AB.CUST_AC_NO
      WHERE CA.CUST_NO = :1
      ORDER BY CA.CUST_AC_NO
    `;

    const result = await executeQuery(query, [custNo]);

    if (result.success && result.data) {
      const accounts = result.data.map((row: any) => ({
        CCY: row.CCY,
        CUST_AC_NO: row.CUST_AC_NO,
        ACC_DESC: row.ACC_DESC,
        AVAILABLE_BALANCE: Number(row.AVAILABLE_BALANCE)
      }));

      return NextResponse.json({
        success: true,
        encrypted: encryptResponse(accounts)
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No accounts found'
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Error fetching user accounts:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch user accounts',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
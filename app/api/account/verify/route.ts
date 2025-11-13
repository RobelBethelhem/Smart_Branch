import { NextResponse } from 'next/server';
import { executeQuery } from "@/lib/db";
import { AccountData } from "@/types/account";
import oracledb from 'oracledb';

// Define the DatabaseRow interface
interface DatabaseRow {
  BRANCH_CODE: string;
  CUST_AC_NO: string;
  ACC_DESC: string;
  NO_DEBIT: string;
  NO_CREDIT: string;
  DORMANT: string | null;
  CUST_NO: string;
  ACCOUNT_CLASS: string;
  CCY: string;
  CURRENT_BALANCE: number;
  AVAILABLE_BALANCE: number;
  BLOCKED_AMOUNT: number;
  PROFILE_IMAGE: string | null;
  SIGN_IMAGE: string | null;
}

export async function POST(request: Request) {
  try {
   
    const { accountNumber , searchName, firstName, phoneNumber} = await request.json();

    let query;
    let params;

    if (accountNumber) {
      // Existing account number query
      query = `
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
      params = [accountNumber.toString().trim()];
    }
    else if (searchName) {
      // Modified name search query to handle full names
      query = `
        SELECT 
          CA.BRANCH_CODE,
          CA.CUST_AC_NO,
          CA.AC_DESC,
          CA.CCY,
          CP.FIRST_NAME,
          CP.MIDDLE_NAME,
          CP.LAST_NAME
        FROM fcubsprd.STTM_CUST_ACCOUNT CA
        JOIN fcubsprd.sttm_cust_personal CP ON CA.CUST_NO = CP.CUSTOMER_NO
        WHERE 
          REGEXP_LIKE(CA.AC_DESC, :1, 'i')
          AND LENGTH(REGEXP_REPLACE(CA.AC_DESC, '[^[:space:]]+', '')) >= 2  -- Ensure at least 3 words
        ORDER BY 
          CASE 
            WHEN UPPER(CA.AC_DESC) = UPPER(:2) THEN 1
            WHEN UPPER(CA.AC_DESC) LIKE UPPER(:3) THEN 2
            ELSE 3
          END`;
      params = [
        searchName.trim().replace(/\s+/g, '.*'),
        searchName.trim(),
        `%${searchName.trim()}%`
      ];
    }
    
    else if (firstName && phoneNumber) {
      // New phone & name search query
      query = `
        SELECT 
          CP.FIRST_NAME,
          CA.CUST_AC_NO,
          CA.AC_DESC,
          CA.CCY
        FROM 
          FCUBSPRD.sttm_cust_personal CP
        JOIN 
          FCUBSPRD.STTM_CUST_ACCOUNT CA ON CP.CUSTOMER_NO = CA.CUST_NO
        WHERE 
          TRIM(UPPER(CP.FIRST_NAME)) = TRIM(UPPER(:1))
          AND CP.MOBILE_NUMBER = :2`;
      params = [firstName.trim(), phoneNumber.trim()];
    } 
    
    else {
      return NextResponse.json({
        success: false,
        message: 'Please provide either account number or name'
      }, { status: 400 });
    }

    const result = await executeQuery(
      query, 
      params,
      {
        fetchInfo: {
          PROFILE_IMAGE: { type: oracledb.STRING },
          SIGN_IMAGE: { type: oracledb.STRING }
        }
      }
    );

     if (result.success && result.data && result.data.length > 0) {
      if (searchName || (firstName && phoneNumber)) {
        const accounts = result.data.map((row: any) => ({
          CUST_AC_NO: row.CUST_AC_NO,
          ACC_DESC: row.ACC_DESC,
          CCY: row.CCY,
          FIRST_NAME: row.FIRST_NAME
        }));

        // For phone & name search, verify first name match
        if (firstName && phoneNumber) {
          const matchingFirstName = accounts[0].FIRST_NAME.trim().toLowerCase() === firstName.trim().toLowerCase();
          if (!matchingFirstName) {
            return NextResponse.json({
              success: false,
              message: 'First name does not match our records'
            }, { status: 400 });
          }
        }

        return NextResponse.json({
          success: true,
          data: accounts,
          isNameSearch: true
        });
      }

      // If searching by account number, return full account details
      const rawData = result.data[0] as DatabaseRow;
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

      return NextResponse.json({
        success: true,
        data: accountData
      });
    } else {
      return NextResponse.json({
        success: false,
        message: searchName ? 'No accounts found with that name' : 'Account not found'
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Account verification error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to verify account',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
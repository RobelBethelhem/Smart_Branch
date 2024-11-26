// import { NextResponse } from 'next/server';
// import { executeQuery } from "@/lib/db";
// import { AccountData } from "@/types/account";
// import oracledb from 'oracledb';

// // Define the DatabaseRow interface
// interface DatabaseRow {
//   BRANCH_CODE: string;
//   CUST_AC_NO: string;
//   ACC_DESC: string;
//   NO_DEBIT: string;
//   NO_CREDIT: string;
//   DORMANT: string | null;
//   CUST_NO: string;
//   ACCOUNT_CLASS: string;
//   CCY: string;
//   CURRENT_BALANCE: number;
//   AVAILABLE_BALANCE: number;
//   BLOCKED_AMOUNT: number;
//   PROFILE_IMAGE: string | null;
//   SIGN_IMAGE: string | null;
// }

// export async function POST(request: Request) {
//     try {
//       const { accountNumber } = await request.json();

//       // const query = `
//       // SELECT * FROM (
//       //   SELECT 
//       //     CA.BRANCH_CODE,
//       //     CA.CUST_AC_NO AS CUST_AC_NO,
//       //     CA.AC_DESC AS ACC_DESC,
//       //     CA.AC_STAT_NO_DR AS NO_DEBIT,
//       //     CA.AC_STAT_NO_CR AS NO_CREDIT,
//       //     CA.AC_STAT_DORMANT AS DORMANT,
//       //     CA.CUST_NO,
//       //     CA.ACCOUNT_CLASS,
//       //     CA.CCY AS CCY,
//       //     AB.ACY_WITHDRAWABLE_BAL AS CURRENT_BALANCE,
//       //     AB.ACY_WITHDRAWABLE_BAL AS AVAILABLE_BALANCE,
//       //     AB.ACY_BLOCKED_AMT AS BLOCKED_AMOUNT,
//       //     CI.IMAGE_TEXT AS PROFILE_IMAGE,
//       //     SI.SIG_TEXT AS SIGN_IMAGE
//       //   FROM STTM_CUST_ACCOUNT CA
//       //   JOIN STTM_ACCOUNT_BALANCE AB ON CA.CUST_AC_NO = AB.CUST_AC_NO
//       //   LEFT JOIN FCUBSPRD.STTM_CUST_IMAGE CI ON CA.CUST_NO = CI.CUSTOMER_NO
//       //   LEFT JOIN FCUBSPRD.svtm_cif_sig_det SI ON CA.CUST_NO = SI.CIF_ID
//       //   WHERE CA.CUST_AC_NO = :1
//       // ) WHERE ROWNUM = 1`;
      
//       const query = `
//         SELECT * FROM (
//           SELECT 
//             CA.BRANCH_CODE,
//             CA.CUST_AC_NO AS CUST_AC_NO,
//             CA.AC_DESC AS ACC_DESC,
//             CA.AC_STAT_NO_DR AS NO_DEBIT,
//             CA.AC_STAT_NO_CR AS NO_CREDIT,
//             CA.AC_STAT_DORMANT AS DORMANT,
//             CA.CUST_NO,
//             CA.ACCOUNT_CLASS,
//             CA.CCY AS CCY,
//             AB.ACY_WITHDRAWABLE_BAL AS CURRENT_BALANCE,
//             AB.ACY_WITHDRAWABLE_BAL AS AVAILABLE_BALANCE,
//             AB.ACY_BLOCKED_AMT AS BLOCKED_AMOUNT,
//             CI.IMAGE_TEXT AS PROFILE_IMAGE,
//             SI.SIG_TEXT AS SIGN_IMAGE
//           FROM fcubsprd.STTM_CUST_ACCOUNT CA
//           JOIN fcubsprd.STTM_ACCOUNT_BALANCE AB ON CA.CUST_AC_NO = AB.CUST_AC_NO
//           LEFT JOIN fcubsprd.STTM_CUST_IMAGE CI ON CA.CUST_NO = CI.CUSTOMER_NO
//           LEFT JOIN fcubsprd.svtm_cif_sig_det SI ON CA.CUST_NO = SI.CIF_ID
//           WHERE CA.CUST_AC_NO = :1
//         ) WHERE ROWNUM = 1`;
  
//       const result = await executeQuery(query, [accountNumber], {
//         fetchInfo: {
//           PROFILE_IMAGE: { type: oracledb.STRING },
//           SIGN_IMAGE: { type: oracledb.STRING }
//         }
//       });
  
//       if (result.success && result.data && result.data.length > 0) {
//         const rawData = result.data[0] as DatabaseRow;
        
//         const accountData: AccountData = {
//           BRANCH_CODE: rawData.BRANCH_CODE,
//           CUST_AC_NO: rawData.CUST_AC_NO,
//           ACC_DESC: rawData.ACC_DESC,
//           NO_DEBIT: rawData.NO_DEBIT,
//           NO_CREDIT: rawData.NO_CREDIT,
//           DORMANT: rawData.DORMANT,
//           CUST_NO: rawData.CUST_NO,
//           ACCOUNT_CLASS: rawData.ACCOUNT_CLASS,
//           CCY: rawData.CCY,
//           CURRENT_BALANCE: Number(rawData.CURRENT_BALANCE),
//           AVAILABLE_BALANCE: Number(rawData.AVAILABLE_BALANCE),
//           BLOCKED_AMOUNT: Number(rawData.BLOCKED_AMOUNT),
//           PROFILE_IMAGE: rawData.PROFILE_IMAGE,
//           SIGN_IMAGE: rawData.SIGN_IMAGE
//         };
  
//         return NextResponse.json({
//           success: true,
//           data: accountData
//         });
//       } else {
//         return NextResponse.json({
//           success: false,
//           message: 'Account not found'
//         }, { status: 404 });
//       }
      
//     } catch (error) {
//       console.error('Account verification error:', error);
//       return NextResponse.json({
//         success: false,
//         message: 'Failed to verify account',
//         error: error instanceof Error ? error.message : 'Unknown error'
//       }, { status: 500 });
//     }
// }
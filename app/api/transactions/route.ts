import { NextRequest, NextResponse } from 'next/server';
import oracledb, { Connection, ExecuteOptions, NUMBER, DATE, Result } from 'oracledb';
import { dbConfig } from '@/lib/dbConfig';
import { executeQuery } from '@/lib/db';
import { encryptResponse } from '@/lib/responseEncryption';
const BACKEND_URL = process.env.EXPRESS_BACKEND_URL || 'http://localhost:5000';

interface TransactionRow {
  TRN_REF_NO: string;
  TRN_DT: Date;
  VALUE_DT: Date;
  DRCR_IND: string;
  FCY_AMOUNT: number;
  LCY_AMOUNT: number;
  AC_CCY: string;
  TRN_CODE: string;
  RELATED_ACCOUNT: string;
  RELATED_REFERENCE: string;
  TOTAL_COUNT: number;
  TRN_CODE_DESC?: string;
}

const TRN_CODE_DESCRIPTIONS: { [key: string]: string } = {
  AAF: "Account Annual Fee",
  ADE: "Account Debit Entry",
  ADJ: "Adjustment",
  AIP: "Account Interest Payment",
  AMG: "Account Management Fee",
  AVL: "Available Balance Update",
  BCA: "Bank Cash Advance",
  BCB: "Bank Cash Back",
  BCC: "Bank Credit Card Transaction",
  BCL: "Bank Credit Line",
  BGA: "Bank Guarantee Application",
  BLC: "Bank Letter of Credit",
  BPR: "Bank Payment Receipt",
  BUC: "Bulk Credit",
  CDD: "Certificate of Deposit Debit",
  CDI: "Credit Interest",
  CDP: "Cash Deposit",
  CHC: "Check Clearing",
  CHD: "Check Deposit",
  CHG: "Service Charge",
  CHI: "Check Issue",
  CHR: "Check Return",
  CHW: "Check Withdrawal",
  COD: "Cash On Delivery",
  CON: "Conversion",
  CPC: "Credit Card Payment Credit",
  CPI: "Credit Card Payment Installment",
  CPL: "Credit Card Payment Late Fee",
  CRF: "Credit Reference Fee",
  CWL: "Cash Withdrawal",
  DOD: "Document Draft",
  EBB: "E-Banking Bill Payment",
  EBL: "E-Banking Login",
  EPC: "Electronic Payment Credit",
  ESF: "E-Statement Fee",
  FCT: "Foreign Currency Transaction",
  FEX: "Foreign Exchange",
  FLO: "Float Adjustment",
  FRE: "Fund Return",
  FSC: "Foreign Service Charge",
  FSF: "Facility Service Fee",
  FSL: "Facility Service Late Fee",
  FTB: "Fund Transfer Between Banks",
  FTC: "Fund Transfer Credit",
  FTT: "Fund Transfer Tax",
  FXB: "Foreign Exchange Buy",
  FXP: "Foreign Exchange Payment",
  FXS: "Foreign Exchange Sell",
  GCF: "Government Collection Fee",
  ICA: "Interest Capitalization",
  ICC: "Import Collection Credit",
  ICG: "Interest Charge",
  ICL: "Interest Credit Local",
  ILP: "Interest Late Payment",
  IPF: "Insurance Premium Fee",
  LAC: "Loan Account Credit",
  LAM: "Loan Account Management",
  LBF: "Letter of Bank Fee",
  LCA: "Letter of Credit Application",
  LCB: "Letter of Credit Bill",
  LCC: "Letter of Credit Commission",
  LCE: "Letter of Credit Extension",
  LCF: "Letter of Credit Fee",
  LCG: "Letter of Credit Guarantee",
  LCM: "Letter of Credit Amendment",
  LCS: "Letter of Credit Settlement",
  LDF: "Late Document Fee",
  LIA: "Loan Interest Accrual",
  LIL: "Loan Interest Local",
  LIR: "Loan Interest Rate Change",
  LIW: "Loan Interest Waiver",
  LMF: "Loan Management Fee",
  LNF: "Loan Notification Fee",
  LPD: "Loan Payment Due",
  LPF: "Late Payment Fee",
  LPL: "Loan Payment Local",
  LPS: "Loan Payment Settlement",
  LPW: "Loan Payment Waiver",
  LRF: "Loan Registration Fee",
  LSC: "Loan Service Charge",
  LSF: "Legal Service Fee",
  MIG: "Migration Entry",
  MSC: "Miscellaneous Charge",
  MSD: "Miscellaneous Debit",
  MSG: "Message Charge",
  OAT: "Online Account Transfer",
  OCC: "Outward Check Collection",
  OCG: "Overdraft Charge",
  ODA: "Overdraft Advance",
  ODL: "Overdraft Limit",
  PBF: "Payment Book Fee",
  PLP: "Prepayment Penalty",
  POA: "Power of Attorney",
  POC: "Point of Sale Credit",
  POE: "Point of Sale Entry",
  POS: "Point of Sale Transaction",
  RAF: "Returned Application Fee",
  REV: "Reversal Entry",
  RPF: "Replacement Fee",
  RVL: "Revaluation",
  SCC: "Standing Order Credit Commission",
  SEC: "Securities Transaction",
  SIC: "Standing Instruction Credit",
  SID: "Standing Instruction Debit",
  SWT: "SWIFT Transfer",
  TAX: "Tax Deduction",
  TCB: "Tax Credit Balance",
  TIN: "Tax Identification Number",
  TRF: "Transfer",
  TTI: "Telegraphic Transfer In",
  TTL: "Telegraphic Transfer Local",
  TTT: "Telegraphic Transfer Tax",
  TTV: "Telegraphic Transfer Verification",
  YET: "Year End Transfer"
};

export async function POST(request: NextRequest) {
  try {
    const { accountNumber, filter, customDateRange, page, limit } = await request.json();

    // Calculate date range based on filter
    let dateFrom = new Date();
    let dateTo = new Date();
    
    switch (filter) {
      case 'today':
        dateFrom = new Date();
        break;
      case 'week':
        dateFrom = new Date(dateTo.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateFrom = new Date(dateTo.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3months':
        dateFrom = new Date(dateTo.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6months':
        dateFrom = new Date(dateTo.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '9months':
        dateFrom = new Date(dateTo.getTime() - 270 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        dateFrom = new Date(dateTo.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        if (customDateRange?.startDate && customDateRange?.endDate) {
          dateFrom = new Date(customDateRange.startDate);
          dateTo = new Date(customDateRange.endDate);
        }
        else {
          dateFrom = new Date(dateTo.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        break;
      default:
        dateFrom = new Date(dateTo.getTime() - 30 * 24 * 60 * 60 * 1000);
    }


    const openingBalanceQuery = `
    select * from (
      select 
        FCUBSPRD.Z_FN_CL_GETCLOSEBAL_stmt1(a.ac_no,a.value_dt) + 
        FCUBSPRD.Z_FN_CL_GETCLOSEBAL_stmt2(a.ac_no,a.value_dt,a.ac_entry_sr_no) CLOSE_BAL
      from FCUBSPRD.ACVWS_ALL_AC_ENTRIES a, FCUBSPRD.Sttms_Trn_code b,
      (SELECT DISTINCT ACVWS_ALL_AC_ENTRIES1.TRN_REF_NO COL1
       FROM FCUBSPRD.ACVWS_ALL_AC_ENTRIES ACVWS_ALL_AC_ENTRIES1
       WHERE ACVWS_ALL_AC_ENTRIES1.AC_NO = :AccountNo
       AND ACVWS_ALL_AC_ENTRIES1.VALUE_DT < to_date(trunc(:DateFrom))
      MINUS
       SELECT ACVWS_ALL_AC_ENTRIES2.TRN_REF_NO
       FROM FCUBSPRD.ACVWS_ALL_AC_ENTRIES ACVWS_ALL_AC_ENTRIES2
       WHERE ACVWS_ALL_AC_ENTRIES2.EVENT = 'REVR'
       AND ACVWS_ALL_AC_ENTRIES2.AC_NO = :AccountNo
       AND ACVWS_ALL_AC_ENTRIES2.VALUE_DT < to_date(trunc(:DateFrom))) TEMP0 
      where a.Trn_code=b.Trn_code 
      and a.auth_stat = 'A' 
      and a.trn_ref_no not in('103FTOR141740001','103FTOR141740007') 
      and a.dont_showin_stmt = 'N'
      and a.TRN_REF_NO= TEMP0.COL1
      AND A.AC_NO = :AccountNo 
      and a.VALUE_DT < to_date(trunc(:DateFrom))
      ORDER BY a.VALUE_DT DESC, a.ac_entry_sr_no DESC)
    where rownum = 1`;

    const openingDate = new Date(dateFrom.getTime());
    openingDate.setDate(openingDate.getDate() - 1);

    const openingBalanceResult = await executeQuery(openingBalanceQuery, 
      [accountNumber, dateFrom, accountNumber, dateFrom, accountNumber, dateFrom], 
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    

    const query = `
    select * from (
    select to_char(a.value_dt,'DD-MON-YYYY') value_dt,
     a.trn_ref_no TRN_REF_NO,
    CASE WHEN a.MODULE = 'RT' OR a.MODULE = 'FT' OR a.MODULE = 'PC' OR a.MODULE = 'CG' THEN
    (select p.product_description from FCUBSPRD.cstm_product p where p.product_code = SUBSTR(a.trn_ref_no,4,4) ) ELSE b.Trn_Desc END Trn_Desc,
    decode(drcr_ind,'D',-a.lcy_amount,a.lcy_amount) Dr_Cr_Diff,
    FCUBSPRD.Z_FN_CL_GETCLOSEBAL_stmt1(a.ac_no,a.value_dt) + FCUBSPRD.Z_FN_CL_GETCLOSEBAL_stmt2(a.ac_no,a.value_dt,a.ac_entry_sr_no ) CLOSE_BAL 
    from FCUBSPRD.ACVWS_ALL_AC_ENTRIES a, FCUBSPRD.Sttms_Trn_code b,
    (SELECT DISTINCT ACVWS_ALL_AC_ENTRIES1.TRN_REF_NO COL1
     FROM FCUBSPRD.ACVWS_ALL_AC_ENTRIES ACVWS_ALL_AC_ENTRIES1
     WHERE ACVWS_ALL_AC_ENTRIES1.AC_NO = :AccountNo
     AND ACVWS_ALL_AC_ENTRIES1.VALUE_DT <=to_date(trunc(:DateTo))
    MINUS
     SELECT ACVWS_ALL_AC_ENTRIES2.TRN_REF_NO
     FROM FCUBSPRD.ACVWS_ALL_AC_ENTRIES ACVWS_ALL_AC_ENTRIES2
     WHERE ACVWS_ALL_AC_ENTRIES2.EVENT = 'REVR'
     AND ACVWS_ALL_AC_ENTRIES2.AC_NO = :AccountNo
     AND ACVWS_ALL_AC_ENTRIES2.VALUE_DT <=to_date(trunc(:DateTo)) ) TEMP0 
    where a.Trn_code=b.Trn_code 
    and a.auth_stat = 'A' 
    and a.trn_ref_no not in('103FTOR141740001','103FTOR141740007') 
    and a.dont_showin_stmt = 'N'
    and a.TRN_REF_NO= TEMP0.COL1
    AND A.AC_NO = :AccountNo 
    and a.VALUE_DT <= to_date(trunc(:DateTo))
    ORDER BY a.VALUE_DT,a.ac_entry_sr_no asc)
where value_dt>=to_date(trunc(:DateFrom))
    `;

    const bindParams = [
      accountNumber,
      dateTo,
      accountNumber,
      dateTo,
      accountNumber,
      dateTo,
      dateFrom
    ];


    const openingBalance = openingBalanceResult.data?.[0]?.CLOSE_BAL || 0;



    const result = await executeQuery(query, bindParams, {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch transactions');
    }

    const rows = result.data || [];
    const transformedRows = rows.map(row => ({
      VALUE_DT: row.VALUE_DT,
      TRN_DESC: row.TRN_DESC,
      DR_CR_DIFF: parseFloat(row.DR_CR_DIFF?.toString() || '0'),
      CLOSE_BAL: parseFloat(row.CLOSE_BAL?.toString() || '0'),
      TRN_REF_NO: row.TRN_REF_NO
    }));

    return NextResponse.json({
      success: true,
      encrypted: encryptResponse({
        transactions: transformedRows,
        openingBalance: parseFloat(openingBalance.toString()),
        pagination: {
          page: page || 1,
          limit: limit || 10,
          total: rows.length,
          totalPages: Math.ceil(rows.length / (limit || 10))
        }
      })
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch transactions',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

interface TransactionType {
  TRN_CODE: string;
  DESCRIPTIONS: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let accountNumber = searchParams.get('accountNumber');
  const encryptedToken = searchParams.get('encryptedToken');

  // Call Express backend to decrypt token if provided
  if (!accountNumber && encryptedToken) {
    try {
      const decryptTokenRes = await fetch(`${BACKEND_URL}/api/zsmart_branch_requests/decrypt-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encryptedToken }),
      });
      const decryptResult = await decryptTokenRes.json();
      if (decryptResult.error || !decryptResult.accountNumber) {
        return NextResponse.json({
          success: false,
          message: 'Invalid or expired account token'
        }, { status: 400 });
      }
      accountNumber = decryptResult.accountNumber;
    } catch (err) {
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired account token'
      }, { status: 400 });
    }
  }

  if (!accountNumber) {
    return NextResponse.json({
      success: false,
      message: 'Account number is required'
    }, { status: 400 });
  }

  try {
    const result = await executeQuery(
      `SELECT * FROM FCUBSPRD.ACVW_ALL_AC_ENTRIES 
       WHERE AC_NO = :1 
       ORDER BY VALUE_DT DESC`,
      [accountNumber.toString()],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch transactions');
    }

    return NextResponse.json({
      success: true,
      encrypted: encryptResponse(result.data)
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
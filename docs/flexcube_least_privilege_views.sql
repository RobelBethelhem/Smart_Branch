-- ============================================================================
-- OPTION 2: column-level least privilege for ZSmart Branch via VIEWS
-- ============================================================================
-- Oracle cannot grant SELECT on specific columns. To restrict READS to only the
-- columns the app uses, expose a VIEW per table with just those columns and grant
-- SELECT on the views instead of the base tables. Columns come from
-- flexcube_columns.md.
--
-- Design: put the views in a dedicated schema SBVIEW with the SAME names as the
-- base tables. The app already runs "ALTER SESSION SET CURRENT_SCHEMA" from the
-- FLEXCUBE_SCHEMA env, so pointing it at the views only needs:
--     (1) FLEXCUBE_SCHEMA=SBVIEW   in both .env files, AND
--     (2) removing the hard-coded "FCUBSPRD." prefix from TABLE references in the
--         app (leave it on the two Z_FN_CL_GETCLOSEBAL functions and on
--         FBTB_TILL_DETAIL_CCY — see the exceptions at the bottom).
-- Ask us and we'll make change (2); it's a mechanical edit across both apps.
--
-- SBVIEW's owner needs SELECT on the FCUBSPRD base tables to create the views.
-- SMARTBRANCH gets NO privilege on the base tables — only on these views.
-- ----------------------------------------------------------------------------

-- CREATE USER SBVIEW ...;  -- (DBA) a plain schema to hold the views
-- Grant the view owner read on the bases (or create the views AS the owner FCUBSPRD).

CREATE OR REPLACE VIEW SBVIEW.STTM_CUST_ACCOUNT AS
  SELECT BRANCH_CODE, CUST_AC_NO, AC_DESC, CCY, CUST_NO, ACCOUNT_CLASS,
         AC_STAT_NO_DR, AC_STAT_NO_CR, AC_STAT_DORMANT
  FROM FCUBSPRD.STTM_CUST_ACCOUNT;

CREATE OR REPLACE VIEW SBVIEW.STTM_ACCOUNT_BALANCE AS
  SELECT CUST_AC_NO, ACY_WITHDRAWABLE_BAL, ACY_BLOCKED_AMT
  FROM FCUBSPRD.STTM_ACCOUNT_BALANCE;

CREATE OR REPLACE VIEW SBVIEW.STTM_CUST_IMAGE AS
  SELECT CUSTOMER_NO, IMAGE_TEXT
  FROM FCUBSPRD.STTM_CUST_IMAGE;

CREATE OR REPLACE VIEW SBVIEW.SVTM_CIF_SIG_DET AS
  SELECT CIF_ID, SIG_TEXT
  FROM FCUBSPRD.SVTM_CIF_SIG_DET;

CREATE OR REPLACE VIEW SBVIEW.STTM_CUST_PERSONAL AS
  SELECT CUSTOMER_NO, FIRST_NAME, MIDDLE_NAME, LAST_NAME, MOBILE_NUMBER,
         P_ADDRESS1, P_ADDRESS2, P_ADDRESS4
  FROM FCUBSPRD.STTM_CUST_PERSONAL;

CREATE OR REPLACE VIEW SBVIEW.STTM_CUSTOMER AS
  SELECT CUSTOMER_NO, CUSTOMER_NAME1, CUSTOMER_CATEGORY  -- CATEGORY used by the daily-limit check
  FROM FCUBSPRD.STTM_CUSTOMER;

CREATE OR REPLACE VIEW SBVIEW.ACVWS_ALL_AC_ENTRIES AS
  SELECT AC_NO, VALUE_DT, AC_ENTRY_SR_NO, TRN_REF_NO, TRN_CODE, AUTH_STAT,
         DONT_SHOWIN_STMT, EVENT, MODULE, DRCR_IND, LCY_AMOUNT
  FROM FCUBSPRD.ACVWS_ALL_AC_ENTRIES;

CREATE OR REPLACE VIEW SBVIEW.STTMS_TRN_CODE AS
  SELECT TRN_CODE, TRN_DESC
  FROM FCUBSPRD.STTMS_TRN_CODE;

CREATE OR REPLACE VIEW SBVIEW.CSTM_PRODUCT AS
  SELECT PRODUCT_CODE, PRODUCT_DESCRIPTION, PRODUCT_GROUP
  FROM FCUBSPRD.CSTM_PRODUCT;

CREATE OR REPLACE VIEW SBVIEW.DETB_RTL_TELLER AS
  SELECT TRN_REF_NO, TXN_TRN_CODE, TXN_ACC, TXN_AMOUNT, OFS_AMOUNT, OFS_ACC,
         MAKER_ID, MAKER_DT_STAMP, CHECKER_ID, CHECKER_DT_STAMP
  FROM FCUBSPRD.DETB_RTL_TELLER;

CREATE OR REPLACE VIEW SBVIEW.FBTB_TILL_MASTER_TB AS
  SELECT USER_ID, BRANCH_CODE
  FROM FCUBSPRD.FBTB_TILL_MASTER_TB;

CREATE OR REPLACE VIEW SBVIEW.SMTB_USER_TILLS AS
  SELECT TILL_ID, BRANCH_CODE
  FROM FCUBSPRD.SMTB_USER_TILLS;

CREATE OR REPLACE VIEW SBVIEW.SMTB_USER_ROLE AS
  SELECT USER_ID, BRANCH_CODE
  FROM FCUBSPRD.SMTB_USER_ROLE;

-- ACVW_ALL_AC_ENTRIES and ACTB_DAILY_LOG are queried with SELECT * in the app,
-- so a restricting view helps only if the app is changed to list columns. Until
-- then expose them whole (or grant table-level SELECT on the base):
CREATE OR REPLACE VIEW SBVIEW.ACVW_ALL_AC_ENTRIES AS
  SELECT * FROM FCUBSPRD.ACVW_ALL_AC_ENTRIES;
CREATE OR REPLACE VIEW SBVIEW.ACTB_DAILY_LOG AS
  SELECT * FROM FCUBSPRD.ACTB_DAILY_LOG;

-- ----------------------------------------------------------------------------
-- Grant SELECT on the views to the app user.
-- ----------------------------------------------------------------------------
GRANT SELECT ON SBVIEW.STTM_CUST_ACCOUNT    TO SMARTBRANCH;
GRANT SELECT ON SBVIEW.STTM_ACCOUNT_BALANCE TO SMARTBRANCH;
GRANT SELECT ON SBVIEW.STTM_CUST_IMAGE      TO SMARTBRANCH;
GRANT SELECT ON SBVIEW.SVTM_CIF_SIG_DET     TO SMARTBRANCH;
GRANT SELECT ON SBVIEW.STTM_CUST_PERSONAL   TO SMARTBRANCH;
GRANT SELECT ON SBVIEW.STTM_CUSTOMER        TO SMARTBRANCH;
GRANT SELECT ON SBVIEW.ACVWS_ALL_AC_ENTRIES TO SMARTBRANCH;
GRANT SELECT ON SBVIEW.STTMS_TRN_CODE       TO SMARTBRANCH;
GRANT SELECT ON SBVIEW.CSTM_PRODUCT         TO SMARTBRANCH;
GRANT SELECT ON SBVIEW.DETB_RTL_TELLER      TO SMARTBRANCH;
GRANT SELECT ON SBVIEW.FBTB_TILL_MASTER_TB  TO SMARTBRANCH;
GRANT SELECT ON SBVIEW.SMTB_USER_TILLS      TO SMARTBRANCH;
GRANT SELECT ON SBVIEW.SMTB_USER_ROLE       TO SMARTBRANCH;
GRANT SELECT ON SBVIEW.ACVW_ALL_AC_ENTRIES  TO SMARTBRANCH;
GRANT SELECT ON SBVIEW.ACTB_DAILY_LOG       TO SMARTBRANCH;

-- ----------------------------------------------------------------------------
-- Exceptions that stay on the BASE FCUBSPRD objects (not views):
--   * The closing-balance functions (EXECUTE, definer-rights so they read the
--     base tables themselves):
GRANT EXECUTE ON FCUBSPRD.Z_FN_CL_GETCLOSEBAL_STMT1 TO SMARTBRANCH;
GRANT EXECUTE ON FCUBSPRD.Z_FN_CL_GETCLOSEBAL_STMT2 TO SMARTBRANCH;
--   * The till table, because the app UPDATEs it (updating through a
--     column-restricted view would drop DENOMCOUNT). Grant on the base table,
--     column-scoped for the write:
GRANT SELECT                                ON FCUBSPRD.FBTB_TILL_DETAIL_CCY TO SMARTBRANCH;
GRANT UPDATE (INFLOW, OUTFLOW, DENOMCOUNT)  ON FCUBSPRD.FBTB_TILL_DETAIL_CCY TO SMARTBRANCH;
-- (Keep the "FCUBSPRD." prefix on FBTB_TILL_DETAIL_CCY and on the two functions
--  in the app code; only the pure-read tables above are switched to SBVIEW.)

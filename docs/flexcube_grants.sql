-- ============================================================================
-- Flexcube privileges for the ZSmart Branch app DB user  (GRANTEE = SMARTBRANCH)
-- ============================================================================
-- Symptom this fixes: ORA-00942 "table or view does not exist". Oracle returns
-- ORA-00942 both when an object is missing AND when you lack privilege on it, so
-- a fully-qualified query (FCUBSPRD.STTM_ACCOUNT_BALANCE) still fails if SELECT
-- wasn't granted. As the schema OWNER (test) you read everything implicitly; as
-- SMARTBRANCH you only read what was explicitly granted.
--
-- Confirmed owner: FCUBSPRD. Already granted to SMARTBRANCH (do NOT re-run):
--   STTM_CUST_ACCOUNT (S), ACVW_ALL_AC_ENTRIES (S),
--   FBTB_TILL_DETAIL_CCY (S,U), FBTB_TILL_TOTALS (S,U), SMTB_USER_TILLS (S)
--
-- Run everything below AS the schema owner FCUBSPRD (or a DBA).

-- ----------------------------------------------------------------------------
-- A) FRONTEND — unblocks /api/account/verify and the dashboard/mini-statement.
--    The three marked *** are what the failing verify JOIN needs right now.
-- ----------------------------------------------------------------------------
GRANT SELECT  ON FCUBSPRD.STTM_ACCOUNT_BALANCE      TO SMARTBRANCH;  -- *** verify: balance
GRANT SELECT  ON FCUBSPRD.STTM_CUST_IMAGE           TO SMARTBRANCH;  -- *** verify: profile photo
GRANT SELECT  ON FCUBSPRD.SVTM_CIF_SIG_DET          TO SMARTBRANCH;  -- *** verify: signature
GRANT SELECT  ON FCUBSPRD.STTM_CUST_PERSONAL        TO SMARTBRANCH;  -- name/phone search
GRANT SELECT  ON FCUBSPRD.ACVWS_ALL_AC_ENTRIES      TO SMARTBRANCH;  -- mini statement (NOTE: with "S" — a DIFFERENT view than ACVW_ALL_AC_ENTRIES; the app uses BOTH)
GRANT SELECT  ON FCUBSPRD.STTMS_TRN_CODE            TO SMARTBRANCH;  -- txn code descriptions
GRANT SELECT  ON FCUBSPRD.CSTM_PRODUCT              TO SMARTBRANCH;  -- product lookup
GRANT SELECT  ON FCUBSPRD.ACTB_DAILY_LOG            TO SMARTBRANCH;  -- /api/flexcube (also needs FLEXCUBE_SCHEMA, see D)
GRANT EXECUTE ON FCUBSPRD.Z_FN_CL_GETCLOSEBAL_STMT1 TO SMARTBRANCH;  -- closing-balance function
GRANT EXECUTE ON FCUBSPRD.Z_FN_CL_GETCLOSEBAL_STMT2 TO SMARTBRANCH;  -- closing-balance function

-- ----------------------------------------------------------------------------
-- B) BACKEND — needed when you run transactions (grant now to avoid a repeat).
--    (The SELECTs it shares with the frontend are already in section A.)
-- ----------------------------------------------------------------------------
GRANT SELECT  ON FCUBSPRD.STTM_CUSTOMER            TO SMARTBRANCH;
GRANT SELECT  ON FCUBSPRD.DETB_RTL_TELLER          TO SMARTBRANCH;
GRANT SELECT  ON FCUBSPRD.FBTB_TILL_MASTER_TB      TO SMARTBRANCH;
GRANT SELECT  ON FCUBSPRD.SMTB_USER_ROLE           TO SMARTBRANCH;
-- Till UPDATEs the backend performs are already granted (FBTB_TILL_DETAIL_CCY,
-- FBTB_TILL_TOTALS). If transaction POSTING later errors ORA-00942 on another
-- object, grant SELECT (or INSERT/UPDATE) on that object the same way.

-- ----------------------------------------------------------------------------
-- C) DIAGNOSTIC — run AS SMARTBRANCH to verify. Every needed name should appear;
--    OWNER must be FCUBSPRD. Anything missing = still no grant.
-- ----------------------------------------------------------------------------
-- SELECT owner, object_name, object_type FROM all_objects
-- WHERE object_name IN (
--   'STTM_CUST_ACCOUNT','STTM_ACCOUNT_BALANCE','STTM_CUST_IMAGE','STTM_CUST_PERSONAL',
--   'STTM_CUSTOMER','SVTM_CIF_SIG_DET','ACVW_ALL_AC_ENTRIES','ACVWS_ALL_AC_ENTRIES',
--   'CSTM_PRODUCT','STTMS_TRN_CODE','ACTB_DAILY_LOG','DETB_RTL_TELLER',
--   'FBTB_TILL_MASTER_TB','SMTB_USER_ROLE','Z_FN_CL_GETCLOSEBAL_STMT1','Z_FN_CL_GETCLOSEBAL_STMT2')
-- ORDER BY object_name;

-- ----------------------------------------------------------------------------
-- D) DEFAULT SCHEMA for the few UNqualified queries (frontend ACTB_DAILY_LOG,
--    backend STTM_CUSTOMER). Add to the app env so unqualified names resolve to
--    the owner instead of SMARTBRANCH's own schema:
--        FLEXCUBE_SCHEMA=FCUBSPRD      (frontend .env.local AND backend .env)
--    Setting CURRENT_SCHEMA needs no privilege; the grants above still gate reads.
-- ----------------------------------------------------------------------------

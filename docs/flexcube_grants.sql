-- ============================================================================
-- Flexcube privileges for the ZSmart Branch app DB user (e.g. SMARTBRANCH)
-- ============================================================================
-- Symptom this fixes: ORA-00942 "table or view does not exist" when the app
-- connects as a NON-owner user. Oracle returns ORA-00942 both when an object is
-- missing AND when you simply lack privilege on it — so a fully-qualified query
-- like FCUBSPRD.STTM_CUST_ACCOUNT still fails if SELECT wasn't granted. As the
-- schema OWNER (test) you read every table implicitly; as SMARTBRANCH you only
-- read what was explicitly granted.
--
-- Replace SMARTBRANCH with your app DB user and FCUBSPRD with the real owner if
-- different (see the diagnostic below).

-- ----------------------------------------------------------------------------
-- 1) DIAGNOSTIC — run AS the app user (SMARTBRANCH) to see what it can/can't read.
--    all_objects only lists objects you have privilege on, so any name from the
--    app's list that is MISSING here = no grant. The OWNER column also confirms
--    the real schema owner (if it isn't FCUBSPRD, use that name everywhere).
-- ----------------------------------------------------------------------------
SELECT owner, object_name, object_type
FROM   all_objects
WHERE  object_name IN (
         'STTM_CUST_ACCOUNT','STTM_ACCOUNT_BALANCE','STTM_CUST_IMAGE',
         'STTM_CUST_PERSONAL','STTM_CUSTOMER','SVTM_CIF_SIG_DET',
         'ACVW_ALL_AC_ENTRIES','ACVWS_ALL_AC_ENTRIES','CSTM_PRODUCT','ACTB_DAILY_LOG'
       )
ORDER  BY object_name, owner;

-- ----------------------------------------------------------------------------
-- 2) GRANTS — run AS the schema owner (FCUBSPRD) or a DBA.
--    Every object the ZSmart Branch frontend + backend read.
-- ----------------------------------------------------------------------------
GRANT SELECT ON FCUBSPRD.STTM_CUST_ACCOUNT     TO SMARTBRANCH;
GRANT SELECT ON FCUBSPRD.STTM_ACCOUNT_BALANCE  TO SMARTBRANCH;
GRANT SELECT ON FCUBSPRD.STTM_CUST_IMAGE       TO SMARTBRANCH;
GRANT SELECT ON FCUBSPRD.STTM_CUST_PERSONAL    TO SMARTBRANCH;
GRANT SELECT ON FCUBSPRD.STTM_CUSTOMER         TO SMARTBRANCH;
GRANT SELECT ON FCUBSPRD.SVTM_CIF_SIG_DET      TO SMARTBRANCH;
GRANT SELECT ON FCUBSPRD.ACVW_ALL_AC_ENTRIES   TO SMARTBRANCH;
GRANT SELECT ON FCUBSPRD.ACVWS_ALL_AC_ENTRIES  TO SMARTBRANCH;
GRANT SELECT ON FCUBSPRD.CSTM_PRODUCT          TO SMARTBRANCH;
GRANT SELECT ON FCUBSPRD.ACTB_DAILY_LOG        TO SMARTBRANCH;

-- ----------------------------------------------------------------------------
-- 3) DEFAULT SCHEMA for UNqualified queries.
--    A few queries (e.g. /api/flexcube -> ACTB_DAILY_LOG, backend STTM_CUSTOMER)
--    are NOT schema-qualified. As SMARTBRANCH those resolve to
--    SMARTBRANCH.<table> and fail even with the grants above. The app now runs
--    "ALTER SESSION SET CURRENT_SCHEMA = <FLEXCUBE_SCHEMA>" on each pooled
--    connection when FLEXCUBE_SCHEMA is set. So just add to the app env:
--
--        FLEXCUBE_SCHEMA=FCUBSPRD
--
--    (frontend .env.local AND backend .env). No object privilege is needed to
--    set CURRENT_SCHEMA — grants from step 2 still control what is readable.
--    Alternatively the DBA can create synonyms instead of setting CURRENT_SCHEMA:
--        CREATE OR REPLACE PUBLIC SYNONYM ACTB_DAILY_LOG FOR FCUBSPRD.ACTB_DAILY_LOG;  -- etc.
-- ----------------------------------------------------------------------------

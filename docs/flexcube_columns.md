# ZSmart Branch — Flexcube columns used (for least-privilege review)

Complete list of every `FCUBSPRD` object the ZSmart Branch **frontend + backend**
touch, the privilege needed, and the exact columns read/written.

> **Oracle note:** column lists in `GRANT` are allowed only for `UPDATE` /
> `INSERT` / `REFERENCES` — **never `SELECT`**. So for reads, least privilege is
> either **table-level `SELECT`** (recommended) or **`SELECT` on a view** that
> exposes only these columns (see `flexcube_least_privilege_views.sql`).

Grantee: **SMARTBRANCH**  ·  Owner: **FCUBSPRD**

| # | Object | Privilege | Columns the app uses |
|---|--------|-----------|----------------------|
| 1 | `STTM_CUST_ACCOUNT` | SELECT | `BRANCH_CODE, CUST_AC_NO, AC_DESC, CCY, CUST_NO, ACCOUNT_CLASS, AC_STAT_NO_DR, AC_STAT_NO_CR, AC_STAT_DORMANT` |
| 2 | `STTM_ACCOUNT_BALANCE` | SELECT | `CUST_AC_NO, ACY_WITHDRAWABLE_BAL, ACY_BLOCKED_AMT` |
| 3 | `STTM_CUST_IMAGE` | SELECT | `CUSTOMER_NO, IMAGE_TEXT` |
| 4 | `SVTM_CIF_SIG_DET` | SELECT | `CIF_ID, SIG_TEXT` |
| 5 | `STTM_CUST_PERSONAL` | SELECT | `CUSTOMER_NO, FIRST_NAME, MIDDLE_NAME, LAST_NAME, MOBILE_NUMBER, P_ADDRESS1, P_ADDRESS2, P_ADDRESS4` |
| 6 | `STTM_CUSTOMER` | SELECT | `CUSTOMER_NO, CUSTOMER_NAME1, CUSTOMER_CATEGORY` |
| 7 | `ACVWS_ALL_AC_ENTRIES` | SELECT | `AC_NO, VALUE_DT, AC_ENTRY_SR_NO, TRN_REF_NO, TRN_CODE, AUTH_STAT, DONT_SHOWIN_STMT, EVENT, MODULE, DRCR_IND, LCY_AMOUNT` |
| 8 | `STTMS_TRN_CODE` | SELECT | `TRN_CODE, TRN_DESC` |
| 9 | `CSTM_PRODUCT` | SELECT | `PRODUCT_CODE, PRODUCT_DESCRIPTION, PRODUCT_GROUP` |
| 10 | `DETB_RTL_TELLER` | SELECT | `TRN_REF_NO, TXN_TRN_CODE, TXN_ACC, TXN_AMOUNT, OFS_AMOUNT, OFS_ACC, MAKER_ID, MAKER_DT_STAMP, CHECKER_ID, CHECKER_DT_STAMP` |
| 11 | `FBTB_TILL_MASTER_TB` | SELECT | `USER_ID, BRANCH_CODE` |
| 12 | `FBTB_TILL_DETAIL_CCY` | SELECT **+ UPDATE** | SELECT: `TILL_ID, BRANCHCODE, DENOMVAL, DENOMTXT, CCYCODE, INFLOW, OUTFLOW, OPENINGBALANCE` · **UPDATE: `INFLOW, OUTFLOW, DENOMCOUNT`** |
| 13 | `SMTB_USER_TILLS` | SELECT | `TILL_ID, BRANCH_CODE` |
| 14 | `SMTB_USER_ROLE` | SELECT | `USER_ID, BRANCH_CODE` |
| 15 | `ACVW_ALL_AC_ENTRIES` | SELECT | **`SELECT *` (all columns)** — filtered by `AC_NO, VALUE_DT` |
| 16 | `ACTB_DAILY_LOG` | SELECT | Frontend uses **`SELECT *`**; backend uses `LCY_AMOUNT, PRODUCT, DRCR_IND, AC_CCY, RELATED_CUSTOMER, CUST_GL, TRN_DT, TRN_REF_NO, EVENT, AC_NO` |
| 17 | `Z_FN_CL_GETCLOSEBAL_STMT1` | **EXECUTE** | function — args `AC_NO, VALUE_DT` |
| 18 | `Z_FN_CL_GETCLOSEBAL_STMT2` | **EXECUTE** | function — args `AC_NO, VALUE_DT, AC_ENTRY_SR_NO` |

Notes:
- **#12** is the only table written; the write is column-scoped to
  `INFLOW, OUTFLOW, DENOMCOUNT`, which Oracle CAN grant at column level.
- **#15 / #16** are queried with `SELECT *`, so a restricting view gives no
  benefit unless the app is changed to select explicit columns. Grant table-level
  SELECT (or expose the full view).
- `FBTB_TILL_TOTALS` was granted (SELECT+UPDATE) but the current code never uses
  it — safe to drop.
- No `INSERT` or `DELETE` is performed on any Flexcube object.
- **Daily-limit check** reads only Flexcube tables already listed:
  `STTM_CUSTOMER.CUSTOMER_CATEGORY` (the customer's category — there is NO separate
  category table), then sums today's cash withdrawals from `ACTB_DAILY_LOG` +
  `CSTM_PRODUCT` (#16/#9). The per-category limit **amounts** live in MongoDB
  (`CustomerCategoryLimit`), not Flexcube. The category query
  (`SELECT CUSTOMER_CATEGORY FROM sttm_customer`) is UNqualified, so it needs
  `FLEXCUBE_SCHEMA=FCUBSPRD`.

export interface Transaction {
  VALUE_DT: string;
  TRN_DESC: string;
  DR_CR_DIFF: number;
  CLOSE_BAL: number;
  TRN_REF_NO: string;
}




export interface AccountData {
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
    transactions?: Transaction[];
}

export interface UserData {
    name: string;
    balance: number;
    profileImage: string;
    signImage: string;
}
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { FiCalendar, FiDownload, FiFilter, FiChevronDown } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Transaction } from '@/types/account';

interface MiniStatementProps {
    onBack: () => void;
    accountNumber: string;
    accountName?: string;
    currency?: string;
  }

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const filterOptions = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: '3 Months', value: '3months' },
  { label: '6 Months', value: '6months' },
  { label: '9 Months', value: '9months' },
  { label: '1 Year', value: 'year' },
  { label: 'Custom Range', value: 'custom' },
];

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

const MiniStatement: React.FC<MiniStatementProps> = ({ 
     onBack, 
    accountNumber,
    accountName,
    currency  }) => {
        const [transactions, setTransactions] = useState<Transaction[]>([]);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const [selectedFilter, setSelectedFilter] = useState('month');
        const [showFilterDropdown, setShowFilterDropdown] = useState(false);
        const [startDate, setStartDate] = useState<Date | undefined>(undefined);
        const [endDate, setEndDate] = useState<Date | undefined>(undefined);
        const [showDatePicker, setShowDatePicker] = useState(false);
        const [transactionTypes, setTransactionTypes] = useState<{[key: string]: string}>({});
        const [page, setPage] = useState(1);
        const [limit] = useState(10);
        const [totalPages, setTotalPages] = useState(1);

        const renderAccountDetails = () => (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Account Number</label>
                  <p className="font-medium">{accountNumber}</p>
                </div>
                {accountName && (
                  <div>
                    <label className="text-sm text-gray-500">Account Name</label>
                    <p className="font-medium">{accountName}</p>
                  </div>
                )}
                {currency && (
                  <div>
                    <label className="text-sm text-gray-500">Currency</label>
                    <p className="font-medium">{currency}</p>
                  </div>
                )}
              </div>
            </div>
          );

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountNumber,
          filter: selectedFilter,
          page,
          limit,
          customDateRange: selectedFilter === 'custom' && startDate && endDate
            ? {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
              }
            : null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTransactions(data.transactions);
        setTotalPages(data.pagination.totalPages);
      } else {
        setError(data.message || 'Failed to fetch transactions');
      }
    } catch (err) {
      setError('An error occurred while fetching transactions');
      console.error('Transaction fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountNumber) {
      fetchTransactions();
    }
  }, [accountNumber, selectedFilter, startDate, endDate, page, limit]);

  useEffect(() => {
    const fetchTransactionTypes = async () => {
      try {
        const response = await fetch('/api/transaction-types');
        const data = await response.json();
        if (data.success) {
          setTransactionTypes(data.transactionTypes);
        }
      } catch (error) {
        console.error('Failed to fetch transaction types:', error);
      }
    };

    fetchTransactionTypes();
  }, []);

  const handleFilterSelect = (filter: string) => {
    setSelectedFilter(filter);
    setShowFilterDropdown(false);
    if (filter !== 'custom') {
      setShowDatePicker(false);
    } else {
      setShowDatePicker(true);
    }
  };

  const handleDownload = () => {
    // Implement PDF/Excel download functionality
  };

  // Add a helper function for amount formatting
  const formatAmount = (amount: number, currency: string) => {
    if (amount === null || amount === undefined) {
      return `0.00 ${currency}`;
    }
    return `${amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMM yyyy');
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const getTransactionDescription = (transaction: Transaction) => {
    return transaction.TRN_DESC;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="max-w-6xl mx-auto p-6"
    >
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Account Statement</h2>
            <p className="text-sm text-gray-500 mt-1">View your transaction history</p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {renderAccountDetails()}

        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <FiFilter />
                {filterOptions.find(opt => opt.value === selectedFilter)?.label}
                <FiChevronDown />
              </button>

              <AnimatePresence>
                {showFilterDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10"
                  >
                    {filterOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleFilterSelect(option.value)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
            >
              <FiDownload />
              Export
            </button>
          </div>
        </div>

        {showDatePicker && (
          <div className="mb-6">
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={(dates: [Date | null, Date | null]) => {
                const [start, end] = dates;
                setStartDate(start ?? undefined);
                setEndDate(end ?? undefined);
              }}
              isClearable={true}
              className="w-full p-2 border rounded"
              placeholderText="Select date range"
              dateFormat="dd/MM/yyyy"
              maxDate={new Date()}
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
            />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center p-4">{error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(transaction.VALUE_DT)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {getTransactionDescription(transaction)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                        transaction.DR_CR_DIFF < 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatAmount(Math.abs(transaction.DR_CR_DIFF), currency || '')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {formatAmount(transaction.CLOSE_BAL, currency || '')}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default MiniStatement;
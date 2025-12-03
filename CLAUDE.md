# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 banking application ("ZSmart Branch") that provides comprehensive branch banking operations including account management, transactions, customer onboarding, and biometric verification. The application integrates with Oracle Flexcube banking system and uses face recognition for customer verification.

## Development Commands

### Essential Commands
```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build production bundle
npm run start    # Run production server
npm run lint     # Run ESLint
```

### Environment Setup
Requires `.env.local` file with:
- `ORACLE_CLIENT_PATH` - Path to Oracle Instant Client
- `FLEXCUBE_DB_USER` - Oracle Flexcube database user
- `FLEXCUBE_DB_PASSWORD` - Oracle Flexcube database password
- `FLEXCUBE_DB_CONNECTION_STRING` - Oracle connection string

## Architecture

### Core Technology Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: Oracle Database (via oracledb package)
- **UI**: React 18 + Tailwind CSS + Framer Motion
- **Biometrics**: face-api.js for facial recognition
- **Computer Vision**: OpenCV.js, TensorFlow.js
- **Maps**: Leaflet + react-leaflet
- **3D Graphics**: Three.js + @react-three/fiber

### Project Structure

```
app/
├── page.tsx                 # Main banking interface with all transaction operations
├── layout.tsx              # Root layout with OpenCV initialization
└── api/                    # API routes
    ├── account/
    │   ├── verify/route.ts # Account verification (by number, name, phone)
    │   └── user-accounts/  # User account queries
    ├── transactions/       # Transaction history queries
    ├── flexcube/          # Flexcube API integration
    └── customer-address/  # Customer address lookup

components/
├── WithdrawComponent.tsx           # Cash withdrawal UI
├── DepositComponent.tsx            # Cash deposit UI
├── TransferComponent.tsx           # Internal transfer UI
├── OtherBankTransferComponent.tsx  # Interbank transfer UI
├── ForeignExchangeComponent.tsx    # Forex operations
├── FaceVerificationModal.tsx       # Face recognition verification
├── SignatureVerificationModal.tsx  # Signature verification
├── CustomerOnboarding.tsx          # New customer registration
├── BankFloorLayout.tsx            # 3D branch layout visualization
├── TransactionMap.tsx             # Transaction location mapping
├── MiniStatement.tsx              # Account statement display
├── SetATMPasswordComponent.tsx    # ATM PIN management
└── GetMerchantQR.tsx              # Merchant QR code generation

lib/
├── db.ts          # Oracle database connection pool & query execution
└── dbConfig.ts    # Database configuration

types/
└── account.ts     # TypeScript interfaces (AccountData, Transaction, UserData)

constant/
└── transactions.ts # Transaction code descriptions (TRN_CODE_DESCRIPTIONS)

utils/
├── numberToWordConverter.ts # Convert amounts to words
└── imageUtils.ts           # Image processing utilities
```

### Database Integration

The application uses Oracle Connection Pool pattern:
- Connection pooling managed in `lib/db.ts`
- `initializeOracleClient()` must be called before first query
- `executeQuery()` function handles all database operations
- Uses parameterized queries to prevent SQL injection

All API routes query Oracle Flexcube tables:
- `STTM_CUST_ACCOUNT` - Customer account master
- `ACTB_DAILY_BAL` - Daily account balances
- `CHTB_DAILY_TXN_SUMMARY` - Transaction history
- `CSTB_IMAGE` - Customer images (profile photos)
- `STTM_CUSTOMER` - Customer master data

### Transaction Flow

1. User enters account number
2. `app/api/account/verify/route.ts` validates account & fetches details
3. Account data stored in state with profile/signature images
4. Transaction component renders (Withdraw/Deposit/Transfer/etc)
5. Face verification modal triggered before transaction submission
6. Transaction data formatted and submitted to backend
7. Success/error feedback displayed

### Biometric Verification

Face recognition uses face-api.js models loaded from `/public/models/`:
- `tiny_face_detector_model` - Face detection
- `face_landmark_68_model` - Facial landmarks
- `face_recognition_model` - Face descriptors
- `age_gender_model` - Age/gender detection

Models must be loaded before first verification attempt. OpenCV.js is initialized in the root layout and provided via OpenCVProvider context.

### State Management

No external state management library - uses React useState/useEffect patterns:
- Main app state in `app/page.tsx`
- Account data passed as props to transaction components
- Local storage used for branch selection (`branchCode`)
- Session timeout handling with `INACTIVITY_TIMEOUT`

### Styling

Tailwind CSS with custom configuration in `tailwind.config.ts`. Framer Motion used extensively for animations and transitions. Material-UI components used selectively for specific UI elements.

## Key Implementation Details

### Oracle Client Initialization
Must occur server-side only. Next.js config marks `oracledb` as `serverExternalPackages` to prevent client bundling.

### Image Handling
Customer images stored as BLOBs in Oracle database, converted to base64 strings in API responses for display in React components.

### Webpack Fallbacks
Client-side webpack config disables Node.js modules (`fs`, `net`, `crypto`, etc.) to prevent bundling issues with server-only dependencies.

### API Route Pattern
All API routes return JSON with structure:
```typescript
{ success: boolean, data?: any, error?: string }
```

### Transaction Codes
Transaction descriptions mapped via `TRN_CODE_DESCRIPTIONS` constant. Use this to display user-friendly transaction types.

## Testing Strategy

The project does not currently have a formal test suite. When adding tests:
- Use Next.js testing conventions
- Mock Oracle database calls in unit tests
- Test face verification components with mock face-api.js responses
- Consider E2E tests for critical transaction flows
/**
 * Core types for the OrbyTech Stellar SDK
 */

// ============================================================================
// Network Configuration
// ============================================================================

export type StellarNetwork = 'testnet' | 'mainnet' | 'futurenet' | 'standalone';

export interface NetworkConfig {
  network: StellarNetwork;
  horizonUrl: string;
  sorobanRpcUrl: string;
  networkPassphrase: string;
}

// ============================================================================
// Wallet Types
// ============================================================================

export interface StellarWallet {
  publicKey: string;
  secretKey?: string;
  network?: StellarNetwork;
}

export interface WalletInfo {
  publicKey: string;
  balance: string;
  balances: Balance[];
  network: StellarNetwork;
  createdAt?: Date;
}

// ============================================================================
// Balance Types
// ============================================================================

export interface Balance {
  balance: string;
  assetType: 'native' | 'credit_alphanum4' | 'credit_alphanum12';
  assetCode: string;
  assetIssuer?: string;
  limit?: string;
  isAuthorized?: boolean;
  isAuthorizedToMaintainLiabilities?: boolean;
  lastModifiedLedger?: number;
}

// ============================================================================
// Payment Types
// ============================================================================

export interface PaymentRequest {
  from: string;
  to: string;
  amount: string;
  asset?: string | Asset;
  memo?: string | Memo;
  fee?: number;
  timeout?: number;
}

export interface PaymentResponse {
  success: boolean;
  hash?: string;
  transactionXDR?: string;
  error?: string;
  fee?: number;
  status?: TransactionStatus;
}

export interface Asset {
  code: string;
  issuer?: string;
  type: 'native' | 'credit_alphanum4' | 'credit_alphanum12';
}

export interface Memo {
  type: 'none' | 'text' | 'id' | 'hash' | 'return';
  value?: string;
}

// ============================================================================
// Transaction Types
// ============================================================================

export type TransactionStatus = 'pending' | 'success' | 'failed' | 'timeout';

export interface Transaction {
  hash: string;
  ledger: number;
  createdAt: Date;
  sourceAccount: string;
  feePaid: number;
  operationCount: number;
  status: TransactionStatus;
  memo?: Memo;
  operations: Operation[];
}

export interface Operation {
  id: string;
  type: string;
  sourceAccount?: string;
  createdAt: Date;
  details: PaymentOperation | CreateAccountOperation | otherOperationTypes;
}

export interface PaymentOperation {
  type: 'payment';
  from: string;
  to: string;
  amount: string;
  asset: Asset;
  memo?: string;
}

export interface CreateAccountOperation {
  type: 'create_account';
  source: string;
  destination: string;
  startingBalance: string;
}

export interface otherOperationTypes {
  type: string;
  [key: string]: any;
}

// ============================================================================
// Transaction History Types
// ============================================================================

export interface TransactionHistoryOptions {
  limit?: number;
  cursor?: string;
  order?: 'asc' | 'desc';
  includeFailed?: boolean;
}

export interface TransactionHistory {
  transactions: Transaction[];
  cursor?: string;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface PaymentValidationOptions {
  checkBalance?: boolean;
  checkDestination?: boolean;
  checkAsset?: boolean;
  minimumFee?: number;
  maximumAmount?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export class StellarError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'StellarError';
  }
}

export class NetworkError extends StellarError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends StellarError {
  constructor(message: string, public validationErrors: string[]) {
    super(message, 'VALIDATION_ERROR', validationErrors);
    this.name = 'ValidationError';
  }
}

export class TransactionError extends StellarError {
  constructor(message: string, public transactionHash?: string, details?: any) {
    super(message, 'TRANSACTION_ERROR', details);
    this.name = 'TransactionError';
  }
}

export class InsufficientBalanceError extends StellarError {
  constructor(message: string, public required: string, public available: string) {
    super(message, 'INSUFFICIENT_BALANCE', { required, available });
    this.name = 'InsufficientBalanceError';
  }
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface OrbyTechSDKConfig {
  network: NetworkConfig;
  defaultFee?: number;
  defaultTimeout?: number;
  enableLogging?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  customHorizon?: string;
  customSorobanRpc?: string;
}

export interface SDKOptions {
  network?: StellarNetwork;
  horizonUrl?: string;
  sorobanRpcUrl?: string;
  networkPassphrase?: string;
  fee?: number;
  timeout?: number;
}

// ============================================================================
// Utility Types
// ============================================================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type AsyncFunction<T = void> = () => Promise<T>;

export type EventHandler<T = any> = (event: T) => void;

export type EventMap = {
  'wallet:connected': StellarWallet;
  'wallet:disconnected': void;
  'transaction:created': Transaction;
  'transaction:success': Transaction;
  'transaction:failed': TransactionError;
  'balance:updated': Balance[];
  'error': StellarError;
};

// ============================================================================
// API Response Types
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// ============================================================================
// Contract Types (for Soroban integration)
// ============================================================================

export interface ContractInfo {
  contractId: string;
  wasmHash: string;
  createdAt: Date;
  createdBy: string;
}

export interface ContractCall {
  contractId: string;
  method: string;
  args?: any[];
  signers?: string[];
  fee?: number;
}

export interface ContractCallResult {
  success: boolean;
  result?: any;
  error?: string;
  gasUsed?: number;
}

// ============================================================================
// Export all types
// ============================================================================

export * from './zod-schemas';

// Re-export validation functions for convenience
export {
  validateStellarAddress,
  validateStellarSecretKey,
  validateAmount,
  validateAssetCode,
  validateMemo,
  validateTransactionHash,
} from './zod-schemas';

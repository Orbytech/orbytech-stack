import { z } from 'zod';

// ============================================================================
// Network Configuration Schemas
// ============================================================================

export const StellarNetworkSchema = z.enum(['testnet', 'mainnet', 'futurenet', 'standalone']);

export const NetworkConfigSchema = z.object({
  network: StellarNetworkSchema,
  horizonUrl: z.string().url(),
  sorobanRpcUrl: z.string().url(),
  networkPassphrase: z.string().min(1),
});

// ============================================================================
// Wallet Schemas
// ============================================================================

export const StellarWalletSchema = z.object({
  publicKey: z.string().regex(/^G[A-Z0-9]{55}$/, 'Invalid Stellar public key format'),
  secretKey: z.string().regex(/^S[A-Z0-9]{55}$/, 'Invalid Stellar secret key format').optional(),
  network: StellarNetworkSchema.optional(),
});

export const WalletInfoSchema = z.object({
  publicKey: z.string().regex(/^G[A-Z0-9]{55}$/),
  balance: z.string(),
  balances: z.array(z.any()), // Balance schema is complex, using any for now
  network: StellarNetworkSchema,
  createdAt: z.date().optional(),
});

// ============================================================================
// Balance Schemas
// ============================================================================

export const BalanceSchema = z.object({
  balance: z.string(),
  assetType: z.enum(['native', 'credit_alphanum4', 'credit_alphanum12']),
  assetCode: z.string(),
  assetIssuer: z.string().regex(/^G[A-Z0-9]{55}$/).optional(),
  limit: z.string().optional(),
  isAuthorized: z.boolean().optional(),
  isAuthorizedToMaintainLiabilities: z.boolean().optional(),
  lastModifiedLedger: z.number().optional(),
});

// ============================================================================
// Payment Schemas
// ============================================================================

export const AssetSchema = z.object({
  code: z.string().min(1).max(12),
  issuer: z.string().regex(/^G[A-Z0-9]{55}$/).optional(),
  type: z.enum(['native', 'credit_alphanum4', 'credit_alphanum12']),
});

export const MemoSchema = z.object({
  type: z.enum(['none', 'text', 'id', 'hash', 'return']),
  value: z.string().optional(),
});

export const PaymentRequestSchema = z.object({
  from: z.string().regex(/^G[A-Z0-9]{55}$/, 'Invalid sender address'),
  to: z.string().regex(/^G[A-Z0-9]{55}$/, 'Invalid recipient address'),
  amount: z.string().regex(/^\d+(\.\d+)?$/, 'Amount must be a valid number')
    .refine(val => parseFloat(val) > 0, 'Amount must be greater than 0'),
  asset: z.union([z.string(), AssetSchema]).optional(),
  memo: z.union([z.string(), MemoSchema]).optional(),
  fee: z.number().min(100).max(100000).optional(),
  timeout: z.number().min(0).max(300).optional(),
}).refine(data => data.from !== data.to, 'Sender and recipient must be different');

export const PaymentResponseSchema = z.object({
  success: z.boolean(),
  hash: z.string().regex(/^[a-fA-F0-9]{64}$/).optional(),
  transactionXDR: z.string().optional(),
  error: z.string().optional(),
  fee: z.number().optional(),
  status: z.enum(['pending', 'success', 'failed', 'timeout']).optional(),
});

// ============================================================================
// Transaction Schemas
// ============================================================================

export const TransactionStatusSchema = z.enum(['pending', 'success', 'failed', 'timeout']);

export const PaymentOperationSchema = z.object({
  type: z.literal('payment'),
  from: z.string().regex(/^G[A-Z0-9]{55}$/),
  to: z.string().regex(/^G[A-Z0-9]{55}$/),
  amount: z.string(),
  asset: AssetSchema,
  memo: z.string().optional(),
});

export const CreateAccountOperationSchema = z.object({
  type: z.literal('create_account'),
  source: z.string().regex(/^G[A-Z0-9]{55}$/),
  destination: z.string().regex(/^G[A-Z0-9]{55}$/),
  startingBalance: z.string(),
});

export const OperationSchema = z.object({
  id: z.string(),
  type: z.string(),
  sourceAccount: z.string().regex(/^G[A-Z0-9]{55}$/).optional(),
  createdAt: z.date(),
  details: z.union([PaymentOperationSchema, CreateAccountOperationSchema, z.any()]),
});

export const TransactionSchema = z.object({
  hash: z.string().regex(/^[a-fA-F0-9]{64}$/),
  ledger: z.number(),
  createdAt: z.date(),
  sourceAccount: z.string().regex(/^G[A-Z0-9]{55}$/),
  feePaid: z.number(),
  operationCount: z.number(),
  status: TransactionStatusSchema,
  memo: MemoSchema.optional(),
  operations: z.array(OperationSchema),
});

// ============================================================================
// Transaction History Schemas
// ============================================================================

export const TransactionHistoryOptionsSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  cursor: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  includeFailed: z.boolean().optional(),
});

export const TransactionHistorySchema = z.object({
  transactions: z.array(TransactionSchema),
  cursor: z.string().optional(),
  hasNext: z.boolean(),
  hasPrevious: z.boolean(),
});

// ============================================================================
// Validation Schemas
// ============================================================================

export const ValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()).optional(),
});

export const PaymentValidationOptionsSchema = z.object({
  checkBalance: z.boolean().optional(),
  checkDestination: z.boolean().optional(),
  checkAsset: z.boolean().optional(),
  minimumFee: z.number().optional(),
  maximumAmount: z.string().optional(),
});

// ============================================================================
// Configuration Schemas
// ============================================================================

export const OrbyTechSDKConfigSchema = z.object({
  network: NetworkConfigSchema,
  defaultFee: z.number().min(100).max(100000).optional(),
  defaultTimeout: z.number().min(0).max(300).optional(),
  enableLogging: z.boolean().optional(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  customHorizon: z.string().url().optional(),
  customSorobanRpc: z.string().url().optional(),
});

export const SDKOptionsSchema = z.object({
  network: StellarNetworkSchema.optional(),
  horizonUrl: z.string().url().optional(),
  sorobanRpcUrl: z.string().url().optional(),
  networkPassphrase: z.string().min(1).optional(),
  fee: z.number().min(100).max(100000).optional(),
  timeout: z.number().min(0).max(300).optional(),
});

// ============================================================================
// API Response Schemas
// ============================================================================

export const APIResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }).optional(),
  timestamp: z.date(),
});

export const PaginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrevious: z.boolean(),
});

export const PaginatedResponseSchema = APIResponseSchema.extend({
  data: z.array(z.any()).optional(),
  pagination: PaginationSchema.optional(),
});

// ============================================================================
// Contract Schemas
// ============================================================================

export const ContractInfoSchema = z.object({
  contractId: z.string(),
  wasmHash: z.string(),
  createdAt: z.date(),
  createdBy: z.string().regex(/^G[A-Z0-9]{55}$/),
});

export const ContractCallSchema = z.object({
  contractId: z.string(),
  method: z.string(),
  args: z.array(z.any()).optional(),
  signers: z.array(z.string().regex(/^G[A-Z0-9]{55}$/)).optional(),
  fee: z.number().min(100).max(100000).optional(),
});

export const ContractCallResultSchema = z.object({
  success: z.boolean(),
  result: z.any().optional(),
  error: z.string().optional(),
  gasUsed: z.number().optional(),
});

// ============================================================================
// Validation Functions
// ============================================================================

export const validateStellarAddress = (address: string): boolean => {
  return /^G[A-Z0-9]{55}$/.test(address);
};

export const validateStellarSecretKey = (secretKey: string): boolean => {
  return /^S[A-Z0-9]{55}$/.test(secretKey);
};

export const validateAmount = (amount: string): boolean => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= 1000000000000; // Max 1T XLM
};

export const validateAssetCode = (code: string): boolean => {
  return code.length >= 1 && code.length <= 12 && /^[A-Z0-9]+$/.test(code);
};

export const validateMemo = (memo: string): boolean => {
  return memo.length <= 28;
};

export const validateTransactionHash = (hash: string): boolean => {
  return /^[a-fA-F0-9]{64}$/.test(hash);
};

// ============================================================================
// Type Guards
// ============================================================================

export const isPaymentOperation = (operation: any): operation is PaymentOperationSchema._type => {
  return operation?.type === 'payment';
};

export const isCreateAccountOperation = (operation: any): operation is CreateAccountOperationSchema._type => {
  return operation?.type === 'create_account';
};

export const isNativeAsset = (asset: AssetSchema._type): boolean => {
  return asset.type === 'native' || asset.code === 'XLM';
};

export const isCreditAsset = (asset: AssetSchema._type): boolean => {
  return asset.type !== 'native' && !!asset.issuer;
};

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_NETWORK_CONFIGS = {
  testnet: {
    network: 'testnet' as const,
    horizonUrl: 'https://horizon-testnet.stellar.org',
    sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
    networkPassphrase: 'Test SDF Network ; September 2015',
  },
  mainnet: {
    network: 'mainnet' as const,
    horizonUrl: 'https://horizon.stellar.org',
    sorobanRpcUrl: 'https://soroban.stellar.org',
    networkPassphrase: 'Public Global Stellar Network ; September 2015',
  },
  futurenet: {
    network: 'futurenet' as const,
    horizonUrl: 'https://horizon-futurenet.stellar.org',
    sorobanRpcUrl: 'https://soroban-futurenet.stellar.org',
    networkPassphrase: 'Test SDF Future Network ; October 2022',
  },
  standalone: {
    network: 'standalone' as const,
    horizonUrl: 'http://localhost:8000',
    sorobanRpcUrl: 'http://localhost:8000/soroban/rpc',
    networkPassphrase: 'Standalone Network ; February 2017',
  },
};

export const DEFAULT_CONFIG = {
  defaultFee: 100,
  defaultTimeout: 30,
  enableLogging: false,
  logLevel: 'info' as const,
};

// ============================================================================
// Export schemas and validators
// ============================================================================

export {
  StellarNetworkSchema,
  NetworkConfigSchema,
  StellarWalletSchema,
  WalletInfoSchema,
  BalanceSchema,
  AssetSchema,
  MemoSchema,
  PaymentRequestSchema,
  PaymentResponseSchema,
  TransactionSchema,
  TransactionHistoryOptionsSchema,
  TransactionHistorySchema,
  ValidationResultSchema,
  OrbyTechSDKConfigSchema,
  SDKOptionsSchema,
  APIResponseSchema,
  ContractInfoSchema,
  ContractCallSchema,
  ContractCallResultSchema,
};

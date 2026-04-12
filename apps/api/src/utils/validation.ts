import { z } from 'zod';

// Common validation schemas
export const stellarAddressSchema = z.string()
  .min(56, 'Stellar address must be 56 characters')
  .max(56, 'Stellar address must be 56 characters')
  .regex(/^G[A-Z0-9]{55}$/, 'Invalid Stellar address format');

export const amountSchema = z.string()
  .regex(/^\d+(\.\d+)?$/, 'Amount must be a valid number')
  .refine(val => parseFloat(val) > 0, {
    message: 'Amount must be greater than 0',
  });

export const assetSchema = z.string()
  .refine(val => {
    if (val === 'XLM' || val === 'native') return true;
    const parts = val.split(':');
    return parts.length === 2 && 
           parts[0].length > 0 && parts[0].length <= 12 &&
           parts[1].length === 56 &&
           /^[A-Z0-9]{55}$/.test(parts[1]);
  }, {
    message: 'Invalid asset format. Use "XLM" or "CODE:ISSUER"',
  });

export const memoSchema = z.string()
  .max(28, 'Memo must be at most 28 characters')
  .optional();

export const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1).default(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100).default(10)).optional(),
  cursor: z.string().optional(),
});

// Request validation schemas
export const createWalletRequestSchema = z.object({
  fund: z.boolean().default(false),
});

export const fundWalletRequestSchema = z.object({
  address: stellarAddressSchema,
});

export const sendPaymentRequestSchema = z.object({
  from: stellarAddressSchema,
  to: stellarAddressSchema,
  amount: amountSchema,
  asset: assetSchema.default('XLM'),
  memo: memoSchema,
}).refine(data => data.from !== data.to, {
  message: 'Sender and recipient addresses must be different',
  path: ['to'],
});

export const submitTransactionRequestSchema = z.object({
  transactionXDR: z.string().min(1, 'Transaction XDR is required'),
});

export const getTransactionRequestSchema = z.object({
  hash: z.string().regex(/^[a-fA-F0-9]{64}$/, 'Invalid transaction hash format'),
});

// Response validation schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }).optional(),
  timestamp: z.date(),
});

export const stellarAccountSchema = z.object({
  publicKey: stellarAddressSchema,
  secretKey: stellarAddressSchema.optional(),
  balance: z.string().optional(),
});

export const stellarBalanceSchema = z.object({
  balance: z.string(),
  assetType: z.string(),
  assetCode: z.string(),
  assetIssuer: z.string().optional(),
});

export const paymentResponseSchema = z.object({
  hash: z.string(),
  status: z.enum(['success', 'failed', 'pending']),
  error: z.string().optional(),
  timestamp: z.date(),
  from: stellarAddressSchema,
  to: stellarAddressSchema,
  amount: amountSchema,
  asset: assetSchema,
  memo: memoSchema,
});

// Validation helpers
export const validateStellarAddress = (address: string): boolean => {
  return stellarAddressSchema.safeParse(address).success;
};

export const validateAmount = (amount: string): boolean => {
  return amountSchema.safeParse(amount).success;
};

export const validateAsset = (asset: string): boolean => {
  return assetSchema.safeParse(asset).success;
};

export const validateMemo = (memo?: string): boolean => {
  if (!memo) return true;
  return memoSchema.safeParse(memo).success;
};

// Error messages
export const VALIDATION_ERRORS = {
  INVALID_ADDRESS: 'Invalid Stellar address format',
  INVALID_AMOUNT: 'Amount must be a valid positive number',
  INVALID_ASSET: 'Invalid asset format. Use "XLM" or "CODE:ISSUER"',
  INVALID_MEMO: 'Memo must be at most 28 characters',
  SAME_ADDRESSES: 'Sender and recipient addresses must be different',
  REQUIRED_FIELD: (field: string) => `${field} is required`,
  INVALID_FORMAT: (field: string) => `Invalid ${field} format`,
} as const;

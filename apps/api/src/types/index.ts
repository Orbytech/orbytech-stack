export interface StellarAccount {
  publicKey: string;
  secretKey?: string;
  balance?: string;
}

export interface StellarBalance {
  balance: string;
  assetType: string;
  assetCode: string;
  assetIssuer?: string;
}

export interface PaymentRequest {
  from: string;
  to: string;
  amount: string;
  asset?: string;
  memo?: string;
}

export interface PaymentResponse {
  hash: string;
  status: 'success' | 'failed' | 'pending';
  error?: string;
  timestamp: Date;
  from: string;
  to: string;
  amount: string;
  asset: string;
  memo?: string;
}

export interface WalletCreateResponse {
  publicKey: string;
  secretKey: string;
  network: string;
}

export interface WalletInfoResponse {
  publicKey: string;
  balance: StellarBalance[];
  network: string;
  createdAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

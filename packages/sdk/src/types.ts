export interface StellarAccount {
  publicKey: string;
  secretKey?: string;
  balance?: string;
}

export interface SorobanContract {
  contractId: string;
  wasmId?: string;
  address?: string;
}

export interface PaymentContract extends SorobanContract {
  recipient: string;
  amount: string;
  token: string;
  memo?: string;
}

export interface StreamingContract extends SorobanContract {
  sender: string;
  recipient: string;
  totalAmount: string;
  token: string;
  startTime: Date;
  endTime: Date;
  interval: number; // in seconds
}

export interface TransactionResult {
  hash: string;
  status: 'success' | 'failed' | 'pending';
  error?: string;
  timestamp: Date;
}

export interface NetworkConfig {
  network: 'mainnet' | 'testnet' | 'futurenet' | 'standalone';
  horizonUrl: string;
  sorobanRpcUrl: string;
  networkPassphrase: string;
}

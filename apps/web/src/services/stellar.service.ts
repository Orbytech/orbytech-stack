import { 
  Keypair, 
  TransactionBuilder, 
  Networks, 
  Server, 
  Horizon,
  Asset,
  Operation,
  Memo,
  MemoType,
  AccountResponse
} from 'stellar-sdk';
import axios from 'axios';

export interface StellarAccount {
  publicKey: string;
  secretKey?: string;
  balance?: string;
  balances?: StellarBalance[];
}

export interface StellarBalance {
  balance: string;
  asset_type: string;
  asset_code: string;
  asset_issuer?: string;
}

export interface PaymentRequest {
  from: string;
  to: string;
  amount: string;
  asset?: string;
  memo?: string;
}

export interface PaymentResponse {
  success: boolean;
  hash?: string;
  error?: string;
  transactionXDR?: string;
}

export interface Transaction {
  hash: string;
  created_at: string;
  source_account: string;
  operations: PaymentOperation[];
}

export interface PaymentOperation {
  type: string;
  destination: string;
  amount: string;
  asset_code: string;
  asset_issuer?: string;
}

export interface NetworkConfig {
  network: 'testnet' | 'mainnet' | 'futurenet' | 'standalone';
  horizonUrl: string;
  sorobanRpcUrl: string;
  networkPassphrase: string;
}

class StellarService {
  private server: Server;
  private network: string;
  private apiBaseUrl: string;

  constructor() {
    // Default to testnet
    this.network = 'Test SDF Network ; September 2015';
    this.server = new Server('https://horizon-testnet.stellar.org');
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  /**
   * Set network configuration
   */
  setNetwork(config: NetworkConfig) {
    this.network = config.networkPassphrase;
    this.server = new Server(config.horizonUrl);
  }

  /**
   * Create a new Stellar account
   */
  createAccount(): StellarAccount {
    const keypair = Keypair.random();
    
    return {
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret(),
    };
  }

  /**
   * Get account information from the API
   */
  async getAccountInfo(publicKey: string): Promise<StellarAccount> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/api/v1/wallet/${publicKey}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || 'Failed to get account info');
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Account not found');
      }
      throw new Error(error.message || 'Failed to get account info');
    }
  }

  /**
   * Fund a testnet account using the API
   */
  async fundTestnetAccount(publicKey: string): Promise<boolean> {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/api/v1/wallet/fund`, {
        address: publicKey,
      });
      
      return response.data.success && response.data.data.funded;
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Failed to fund account');
    }
  }

  /**
   * Create a payment transaction
   */
  async createPaymentTransaction(payment: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/api/v1/payment/send`, payment);
      
      if (response.data.success) {
        return {
          success: true,
          hash: response.data.data.hash,
          transactionXDR: response.data.data.transactionXDR,
        };
      } else {
        return {
          success: false,
          error: response.data.error?.message || 'Failed to create payment',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to create payment',
      };
    }
  }

  /**
   * Submit a signed transaction
   */
  async submitTransaction(transactionXDR: string): Promise<PaymentResponse> {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/api/v1/payment/submit`, {
        transactionXDR,
      });
      
      if (response.data.success) {
        return {
          success: true,
          hash: response.data.data.hash,
        };
      } else {
        return {
          success: false,
          error: response.data.error?.message || 'Transaction failed',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Transaction submission failed',
      };
    }
  }

  /**
   * Get transaction history for an account
   */
  async getTransactionHistory(publicKey: string, limit: number = 10): Promise<Transaction[]> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/api/v1/payment/history/${publicKey}`, {
        params: { limit },
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || 'Failed to get transaction history');
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw new Error(error.message || 'Failed to get transaction history');
    }
  }

  /**
   * Get transaction details
   */
  async getTransactionDetails(hash: string): Promise<Transaction | null> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/api/v1/payment/transaction/${hash}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || 'Transaction not found');
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(error.message || 'Failed to get transaction details');
    }
  }

  /**
   * Sign a transaction with a secret key
   */
  signTransaction(transactionXDR: string, secretKey: string): string {
    try {
      const keypair = Keypair.fromSecret(secretKey);
      const transaction = TransactionBuilder.fromXDR(transactionXDR, this.network);
      transaction.sign(keypair);
      
      return transaction.toXDR();
    } catch (error) {
      throw new Error('Failed to sign transaction');
    }
  }

  /**
   * Validate a Stellar address
   */
  validateAddress(address: string): boolean {
    try {
      Keypair.fromPublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  validateSecretKey(secretKey: string): boolean {
    try {
      Keypair.fromSecret(secretKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Parse asset from string
   */
  parseAsset(assetString: string): Asset {
    if (assetString === 'XLM' || assetString === 'native') {
      return Asset.native();
    }

    const parts = assetString.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid asset format. Use "XLM" or "CODE:ISSUER"');
    }

    const [code, issuer] = parts;
    return new Asset(code, issuer);
  }

  /**
   * Get network information
   */
  getNetworkInfo(): NetworkConfig {
    return {
      network: this.network === 'Test SDF Network ; September 2015' ? 'testnet' : 'mainnet',
      horizonUrl: this.server.serverURL.toString(),
      sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
      networkPassphrase: this.network,
    };
  }

  /**
   * Estimate transaction fee
   */
  async estimateFee(): Promise<number> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/api/v1/payment/fee`);
      
      if (response.data.success) {
        return response.data.data.fee;
      } else {
        throw new Error(response.data.error?.message || 'Failed to estimate fee');
      }
    } catch (error: any) {
      // Return default fee if API fails
      return 100;
    }
  }

  /**
   * Validate payment parameters
   */
  async validatePayment(payment: PaymentRequest): Promise<{
    valid: boolean;
    errors: string[];
    estimatedFee?: number;
  }> {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/api/v1/payment/validate`, payment);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || 'Validation failed');
      }
    } catch (error: any) {
      return {
        valid: false,
        errors: [error.response?.data?.error?.message || 'Validation failed'],
      };
    }
  }
}

// Singleton instance
export const stellarService = new StellarService();

export default stellarService;

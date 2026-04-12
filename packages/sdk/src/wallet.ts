import { Keypair, Server } from 'stellar-sdk';
import { 
  StellarWallet, 
  WalletInfo, 
  Balance, 
  NetworkConfig,
  StellarError,
  NetworkError,
  ValidationError,
  validateStellarAddress,
  validateStellarSecretKey,
  DEFAULT_NETWORK_CONFIGS
} from './types';

// Add fetch polyfill for Node.js environment
if (typeof fetch === 'undefined') {
  (global as any).fetch = (await import('node-fetch')).default;
}

/**
 * Wallet management functionality for the OrbyTech SDK
 */
export class WalletManager {
  private server: Server;
  private networkConfig: NetworkConfig;

  constructor(networkConfig?: Partial<NetworkConfig>) {
    this.networkConfig = {
      ...DEFAULT_NETWORK_CONFIGS.testnet,
      ...networkConfig,
    };
    this.server = new Server(this.networkConfig.horizonUrl);
  }

  /**
   * Create a new Stellar wallet
   * @returns New wallet with public and secret keys
   */
  createWallet(): StellarWallet {
    try {
      const keypair = Keypair.random();
      
      return {
        publicKey: keypair.publicKey(),
        secretKey: keypair.secret(),
        network: this.networkConfig.network,
      };
    } catch (error) {
      throw new StellarError(
        'Failed to create wallet',
        'WALLET_CREATION_FAILED',
        error
      );
    }
  }

  /**
   * Create wallet from secret key
   * @param secretKey Stellar secret key
   * @returns Wallet information
   */
  createWalletFromSecret(secretKey: string): StellarWallet {
    try {
      if (!validateStellarSecretKey(secretKey)) {
        throw new ValidationError('Invalid secret key format', ['Secret key must be 56 characters starting with S']);
      }

      const keypair = Keypair.fromSecret(secretKey);
      
      return {
        publicKey: keypair.publicKey(),
        secretKey: keypair.secret(),
        network: this.networkConfig.network,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new StellarError(
        'Failed to create wallet from secret key',
        'WALLET_FROM_SECRET_FAILED',
        error
      );
    }
  }

  /**
   * Get wallet information including balances
   * @param publicKey Stellar public key
   * @returns Complete wallet information
   */
  async getWalletInfo(publicKey: string): Promise<WalletInfo> {
    try {
      if (!validateStellarAddress(publicKey)) {
        throw new ValidationError('Invalid public key format', ['Public key must be 56 characters starting with G']);
      }

      const account = await this.server.loadAccount(publicKey);
      const balances = this.parseBalances(account.balances);

      return {
        publicKey,
        balance: balances.find(b => b.assetCode === 'XLM')?.balance || '0',
        balances,
        network: this.networkConfig.network,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new StellarError(
          'Account not found on the network',
          'ACCOUNT_NOT_FOUND',
          { publicKey }
        );
      }
      throw new NetworkError(
        'Failed to get wallet information',
        error
      );
    }
  }

  /**
   * Get wallet balance for a specific asset
   * @param publicKey Stellar public key
   * @param assetCode Asset code (default: 'XLM')
   * @param assetIssuer Asset issuer (for non-native assets)
   * @returns Balance for the specified asset
   */
  async getBalance(
    publicKey: string, 
    assetCode: string = 'XLM', 
    assetIssuer?: string
  ): Promise<Balance | null> {
    try {
      const walletInfo = await this.getWalletInfo(publicKey);
      
      const balance = walletInfo.balances.find((b: Balance) => 
        b.assetCode === assetCode && 
        (!assetIssuer || b.assetIssuer === assetIssuer)
      );

      return balance || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all wallet balances
   * @param publicKey Stellar public key
   * @returns Array of all balances
   */
  async getBalances(publicKey: string): Promise<Balance[]> {
    try {
      const walletInfo = await this.getWalletInfo(publicKey);
      return walletInfo.balances;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate wallet address
   * @param address Stellar address to validate
   * @returns True if valid
   */
  validateAddress(address: string): boolean {
    return validateStellarAddress(address);
  }

  /**
   * Validate secret key
   * @param secretKey Stellar secret key to validate
   * @returns True if valid
   */
  validateSecretKey(secretKey: string): boolean {
    return validateStellarSecretKey(secretKey);
  }

  /**
   * Check if wallet exists on the network
   * @param publicKey Stellar public key
   * @returns True if wallet exists
   */
  async walletExists(publicKey: string): Promise<boolean> {
    try {
      await this.server.loadAccount(publicKey);
      return true;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return false;
      }
      throw new NetworkError(
        'Failed to check if wallet exists',
        error
      );
    }
  }

  /**
   * Fund a testnet wallet using friendbot
   * @param publicKey Stellar public key
   * @returns True if funding was successful
   */
  async fundTestnetWallet(publicKey: string): Promise<boolean> {
    if (this.networkConfig.network !== 'testnet') {
      throw new StellarError(
        'Wallet funding is only available on testnet',
        'FUNDING_NOT_AVAILABLE'
      );
    }

    try {
      const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
      
      if (!response.ok) {
        throw new NetworkError(
          `Friendbot request failed: ${response.statusText}`,
          { status: response.status, statusText: response.statusText }
        );
      }

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error;
      }
      throw new NetworkError(
        'Failed to fund testnet wallet',
        error
      );
    }
  }

  /**
   * Get minimum balance required for an account
   * @param subentries Number of subentries (optional)
   * @returns Minimum balance in stroops
   */
  getMinimumBalance(subentries: number = 0): number {
    // Base reserve is 1 XLM (10000000 stroops)
    // Each subentry adds 0.5 XLM (5000000 stroops)
    const baseReserve = 10000000; // 1 XLM in stroops
    const subentryReserve = 5000000; // 0.5 XLM in stroops
    
    return baseReserve + (subentries * subentryReserve);
  }

  /**
   * Check if account has sufficient balance for operations
   * @param publicKey Stellar public key
   * @param requiredAmount Amount required in stroops
   * @param subentries Number of subentries to consider
   * @returns True if sufficient balance
   */
  async hasSufficientBalance(
    publicKey: string, 
    requiredAmount: number, 
    subentries: number = 0
  ): Promise<boolean> {
    try {
      const balance = await this.getBalance(publicKey, 'XLM');
      
      if (!balance) {
        return false;
      }

      const balanceInStroops = Math.floor(parseFloat(balance.balance) * 10000000);
      const minimumBalance = this.getMinimumBalance(subentries);
      
      return balanceInStroops >= (minimumBalance + requiredAmount);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Parse Stellar API balance response to our Balance type
   * @param stellarBalances Balance response from Stellar API
   * @returns Parsed balances
   */
  private parseBalances(stellarBalances: any[]): Balance[] {
    return stellarBalances.map(balance => ({
      balance: balance.balance,
      assetType: balance.asset_type,
      assetCode: balance.asset_code || 'XLM',
      assetIssuer: balance.asset_issuer,
      limit: balance.limit,
      isAuthorized: balance.is_authorized,
      isAuthorizedToMaintainLiabilities: balance.is_authorized_to_maintain_liabilities,
      lastModifiedLedger: balance.last_modified_ledger,
    }));
  }

  /**
   * Update network configuration
   * @param networkConfig New network configuration
   */
  updateNetworkConfig(networkConfig: Partial<NetworkConfig>): void {
    this.networkConfig = { ...this.networkConfig, ...networkConfig };
    this.server = new Server(this.networkConfig.horizonUrl);
  }

  /**
   * Get current network configuration
   * @returns Current network configuration
   */
  getNetworkConfig(): NetworkConfig {
    return { ...this.networkConfig };
  }

  /**
   * Get Stellar server instance
   * @returns Stellar server instance
   */
  getServer(): Server {
    return this.server;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create a new wallet with default testnet configuration
 * @returns New wallet
 */
export function createWallet(): StellarWallet {
  const walletManager = new WalletManager();
  return walletManager.createWallet();
}

/**
 * Create wallet from secret key with default testnet configuration
 * @param secretKey Stellar secret key
 * @returns Wallet information
 */
export function createWalletFromSecret(secretKey: string): StellarWallet {
  const walletManager = new WalletManager();
  return walletManager.createWalletFromSecret(secretKey);
}

/**
 * Get wallet information with default testnet configuration
 * @param publicKey Stellar public key
 * @returns Wallet information
 */
export async function getWalletInfo(publicKey: string): Promise<WalletInfo> {
  const walletManager = new WalletManager();
  return walletManager.getWalletInfo(publicKey);
}

/**
 * Get wallet balance with default testnet configuration
 * @param publicKey Stellar public key
 * @param assetCode Asset code (default: 'XLM')
 * @param assetIssuer Asset issuer (for non-native assets)
 * @returns Balance for the specified asset
 */
export async function getBalance(
  publicKey: string,
  assetCode: string = 'XLM',
  assetIssuer?: string
): Promise<Balance | null> {
  const walletManager = new WalletManager();
  return walletManager.getBalance(publicKey, assetCode, assetIssuer);
}

/**
 * Fund a testnet wallet with default configuration
 * @param publicKey Stellar public key
 * @returns True if funding was successful
 */
export async function fundTestnetWallet(publicKey: string): Promise<boolean> {
  const walletManager = new WalletManager();
  return walletManager.fundTestnetWallet(publicKey);
}

/**
 * Validate Stellar address
 * @param address Stellar address to validate
 * @returns True if valid
 */
export function validateAddress(address: string): boolean {
  return validateStellarAddress(address);
}

/**
 * Validate Stellar secret key
 * @param secretKey Stellar secret key to validate
 * @returns True if valid
 */
export function validateSecretKey(secretKey: string): boolean {
  return validateStellarSecretKey(secretKey);
}

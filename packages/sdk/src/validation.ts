import {
  PaymentRequest,
  ValidationResult,
  PaymentValidationOptions,
  StellarWallet,
  NetworkConfig,
  ValidationError,
  StellarError,
  validateStellarAddress,
  validateStellarSecretKey,
  validateAmount,
  validateAssetCode,
  validateMemo,
  validateTransactionHash,
} from './types';
import { WalletManager } from './wallet';

/**
 * Validation utilities for the OrbyTech SDK
 */
export class ValidationManager {
  private walletManager: WalletManager;

  constructor(networkConfig?: Partial<NetworkConfig>) {
    this.walletManager = new WalletManager(networkConfig);
  }

  /**
   * Validate Stellar wallet
   * @param wallet Wallet to validate
   * @returns Validation result
   */
  validateWallet(wallet: StellarWallet): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate public key
    if (!validateStellarAddress(wallet.publicKey)) {
      errors.push('Invalid public key format');
    }

    // Validate secret key if provided
    if (wallet.secretKey && !validateStellarSecretKey(wallet.secretKey)) {
      errors.push('Invalid secret key format');
    }

    // Check if keys match
    if (wallet.secretKey && wallet.publicKey) {
      try {
        const derivedPublicKey = this.walletManager.createWalletFromSecret(wallet.secretKey).publicKey;
        if (derivedPublicKey !== wallet.publicKey) {
          errors.push('Secret key does not match public key');
        }
      } catch (error) {
        errors.push('Invalid key pair');
      }
    }

    // Check if wallet exists on network
    if (validateStellarAddress(wallet.publicKey)) {
      this.walletManager.walletExists(wallet.publicKey)
        .then(exists => {
          if (!exists) {
            warnings.push('Wallet not found on the network');
          }
        })
        .catch(() => {
          // Ignore network errors during validation
        });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate payment request
   * @param payment Payment request to validate
   * @param options Validation options
   * @returns Validation result
   */
  async validatePaymentRequest(
    payment: PaymentRequest,
    options: PaymentValidationOptions = {}
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate addresses
    if (!validateStellarAddress(payment.from)) {
      errors.push('Invalid sender address');
    }

    if (!validateStellarAddress(payment.to)) {
      errors.push('Invalid recipient address');
    }

    // Validate addresses are different
    if (payment.from === payment.to) {
      errors.push('Sender and recipient must be different');
    }

    // Validate amount
    if (!validateAmount(payment.amount)) {
      errors.push('Invalid amount format');
    } else {
      const amount = parseFloat(payment.amount);
      if (amount <= 0) {
        errors.push('Amount must be greater than 0');
      }
      if (amount > 1000000000000) {
        errors.push('Amount exceeds maximum limit');
      }
      if (options.maximumAmount && amount > parseFloat(options.maximumAmount)) {
        errors.push('Amount exceeds specified maximum');
      }
    }

    // Validate asset
    if (payment.asset && payment.asset !== 'XLM') {
      if (typeof payment.asset === 'string') {
        const parts = payment.asset.split(':');
        if (parts.length !== 2) {
          errors.push('Invalid asset format. Use "XLM" or "CODE:ISSUER"');
        } else {
          const [code, issuer] = parts;
          if (!validateAssetCode(code)) {
            errors.push('Invalid asset code');
          }
          if (!validateStellarAddress(issuer)) {
            errors.push('Invalid asset issuer');
          }
        }
      }
    }

    // Validate memo
    if (payment.memo && typeof payment.memo === 'string') {
      if (!validateMemo(payment.memo)) {
        errors.push('Memo too long (max 28 characters)');
      }
    }

    // Validate fee
    if (payment.fee) {
      if (payment.fee < 100) {
        errors.push('Fee too low (minimum 100 stroops)');
      }
      if (payment.fee > 100000) {
        errors.push('Fee too high (maximum 100000 stroops)');
      }
      if (options.minimumFee && payment.fee < options.minimumFee) {
        errors.push('Fee below minimum required');
      }
    }

    // Validate timeout
    if (payment.timeout && (payment.timeout < 0 || payment.timeout > 300)) {
      errors.push('Invalid timeout (must be between 0 and 300 seconds)');
    }

    // Check destination account exists
    if (options.checkDestination && validateStellarAddress(payment.to)) {
      try {
        const exists = await this.walletManager.walletExists(payment.to);
        if (!exists) {
          errors.push('Recipient account does not exist');
        }
      } catch (error) {
        warnings.push('Could not verify recipient account existence');
      }
    }

    // Check balance
    if (options.checkBalance && validateStellarAddress(payment.from)) {
      try {
        const asset = payment.asset || 'XLM';
        const hasSufficient = await this.checkSufficientBalance(
          payment.from,
          payment.amount,
          asset
        );
        if (!hasSufficient) {
          errors.push('Insufficient balance for payment');
        }
      } catch (error) {
        warnings.push('Could not verify sufficient balance');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate asset
   * @param asset Asset string or object
   * @returns Validation result
   */
  validateAsset(asset: string | { code: string; issuer?: string }): ValidationResult {
    const errors: string[] = [];

    if (typeof asset === 'string') {
      if (asset === 'XLM' || asset === 'native') {
        return { valid: true, errors: [] };
      }

      const parts = asset.split(':');
      if (parts.length !== 2) {
        errors.push('Invalid asset format. Use "XLM" or "CODE:ISSUER"');
        return { valid: false, errors };
      }

      const [code, issuer] = parts;
      if (!validateAssetCode(code)) {
        errors.push('Invalid asset code');
      }
      if (!validateStellarAddress(issuer)) {
        errors.push('Invalid asset issuer');
      }
    } else {
      if (!validateAssetCode(asset.code)) {
        errors.push('Invalid asset code');
      }
      if (asset.code !== 'XLM' && !asset.issuer) {
        errors.push('Asset issuer required for non-native assets');
      }
      if (asset.issuer && !validateStellarAddress(asset.issuer)) {
        errors.push('Invalid asset issuer');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate memo
   * @param memo Memo string or object
   * @returns Validation result
   */
  validateMemo(memo: string | { type: string; value?: string }): ValidationResult {
    const errors: string[] = [];

    if (typeof memo === 'string') {
      if (!validateMemo(memo)) {
        errors.push('Memo too long (max 28 characters)');
      }
    } else {
      const validTypes = ['none', 'text', 'id', 'hash', 'return'];
      if (!validTypes.includes(memo.type)) {
        errors.push('Invalid memo type');
      }
      if (memo.type === 'text' && memo.value && !validateMemo(memo.value)) {
        errors.push('Memo text too long (max 28 characters)');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate transaction hash
   * @param hash Transaction hash
   * @returns Validation result
   */
  validateTransactionHash(hash: string): ValidationResult {
    const errors: string[] = [];

    if (!validateTransactionHash(hash)) {
      errors.push('Invalid transaction hash format');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate network configuration
   * @param config Network configuration
   * @returns Validation result
   */
  validateNetworkConfig(config: NetworkConfig): ValidationResult {
    const errors: string[] = [];

    // Validate network
    const validNetworks = ['testnet', 'mainnet', 'futurenet', 'standalone'];
    if (!validNetworks.includes(config.network)) {
      errors.push('Invalid network type');
    }

    // Validate URLs
    try {
      new URL(config.horizonUrl);
    } catch {
      errors.push('Invalid Horizon URL');
    }

    try {
      new URL(config.sorobanRpcUrl);
    } catch {
      errors.push('Invalid Soroban RPC URL');
    }

    // Validate network passphrase
    if (!config.networkPassphrase || config.networkPassphrase.length === 0) {
      errors.push('Network passphrase is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if account has sufficient balance
   * @param publicKey Account public key
   * @param amount Amount in XLM
   * @param asset Asset (default: 'XLM')
   * @returns True if sufficient balance
   */
  private async checkSufficientBalance(
    publicKey: string,
    amount: string,
    asset: string = 'XLM'
  ): Promise<boolean> {
    if (asset !== 'XLM') {
      // For non-native assets, we'd need to check the specific asset balance
      // This is more complex and would require additional logic
      return true;
    }

    const amountInStroops = Math.floor(parseFloat(amount) * 10000000);
    return this.walletManager.hasSufficientBalance(publicKey, amountInStroops);
  }

  /**
   * Sanitize string input
   * @param input String to sanitize
   * @returns Sanitized string
   */
  sanitizeString(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  /**
   * Sanitize numeric input
   * @param input Numeric string to sanitize
   * @returns Sanitized numeric string
   */
  sanitizeNumeric(input: string): string {
    return input.trim().replace(/[^0-9.]/g, '');
  }

  /**
   * Sanitize memo input
   * @param input Memo to sanitize
   * @returns Sanitized memo
   */
  sanitizeMemo(input: string): string {
    // Remove potentially harmful characters but allow most printable characters
    return input.trim().replace(/[\x00-\x1F\x7F]/g, '');
  }

  /**
   * Format amount for display
   * @param amount Amount in string
   * @param decimals Number of decimal places
   * @returns Formatted amount
   */
  formatAmount(amount: string, decimals: number = 7): string {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0';
    
    if (num === 0) return '0';
    
    if (num < 0.000001) {
      return num.toExponential(4);
    }
    
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  }

  /**
   * Format address for display
   * @param address Stellar address
   * @param startChars Number of characters to show at start
   * @param endChars Number of characters to show at end
   * @returns Formatted address
   */
  formatAddress(address: string, startChars: number = 4, endChars: number = 4): string {
    if (!address || address.length < startChars + endChars) {
      return address;
    }
    
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  }

  /**
   * Format transaction hash for display
   * @param hash Transaction hash
   * @param startChars Number of characters to show at start
   * @param endChars Number of characters to show at end
   * @returns Formatted hash
   */
  formatTransactionHash(hash: string, startChars: number = 8, endChars: number = 8): string {
    if (!hash || hash.length < startChars + endChars) {
      return hash;
    }
    
    return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`;
  }

  /**
   * Convert stroops to XLM
   * @param stroops Amount in stroops
   * @returns Amount in XLM
   */
  stroopsToXLM(stroops: number | string): string {
    const num = typeof stroops === 'string' ? parseInt(stroops) : stroops;
    return (num / 10000000).toString();
  }

  /**
   * Convert XLM to stroops
   * @param xlm Amount in XLM
   * @returns Amount in stroops
   */
  xlmToStroops(xlm: number | string): number {
    const num = typeof xlm === 'string' ? parseFloat(xlm) : xlm;
    return Math.floor(num * 10000000);
  }

  /**
   * Check if string is a valid Stellar address
   * @param address String to check
   * @returns True if valid Stellar address
   */
  isValidStellarAddress(address: string): boolean {
    return validateStellarAddress(address);
  }

  /**
   * Check if string is a valid Stellar secret key
   * @param secretKey String to check
   * @returns True if valid Stellar secret key
   */
  isValidStellarSecretKey(secretKey: string): boolean {
    return validateStellarSecretKey(secretKey);
  }

  /**
   * Check if string is a valid amount
   * @param amount String to check
   * @returns True if valid amount
   */
  isValidAmount(amount: string): boolean {
    return validateAmount(amount);
  }

  /**
   * Check if string is a valid asset code
   * @param code Asset code to check
   * @returns True if valid asset code
   */
  isValidAssetCode(code: string): boolean {
    return validateAssetCode(code);
  }

  /**
   * Check if string is a valid memo
   * @param memo Memo to check
   * @returns True if valid memo
   */
  isValidMemo(memo: string): boolean {
    return validateMemo(memo);
  }

  /**
   * Check if string is a valid transaction hash
   * @param hash Transaction hash to check
   * @returns True if valid transaction hash
   */
  isValidTransactionHash(hash: string): boolean {
    return validateTransactionHash(hash);
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Validate Stellar wallet with default configuration
 * @param wallet Wallet to validate
 * @returns Validation result
 */
export function validateWallet(wallet: StellarWallet): ValidationResult {
  const validationManager = new ValidationManager();
  return validationManager.validateWallet(wallet);
}

/**
 * Validate payment request with default configuration
 * @param payment Payment request to validate
 * @param options Validation options
 * @returns Validation result
 */
export async function validatePayment(
  payment: PaymentRequest,
  options?: PaymentValidationOptions
): Promise<ValidationResult> {
  const validationManager = new ValidationManager();
  return validationManager.validatePaymentRequest(payment, options);
}

/**
 * Validate asset with default configuration
 * @param asset Asset to validate
 * @returns Validation result
 */
export function validateAsset(asset: string | { code: string; issuer?: string }): ValidationResult {
  const validationManager = new ValidationManager();
  return validationManager.validateAsset(asset);
}

/**
 * Validate memo with default configuration
 * @param memo Memo to validate
 * @returns Validation result
 */
export function validateMemoInput(memo: string | { type: string; value?: string }): ValidationResult {
  const validationManager = new ValidationManager();
  return validationManager.validateMemo(memo);
}

/**
 * Validate transaction hash with default configuration
 * @param hash Transaction hash to validate
 * @returns Validation result
 */
export function validateHash(hash: string): ValidationResult {
  const validationManager = new ValidationManager();
  return validationManager.validateTransactionHash(hash);
}

/**
 * Format amount for display
 * @param amount Amount to format
 * @param decimals Number of decimal places
 * @returns Formatted amount
 */
export function formatAmount(amount: string, decimals: number = 7): string {
  const validationManager = new ValidationManager();
  return validationManager.formatAmount(amount, decimals);
}

/**
 * Format address for display
 * @param address Address to format
 * @param startChars Number of characters to show at start
 * @param endChars Number of characters to show at end
 * @returns Formatted address
 */
export function formatAddress(address: string, startChars: number = 4, endChars: number = 4): string {
  const validationManager = new ValidationManager();
  return validationManager.formatAddress(address, startChars, endChars);
}

/**
 * Format transaction hash for display
 * @param hash Hash to format
 * @param startChars Number of characters to show at start
 * @param endChars Number of characters to show at end
 * @returns Formatted hash
 */
export function formatHash(hash: string, startChars: number = 8, endChars: number = 8): string {
  const validationManager = new ValidationManager();
  return validationManager.formatTransactionHash(hash, startChars, endChars);
}

/**
 * Convert stroops to XLM
 * @param stroops Amount in stroops
 * @returns Amount in XLM
 */
export function stroopsToXLM(stroops: number | string): string {
  const validationManager = new ValidationManager();
  return validationManager.stroopsToXLM(stroops);
}

/**
 * Convert XLM to stroops
 * @param xlm Amount in XLM
 * @returns Amount in stroops
 */
export function xlmToStroops(xlm: number | string): number {
  const validationManager = new ValidationManager();
  return validationManager.xlmToStroops(xlm);
}

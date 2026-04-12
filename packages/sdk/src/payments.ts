import {
  TransactionBuilder,
  Networks,
  Asset,
  Operation,
  Memo,
  MemoType,
  AccountResponse,
} from 'stellar-sdk';
import {
  PaymentRequest,
  PaymentResponse,
  Asset as SDKAsset,
  Memo as SDKMemo,
  Transaction,
  TransactionStatus,
  NetworkConfig,
  StellarError,
  NetworkError,
  ValidationError,
  TransactionError,
  InsufficientBalanceError,
  validateStellarAddress,
  validateAmount,
  validateAssetCode,
  validateMemo,
  DEFAULT_NETWORK_CONFIGS,
} from './types';
import { WalletManager } from './wallet';

/**
 * Payment processing functionality for the OrbyTech SDK
 */
export class PaymentManager {
  private walletManager: WalletManager;
  private networkConfig: NetworkConfig;

  constructor(networkConfig?: Partial<NetworkConfig>) {
    this.networkConfig = {
      ...DEFAULT_NETWORK_CONFIGS.testnet,
      ...networkConfig,
    };
    this.walletManager = new WalletManager(this.networkConfig);
  }

  /**
   * Send a payment from one wallet to another
   * @param paymentRequest Payment details
   * @param secretKey Sender's secret key
   * @returns Payment response with transaction hash
   */
  async sendPayment(
    paymentRequest: PaymentRequest,
    secretKey: string
  ): Promise<PaymentResponse> {
    try {
      // Validate payment request
      this.validatePaymentRequest(paymentRequest);

      // Load source account
      const server = this.walletManager.getServer();
      const sourceAccount = await server.loadAccount(paymentRequest.from);

      // Parse asset
      const asset = this.parseAsset(paymentRequest.asset || 'XLM');

      // Parse memo
      const memo = this.parseMemo(paymentRequest.memo);

      // Check balance
      await this.checkBalance(paymentRequest.from, paymentRequest.amount, asset);

      // Build transaction
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: paymentRequest.fee || await server.fetchBaseFee(),
        networkPassphrase: this.networkConfig.networkPassphrase,
      })
        .addOperation(
          Operation.payment({
            destination: paymentRequest.to,
            asset,
            amount: paymentRequest.amount,
          })
        )
        .addMemo(memo)
        .setTimeout(paymentRequest.timeout || 30)
        .build();

      // Sign transaction
      const keypair = await this.walletManager.getServer().loadAccount(paymentRequest.from);
      transaction.sign(keypair);

      // Submit transaction
      const result = await server.submitTransaction(transaction);

      return {
        success: result.successful,
        hash: result.hash,
        fee: transaction.fee,
        status: result.successful ? 'success' : 'failed',
        error: result.successful ? undefined : 'Transaction failed',
      };
    } catch (error: any) {
      if (error.response?.data?.extras?.result_codes) {
        const resultCodes = error.response.data.extras.result_codes;
        return {
          success: false,
          error: `Transaction failed: ${resultCodes.operations?.[0] || 'Unknown error'}`,
          status: 'failed',
        };
      }
      throw new TransactionError(
        'Failed to send payment',
        undefined,
        error
      );
    }
  }

  /**
   * Create a payment transaction without submitting it
   * @param paymentRequest Payment details
   * @returns Unsigned transaction XDR
   */
  async createPaymentTransaction(paymentRequest: PaymentRequest): Promise<string> {
    try {
      // Validate payment request
      this.validatePaymentRequest(paymentRequest);

      // Load source account
      const server = this.walletManager.getServer();
      const sourceAccount = await server.loadAccount(paymentRequest.from);

      // Parse asset
      const asset = this.parseAsset(paymentRequest.asset || 'XLM');

      // Parse memo
      const memo = this.parseMemo(paymentRequest.memo);

      // Build transaction
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: paymentRequest.fee || await server.fetchBaseFee(),
        networkPassphrase: this.networkConfig.networkPassphrase,
      })
        .addOperation(
          Operation.payment({
            destination: paymentRequest.to,
            asset,
            amount: paymentRequest.amount,
          })
        )
        .addMemo(memo)
        .setTimeout(paymentRequest.timeout || 30)
        .build();

      return transaction.toXDR();
    } catch (error) {
      throw new TransactionError(
        'Failed to create payment transaction',
        undefined,
        error
      );
    }
  }

  /**
   * Sign a transaction with a secret key
   * @param transactionXDR Transaction XDR
   * @param secretKey Secret key for signing
   * @returns Signed transaction XDR
   */
  signTransaction(transactionXDR: string, secretKey: string): string {
    try {
      const transaction = TransactionBuilder.fromXDR(
        transactionXDR,
        this.networkConfig.networkPassphrase
      );
      
      const keypair = this.walletManager.createServer.loadAccount(secretKey);
      transaction.sign(keypair);
      
      return transaction.toXDR();
    } catch (error) {
      throw new TransactionError(
        'Failed to sign transaction',
        undefined,
        error
      );
    }
  }

  /**
   * Submit a signed transaction to the network
   * @param transactionXDR Signed transaction XDR
   * @returns Transaction response
   */
  async submitTransaction(transactionXDR: string): Promise<PaymentResponse> {
    try {
      const server = this.walletManager.getServer();
      const result = await server.submitTransaction(transactionXDR);

      return {
        success: result.successful,
        hash: result.hash,
        status: result.successful ? 'success' : 'failed',
        error: result.successful ? undefined : 'Transaction failed',
      };
    } catch (error: any) {
      if (error.response?.data?.extras?.result_codes) {
        const resultCodes = error.response.data.extras.result_codes;
        return {
          success: false,
          error: `Transaction failed: ${resultCodes.operations?.[0] || 'Unknown error'}`,
          status: 'failed',
        };
      }
      throw new TransactionError(
        'Failed to submit transaction',
        undefined,
        error
      );
    }
  }

  /**
   * Validate payment request parameters
   * @param paymentRequest Payment request to validate
   * @throws ValidationError if invalid
   */
  private validatePaymentRequest(paymentRequest: PaymentRequest): void {
    const errors: string[] = [];

    // Validate addresses
    if (!validateStellarAddress(paymentRequest.from)) {
      errors.push('Invalid sender address');
    }

    if (!validateStellarAddress(paymentRequest.to)) {
      errors.push('Invalid recipient address');
    }

    // Validate addresses are different
    if (paymentRequest.from === paymentRequest.to) {
      errors.push('Sender and recipient must be different');
    }

    // Validate amount
    if (!validateAmount(paymentRequest.amount)) {
      errors.push('Invalid amount format');
    }

    // Validate asset
    if (paymentRequest.asset && paymentRequest.asset !== 'XLM') {
      if (typeof paymentRequest.asset === 'string') {
        const parts = paymentRequest.asset.split(':');
        if (parts.length !== 2) {
          errors.push('Invalid asset format. Use "XLM" or "CODE:ISSUER"');
        } else {
          const [code, issuer] = parts;
          if (!validateAssetCode(code) || !validateStellarAddress(issuer)) {
            errors.push('Invalid asset code or issuer');
          }
        }
      }
    }

    // Validate memo
    if (paymentRequest.memo && typeof paymentRequest.memo === 'string') {
      if (!validateMemo(paymentRequest.memo)) {
        errors.push('Memo too long (max 28 characters)');
      }
    }

    // Validate fee
    if (paymentRequest.fee && (paymentRequest.fee < 100 || paymentRequest.fee > 100000)) {
      errors.push('Invalid fee (must be between 100 and 100000 stroops)');
    }

    // Validate timeout
    if (paymentRequest.timeout && (paymentRequest.timeout < 0 || paymentRequest.timeout > 300)) {
      errors.push('Invalid timeout (must be between 0 and 300 seconds)');
    }

    if (errors.length > 0) {
      throw new ValidationError('Payment validation failed', errors);
    }
  }

  /**
   * Parse asset from string or Asset object
   * @param asset Asset string or object
   * @returns Stellar Asset
   */
  private parseAsset(asset: string | SDKAsset): Asset {
    if (typeof asset === 'string') {
      if (asset === 'XLM' || asset === 'native') {
        return Asset.native();
      }

      const parts = asset.split(':');
      if (parts.length !== 2) {
        throw new ValidationError('Invalid asset format. Use "XLM" or "CODE:ISSUER"', [
          'Asset must be "XLM" or in format "CODE:ISSUER"',
        ]);
      }

      const [code, issuer] = parts;
      return new Asset(code, issuer);
    }

    if (asset.type === 'native' || asset.code === 'XLM') {
      return Asset.native();
    }

    if (!asset.issuer) {
      throw new ValidationError('Credit asset must have an issuer', [
        'Asset issuer is required for credit assets',
      ]);
    }

    return new Asset(asset.code, asset.issuer);
  }

  /**
   * Parse memo from string or Memo object
   * @param memo Memo string or object
   * @returns Stellar Memo
   */
  private parseMemo(memo?: string | SDKMemo): Memo {
    if (!memo) {
      return Memo.none();
    }

    if (typeof memo === 'string') {
      return Memo.text(memo);
    }

    switch (memo.type) {
      case 'none':
        return Memo.none();
      case 'text':
        return Memo.text(memo.value || '');
      case 'id':
        return Memo.id(memo.value ? BigInt(memo.value) : BigInt(0));
      case 'hash':
        return Memo.hash(memo.value || '');
      case 'return':
        return Memo.returnHash(memo.value || '');
      default:
        return Memo.none();
    }
  }

  /**
   * Check if account has sufficient balance for payment
   * @param publicKey Account public key
   * @param amount Amount to send
   * @param asset Asset to send
   * @throws InsufficientBalanceError if insufficient balance
   */
  private async checkBalance(
    publicKey: string,
    amount: string,
    asset: Asset
  ): Promise<void> {
    if (asset.isNative()) {
      const hasSufficient = await this.walletManager.hasSufficientBalance(
        publicKey,
        Math.floor(parseFloat(amount) * 10000000) // Convert to stroops
      );

      if (!hasSufficient) {
        const balance = await this.walletManager.getBalance(publicKey, 'XLM');
        throw new InsufficientBalanceError(
          'Insufficient XLM balance',
          amount,
          balance?.balance || '0'
        );
      }
    }
    // For non-native assets, we would need to check the specific asset balance
    // This is more complex and would require additional logic
  }

  /**
   * Get transaction details by hash
   * @param hash Transaction hash
   * @returns Transaction details
   */
  async getTransaction(hash: string): Promise<Transaction | null> {
    try {
      const server = this.walletManager.getServer();
      const transaction = await server.transactions().transaction(hash).call();

      return {
        hash: transaction.hash,
        ledger: transaction.ledger,
        createdAt: new Date(transaction.created_at),
        sourceAccount: transaction.source_account,
        feePaid: transaction.fee_charged || 0,
        operationCount: transaction.operations.length,
        status: transaction.successful ? 'success' : 'failed',
        memo: transaction.memo ? this.parseMemoToSDKMemo(transaction.memo) : undefined,
        operations: transaction.operations.map(op => this.parseOperation(op)),
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new NetworkError('Failed to get transaction details', error);
    }
  }

  /**
   * Parse Stellar memo to SDK memo format
   * @param stellarMemo Stellar memo
   * @returns SDK memo
   */
  private parseMemoToSDKMemo(stellarMemo: any): SDKMemo {
    if (!stellarMemo) {
      return { type: 'none' };
    }

    switch (stellarMemo.type) {
      case MemoType.TEXT:
        return { type: 'text', value: stellarMemo.value };
      case MemoType.ID:
        return { type: 'id', value: stellarMemo.value?.toString() };
      case MemoType.HASH:
        return { type: 'hash', value: stellarMemo.value?.toString('base64') };
      case MemoType.RETURN:
        return { type: 'return', value: stellarMemo.value?.toString('base64') };
      default:
        return { type: 'none' };
    }
  }

  /**
   * Parse Stellar operation to SDK operation format
   * @param stellarOp Stellar operation
   * @returns SDK operation
   */
  private parseOperation(stellarOp: any): any {
    const baseOperation = {
      id: stellarOp.id,
      type: stellarOp.type,
      sourceAccount: stellarOp.source_account,
      createdAt: new Date(),
    };

    switch (stellarOp.type) {
      case 'payment':
        return {
          ...baseOperation,
          details: {
            type: 'payment',
            from: stellarOp.source_account,
            to: stellarOp.destination,
            amount: stellarOp.amount,
            asset: this.parseStellarAssetToSDKAsset(stellarOp.asset),
            memo: stellarOp.memo,
          },
        };
      case 'create_account':
        return {
          ...baseOperation,
          details: {
            type: 'create_account',
            source: stellarOp.source_account,
            destination: stellarOp.destination,
            startingBalance: stellarOp.starting_balance,
          },
        };
      default:
        return {
          ...baseOperation,
          details: {
            type: stellarOp.type,
            ...stellarOp,
          },
        };
    }
  }

  /**
   * Parse Stellar asset to SDK asset format
   * @param stellarAsset Stellar asset
   * @returns SDK asset
   */
  private parseStellarAssetToSDKAsset(stellarAsset: any): SDKAsset {
    if (stellarAsset === 'native') {
      return { code: 'XLM', type: 'native' };
    }

    return {
      code: stellarAsset.code,
      issuer: stellarAsset.issuer,
      type: stellarAsset.asset_type,
    };
  }

  /**
   * Update network configuration
   * @param networkConfig New network configuration
   */
  updateNetworkConfig(networkConfig: Partial<NetworkConfig>): void {
    this.networkConfig = { ...this.networkConfig, ...networkConfig };
    this.walletManager.updateNetworkConfig(networkConfig);
  }

  /**
   * Get current network configuration
   * @returns Current network configuration
   */
  getNetworkConfig(): NetworkConfig {
    return { ...this.networkConfig };
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Send payment with default testnet configuration
 * @param paymentRequest Payment details
 * @param secretKey Sender's secret key
 * @returns Payment response
 */
export async function sendPayment(
  paymentRequest: PaymentRequest,
  secretKey: string
): Promise<PaymentResponse> {
  const paymentManager = new PaymentManager();
  return paymentManager.sendPayment(paymentRequest, secretKey);
}

/**
 * Create payment transaction with default testnet configuration
 * @param paymentRequest Payment details
 * @returns Unsigned transaction XDR
 */
export async function createPaymentTransaction(paymentRequest: PaymentRequest): Promise<string> {
  const paymentManager = new PaymentManager();
  return paymentManager.createPaymentTransaction(paymentRequest);
}

/**
 * Sign transaction with default testnet configuration
 * @param transactionXDR Transaction XDR
 * @param secretKey Secret key for signing
 * @returns Signed transaction XDR
 */
export function signTransaction(transactionXDR: string, secretKey: string): string {
  const paymentManager = new PaymentManager();
  return paymentManager.signTransaction(transactionXDR, secretKey);
}

/**
 * Submit transaction with default testnet configuration
 * @param transactionXDR Signed transaction XDR
 * @returns Transaction response
 */
export async function submitTransaction(transactionXDR: string): Promise<PaymentResponse> {
  const paymentManager = new PaymentManager();
  return paymentManager.submitTransaction(transactionXDR);
}

/**
 * Get transaction details with default testnet configuration
 * @param hash Transaction hash
 * @returns Transaction details
 */
export async function getTransaction(hash: string): Promise<Transaction | null> {
  const paymentManager = new PaymentManager();
  return paymentManager.getTransaction(hash);
}

import {
  Horizon,
  Server,
  TransactionBuilder,
  Networks,
  Keypair,
  Asset,
  Operation,
  Memo,
  MemoType,
} from 'stellar-sdk';
import { config } from '../config';
import { StellarAccount, StellarBalance, PaymentRequest, PaymentResponse } from '../types';

export class StellarService {
  private server: Server;
  private network: string;

  constructor() {
    this.server = new Server(config.stellar.horizonUrl);
    this.network = config.stellar.networkPassphrase;
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
   * Get account information including balance
   */
  async getAccount(publicKey: string): Promise<StellarAccount> {
    try {
      const account = await this.server.loadAccount(publicKey);
      const balances = account.balances.map((balance: any) => ({
        balance: balance.balance,
        assetType: balance.asset_type,
        assetCode: balance.asset_code || 'XLM',
        assetIssuer: balance.asset_issuer,
      }));

      return {
        publicKey,
        balance: balances.find(b => b.assetCode === 'XLM')?.balance || '0',
      };
    } catch (error) {
      if (error instanceof Horizon.Error && error.response?.status === 404) {
        throw new Error('Account not found');
      }
      throw error;
    }
  }

  /**
   * Get detailed account information
   */
  async getAccountDetails(publicKey: string): Promise<{
    publicKey: string;
    balances: StellarBalance[];
    network: string;
  }> {
    try {
      const account = await this.server.loadAccount(publicKey);
      const balances: StellarBalance[] = account.balances.map((balance: any) => ({
        balance: balance.balance,
        assetType: balance.asset_type,
        assetCode: balance.asset_code || 'XLM',
        assetIssuer: balance.asset_issuer,
      }));

      return {
        publicKey,
        balances,
        network: config.stellar.network,
      };
    } catch (error) {
      if (error instanceof Horizon.Error && error.response?.status === 404) {
        throw new Error('Account not found');
      }
      throw error;
    }
  }

  /**
   * Send a payment
   */
  async sendPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Validate addresses
      this.validateAddress(paymentRequest.from);
      this.validateAddress(paymentRequest.to);

      // Load source account
      const sourceAccount = await this.server.loadAccount(paymentRequest.from);

      // Parse asset
      const asset = this.parseAsset(paymentRequest.asset || 'XLM');

      // Create payment operation
      const paymentOperation = Operation.payment({
        destination: paymentRequest.to,
        asset,
        amount: paymentRequest.amount,
      });

      // Build transaction
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: await this.server.fetchBaseFee(),
        networkPassphrase: this.network,
      })
        .addOperation(paymentOperation)
        .addMemo(paymentRequest.memo ? Memo.text(paymentRequest.memo) : Memo.none())
        .setTimeout(30)
        .build();

      // Note: In a real application, you would sign the transaction here
      // For this example, we'll return the transaction hash after submission
      // The client would need to sign and submit the transaction
      
      const response: PaymentResponse = {
        hash: 'pending_transaction_hash',
        status: 'pending',
        timestamp: new Date(),
        from: paymentRequest.from,
        to: paymentRequest.to,
        amount: paymentRequest.amount,
        asset: paymentRequest.asset || 'XLM',
        memo: paymentRequest.memo,
      };

      return response;
    } catch (error) {
      throw new Error(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Submit a signed transaction
   */
  async submitTransaction(transactionXDR: string): Promise<PaymentResponse> {
    try {
      const transaction = TransactionBuilder.fromXDR(transactionXDR, this.network);
      const result = await this.server.submitTransaction(transaction);

      return {
        hash: result.hash,
        status: result.successful ? 'success' : 'failed',
        timestamp: new Date(),
        from: transaction.source,
        to: this.extractDestinationFromTransaction(transaction),
        amount: this.extractAmountFromTransaction(transaction),
        asset: this.extractAssetFromTransaction(transaction),
        memo: this.extractMemoFromTransaction(transaction),
        error: result.successful ? undefined : 'Transaction failed',
      };
    } catch (error) {
      if (error instanceof Horizon.Error) {
        const result = error.response?.data?.extras?.result_codes;
        return {
          hash: '',
          status: 'failed',
          timestamp: new Date(),
          from: '',
          to: '',
          amount: '0',
          asset: 'XLM',
          error: result?.operations?.[0] || 'Transaction failed',
        };
      }
      throw error;
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(transactionHash: string): Promise<any> {
    try {
      const transaction = await this.server.transactions().transaction(transactionHash).call();
      return transaction;
    } catch (error) {
      if (error instanceof Horizon.Error && error.response?.status === 404) {
        throw new Error('Transaction not found');
      }
      throw error;
    }
  }

  /**
   * Fund a testnet account using friendbot
   */
  async fundTestnetAccount(publicKey: string): Promise<boolean> {
    if (config.stellar.network !== 'testnet') {
      throw new Error('Account funding is only available on testnet');
    }

    try {
      const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
      if (!response.ok) {
        throw new Error('Failed to fund account');
      }
      const result = await response.json();
      return result.success;
    } catch (error) {
      throw new Error(`Failed to fund account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate Stellar address format
   */
  private validateAddress(address: string): void {
    try {
      Keypair.fromPublicKey(address);
    } catch (error) {
      throw new Error('Invalid Stellar address');
    }
  }

  /**
   * Parse asset from string
   */
  private parseAsset(assetString: string): Asset {
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
   * Extract destination from transaction
   */
  private extractDestinationFromTransaction(transaction: any): string {
    const paymentOp = transaction.operations.find((op: any) => op.type === 'payment');
    return paymentOp?.destination || '';
  }

  /**
   * Extract amount from transaction
   */
  private extractAmountFromTransaction(transaction: any): string {
    const paymentOp = transaction.operations.find((op: any) => op.type === 'payment');
    return paymentOp?.amount || '0';
  }

  /**
   * Extract asset from transaction
   */
  private extractAssetFromTransaction(transaction: any): string {
    const paymentOp = transaction.operations.find((op: any) => op.type === 'payment');
    if (!paymentOp) return 'XLM';
    
    if (paymentOp.asset === 'native') {
      return 'XLM';
    }
    
    return `${paymentOp.assetCode}:${paymentOp.assetIssuer}`;
  }

  /**
   * Extract memo from transaction
   */
  private extractMemoFromTransaction(transaction: any): string | undefined {
    if (!transaction.memo) return undefined;
    
    if (transaction.memo.type === MemoType.TEXT) {
      return transaction.memo.value;
    }
    
    return undefined;
  }

  /**
   * Get network information
   */
  getNetworkInfo(): {
    network: string;
    horizonUrl: string;
    sorobanRpcUrl: string;
  } {
    return {
      network: config.stellar.network,
      horizonUrl: config.stellar.horizonUrl,
      sorobanRpcUrl: config.stellar.sorobanRpcUrl,
    };
  }
}

import {
  TransactionHistoryOptions,
  TransactionHistory,
  Transaction,
  NetworkConfig,
  StellarError,
  NetworkError,
  DEFAULT_NETWORK_CONFIGS,
} from './types';
import { WalletManager } from './wallet';

/**
 * Transaction history functionality for the OrbyTech SDK
 */
export class TransactionManager {
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
   * Get transaction history for an account
   * @param publicKey Account public key
   * @param options Query options
   * @returns Transaction history
   */
  async getTransactionHistory(
    publicKey: string,
    options?: TransactionHistoryOptions
  ): Promise<TransactionHistory> {
    try {
      const server = this.walletManager.getServer();
      let callBuilder = server.transactions().forAccount(publicKey);

      // Apply options
      if (options?.limit) {
        callBuilder = callBuilder.limit(options.limit);
      }

      if (options?.cursor) {
        callBuilder = callBuilder.cursor(options.cursor);
      }

      if (options?.order) {
        callBuilder = callBuilder.order(options.order);
      }

      if (options?.includeFailed) {
        // Note: Stellar SDK doesn't have a direct way to include failed transactions
        // This would need custom implementation
      }

      const response = await callBuilder.call();

      const transactions: Transaction[] = response.records.map(record => 
        this.parseTransactionRecord(record)
      );

      return {
        transactions,
        cursor: response.records.length > 0 ? response.records[response.records.length - 1].paging_token : undefined,
        hasNext: !!response.next,
        hasPrevious: !!response.prev,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          transactions: [],
          hasNext: false,
          hasPrevious: false,
        };
      }
      throw new NetworkError(
        'Failed to get transaction history',
        error
      );
    }
  }

  /**
   * Get transactions for a specific asset
   * @param publicKey Account public key
   * @param assetCode Asset code
   * @param assetIssuer Asset issuer (for non-native assets)
   * @param options Query options
   * @returns Transaction history for the specified asset
   */
  async getTransactionsForAsset(
    publicKey: string,
    assetCode: string,
    assetIssuer?: string,
    options?: TransactionHistoryOptions
  ): Promise<TransactionHistory> {
    const allHistory = await this.getTransactionHistory(publicKey, options);
    
    const filteredTransactions = allHistory.transactions.filter(transaction => 
      transaction.operations.some(op => 
        op.type === 'payment' && 
        op.details.asset.code === assetCode &&
        (!assetIssuer || op.details.asset.issuer === assetIssuer)
      )
    );

    return {
      ...allHistory,
      transactions: filteredTransactions,
    };
  }

  /**
   * Get payment transactions only
   * @param publicKey Account public key
   * @param options Query options
   * @returns Payment transaction history
   */
  async getPaymentTransactions(
    publicKey: string,
    options?: TransactionHistoryOptions
  ): Promise<TransactionHistory> {
    const allHistory = await this.getTransactionHistory(publicKey, options);
    
    const paymentTransactions = allHistory.transactions.filter(transaction => 
      transaction.operations.some(op => op.type === 'payment')
    );

    return {
      ...allHistory,
      transactions: paymentTransactions,
    };
  }

  /**
   * Get transactions where the account was the sender
   * @param publicKey Account public key
   * @param options Query options
   * @returns Sent transaction history
   */
  async getSentTransactions(
    publicKey: string,
    options?: TransactionHistoryOptions
  ): Promise<TransactionHistory> {
    const allHistory = await this.getTransactionHistory(publicKey, options);
    
    const sentTransactions = allHistory.transactions.filter(transaction => 
      transaction.sourceAccount === publicKey
    );

    return {
      ...allHistory,
      transactions: sentTransactions,
    };
  }

  /**
   * Get transactions where the account was the recipient
   * @param publicKey Account public key
   * @param options Query options
   * @returns Received transaction history
   */
  async getReceivedTransactions(
    publicKey: string,
    options?: TransactionHistoryOptions
  ): Promise<TransactionHistory> {
    const allHistory = await this.getTransactionHistory(publicKey, options);
    
    const receivedTransactions = allHistory.transactions.filter(transaction => 
      transaction.operations.some(op => 
        op.type === 'payment' && 
        op.details.to === publicKey
      )
    );

    return {
      ...allHistory,
      transactions: receivedTransactions,
    };
  }

  /**
   * Get transaction by hash
   * @param hash Transaction hash
   * @returns Transaction details or null if not found
   */
  async getTransaction(hash: string): Promise<Transaction | null> {
    try {
      const server = this.walletManager.getServer();
      const record = await server.transactions().transaction(hash).call();
      
      return this.parseTransactionRecord(record);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new NetworkError(
        'Failed to get transaction',
        error
      );
    }
  }

  /**
   * Get transactions in a specific ledger
   * @param ledgerSeq Ledger sequence number
   * @param options Query options
   * @returns Transactions in the specified ledger
   */
  async getLedgerTransactions(
    ledgerSeq: number,
    options?: TransactionHistoryOptions
  ): Promise<TransactionHistory> {
    try {
      const server = this.walletManager.getServer();
      let callBuilder = server.transactions().forLedger(ledgerSeq);

      // Apply options
      if (options?.limit) {
        callBuilder = callBuilder.limit(options.limit);
      }

      if (options?.cursor) {
        callBuilder = callBuilder.cursor(options.cursor);
      }

      if (options?.order) {
        callBuilder = callBuilder.order(options.order);
      }

      const response = await callBuilder.call();

      const transactions: Transaction[] = response.records.map(record => 
        this.parseTransactionRecord(record)
      );

      return {
        transactions,
        cursor: response.records.length > 0 ? response.records[response.records.length - 1].paging_token : undefined,
        hasNext: !!response.next,
        hasPrevious: !!response.prev,
      };
    } catch (error: any) {
      throw new NetworkError(
        'Failed to get ledger transactions',
        error
      );
    }
  }

  /**
   * Search transactions by memo
   * @param publicKey Account public key
   * @param memoText Memo text to search for
   * @param options Query options
   * @returns Transactions with matching memo
   */
  async searchTransactionsByMemo(
    publicKey: string,
    memoText: string,
    options?: TransactionHistoryOptions
  ): Promise<TransactionHistory> {
    const allHistory = await this.getTransactionHistory(publicKey, options);
    
    const matchingTransactions = allHistory.transactions.filter(transaction => 
      transaction.operations.some(op => 
        op.type === 'payment' && 
        op.details.memo && 
        op.details.memo.toLowerCase().includes(memoText.toLowerCase())
      )
    );

    return {
      ...allHistory,
      transactions: matchingTransactions,
    };
  }

  /**
   * Get transaction statistics for an account
   * @param publicKey Account public key
   * @returns Transaction statistics
   */
  async getTransactionStatistics(publicKey: string): Promise<{
    totalTransactions: number;
    totalPayments: number;
    totalSent: number;
    totalReceived: number;
    firstTransaction?: Date;
    lastTransaction?: Date;
    assets: Array<{
      code: string;
      issuer?: string;
      sentCount: number;
      receivedCount: number;
      totalSent: string;
      totalReceived: string;
    }>;
  }> {
    const history = await this.getTransactionHistory(publicKey, { limit: 200 });
    const transactions = history.transactions;

    const payments = transactions.filter(tx => 
      tx.operations.some(op => op.type === 'payment')
    );

    const sentPayments = payments.filter(tx => tx.sourceAccount === publicKey);
    const receivedPayments = payments.filter(tx => 
      tx.operations.some(op => op.type === 'payment' && op.details.to === publicKey)
    );

    // Asset statistics
    const assetStats = new Map<string, {
      code: string;
      issuer?: string;
      sentCount: number;
      receivedCount: number;
      totalSent: string;
      totalReceived: string;
    }>();

    payments.forEach(tx => {
      tx.operations.forEach(op => {
        if (op.type === 'payment') {
          const assetKey = op.details.asset.issuer 
            ? `${op.details.asset.code}:${op.details.asset.issuer}`
            : op.details.asset.code;

          if (!assetStats.has(assetKey)) {
            assetStats.set(assetKey, {
              code: op.details.asset.code,
              issuer: op.details.asset.issuer,
              sentCount: 0,
              receivedCount: 0,
              totalSent: '0',
              totalReceived: '0',
            });
          }

          const stats = assetStats.get(assetKey)!;

          if (tx.sourceAccount === publicKey) {
            stats.sentCount++;
            stats.totalSent = (
              parseFloat(stats.totalSent) + parseFloat(op.details.amount)
            ).toString();
          } else if (op.details.to === publicKey) {
            stats.receivedCount++;
            stats.totalReceived = (
              parseFloat(stats.totalReceived) + parseFloat(op.details.amount)
            ).toString();
          }
        }
      });
    });

    return {
      totalTransactions: transactions.length,
      totalPayments: payments.length,
      totalSent: sentPayments.length,
      totalReceived: receivedPayments.length,
      firstTransaction: transactions.length > 0 ? transactions[transactions.length - 1].createdAt : undefined,
      lastTransaction: transactions.length > 0 ? transactions[0].createdAt : undefined,
      assets: Array.from(assetStats.values()),
    };
  }

  /**
   * Parse Stellar transaction record to SDK Transaction format
   * @param record Stellar transaction record
   * @returns SDK Transaction
   */
  private parseTransactionRecord(record: any): Transaction {
    return {
      hash: record.hash,
      ledger: record.ledger,
      createdAt: new Date(record.created_at),
      sourceAccount: record.source_account,
      feePaid: record.fee_charged || 0,
      operationCount: record.operations?.length || 0,
      status: record.successful ? 'success' : 'failed',
      memo: record.memo ? this.parseMemo(record.memo) : undefined,
      operations: record.operations?.map((op: any) => this.parseOperation(op)) || [],
    };
  }

  /**
   * Parse Stellar memo to SDK memo format
   * @param stellarMemo Stellar memo
   * @returns SDK memo
   */
  private parseMemo(stellarMemo: any): any {
    if (!stellarMemo) {
      return { type: 'none' };
    }

    switch (stellarMemo.type) {
      case 'text':
        return { type: 'text', value: stellarMemo.value };
      case 'id':
        return { type: 'id', value: stellarMemo.value?.toString() };
      case 'hash':
        return { type: 'hash', value: stellarMemo.value?.toString('base64') };
      case 'return':
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
            asset: this.parseAsset(stellarOp.asset),
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
  private parseAsset(stellarAsset: any): any {
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
 * Get transaction history with default testnet configuration
 * @param publicKey Account public key
 * @param options Query options
 * @returns Transaction history
 */
export async function getTransactionHistory(
  publicKey: string,
  options?: TransactionHistoryOptions
): Promise<TransactionHistory> {
  const transactionManager = new TransactionManager();
  return transactionManager.getTransactionHistory(publicKey, options);
}

/**
 * Get transaction by hash with default testnet configuration
 * @param hash Transaction hash
 * @returns Transaction details
 */
export async function getTransaction(hash: string): Promise<Transaction | null> {
  const transactionManager = new TransactionManager();
  return transactionManager.getTransaction(hash);
}

/**
 * Get payment transactions with default testnet configuration
 * @param publicKey Account public key
 * @param options Query options
 * @returns Payment transaction history
 */
export async function getPaymentTransactions(
  publicKey: string,
  options?: TransactionHistoryOptions
): Promise<TransactionHistory> {
  const transactionManager = new TransactionManager();
  return transactionManager.getPaymentTransactions(publicKey, options);
}

/**
 * Get transaction statistics with default testnet configuration
 * @param publicKey Account public key
 * @returns Transaction statistics
 */
export async function getTransactionStatistics(publicKey: string) {
  const transactionManager = new TransactionManager();
  return transactionManager.getTransactionStatistics(publicKey);
}

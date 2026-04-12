// Export all modules
export * from './stellar';
export * from './types';

// Export main classes and functions
export { WalletManager, createWallet, createWalletFromSecret, getWalletInfo, getBalance, fundTestnetWallet, validateAddress, validateSecretKey } from './wallet';
export { PaymentManager, sendPayment, createPaymentTransaction, signTransaction, submitTransaction, getTransaction as getPaymentTransaction } from './payments';
export { TransactionManager, getTransactionHistory, getTransaction, getPaymentTransactions, getTransactionStatistics } from './transactions';
export { ValidationManager, validateWallet, validatePayment, validateAsset, validateMemoInput, validateHash, formatAmount, formatAddress, formatHash, stroopsToXLM, xlmToStroops } from './validation';

// Export convenience functions
export * from './validation';

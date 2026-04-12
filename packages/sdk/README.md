# OrbyTech Stellar SDK

A comprehensive TypeScript SDK for Stellar blockchain operations, providing clean, reusable functions for both frontend and backend applications.

## Features

- **Wallet Management**: Create, validate, and manage Stellar wallets
- **Payment Processing**: Send, validate, and track payments with ease
- **Transaction History**: Retrieve and analyze transaction history
- **Balance Management**: Get wallet balances for multiple assets
- **Validation**: Comprehensive input validation and error handling
- **Type Safety**: Full TypeScript support with proper type definitions
- **Network Support**: Testnet, Mainnet, Futurenet, and Standalone networks
- **Error Handling**: Custom error classes with detailed error information

## Installation

```bash
# Install the SDK
pnpm add @orbytech/sdk

# Install peer dependencies
pnpm add stellar-sdk
```

## Quick Start

### Basic Usage

```typescript
import { createWallet, sendPayment, getBalance } from '@orbytech/sdk';

// Create a new wallet
const wallet = createWallet();
console.log('Public Key:', wallet.publicKey);
console.log('Secret Key:', wallet.secretKey);

// Get wallet balance
const balance = await getBalance(wallet.publicKey);
console.log('Balance:', balance);

// Send a payment
const paymentResult = await sendPayment(
  {
    from: wallet.publicKey,
    to: 'GDEFGHIJKLMNOPQRSTUVWXYZ123456789',
    amount: '10.5',
    asset: 'XLM',
    memo: 'Payment for services'
  },
  wallet.secretKey!
);

console.log('Payment Hash:', paymentResult.hash);
```

### Advanced Usage

```typescript
import { WalletManager, PaymentManager, TransactionManager } from '@orbytech/sdk';

// Initialize managers with custom network configuration
const networkConfig = {
  network: 'testnet',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
};

const walletManager = new WalletManager(networkConfig);
const paymentManager = new PaymentManager(networkConfig);
const transactionManager = new TransactionManager(networkConfig);

// Create and fund a wallet
const wallet = walletManager.createWallet();
await walletManager.fundTestnetWallet(wallet.publicKey);

// Get detailed wallet information
const walletInfo = await walletManager.getWalletInfo(wallet.publicKey);
console.log('Wallet Info:', walletInfo);

// Create and sign a transaction
const transactionXDR = await paymentManager.createPaymentTransaction({
  from: wallet.publicKey,
  to: 'GDEFGHIJKLMNOPQRSTUVWXYZ123456789',
  amount: '5.0',
  asset: 'XLM',
});

const signedXDR = paymentManager.signTransaction(transactionXDR, wallet.secretKey!);

// Submit the transaction
const result = await paymentManager.submitTransaction(signedXDR);
console.log('Transaction Result:', result);

// Get transaction history
const history = await transactionManager.getTransactionHistory(wallet.publicKey);
console.log('Transaction History:', history);
```

## API Reference

### Wallet Management

#### `createWallet()`
Create a new Stellar wallet with random keys.

```typescript
const wallet = createWallet();
// Returns: { publicKey: string, secretKey: string, network?: StellarNetwork }
```

#### `createWalletFromSecret(secretKey)`
Create a wallet from an existing secret key.

```typescript
const wallet = createWalletFromSecret('S...');
// Returns: { publicKey: string, secretKey: string, network?: StellarNetwork }
```

#### `getWalletInfo(publicKey)`
Get detailed wallet information including all balances.

```typescript
const walletInfo = await getWalletInfo('G...');
// Returns: { publicKey: string, balance: string, balances: Balance[], network: StellarNetwork }
```

#### `getBalance(publicKey, assetCode?, assetIssuer?)`
Get balance for a specific asset.

```typescript
const xlmBalance = await getBalance('G...', 'XLM');
const usdcBalance = await getBalance('G...', 'USDC', 'G...');

// Returns: Balance | null
interface Balance {
  balance: string;
  assetType: string;
  assetCode: string;
  assetIssuer?: string;
  limit?: string;
  isAuthorized?: boolean;
}
```

#### `fundTestnetWallet(publicKey)`
Fund a wallet on testnet using Friendbot.

```typescript
const funded = await fundTestnetWallet('G...');
// Returns: boolean
```

### Payment Processing

#### `sendPayment(paymentRequest, secretKey)`
Send a payment with automatic transaction creation and signing.

```typescript
const result = await sendPayment(
  {
    from: 'G...',
    to: 'G...',
    amount: '10.5',
    asset: 'XLM',
    memo: 'Payment for services',
    fee: 100,
    timeout: 30
  },
  'S...'
);

// Returns: PaymentResponse
interface PaymentResponse {
  success: boolean;
  hash?: string;
  transactionXDR?: string;
  error?: string;
  fee?: number;
  status?: 'pending' | 'success' | 'failed' | 'timeout';
}
```

#### `createPaymentTransaction(paymentRequest)`
Create an unsigned payment transaction.

```typescript
const transactionXDR = await createPaymentTransaction({
  from: 'G...',
  to: 'G...',
  amount: '10.5',
  asset: 'XLM'
});

// Returns: string (transaction XDR)
```

#### `signTransaction(transactionXDR, secretKey)`
Sign a transaction with a secret key.

```typescript
const signedXDR = signTransaction(transactionXDR, 'S...');
// Returns: string (signed transaction XDR)
```

#### `submitTransaction(transactionXDR)`
Submit a signed transaction to the network.

```typescript
const result = await submitTransaction(signedXDR);
// Returns: PaymentResponse
```

### Transaction History

#### `getTransactionHistory(publicKey, options?)`
Get transaction history for an account.

```typescript
const history = await getTransactionHistory('G...', {
  limit: 10,
  cursor: '...',
  order: 'desc',
  includeFailed: false
});

// Returns: TransactionHistory
interface TransactionHistory {
  transactions: Transaction[];
  cursor?: string;
  hasNext: boolean;
  hasPrevious: boolean;
}
```

#### `getPaymentTransactions(publicKey, options?)`
Get only payment transactions.

```typescript
const payments = await getPaymentTransactions('G...', { limit: 20 });
// Returns: TransactionHistory
```

#### `getTransactionStatistics(publicKey)`
Get transaction statistics for an account.

```typescript
const stats = await getTransactionStatistics('G...');

// Returns: {
//   totalTransactions: number;
//   totalPayments: number;
//   totalSent: number;
//   totalReceived: number;
//   firstTransaction?: Date;
//   lastTransaction?: Date;
//   assets: AssetStats[];
// }
```

### Validation

#### `validateWallet(wallet)`
Validate a wallet object.

```typescript
const result = validateWallet({
  publicKey: 'G...',
  secretKey: 'S...'
});

// Returns: ValidationResult
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}
```

#### `validatePayment(paymentRequest, options?)`
Validate a payment request.

```typescript
const result = await validatePayment({
  from: 'G...',
  to: 'G...',
  amount: '10.5',
  asset: 'XLM'
}, {
  checkBalance: true,
  checkDestination: true,
  minimumFee: 100
});

// Returns: ValidationResult
```

### Utility Functions

#### `formatAmount(amount, decimals?)`
Format amount for display.

```typescript
const formatted = formatAmount('10.123456789', 4); // "10.1235"
```

#### `formatAddress(address, startChars?, endChars?)`
Format address for display.

```typescript
const formatted = formatAddress('GABC...XYZ', 4, 4); // "GABC...XYZ"
```

#### `stroopsToXLM(stroops)`
Convert stroops to XLM.

```typescript
const xlm = stroopsToXLM(10000000); // "1"
```

#### `xlmToStroops(xlm)`
Convert XLM to stroops.

```typescript
const stroops = xlmToStroops(1); // 10000000
```

## Classes

### `WalletManager`

Advanced wallet management with network configuration.

```typescript
const walletManager = new WalletManager({
  network: 'testnet',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015'
});

const wallet = walletManager.createWallet();
const exists = await walletManager.walletExists(wallet.publicKey);
const hasBalance = await walletManager.hasSufficientBalance(wallet.publicKey, 1000000);
```

### `PaymentManager`

Advanced payment processing with fine-grained control.

```typescript
const paymentManager = new PaymentManager();

// Create transaction
const xdr = await paymentManager.createPaymentTransaction({
  from: 'G...',
  to: 'G...',
  amount: '10',
  asset: 'XLM'
});

// Sign and submit
const signed = paymentManager.signTransaction(xdr, 'S...');
const result = await paymentManager.submitTransaction(signed);
```

### `TransactionManager`

Advanced transaction history and analysis.

```typescript
const transactionManager = new TransactionManager();

// Get detailed transaction
const transaction = await transactionManager.getTransaction('hash');

// Get transactions for specific asset
const assetHistory = await transactionManager.getTransactionsForAsset(
  'G...', 'USDC', 'G...'
);

// Get transaction statistics
const stats = await transactionManager.getTransactionStatistics('G...');
```

### `ValidationManager`

Comprehensive validation utilities.

```typescript
const validationManager = new ValidationManager();

// Validate wallet
const walletValidation = validationManager.validateWallet(wallet);

// Validate payment
const paymentValidation = await validationManager.validatePaymentRequest(payment, {
  checkBalance: true,
  checkDestination: true
});

// Format utilities
const formattedAmount = validationManager.formatAmount('10.123456789');
const formattedAddress = validationManager.formatAddress('GABC...XYZ');
```

## Error Handling

The SDK provides custom error classes for better error handling:

```typescript
import { StellarError, NetworkError, ValidationError, TransactionError, InsufficientBalanceError } from '@orbytech/sdk';

try {
  await sendPayment(paymentRequest, secretKey);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Validation errors:', error.validationErrors);
  } else if (error instanceof InsufficientBalanceError) {
    console.log(`Insufficient balance: need ${error.required}, have ${error.available}`);
  } else if (error instanceof NetworkError) {
    console.log('Network error occurred');
  } else {
    console.log('Unknown error:', error.message);
  }
}
```

## Network Configuration

The SDK supports multiple Stellar networks:

```typescript
import { DEFAULT_NETWORK_CONFIGS } from '@orbytech/sdk';

// Testnet (default)
const testnetConfig = DEFAULT_NETWORK_CONFIGS.testnet;

// Mainnet
const mainnetConfig = DEFAULT_NETWORK_CONFIGS.mainnet;

// Futurenet
const futurenetConfig = DEFAULT_NETWORK_CONFIGS.futurenet;

// Standalone
const standaloneConfig = DEFAULT_NETWORK_CONFIGS.standalone;
```

## TypeScript Support

The SDK is fully typed with comprehensive TypeScript definitions:

```typescript
import { 
  StellarWallet, 
  PaymentRequest, 
  PaymentResponse, 
  Balance, 
  Transaction,
  NetworkConfig 
} from '@orbytech/sdk';

// All functions and classes are properly typed
const wallet: StellarWallet = createWallet();
const payment: PaymentRequest = { /* ... */ };
const result: PaymentResponse = await sendPayment(payment, secretKey);
```

## Examples

### Complete Wallet Flow

```typescript
import { WalletManager, PaymentManager, TransactionManager } from '@orbytech/sdk';

async function completeWalletFlow() {
  // Initialize managers
  const walletManager = new WalletManager();
  const paymentManager = new PaymentManager();
  const transactionManager = new TransactionManager();

  // Create wallet
  const wallet = walletManager.createWallet();
  console.log('Created wallet:', wallet.publicKey);

  // Fund wallet (testnet only)
  await walletManager.fundTestnetWallet(wallet.publicKey);
  console.log('Wallet funded');

  // Get balance
  const balance = await walletManager.getBalance(wallet.publicKey);
  console.log('Balance:', balance?.balance);

  // Send payment
  const paymentResult = await paymentManager.sendPayment(
    {
      from: wallet.publicKey,
      to: 'GDEFGHIJKLMNOPQRSTUVWXYZ123456789',
      amount: '1.0',
      asset: 'XLM',
      memo: 'Test payment'
    },
    wallet.secretKey!
  );

  if (paymentResult.success) {
    console.log('Payment sent:', paymentResult.hash);

    // Get transaction details
    const transaction = await transactionManager.getTransaction(paymentResult.hash!);
    console.log('Transaction:', transaction);

    // Get updated balance
    const newBalance = await walletManager.getBalance(wallet.publicKey);
    console.log('New balance:', newBalance?.balance);
  } else {
    console.log('Payment failed:', paymentResult.error);
  }
}
```

### Payment Validation

```typescript
import { validatePayment, PaymentValidationOptions } from '@orbytech/sdk';

async function validatePaymentFlow() {
  const paymentRequest = {
    from: 'GABC...XYZ',
    to: 'GDEF...UVW',
    amount: '10.5',
    asset: 'XLM',
    memo: 'Payment validation test'
  };

  const options: PaymentValidationOptions = {
    checkBalance: true,
    checkDestination: true,
    minimumFee: 100,
    maximumAmount: '1000'
  };

  const validation = await validatePayment(paymentRequest, options);

  if (validation.valid) {
    console.log('Payment is valid');
    // Proceed with payment
  } else {
    console.log('Payment validation failed:', validation.errors);
    // Show errors to user
  }

  if (validation.warnings && validation.warnings.length > 0) {
    console.log('Warnings:', validation.warnings);
  }
}
```

### Transaction Analysis

```typescript
import { TransactionManager } from '@orbytech/sdk';

async function analyzeTransactions(publicKey: string) {
  const transactionManager = new TransactionManager();

  // Get transaction statistics
  const stats = await transactionManager.getTransactionStatistics(publicKey);
  
  console.log('Transaction Summary:');
  console.log(`Total transactions: ${stats.totalTransactions}`);
  console.log(`Total payments: ${stats.totalPayments}`);
  console.log(`Total sent: ${stats.totalSent}`);
  console.log(`Total received: ${stats.totalReceived}`);

  // Analyze asset usage
  console.log('\nAsset Usage:');
  stats.assets.forEach(asset => {
    console.log(`${asset.code}:`);
    console.log(`  Sent: ${asset.sentCount} times, total ${asset.totalSent}`);
    console.log(`  Received: ${asset.receivedCount} times, total ${asset.totalReceived}`);
  });

  // Get recent payment transactions
  const recentPayments = await transactionManager.getPaymentTransactions(publicKey, {
    limit: 10,
    order: 'desc'
  });

  console.log('\nRecent Payments:');
  recentPayments.transactions.forEach(tx => {
    const payment = tx.operations.find(op => op.type === 'payment');
    if (payment) {
      console.log(`${tx.createdAt}: ${payment.details.amount} ${payment.details.asset.code}`);
    }
  });
}
```

## Testing

The SDK includes comprehensive test coverage:

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test --coverage

# Run tests in watch mode
pnpm test:watch
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Use proper error handling
- Write comprehensive tests
- Update documentation
- Use semantic commit messages

## License

MIT License - see LICENSE file for details.

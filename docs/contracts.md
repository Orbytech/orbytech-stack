# Smart Contracts Documentation

## Overview

OrbyTech Stack includes two main smart contracts built with Stellar Soroban:

1. **Payment Contract** - For one-time payment processing
2. **Streaming Contract** - For time-based payment streaming

## Payment Contract

### Purpose

The Payment Contract facilitates secure one-time payments between Stellar addresses with optional memos and tracking.

### Contract Structure

```rust
#[contract]
pub struct PaymentContract;
```

### Key Functions

#### `init(recipient: Address, token: Address)`

Initialize the payment contract with a recipient and token address.

**Parameters:**
- `recipient`: Address that will receive payments
- `token`: Token contract address for payments

**Example:**
```rust
PaymentContract::init(env, recipient_address, token_address);
```

#### `process_payment(from: Address, amount: i128, memo: Option<String>) -> bool`

Process a payment from a sender to the contract's recipient.

**Parameters:**
- `from`: Sender's address
- `amount`: Payment amount in token units
- `memo`: Optional memo string

**Returns:**
- `bool`: Success status

**Example:**
```rust
let success = PaymentContract::process_payment(
    env,
    sender_address,
    10000000, // 1 XLM (7 decimals)
    Some(String::from_str(&env, "Payment for services"))
);
```

#### `get_recipient() -> Address`

Get the recipient address configured for this contract.

#### `get_token() -> Address`

Get the token address configured for this contract.

#### `get_payment(payment_id: Bytes) -> Option<(Address, i128, Option<String>)>`

Get details of a specific payment.

**Parameters:**
- `payment_id`: Unique payment identifier

**Returns:**
- `Option<(Address, i128, Option<String>)>`: Payment details or None

## Streaming Contract

### Purpose

The Streaming Contract enables time-based payment streaming where funds are released gradually over a specified period.

### Contract Structure

```rust
#[contract]
pub struct StreamingContract;

#[derive(Clone, Debug, soroban_sdk::contracttype)]
pub struct StreamData {
    pub sender: Address,
    pub recipient: Address,
    pub token: Address,
    pub total_amount: i128,
    pub start_time: u64,
    pub end_time: u64,
    pub withdrawn_amount: i128,
}
```

### Key Functions

#### `init(sender, recipient, token, total_amount, start_time, end_time)`

Initialize a new payment stream.

**Parameters:**
- `sender`: Address providing the funds
- `recipient`: Address receiving the streamed funds
- `token`: Token contract address
- `total_amount`: Total amount to be streamed
- `start_time`: Unix timestamp when streaming starts
- `end_time`: Unix timestamp when streaming ends

**Example:**
```rust
StreamingContract::init(
    env,
    sender_address,
    recipient_address,
    token_address,
    100000000, // 10 XLM
    1640995200, // Jan 1, 2022
    1672531200, // Jan 1, 2023
);
```

#### `withdraw(withdrawer: Address) -> i128`

Withdraw available funds from the stream.

**Parameters:**
- `withdrawer`: Address attempting to withdraw (must be recipient)

**Returns:**
- `i128`: Amount withdrawn

**Example:**
```rust
let amount = StreamingContract::withdraw(env, recipient_address);
```

#### `cancel_stream(canceller: Address) -> bool`

Cancel the stream and refund unused funds to the sender.

**Parameters:**
- `canceller`: Address attempting to cancel (must be sender)

**Returns:**
- `bool`: Success status

**Example:**
```rust
let success = StreamingContract::cancel_stream(env, sender_address);
```

#### `get_stream_data() -> StreamData`

Get the complete stream data including current status.

### Internal Functions

#### `calculate_available_amount(total_amount, start_time, end_time, current_time) -> i128`

Calculate how much of the total amount is available for withdrawal based on elapsed time.

**Logic:**
- If `current_time <= start_time`: Returns 0
- If `current_time >= end_time`: Returns `total_amount`
- Otherwise: Returns proportional amount based on elapsed time

## Deployment

### Prerequisites

- Rust toolchain
- Soroban CLI
- Stellar account with sufficient balance

### Build Contracts

```bash
# Build payment contract
cd contracts/payments
soroban contract build

# Build streaming contract
cd contracts/streaming
soroban contract build
```

### Deploy to Testnet

```bash
# Deploy payment contract
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/payment_contract.wasm \
  --source <your-secret-key> \
  --network testnet

# Deploy streaming contract
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/streaming_contract.wasm \
  --source <your-secret-key> \
  --network testnet
```

### Deploy to Mainnet

```bash
# Deploy payment contract
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/payment_contract.wasm \
  --source <your-secret-key> \
  --network mainnet

# Deploy streaming contract
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/streaming_contract.wasm \
  --source <your-secret-key> \
  --network mainnet
```

## Testing

### Unit Tests

```bash
# Test payment contract
cd contracts/payments
soroban contract test

# Test streaming contract
cd contracts/streaming
soroban contract test
```

### Integration Testing

Use the provided test scripts to verify contract interactions:

```bash
# Run integration tests
pnpm contracts:test
```

## Security Considerations

### Payment Contract

1. **Input Validation**: All inputs are validated before processing
2. **Access Control**: Only authorized addresses can initiate payments
3. **Replay Protection**: Each payment is uniquely identified to prevent replay attacks

### Streaming Contract

1. **Time-based Logic**: Streaming calculations are based on ledger timestamps
2. **Access Control**: Only recipients can withdraw, only senders can cancel
3. **Refund Mechanism**: Unused funds are properly refunded upon cancellation

### Best Practices

1. **Audit**: Conduct thorough security audits before mainnet deployment
2. **Testing**: Test extensively on testnet before mainnet deployment
3. **Monitoring**: Monitor contract activity for suspicious behavior
4. **Upgradability**: Consider upgrade patterns for future improvements

## Gas Fees

Contract operations consume gas fees:

- **Payment Contract**: ~5000-10000 operations per payment
- **Streaming Contract**: ~3000-8000 operations per withdrawal
- **Deployment**: ~50000-100000 operations per contract

Estimate costs based on current Stellar network gas prices.

## Integration Examples

### Using the SDK

```typescript
import { PaymentContract, StreamingContract } from '@orbytech/sdk';

// Deploy payment contract
const paymentContract = await PaymentContract.deploy({
  recipient: 'GB...',
  token: 'GB...',
  network: 'testnet'
});

// Process payment
await paymentContract.processPayment({
  from: 'GB...',
  amount: '10.0000000',
  memo: 'Payment for services'
});

// Deploy streaming contract
const streamingContract = await StreamingContract.deploy({
  sender: 'GB...',
  recipient: 'GB...',
  token: 'GB...',
  totalAmount: '100.0000000',
  startTime: new Date('2024-01-01'),
  endTime: new Date('2024-02-01'),
  network: 'testnet'
});

// Withdraw from stream
await streamingContract.withdraw({
  withdrawer: 'GB...'
});
```

## Troubleshooting

### Common Issues

1. **Insufficient Balance**: Ensure the account has enough XLM for gas fees
2. **Invalid Addresses**: Verify all Stellar addresses are valid
3. **Network Issues**: Check network connectivity and status
4. **Contract Not Found**: Verify contract deployment succeeded

### Debug Tools

- Use Soroban CLI for contract inspection
- Check transaction logs for detailed error messages
- Use network explorers for transaction tracking

# OrbyTech Smart Contracts

This directory contains the Stellar Soroban smart contracts for the OrbyTech ecosystem.

## Overview

- **Payment Contract**: A comprehensive payment processing contract with deposit, transfer, and withdrawal functionality
- **Streaming Contract**: Time-based payment streaming contracts (coming soon)

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Rust** (latest stable version)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Soroban CLI**
   ```bash
   cargo install soroban-cli
   ```

3. **Wasm Target**
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

4. **Stellar Account** (with testnet XLM for testing)
   - Create an account at [Stellar Lab](https://laboratory.stellar.org/)
   - Fund your testnet account at [Stellar Testnet Faucet](https://friendbot.stellar.org/)

## Quick Start

### 1. Build the Contracts

```bash
# Build all contracts
./scripts/build.sh

# Or build manually
cd contracts
cargo build --target wasm32-unknown-unknown --release
```

### 2. Run Tests

```bash
# Run all tests
./scripts/test.sh

# Or run manually
cd contracts
cargo test
```

### 3. Deploy to Testnet

```bash
# Set your secret key
export SECRET_KEY="your_secret_key_here"

# Deploy to testnet
./scripts/deploy.sh testnet
```

## Contract Architecture

### Payment Contract

The payment contract provides a complete payment processing solution with the following features:

#### Core Functions

- **`initialize(admin, fee_recipient, fee_rate, minimum_deposit)`**: Initialize the contract
- **`deposit(from, token, amount)`**: Deposit tokens into the contract
- **`transfer(from, to, token, amount, memo)`**: Transfer tokens between addresses
- **`withdraw(to, token, amount)`**: Withdraw tokens from the contract

#### Query Functions

- **`get_balance(address, token)`**: Get token balance for an address
- **`get_payment(payment_id)`**: Get payment details by ID
- **`get_payments_by_address(address)`**: Get all payments for an address
- **`get_config()`**: Get contract configuration

#### Admin Functions

- **`update_config(admin, new_fee_recipient, new_fee_rate, new_minimum_deposit, pause_status)`**: Update contract configuration
- **`emergency_pause(admin)`**: Emergency pause contract operations
- **`emergency_unpause(admin)`**: Emergency unpause contract operations

#### Data Structures

```rust
pub struct Payment {
    pub id: Bytes,
    pub from: Address,
    pub to: Address,
    pub amount: i128,
    pub token: Address,
    pub memo: Option<String>,
    pub timestamp: u64,
    pub status: PaymentStatus,
}

pub struct ContractConfig {
    pub admin: Address,
    pub fee_recipient: Address,
    pub fee_rate: u32, // basis points (100 = 1%)
    pub minimum_deposit: i128,
    pub is_paused: bool,
}
```

## Development Workflow

### 1. Local Development

```bash
# Start local Soroban network (for standalone testing)
soroban network standalone

# Build contracts
./scripts/build.sh

# Run tests
./scripts/test.sh
```

### 2. Testnet Deployment

```bash
# Set environment variables
export SECRET_KEY="your_testnet_secret_key"
export NETWORK="testnet"

# Deploy contracts
./scripts/deploy.sh testnet

# Test deployed contracts
node scripts/examples/payment_example.js
```

### 3. Mainnet Deployment

```bash
# Set environment variables
export SECRET_KEY="your_mainnet_secret_key"
export NETWORK="mainnet"

# Deploy contracts (ensure you have sufficient XLM)
./scripts/deploy.sh mainnet
```

## Scripts

### Build Script (`scripts/build.sh`)

Builds all contracts in the workspace with optimizations:
- Compiles to WASM target
- Applies release optimizations
- Checks contract size limits
- Validates build output

### Test Script (`scripts/test.sh`)

Runs comprehensive tests:
- Unit tests with cargo test
- Contract tests with Soroban testutils
- Code quality checks with clippy
- Format validation

### Deploy Script (`scripts/deploy.sh`)

Deploys contracts to specified network:
- Supports testnet, mainnet, futurenet, and standalone
- Handles contract initialization
- Saves contract addresses to environment file
- Verifies deployment

## Usage Examples

### TypeScript/JavaScript

```typescript
import { Contract, SorobanRpc, TransactionBuilder } from 'soroban-client';

const rpc = new SorobanRpc('https://soroban-testnet.stellar.org');
const contract = new Contract('CONTRACT_ID');

// Deposit tokens
const tx = new TransactionBuilder(account, { fee: BASE_FEE })
  .addOperation(
    contract.call(
      'deposit',
      address.toScVal(),
      token.toScVal(),
      nativeToScVal(BigInt(1000000))
    )
  )
  .build();

const result = await rpc.sendTransaction(tx);
```

### Rust Tests

```rust
#[test]
fn test_payment_flow() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PaymentContract);
    let client = PaymentContractClient::new(&env, &contract_id);

    // Initialize contract
    client.initialize(&admin, &fee_recipient, &100, &1000);

    // Deposit tokens
    let payment_id = client.deposit(&user, &token, &10000);

    // Verify balance
    let balance = client.get_balance(&user, &token);
    assert_eq!(balance, 9900); // Amount minus fee
}
```

## Configuration

### Environment Variables

- `SECRET_KEY`: Your Stellar secret key (required for deployment)
- `NETWORK`: Target network (testnet|mainnet|futurenet|standalone)
- `SOROBAN_RPC_URL`: Soroban RPC endpoint
- `STELLAR_NETWORK_PASSPHRASE`: Stellar network passphrase

### Contract Configuration

The payment contract can be configured with:
- **Fee Rate**: Transaction fee in basis points (100 = 1%)
- **Minimum Deposit**: Minimum amount for deposits
- **Fee Recipient**: Address to receive transaction fees
- **Admin**: Contract administrator address

## Security Considerations

### Smart Contract Security

1. **Access Control**: Admin-only functions are protected
2. **Input Validation**: All inputs are validated before processing
3. **Replay Protection**: Each payment has a unique ID
4. **Emergency Controls**: Pause/unpause functionality for emergencies
5. **Fee Limits**: Maximum fee rate enforced (100%)

### Development Security

1. **Secret Key Management**: Never commit secret keys to version control
2. **Network Separation**: Use testnet for development, mainnet for production
3. **Audit Trail**: All transactions are logged and traceable
4. **Testing**: Comprehensive test coverage before deployment

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Ensure Rust and Soroban CLI are up to date
   - Check that wasm32-unknown-unknown target is installed

2. **Deployment Failures**
   - Verify secret key is correct and has sufficient XLM
   - Check network connectivity and RPC endpoint status

3. **Transaction Failures**
   - Ensure sufficient gas fees
   - Verify contract is initialized
   - Check if contract is paused

### Debug Commands

```bash
# Check contract status
soroban contract read --id CONTRACT_ID --network testnet get_config

# Simulate transaction
soroban contract invoke --id CONTRACT_ID --network testnet get_balance --address ADDRESS --token TOKEN

# Check transaction status
soroban tx --hash TRANSACTION_HASH --network testnet
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `./scripts/test.sh`
5. Submit a pull request

### Code Style

- Use `cargo fmt` for formatting
- Use `cargo clippy` for linting
- Write tests for all new functionality
- Document all public functions

## Resources

- [Soroban Documentation](https://soroban.stellar.org/docs/)
- [Stellar Documentation](https://developers.stellar.org/)
- [Rust Book](https://doc.rust-lang.org/book/)
- [Stellar Laboratory](https://laboratory.stellar.org/)

## License

MIT License - see LICENSE file for details.

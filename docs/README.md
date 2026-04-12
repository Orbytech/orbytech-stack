# OrbyTech Stack Documentation

## Overview

OrbyTech Stack is a production-ready monorepo built with TypeScript, pnpm workspaces, and Stellar Soroban smart contract support.

## Architecture

### Applications (`apps/`)

- **web**: Next.js frontend application with TypeScript and Tailwind CSS
- **api**: Fastify backend API with TypeScript

### Packages (`packages/`)

- **sdk**: Shared TypeScript SDK for Stellar operations and utilities
- **ui**: Shared React UI components library
- **config**: Shared ESLint, Prettier, and TypeScript configurations

### Smart Contracts (`contracts/`)

- **payments**: Stellar Soroban payment processing contracts
- **streaming**: Stellar Soroban streaming payment contracts

## Development

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Rust (for Soroban contracts)
- Soroban CLI

### Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start development servers:
   ```bash
   # Start web app
   pnpm --filter @orbytech/web dev

   # Start API server
   pnpm --filter @orbytech/api dev
   ```

3. Build contracts:
   ```bash
   pnpm contracts:build
   ```

### Scripts

- `pnpm build` - Build all packages and applications
- `pnpm dev` - Start all development servers
- `pnpm lint` - Run ESLint across all packages
- `pnpm format` - Format code with Prettier
- `pnpm type-check` - Run TypeScript type checking
- `pnpm clean` - Clean all build artifacts

## Smart Contracts

### Payment Contract

The payment contract handles one-time payments between addresses.

**Key Functions:**
- `init(recipient, token)` - Initialize the contract
- `process_payment(from, amount, memo)` - Process a payment
- `get_payment(payment_id)` - Get payment details

### Streaming Contract

The streaming contract handles time-based payment streaming.

**Key Functions:**
- `init(sender, recipient, token, total_amount, start_time, end_time)` - Initialize stream
- `withdraw(withdrawer)` - Withdraw available funds
- `cancel_stream(canceller)` - Cancel the stream

## API Reference

### SDK

The SDK provides utilities for Stellar operations:

```typescript
import { StellarClient, NETWORK_CONFIGS } from '@orbytech/sdk';

const client = new StellarClient(NETWORK_CONFIGS.testnet);
const account = await client.createAccount();
```

### UI Components

Shared React components:

```typescript
import { Button, Input, Card, Modal, Toast } from '@orbytech/ui';

<Button variant="primary" onClick={() => console.log('clicked')}>
  Click me
</Button>
```

## Deployment

### Web App

```bash
pnpm --filter @orbytech/web build
# Deploy the .next directory to your hosting provider
```

### API

```bash
pnpm --filter @orbytech/api build
# Deploy the dist directory to your hosting provider
```

### Smart Contracts

```bash
# Build contracts
pnpm contracts:build

# Deploy to testnet
pnpm contracts:deploy --network testnet

# Deploy to mainnet
pnpm contracts:deploy --network mainnet
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

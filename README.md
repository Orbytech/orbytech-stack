# OrbyTech Stack

A production-ready monorepo for building modern applications with TypeScript, pnpm workspaces, and Stellar Soroban smart contract support.

## Features

- **Monorepo Architecture**: pnpm workspaces for efficient dependency management
- **TypeScript Everywhere**: Full TypeScript support across all packages and applications
- **Modern Web Stack**: Next.js frontend, Fastify backend
- **Stellar Integration**: Built-in support for Stellar blockchain and Soroban smart contracts
- **Shared Libraries**: Reusable SDK and UI components
- **Developer Experience**: ESLint, Prettier, and comprehensive tooling
- **Production Ready**: Optimized builds, testing, and deployment configurations

## Project Structure

```
orbytech-stack/
  apps/
    web/          # Next.js frontend application
    api/          # Fastify backend API
  packages/
    sdk/          # Shared TypeScript SDK
    ui/           # Shared React UI components
    config/       # Shared ESLint, Prettier, TypeScript configs
  contracts/
    payments/     # Stellar Soroban payment contracts
    streaming/    # Stellar Soroban streaming contracts
  docs/           # Documentation
```

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Rust (for Soroban contracts)
- Soroban CLI

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd orbytech-stack
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development servers**
   ```bash
   # Start all services
   pnpm dev
   
   # Or start individually
   pnpm --filter @orbytech/web dev    # Frontend on http://localhost:3000
   pnpm --filter @orbytech/api dev     # API on http://localhost:3001
   ```

### Building

```bash
# Build all packages and applications
pnpm build

# Build individual packages
pnpm --filter @orbytech/web build
pnpm --filter @orbytech/api build
pnpm --filter @orbytech/sdk build
```

### Smart Contracts

```bash
# Build contracts
pnpm contracts:build

# Test contracts
pnpm contracts:test

# Deploy to testnet
pnpm contracts:deploy --network testnet
```

## Development

### Scripts

- `pnpm dev` - Start all development servers
- `pnpm build` - Build all packages and applications
- `pnpm lint` - Run ESLint across all packages
- `pnpm lint:fix` - Auto-fix ESLint issues
- `pnpm format` - Format code with Prettier
- `pnpm type-check` - Run TypeScript type checking
- `pnpm test` - Run tests across all packages
- `pnpm clean` - Clean all build artifacts

### Package Management

This monorepo uses pnpm workspaces for efficient dependency management:

```bash
# Add dependency to specific package
pnpm --filter @orbytech/web add react

# Add dev dependency to all packages
pnpm -D add typescript

# Remove dependency
pnpm --filter @orbytech/api remove fastify
```

### Code Quality

- **ESLint**: Configured with TypeScript and React rules
- **Prettier**: Consistent code formatting
- **TypeScript**: Strict type checking enabled
- **Husky**: Git hooks for pre-commit checks (optional)

## Applications

### Web App (`apps/web`)

Next.js application with:
- TypeScript support
- Tailwind CSS for styling
- Shared UI components from `@orbytech/ui`
- SDK integration for Stellar operations

### API (`apps/api`)

Fastify backend with:
- TypeScript support
- CORS and security middleware
- RESTful API endpoints
- JWT authentication
- Stellar blockchain integration

## Packages

### SDK (`packages/sdk`)

Shared TypeScript SDK providing:
- Stellar client utilities
- Contract interaction helpers
- Type definitions for blockchain operations
- Network configuration management

### UI (`packages/ui`)

Shared React component library:
- Button, Input, Card, Modal, Toast components
- TypeScript props definitions
- Tailwind CSS styling
- Reusable across applications

### Config (`packages/config`)

Shared configuration files:
- ESLint configuration
- Prettier configuration
- TypeScript base configuration
- Consistent tooling setup

## Smart Contracts

### Payment Contract

Handles one-time payments with:
- Secure payment processing
- Memo support
- Payment tracking
- Recipient management

### Streaming Contract

Manages time-based payment streams with:
- Gradual fund release
- Withdrawal mechanisms
- Stream cancellation
- Time-based calculations

## Documentation

- [API Reference](./docs/api.md) - REST API documentation
- [Smart Contracts](./docs/contracts.md) - Contract documentation
- [Development Guide](./docs/README.md) - Detailed development instructions

## Deployment

### Web Application

```bash
# Build for production
pnpm --filter @orbytech/web build

# Deploy to Vercel, Netlify, or your preferred hosting
```

### API

```bash
# Build for production
pnpm --filter @orbytech/api build

# Deploy to Vercel, Railway, or your preferred hosting
```

### Smart Contracts

```bash
# Deploy to testnet
pnpm contracts:deploy --network testnet

# Deploy to mainnet
pnpm contracts:deploy --network mainnet
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests and linting: `pnpm lint && pnpm type-check`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a pull request

### Development Guidelines

- Follow TypeScript best practices
- Use semantic commit messages
- Write tests for new features
- Update documentation for API changes
- Ensure all linting passes before submitting

## Environment Variables

See `.env.example` for all available environment variables:

- `STELLAR_NETWORK`: Stellar network (testnet/mainnet)
- `STELLAR_SECRET_KEY`: Your Stellar secret key (development only)
- `JWT_SECRET`: JWT signing secret
- `DATABASE_URL`: Database connection string
- `PORT`: API server port

## Support

- **Issues**: Report bugs and feature requests on GitHub
- **Discussions**: Join community discussions
- **Documentation**: Check the [docs](./docs/) folder for detailed guides

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Stellar](https://stellar.org/) and [Soroban](https://soroban.stellar.org/)
- Inspired by modern monorepo best practices
- Powered by [pnpm](https://pnpm.io/) workspaces

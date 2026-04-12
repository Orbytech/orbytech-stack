# OrbyTech Web Application

A modern Next.js frontend for Stellar wallet management and payments, built with TypeScript and Tailwind CSS.

## Features

- **Wallet Connection**: Connect Stellar wallets with secret key or create new accounts
- **Balance Display**: View wallet balances for XLM and other assets
- **Send Payments**: Create and send payments with validation and fee estimation
- **Transaction History**: Track and view transaction history with detailed information
- **Modern UI**: Clean, responsive design using Tailwind CSS and shared UI components
- **Type Safety**: Full TypeScript implementation with proper type definitions
- **Real-time Updates**: Live balance updates and transaction status tracking

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shared components from `@orbytech/ui`
- **Stellar Integration**: Stellar SDK for blockchain operations
- **Form Handling**: React Hook Form with Zod validation
- **State Management**: React hooks and context
- **Icons**: Lucide React
- **HTTP Client**: Axios with SWR for data fetching

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Running API server (see `../apps/api`)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
pnpm dev
```

The application will be available at `http://localhost:3000`.

### Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Stellar Network Configuration
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# Application Configuration
NEXT_PUBLIC_APP_NAME="OrbyTech Stack"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_DEBUG=true
```

## Architecture

### Project Structure

```
src/
  app/                    # Next.js App Router
    globals.css          # Global styles
    layout.tsx           # Root layout
    page.tsx             # Home page (dashboard)
  components/            # React components
    WalletConnect.tsx    # Wallet connection component
    WalletBalance.tsx    # Balance display component
    SendPayment.tsx      # Payment form component
    TransactionHistory.tsx # Transaction history component
  hooks/                # Custom React hooks
    useStellar.ts        # Stellar wallet hook
  lib/                  # Utility functions
    utils.ts             # Common utilities
  services/             # Service layer
    stellar.service.ts   # Stellar API service
```

### Key Components

#### **WalletConnect**
- Connect existing wallets with secret key
- Create new Stellar accounts
- Fund testnet accounts
- Wallet connection status display

#### **WalletBalance**
- Display XLM and other asset balances
- Account information and network details
- Quick actions (refresh, explorer links)
- Balance formatting and display

#### **SendPayment**
- Payment form with validation
- Fee estimation and total calculation
- Transaction creation and signing
- Success/error handling with feedback

#### **TransactionHistory**
- Transaction list with filtering
- Transaction details and status
- Explorer integration
- Real-time updates and refresh

### Services

#### **StellarService**
- Stellar SDK integration
- API communication
- Transaction handling
- Account management

### Hooks

#### **useStellar**
- Wallet state management
- Connection handling
- Transaction operations
- Error handling and loading states

## Usage Examples

### Connect Wallet

```typescript
import { useStellar } from '@/hooks/useStellar';

function MyComponent() {
  const { connect, disconnect, isConnected, account } = useStellar();
  
  const handleConnect = async () => {
    await connect('S...'); // Secret key
  };
  
  return (
    <div>
      {isConnected ? (
        <div>
          <p>Connected: {account?.publicKey}</p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      ) : (
        <button onClick={handleConnect}>Connect Wallet</button>
      )}
    </div>
  );
}
```

### Send Payment

```typescript
import { useStellar } from '@/hooks/useStellar';

function PaymentForm() {
  const { sendPayment } = useStellar();
  
  const handleSendPayment = async () => {
    try {
      const hash = await sendPayment({
        from: 'G...',
        to: 'G...',
        amount: '10.5',
        asset: 'XLM',
        memo: 'Payment for services'
      });
      
      console.log('Payment sent:', hash);
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };
  
  return <button onClick={handleSendPayment}>Send Payment</button>;
}
```

## Development

### Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues
pnpm type-check       # TypeScript type checking
pnpm test             # Run tests
pnpm test:watch       # Run tests in watch mode
```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for Next.js and TypeScript
- **Prettier**: Code formatting
- **Tailwind CSS**: Utility-first styling
- **Component Structure**: Functional components with hooks

### Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test --coverage

# Run tests in watch mode
pnpm test:watch
```

## Security Considerations

### Private Key Handling
- Secret keys are stored in localStorage (development only)
- In production, consider using secure storage solutions
- Keys are never sent to servers unnecessarily
- Clear key storage on wallet disconnect

### Input Validation
- All user inputs validated with Zod schemas
- Stellar address format validation
- Amount and balance validations
- Transaction parameter validation

### Network Security
- HTTPS required in production
- API endpoint validation
- CORS configuration
- Content Security Policy headers

## Deployment

### Environment Setup

1. Set production environment variables
2. Configure API endpoints
3. Set up HTTPS and security headers
4. Configure analytics and monitoring

### Build Process

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

## Performance Optimization

### Code Splitting
- Automatic code splitting with Next.js
- Component-level lazy loading
- Route-based code splitting

### Caching
- SWR for data fetching
- Image optimization
- Static asset caching

### Bundle Optimization
- Tree shaking enabled
- Minification and compression
- Bundle analysis available

## Monitoring

### Error Tracking
- Client-side error logging
- Transaction failure tracking
- Performance monitoring

### Analytics
- User interaction tracking
- Feature usage analytics
- Performance metrics

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
- Write tests for new features
- Update documentation
- Use semantic commit messages

## Troubleshooting

### Common Issues

**Wallet Connection Failed**
- Check API server is running
- Verify network configuration
- Check secret key format

**Transaction Not Sending**
- Verify account has sufficient balance
- Check network connectivity
- Validate recipient address

**Balance Not Updating**
- Refresh wallet data
- Check API response
- Verify network status

### Debug Mode

Enable debug mode in `.env.local`:
```bash
NEXT_PUBLIC_ENABLE_DEBUG=true
```

This will enable additional logging and debug information.

## License

MIT License - see LICENSE file for details.

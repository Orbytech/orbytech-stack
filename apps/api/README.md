# OrbyTech API

A comprehensive backend API for Stellar blockchain operations built with Fastify and TypeScript.

## Features

- **Stellar Integration**: Full Stellar network support (testnet/mainnet)
- **Wallet Management**: Create, fund, and manage Stellar wallets
- **Payment Processing**: Send and track payments on the Stellar network
- **Type Safety**: Full TypeScript implementation with Zod validation
- **API Documentation**: Auto-generated Swagger documentation
- **Error Handling**: Comprehensive error handling and logging
- **Security**: Rate limiting, CORS, and security headers
- **Testing**: Jest test suite with comprehensive coverage

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Development

```bash
# Start development server
pnpm dev

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type checking
pnpm type-check

# Linting
pnpm lint
pnpm lint:fix

# Build for production
pnpm build
```

### Environment Variables

```bash
# Server Configuration
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

# Stellar Network Configuration
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true
```

## API Endpoints

### Base URL
- Development: `http://localhost:3001`
- Production: `https://api.orbytech.com`

### Health Check

**GET** `/health`

Check if the API server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "network": "testnet"
}
```

### API Info

**GET** `/api/v1/info`

Get API information and available endpoints.

**Response:**
```json
{
  "message": "OrbyTech API",
  "version": "1.0.0",
  "network": "testnet",
  "endpoints": {
    "wallet": "/api/v1/wallet",
    "payment": "/api/v1/payment",
    "docs": "/docs"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Wallet Endpoints

### Create Wallet

**POST** `/api/v1/wallet/create`

Create a new Stellar wallet.

**Request Body:**
```json
{
  "fund": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "publicKey": "GABCDEFGHIJKLMNOPQRSTUVWXYZ123456789",
    "secretKey": "SABCDEFGHIJKLMNOPQRSTUVWXYZ123456789",
    "network": "testnet"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Get Wallet Info

**GET** `/api/v1/wallet/:address`

Get wallet information including balance.

**Parameters:**
- `address` (string): Stellar public key

**Response:**
```json
{
  "success": true,
  "data": {
    "publicKey": "GABCDEFGHIJKLMNOPQRSTUVWXYZ123456789",
    "balance": [
      {
        "balance": "100.0000000",
        "assetType": "native",
        "assetCode": "XLM"
      }
    ],
    "network": "testnet",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Fund Wallet (Testnet Only)

**POST** `/api/v1/wallet/fund`

Fund a wallet with testnet XLM.

**Request Body:**
```json
{
  "address": "GABCDEFGHIJKLMNOPQRSTUVWXYZ123456789"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "funded": true
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Get Wallet Balance

**GET** `/api/v1/wallet/:address/balance`

Get wallet balance for all assets.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "balance": "100.0000000",
      "asset": "XLM"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Validate Wallet Address

**POST** `/api/v1/wallet/validate`

Validate a Stellar wallet address format.

**Request Body:**
```json
{
  "address": "GABCDEFGHIJKLMNOPQRSTUVWXYZ123456789"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "address": "GABCDEFGHIJKLMNOPQRSTUVWXYZ123456789"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Payment Endpoints

### Send Payment

**POST** `/api/v1/payment/send`

Send a payment (creates unsigned transaction).

**Request Body:**
```json
{
  "from": "GABCDEFGHIJKLMNOPQRSTUVWXYZ123456789",
  "to": "GBCDEFGHIJKLMNOPQRSTUVWXYZ123456789",
  "amount": "10.0000000",
  "asset": "XLM",
  "memo": "Payment for services"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hash": "pending_transaction_hash",
    "status": "pending",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "from": "GABCDEFGHIJKLMNOPQRSTUVWXYZ123456789",
    "to": "GBCDEFGHIJKLMNOPQRSTUVWXYZ123456789",
    "amount": "10.0000000",
    "asset": "XLM",
    "memo": "Payment for services"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Submit Signed Transaction

**POST** `/api/v1/payment/submit`

Submit a signed transaction to the network.

**Request Body:**
```json
{
  "transactionXDR": "AAAAAB..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hash": "transaction_hash",
    "status": "success",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "from": "GABCDEFGHIJKLMNOPQRSTUVWXYZ123456789",
    "to": "GBCDEFGHIJKLMNOPQRSTUVWXYZ123456789",
    "amount": "10.0000000",
    "asset": "XLM",
    "memo": "Payment for services"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Get Transaction Details

**GET** `/api/v1/payment/transaction/:hash`

Get transaction details by hash.

**Parameters:**
- `hash` (string): Transaction hash

**Response:**
```json
{
  "success": true,
  "data": {
    "hash": "transaction_hash",
    "created_at": "2024-01-01T00:00:00.000Z",
    "source_account": "GABCDEFGHIJKLMNOPQRSTUVWXYZ123456789",
    "operations": [...]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Estimate Fee

**GET** `/api/v1/payment/fee`

Get current network fee estimate.

**Response:**
```json
{
  "success": true,
  "data": {
    "fee": 100,
    "network": "testnet"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Get Payment History

**GET** `/api/v1/payment/history/:address`

Get payment history for an account.

**Parameters:**
- `address` (string): Stellar public key
- `limit` (query): Number of transactions (max 100, default 10)
- `cursor` (query): Pagination cursor

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "hash": "transaction_hash",
      "created_at": "2024-01-01T00:00:00.000Z",
      "source_account": "GABCDEFGHIJKLMNOPQRSTUVWXYZ123456789",
      "operations": [
        {
          "type": "payment",
          "destination": "GBCDEFGHIJKLMNOPQRSTUVWXYZ123456789",
          "amount": "10.0000000",
          "asset": "XLM"
        }
      ]
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Validate Payment

**POST** `/api/v1/payment/validate`

Validate payment parameters before sending.

**Request Body:**
```json
{
  "from": "GABCDEFGHIJKLMNOPQRSTUVWXYZ123456789",
  "to": "GBCDEFGHIJKLMNOPQRSTUVWXYZ123456789",
  "amount": "10.0000000",
  "asset": "XLM",
  "memo": "Payment for services"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "errors": [],
    "estimatedFee": 100
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details (optional)"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Invalid request parameters
- `WALLET_NOT_FOUND`: Wallet/account not found
- `WALLET_CREATION_FAILED`: Failed to create wallet
- `WALLET_FUNDING_FAILED`: Failed to fund wallet
- `PAYMENT_FAILED`: Payment processing failed
- `TRANSACTION_SUBMISSION_FAILED`: Failed to submit transaction
- `TRANSACTION_NOT_FOUND`: Transaction not found
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `INTERNAL_ERROR`: Server-side error

## API Documentation

Interactive API documentation is available at:

- **Swagger UI**: `http://localhost:3001/docs`
- **OpenAPI JSON**: `http://localhost:3001/docs/json`

## Architecture

### Project Structure

```
src/
  config/          # Configuration management
  controllers/      # Route controllers
  middleware/       # Express middleware
  routes/          # API routes
  services/        # Business logic services
  tests/           # Test files
  types/           # TypeScript type definitions
  utils/           # Utility functions
  index.ts         # Application entry point
```

### Key Components

- **StellarService**: Handles all Stellar network interactions
- **WalletController**: Manages wallet operations
- **PaymentController**: Handles payment processing
- **Error Middleware**: Centralized error handling
- **Validation**: Zod schemas for request/response validation
- **Rate Limiting**: Request rate limiting by IP
- **Logging**: Structured logging with request IDs

### Security Features

- **Input Validation**: All inputs validated with Zod schemas
- **Rate Limiting**: 100 requests per minute per IP
- **CORS**: Configurable CORS settings
- **Security Headers**: HSTS, XSS protection, content security policy
- **Error Sanitization**: Sensitive information hidden in production

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test --coverage
```

### Test Structure

- Unit tests for all controllers and services
- Integration tests for API endpoints
- Mocked Stellar SDK for reliable testing
- Test coverage reporting

### Test Examples

```typescript
// Example test
describe('WalletController', () => {
  it('should create a new wallet', async () => {
    const result = await walletController.createWallet(mockRequest, mockReply);
    expect(result.success).toBe(true);
    expect(result.data.publicKey).toMatch(/^G[A-Z0-9]{55}$/);
  });
});
```

## Deployment

### Environment Setup

1. Set production environment variables
2. Build the application: `pnpm build`
3. Start the server: `pnpm start`

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### Environment Variables for Production

```bash
NODE_ENV=production
PORT=3001
STELLAR_NETWORK=mainnet
STELLAR_HORIZON_URL=https://horizon.stellar.org
STELLAR_SOROBAN_RPC_URL=https://soroban.stellar.org
STELLAR_NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
JWT_SECRET=your-production-jwt-secret
CORS_ORIGIN=https://your-frontend-domain.com
```

## Monitoring

### Health Checks

- `/health` - Basic health check
- `/api/v1/info` - API information

### Logging

- Structured JSON logging
- Request/response logging
- Error tracking
- Performance metrics

### Metrics

- Request count by endpoint
- Response times
- Error rates
- Stellar network operations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Use Zod for all input validation
- Write tests for all new features
- Update documentation for API changes
- Use semantic commit messages

## License

MIT License - see LICENSE file for details.

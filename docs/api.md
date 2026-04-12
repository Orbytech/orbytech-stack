# API Documentation

## Overview

The OrbyTech API provides RESTful endpoints for interacting with Stellar blockchain and managing payment operations.

## Base URL

- Development: `http://localhost:3001`
- Production: `https://api.orbytech.com`

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Health Check

**GET** `/health`

Check if the API server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Hello World

**GET** `/api/v1/hello`

Simple hello endpoint for testing.

**Response:**
```json
{
  "message": "Hello from OrbyTech API!"
}
```

### Stellar Operations

#### Create Account

**POST** `/api/v1/stellar/account`

Create a new Stellar account.

**Request Body:**
```json
{
  "network": "testnet"
}
```

**Response:**
```json
{
  "publicKey": "GB...",
  "secretKey": "S...",
  "balance": "100.0000000"
}
```

#### Get Account Balance

**GET** `/api/v1/stellar/account/:publicKey/balance`

Get the balance of a Stellar account.

**Parameters:**
- `publicKey` (string): Stellar public key

**Response:**
```json
{
  "balance": "100.0000000",
  "assets": [
    {
      "asset_code": "XLM",
      "asset_issuer": "",
      "balance": "100.0000000"
    }
  ]
}
```

#### Send Payment

**POST** `/api/v1/stellar/payment`

Send a payment to another Stellar address.

**Request Body:**
```json
{
  "from": "GB...",
  "to": "GB...",
  "amount": "10.0000000",
  "asset": "XLM",
  "memo": "Payment for services"
}
```

**Response:**
```json
{
  "hash": "tx_hash_here",
  "status": "success",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Smart Contract Operations

#### Deploy Payment Contract

**POST** `/api/v1/contracts/payment/deploy`

Deploy a payment contract.

**Request Body:**
```json
{
  "recipient": "GB...",
  "token": "GB...",
  "network": "testnet"
}
```

**Response:**
```json
{
  "contractId": "contract_id_here",
  "address": "contract_address_here",
  "status": "deployed"
}
```

#### Process Payment Contract

**POST** `/api/v1/contracts/payment/:contractId/process`

Process a payment through the contract.

**Request Body:**
```json
{
  "from": "GB...",
  "amount": "10.0000000",
  "memo": "Payment via contract"
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "tx_hash_here"
}
```

#### Deploy Streaming Contract

**POST** `/api/v1/contracts/streaming/deploy`

Deploy a streaming payment contract.

**Request Body:**
```json
{
  "sender": "GB...",
  "recipient": "GB...",
  "token": "GB...",
  "totalAmount": "100.0000000",
  "startTime": "2024-01-01T00:00:00.000Z",
  "endTime": "2024-02-01T00:00:00.000Z",
  "network": "testnet"
}
```

**Response:**
```json
{
  "contractId": "contract_id_here",
  "address": "contract_address_here",
  "status": "deployed"
}
```

#### Withdraw from Streaming Contract

**POST** `/api/v1/contracts/streaming/:contractId/withdraw`

Withdraw available funds from a streaming contract.

**Request Body:**
```json
{
  "withdrawer": "GB..."
}
```

**Response:**
```json
{
  "amount": "5.0000000",
  "transactionHash": "tx_hash_here"
}
```

## Error Responses

All endpoints may return error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": {
      "field": "publicKey",
      "reason": "Invalid Stellar address format"
    }
  }
}
```

### Error Codes

- `VALIDATION_ERROR`: Invalid input parameters
- `AUTHENTICATION_ERROR`: Invalid or missing authentication
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NETWORK_ERROR`: Stellar network issues
- `CONTRACT_ERROR`: Smart contract execution error
- `INTERNAL_ERROR`: Server-side error

## Rate Limiting

The API implements rate limiting:

- 100 requests per minute per IP address
- 1000 requests per minute per authenticated user

## Webhooks

### Payment Status Webhook

Receive notifications when payment status changes:

**Endpoint**: Your webhook URL
**Method**: POST
**Headers**: `X-OrbyTech-Signature` for verification

**Payload:**
```json
{
  "event": "payment.completed",
  "data": {
    "paymentId": "payment_id_here",
    "status": "completed",
    "amount": "10.0000000",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## SDK Integration

Use the TypeScript SDK for easier integration:

```typescript
import { OrbyTechAPI } from '@orbytech/sdk';

const api = new OrbyTechAPI({
  baseURL: 'http://localhost:3001',
  apiKey: 'your-api-key'
});

const account = await api.stellar.createAccount();
const balance = await api.stellar.getBalance(account.publicKey);
```

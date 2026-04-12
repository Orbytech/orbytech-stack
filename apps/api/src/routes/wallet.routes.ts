import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { WalletController } from '../controllers/wallet.controller';
import { z } from 'zod';

// Route schemas
const createWalletSchema = {
  description: 'Create a new Stellar wallet',
  tags: ['wallet'],
  body: {
    type: 'object',
    properties: {
      fund: {
        type: 'boolean',
        description: 'Whether to fund the wallet with testnet XLM (testnet only)',
        default: false,
      },
    },
  },
  response: {
    201: {
      description: 'Wallet created successfully',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            publicKey: { type: 'string' },
            secretKey: { type: 'string' },
            network: { type: 'string' },
          },
        },
        timestamp: { type: 'string' },
      },
    },
  },
};

const getWalletSchema = {
  description: 'Get wallet information',
  tags: ['wallet'],
  params: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'Stellar public key',
        pattern: '^G[A-Z0-9]{55}$',
      },
    },
    required: ['address'],
  },
  response: {
    200: {
      description: 'Wallet information retrieved successfully',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            publicKey: { type: 'string' },
            balance: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  balance: { type: 'string' },
                  assetType: { type: 'string' },
                  assetCode: { type: 'string' },
                  assetIssuer: { type: 'string' },
                },
              },
            },
            network: { type: 'string' },
            createdAt: { type: 'string' },
          },
        },
        timestamp: { type: 'string' },
      },
    },
  },
};

const fundWalletSchema = {
  description: 'Fund a wallet with testnet XLM',
  tags: ['wallet'],
  body: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'Stellar public key to fund',
        pattern: '^G[A-Z0-9]{55}$',
      },
    },
    required: ['address'],
  },
  response: {
    200: {
      description: 'Wallet funded successfully',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            funded: { type: 'boolean' },
          },
        },
        timestamp: { type: 'string' },
      },
    },
  },
};

const getBalanceSchema = {
  description: 'Get wallet balance',
  tags: ['wallet'],
  params: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'Stellar public key',
        pattern: '^G[A-Z0-9]{55}$',
      },
    },
    required: ['address'],
  },
  response: {
    200: {
      description: 'Balance retrieved successfully',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              balance: { type: 'string' },
              asset: { type: 'string' },
            },
          },
        },
        timestamp: { type: 'string' },
      },
    },
  },
};

const validateWalletSchema = {
  description: 'Validate a Stellar wallet address',
  tags: ['wallet'],
  body: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'Stellar public key to validate',
        pattern: '^G[A-Z0-9]{55}$',
      },
    },
    required: ['address'],
  },
  response: {
    200: {
      description: 'Address validation result',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            address: { type: 'string' },
          },
        },
        timestamp: { type: 'string' },
      },
    },
  },
};

export async function walletRoutes(fastify: FastifyInstance) {
  const walletController = new WalletController();

  // POST /wallet/create - Create a new wallet
  fastify.post('/wallet/create', {
    schema: createWalletSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return walletController.createWallet(request, reply);
  });

  // GET /wallet/:address - Get wallet information
  fastify.get('/wallet/:address', {
    schema: getWalletSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return walletController.getWallet(request, reply);
  });

  // POST /wallet/fund - Fund a wallet (testnet only)
  fastify.post('/wallet/fund', {
    schema: fundWalletSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return walletController.fundWallet(request, reply);
  });

  // GET /wallet/:address/balance - Get wallet balance
  fastify.get('/wallet/:address/balance', {
    schema: getBalanceSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return walletController.getWalletBalance(request, reply);
  });

  // POST /wallet/validate - Validate wallet address
  fastify.post('/wallet/validate', {
    schema: validateWalletSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return walletController.validateWallet(request, reply);
  });
}

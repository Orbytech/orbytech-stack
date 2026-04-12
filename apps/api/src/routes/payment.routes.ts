import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PaymentController } from '../controllers/payment.controller';

// Route schemas
const sendPaymentSchema = {
  description: 'Send a payment',
  tags: ['payment'],
  body: {
    type: 'object',
    properties: {
      from: {
        type: 'string',
        description: 'Sender Stellar public key',
        pattern: '^G[A-Z0-9]{55}$',
      },
      to: {
        type: 'string',
        description: 'Recipient Stellar public key',
        pattern: '^G[A-Z0-9]{55}$',
      },
      amount: {
        type: 'string',
        description: 'Amount to send (in stroops for XLM)',
        pattern: '^\\d+(\\.\\d+)?$',
      },
      asset: {
        type: 'string',
        description: 'Asset to send (XLM or CODE:ISSUER)',
        default: 'XLM',
      },
      memo: {
        type: 'string',
        description: 'Payment memo (max 28 characters)',
        maxLength: 28,
      },
    },
    required: ['from', 'to', 'amount'],
  },
  response: {
    200: {
      description: 'Payment processed successfully',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            hash: { type: 'string' },
            status: { type: 'string', enum: ['success', 'failed', 'pending'] },
            timestamp: { type: 'string' },
            from: { type: 'string' },
            to: { type: 'string' },
            amount: { type: 'string' },
            asset: { type: 'string' },
            memo: { type: 'string' },
          },
        },
        timestamp: { type: 'string' },
      },
    },
  },
};

const submitTransactionSchema = {
  description: 'Submit a signed transaction',
  tags: ['payment'],
  body: {
    type: 'object',
    properties: {
      transactionXDR: {
        type: 'string',
        description: 'Signed transaction in XDR format',
      },
    },
    required: ['transactionXDR'],
  },
  response: {
    200: {
      description: 'Transaction submitted successfully',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            hash: { type: 'string' },
            status: { type: 'string', enum: ['success', 'failed', 'pending'] },
            timestamp: { type: 'string' },
            from: { type: 'string' },
            to: { type: 'string' },
            amount: { type: 'string' },
            asset: { type: 'string' },
            memo: { type: 'string' },
          },
        },
        timestamp: { type: 'string' },
      },
    },
  },
};

const getTransactionSchema = {
  description: 'Get transaction details',
  tags: ['payment'],
  params: {
    type: 'object',
    properties: {
      hash: {
        type: 'string',
        description: 'Transaction hash',
        pattern: '^[a-fA-F0-9]{64}$',
      },
    },
    required: ['hash'],
  },
  response: {
    200: {
      description: 'Transaction details retrieved successfully',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'object' },
        timestamp: { type: 'string' },
      },
    },
  },
};

const estimateFeeSchema = {
  description: 'Estimate transaction fee',
  tags: ['payment'],
  response: {
    200: {
      description: 'Fee estimated successfully',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            fee: { type: 'number' },
            network: { type: 'string' },
          },
        },
        timestamp: { type: 'string' },
      },
    },
  },
};

const getPaymentHistorySchema = {
  description: 'Get payment history for an account',
  tags: ['payment'],
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
  querystring: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Number of transactions to return (max 100)',
        minimum: 1,
        maximum: 100,
        default: 10,
      },
      cursor: {
        type: 'string',
        description: 'Pagination cursor',
      },
    },
  },
  response: {
    200: {
      description: 'Payment history retrieved successfully',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hash: { type: 'string' },
              created_at: { type: 'string' },
              source_account: { type: 'string' },
              operations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    destination: { type: 'string' },
                    amount: { type: 'string' },
                    asset: { type: 'string' },
                    asset_issuer: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        timestamp: { type: 'string' },
      },
    },
  },
};

const validatePaymentSchema = {
  description: 'Validate payment parameters',
  tags: ['payment'],
  body: {
    type: 'object',
    properties: {
      from: {
        type: 'string',
        description: 'Sender Stellar public key',
        pattern: '^G[A-Z0-9]{55}$',
      },
      to: {
        type: 'string',
        description: 'Recipient Stellar public key',
        pattern: '^G[A-Z0-9]{55}$',
      },
      amount: {
        type: 'string',
        description: 'Amount to send',
        pattern: '^\\d+(\\.\\d+)?$',
      },
      asset: {
        type: 'string',
        description: 'Asset to send',
        default: 'XLM',
      },
      memo: {
        type: 'string',
        description: 'Payment memo',
        maxLength: 28,
      },
    },
    required: ['from', 'to', 'amount'],
  },
  response: {
    200: {
      description: 'Payment validation result',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            errors: {
              type: 'array',
              items: { type: 'string' },
            },
            estimatedFee: { type: 'number' },
          },
        },
        timestamp: { type: 'string' },
      },
    },
  },
};

export async function paymentRoutes(fastify: FastifyInstance) {
  const paymentController = new PaymentController();

  // POST /payment/send - Send a payment
  fastify.post('/payment/send', {
    schema: sendPaymentSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return paymentController.sendPayment(request, reply);
  });

  // POST /payment/submit - Submit a signed transaction
  fastify.post('/payment/submit', {
    schema: submitTransactionSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return paymentController.submitTransaction(request, reply);
  });

  // GET /payment/transaction/:hash - Get transaction details
  fastify.get('/payment/transaction/:hash', {
    schema: getTransactionSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return paymentController.getTransaction(request, reply);
  });

  // GET /payment/fee - Estimate transaction fee
  fastify.get('/payment/fee', {
    schema: estimateFeeSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return paymentController.estimateFee(request, reply);
  });

  // GET /payment/history/:address - Get payment history
  fastify.get('/payment/history/:address', {
    schema: getPaymentHistorySchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return paymentController.getPaymentHistory(request, reply);
  });

  // POST /payment/validate - Validate payment parameters
  fastify.post('/payment/validate', {
    schema: validatePaymentSchema,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return paymentController.validatePayment(request, reply);
  });
}

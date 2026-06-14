import { FastifyRequest, FastifyReply } from 'fastify';
import { StellarService } from '../services/stellar.service';
import { PaymentRequest, PaymentResponse, ApiResponse } from '../types';
import { z } from 'zod';

// Validation schemas
const sendPaymentSchema = z.object({
  from: z.string().min(56).max(56).regex(/^G[A-Z0-9]{55}$/),
  to: z.string().min(56).max(56).regex(/^G[A-Z0-9]{55}$/),
  amount: z.string().regex(/^\d+(\.\d+)?$/).refine(val => parseFloat(val) > 0, {
    message: "Amount must be greater than 0"
  }),
  asset: z.string().optional().default('XLM'),
  memo: z.string().max(28).optional(),
});

const submitTransactionSchema = z.object({
  transactionXDR: z.string().min(1),
});

const getTransactionSchema = z.object({
  hash: z.string().min(64).max(64).regex(/^[a-fA-F0-9]{64}$/),
});

export class PaymentController {
  private stellarService: StellarService;

  constructor() {
    this.stellarService = new StellarService();
  }

  /**
   * Send a payment
   */
  async sendPayment(request: FastifyRequest, reply: FastifyReply): Promise<ApiResponse<PaymentResponse>> {
    try {
      const paymentData = sendPaymentSchema.parse(request.body);
      
      // Validate that from and to addresses are different
      if (paymentData.from === paymentData.to) {
        throw new Error('Sender and recipient addresses must be different');
      }

      const payment = await this.stellarService.sendPayment(paymentData);

      // Return any transaction XDR created by the service for client signing
      const responseData: PaymentResponse = {
        ...payment,
        transactionXDR: (payment as any).transactionXDR,
      };

      const response: ApiResponse<PaymentResponse> = {
        success: true,
        data: responseData,
        timestamp: new Date(),
      };

      return reply.send(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'PAYMENT_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
      };

      return reply.code(400).send(response);
    }
  }

  /**
   * Submit a signed transaction
   */
  async submitTransaction(request: FastifyRequest, reply: FastifyReply): Promise<ApiResponse<PaymentResponse>> {
    try {
      const { transactionXDR } = submitTransactionSchema.parse(request.body);
      const payment = await this.stellarService.submitTransaction(transactionXDR);

      const response: ApiResponse<PaymentResponse> = {
        success: true,
        data: payment,
        timestamp: new Date(),
      };

      return reply.send(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TRANSACTION_SUBMISSION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
      };

      return reply.code(400).send(response);
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(request: FastifyRequest, reply: FastifyReply): Promise<ApiResponse<any>> {
    try {
      const { hash } = getTransactionSchema.parse(request.params as any);
      const transaction = await this.stellarService.getTransaction(hash);

      const response: ApiResponse<any> = {
        success: true,
        data: transaction,
        timestamp: new Date(),
      };

      return reply.send(response);
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Transaction not found' ? 404 : 500;
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TRANSACTION_NOT_FOUND',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
      };

      return reply.code(statusCode).send(response);
    }
  }

  /**
   * Estimate transaction fee
   */
  async estimateFee(request: FastifyRequest, reply: FastifyReply): Promise<ApiResponse<{ fee: number; network: string }>> {
    try {
      // Get current base fee from Stellar network
      const fee = await this.stellarService.getServer().fetchBaseFee();
      const network = this.stellarService.getNetworkInfo().network;

      const response: ApiResponse<{ fee: number; network: string }> = {
        success: true,
        data: {
          fee,
          network,
        },
        timestamp: new Date(),
      };

      return reply.send(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'FEE_ESTIMATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
      };

      return reply.code(500).send(response);
    }
  }

  /**
   * Get payment history for an account
   */
  async getPaymentHistory(request: FastifyRequest, reply: FastifyReply): Promise<ApiResponse<any[]>> {
    try {
      const { address } = z.object({
        address: z.string().min(56).max(56).regex(/^G[A-Z0-9]{55}$/),
      }).parse(request.params as any);

      const { limit = 10, cursor } = z.object({
        limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
        cursor: z.string().optional(),
      }).parse(request.query as any);

      const server = this.stellarService.getServer();
      const account = await server.loadAccount(address);
      
      // Get transactions for the account
      const transactionsBuilder = server.transactions()
        .forAccount(address)
        .order('desc')
        .limit(limit);

      if (cursor) {
        transactionsBuilder.cursor(cursor);
      }

      const transactions = await transactionsBuilder.call();

      const paymentTransactions = transactions.records
        .filter((tx: any) => 
          tx.operations.some((op: any) => op.type === 'payment')
        )
        .map((tx: any) => ({
          hash: tx.hash,
          created_at: tx.created_at,
          source_account: tx.source_account,
          operations: tx.operations
            .filter((op: any) => op.type === 'payment')
            .map((op: any) => ({
              type: op.type,
              destination: op.destination,
              amount: op.amount,
              asset: op.asset_code || 'XLM',
              asset_issuer: op.asset_issuer,
            })),
        }));

      const response: ApiResponse<any[]> = {
        success: true,
        data: paymentTransactions,
        timestamp: new Date(),
      };

      return reply.send(response);
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Account not found' ? 404 : 500;
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'PAYMENT_HISTORY_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
      };

      return reply.code(statusCode).send(response);
    }
  }

  /**
   * Validate payment parameters
   */
  async validatePayment(request: FastifyRequest, reply: FastifyReply): Promise<ApiResponse<{
    valid: boolean;
    errors: string[];
    estimatedFee?: number;
  }>> {
    try {
      const paymentData = sendPaymentSchema.safeParse(request.body);
      
      if (!paymentData.success) {
        const errors = paymentData.error.issues.map(issue => issue.message);
        
        const response: ApiResponse<{ valid: boolean; errors: string[] }> = {
          success: true,
          data: {
            valid: false,
            errors,
          },
          timestamp: new Date(),
        };

        return reply.send(response);
      }

      const data = paymentData.data;
      const errors: string[] = [];

      // Validate that from and to addresses are different
      if (data.from === data.to) {
        errors.push('Sender and recipient addresses must be different');
      }

      // Validate asset format
      if (data.asset !== 'XLM' && data.asset !== 'native') {
        const assetParts = data.asset.split(':');
        if (assetParts.length !== 2 || assetParts[0].length > 12 || assetParts[1].length !== 56) {
          errors.push('Invalid asset format. Use "XLM" or "CODE:ISSUER"');
        }
      }

      // Check if accounts exist
      try {
        await this.stellarService.getAccount(data.from);
      } catch (error) {
        errors.push('Sender account not found');
      }

      try {
        await this.stellarService.getAccount(data.to);
      } catch (error) {
        errors.push('Recipient account not found');
      }

      // Get estimated fee
      let estimatedFee = 0;
      try {
        estimatedFee = await this.stellarService.getServer().fetchBaseFee();
      } catch (error) {
        // Continue without fee estimation
      }

      const response: ApiResponse<{ valid: boolean; errors: string[]; estimatedFee?: number }> = {
        success: true,
        data: {
          valid: errors.length === 0,
          errors,
          estimatedFee,
        },
        timestamp: new Date(),
      };

      return reply.send(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'PAYMENT_VALIDATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
      };

      return reply.code(500).send(response);
    }
  }
}

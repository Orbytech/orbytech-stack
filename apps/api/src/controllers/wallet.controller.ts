import { FastifyRequest, FastifyReply } from 'fastify';
import { StellarService } from '../services/stellar.service';
import { WalletCreateResponse, WalletInfoResponse, ApiResponse } from '../types';
import { z } from 'zod';

// Validation schemas
const createWalletSchema = z.object({
  fund: z.boolean().optional().default(false),
});

const getWalletSchema = z.object({
  address: z.string().min(56).max(56).regex(/^G[A-Z0-9]{55}$/),
});

const fundWalletSchema = z.object({
  address: z.string().min(56).max(56).regex(/^G[A-Z0-9]{55}$/),
});

export class WalletController {
  private stellarService: StellarService;

  constructor() {
    this.stellarService = new StellarService();
  }

  /**
   * Create a new wallet
   */
  async createWallet(request: FastifyRequest, reply: FastifyReply): Promise<ApiResponse<WalletCreateResponse>> {
    try {
      const { fund } = createWalletSchema.parse(request.body);
      const account = this.stellarService.createAccount();
      
      let funded = false;
      if (fund) {
        try {
          funded = await this.stellarService.fundTestnetAccount(account.publicKey);
        } catch (error) {
          // Continue even if funding fails
          console.warn('Failed to fund account:', error);
        }
      }

      const response: ApiResponse<WalletCreateResponse> = {
        success: true,
        data: {
          publicKey: account.publicKey,
          secretKey: account.secretKey!,
          network: this.stellarService.getNetworkInfo().network,
        },
        timestamp: new Date(),
      };

      return reply.code(201).send(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'WALLET_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
      };

      return reply.code(400).send(response);
    }
  }

  /**
   * Get wallet information
   */
  async getWallet(request: FastifyRequest, reply: FastifyReply): Promise<ApiResponse<WalletInfoResponse>> {
    try {
      const { address } = getWalletSchema.parse(request.params as any);
      const accountDetails = await this.stellarService.getAccountDetails(address);

      const response: ApiResponse<WalletInfoResponse> = {
        success: true,
        data: {
          publicKey: accountDetails.publicKey,
          balance: accountDetails.balances,
          network: accountDetails.network,
          createdAt: new Date(), // Note: Stellar doesn't provide creation date
        },
        timestamp: new Date(),
      };

      return reply.send(response);
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Account not found' ? 404 : 500;
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'WALLET_NOT_FOUND',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
      };

      return reply.code(statusCode).send(response);
    }
  }

  /**
   * Fund a wallet (testnet only)
   */
  async fundWallet(request: FastifyRequest, reply: FastifyReply): Promise<ApiResponse<{ funded: boolean }>> {
    try {
      const { address } = fundWalletSchema.parse(request.body);
      const funded = await this.stellarService.fundTestnetAccount(address);

      const response: ApiResponse<{ funded: boolean }> = {
        success: true,
        data: { funded },
        timestamp: new Date(),
      };

      return reply.send(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'WALLET_FUNDING_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
      };

      return reply.code(400).send(response);
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(request: FastifyRequest, reply: FastifyReply): Promise<ApiResponse<{ balance: string; asset: string }[]>> {
    try {
      const { address } = getWalletSchema.parse(request.params as any);
      const accountDetails = await this.stellarService.getAccountDetails(address);

      const balances = accountDetails.balances.map(balance => ({
        balance: balance.balance,
        asset: balance.assetCode,
      }));

      const response: ApiResponse<{ balance: string; asset: string }[]> = {
        success: true,
        data: balances,
        timestamp: new Date(),
      };

      return reply.send(response);
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Account not found' ? 404 : 500;
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'WALLET_BALANCE_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
      };

      return reply.code(statusCode).send(response);
    }
  }

  /**
   * Validate wallet address
   */
  async validateWallet(request: FastifyRequest, reply: FastifyReply): Promise<ApiResponse<{ valid: boolean; address: string }>> {
    try {
      const { address } = getWalletSchema.parse(request.body);

      // The schema validation already checks the format
      // Additional validation could be added here if needed
      
      const response: ApiResponse<{ valid: boolean; address: string }> = {
        success: true,
        data: {
          valid: true,
          address,
        },
        timestamp: new Date(),
      };

      return reply.send(response);
    } catch (error) {
      const response: ApiResponse = {
        success: true,
        data: {
          valid: false,
          address: (request.body as any)?.address || '',
        },
        timestamp: new Date(),
      };

      return reply.send(response);
    }
  }
}

import { WalletController } from '../controllers/wallet.controller';
import { StellarService } from '../services/stellar.service';
import { FastifyRequest, FastifyReply } from 'fastify';

// Mock StellarService
jest.mock('../services/stellar.service');
const MockStellarService = StellarService as jest.MockedClass<typeof StellarService>;

describe('WalletController', () => {
  let walletController: WalletController;
  let mockStellarService: jest.Mocked<StellarService>;
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockStellarService = new MockStellarService() as jest.Mocked<StellarService>;
    walletController = new WalletController();
    
    // Mock the service instance
    (walletController as any).stellarService = mockStellarService;
    
    mockRequest = {
      body: {},
      params: {},
    };
    
    mockReply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  describe('createWallet', () => {
    it('should create a new wallet successfully', async () => {
      const mockAccount = {
        publicKey: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ123456789',
        secretKey: 'SABCDEFGHIJKLMNOPQRSTUVWXYZ123456789',
      };
      
      mockStellarService.createAccount.mockReturnValue(mockAccount);
      mockStellarService.getNetworkInfo.mockReturnValue({
        network: 'testnet',
        horizonUrl: 'https://horizon-testnet.stellar.org',
        sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
      });

      mockRequest.body = { fund: false };

      await walletController.createWallet(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockStellarService.createAccount).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(201);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: {
            publicKey: mockAccount.publicKey,
            secretKey: mockAccount.secretKey,
            network: 'testnet',
          },
        })
      );
    });

    it('should fund wallet if requested', async () => {
      const mockAccount = {
        publicKey: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ123456789',
        secretKey: 'SABCDEFGHIJKLMNOPQRSTUVWXYZ123456789',
      };
      
      mockStellarService.createAccount.mockReturnValue(mockAccount);
      mockStellarService.fundTestnetAccount.mockResolvedValue(true);
      mockStellarService.getNetworkInfo.mockReturnValue({
        network: 'testnet',
        horizonUrl: 'https://horizon-testnet.stellar.org',
        sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
      });

      mockRequest.body = { fund: true };

      await walletController.createWallet(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockStellarService.fundTestnetAccount).toHaveBeenCalledWith(mockAccount.publicKey);
    });

    it('should handle wallet creation errors', async () => {
      mockStellarService.createAccount.mockImplementation(() => {
        throw new Error('Failed to create wallet');
      });

      mockRequest.body = { fund: false };

      await walletController.createWallet(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: {
            code: 'WALLET_CREATION_FAILED',
            message: 'Failed to create wallet',
          },
        })
      );
    });
  });

  describe('getWallet', () => {
    it('should get wallet information successfully', async () => {
      const mockAccountDetails = {
        publicKey: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ123456789',
        balances: [
          {
            balance: '100.0000000',
            assetType: 'native',
            assetCode: 'XLM',
          },
        ],
        network: 'testnet',
      };
      
      mockStellarService.getAccountDetails.mockResolvedValue(mockAccountDetails);
      mockRequest.params = { address: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ123456789' };

      await walletController.getWallet(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockStellarService.getAccountDetails).toHaveBeenCalledWith('GABCDEFGHIJKLMNOPQRSTUVWXYZ123456789');
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockAccountDetails,
        })
      );
    });

    it('should handle wallet not found', async () => {
      mockStellarService.getAccountDetails.mockRejectedValue(new Error('Account not found'));
      mockRequest.params = { address: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ123456789' };

      await walletController.getWallet(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.code).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: {
            code: 'WALLET_NOT_FOUND',
            message: 'Account not found',
          },
        })
      );
    });
  });

  describe('fundWallet', () => {
    it('should fund wallet successfully', async () => {
      mockStellarService.fundTestnetAccount.mockResolvedValue(true);
      mockRequest.body = { address: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ123456789' };

      await walletController.fundWallet(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockStellarService.fundTestnetAccount).toHaveBeenCalledWith('GABCDEFGHIJKLMNOPQRSTUVWXYZ123456789');
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: { funded: true },
        })
      );
    });

    it('should handle funding errors', async () => {
      mockStellarService.fundTestnetAccount.mockRejectedValue(new Error('Funding failed'));
      mockRequest.body = { address: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ123456789' };

      await walletController.fundWallet(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: {
            code: 'WALLET_FUNDING_FAILED',
            message: 'Funding failed',
          },
        })
      );
    });
  });

  describe('getWalletBalance', () => {
    it('should get wallet balance successfully', async () => {
      const mockAccountDetails = {
        publicKey: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ123456789',
        balances: [
          {
            balance: '100.0000000',
            assetType: 'native',
            assetCode: 'XLM',
          },
        ],
        network: 'testnet',
      };
      
      mockStellarService.getAccountDetails.mockResolvedValue(mockAccountDetails);
      mockRequest.params = { address: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ123456789' };

      await walletController.getWalletBalance(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: [
            {
              balance: '100.0000000',
              asset: 'XLM',
            },
          ],
        })
      );
    });
  });

  describe('validateWallet', () => {
    it('should validate a valid address', async () => {
      mockRequest.body = { address: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ123456789' };

      await walletController.validateWallet(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: {
            valid: true,
            address: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ123456789',
          },
        })
      );
    });

    it('should invalidate an invalid address', async () => {
      mockRequest.body = { address: 'INVALID_ADDRESS' };

      await walletController.validateWallet(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: {
            valid: false,
            address: 'INVALID_ADDRESS',
          },
        })
      );
    });
  });
});

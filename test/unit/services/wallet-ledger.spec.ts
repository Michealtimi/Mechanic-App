import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from '../../../src/wallet/wallet.service';
import { PrismaService } from 'prisma/prisma.service';
import { Decimal } from 'decimal.js';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

describe('Wallet Ledger Enforcement', () => {
  let service: WalletService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    wallet: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    walletTransaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('creditWalletWithTx', () => {
    it('should create transaction record for all credit operations', async () => {
      const userId = 'user-123';
      const amount = new Decimal(1000);
      const walletId = 'wallet-123';
      const mockWallet = {
        id: walletId,
        userId,
        balance: new Decimal(0),
        pending: new Decimal(0),
      };
      const mockUpdatedWallet = {
        ...mockWallet,
        balance: new Decimal(1000),
      };

      const mockTx = {
        wallet: {
          findUnique: jest.fn().mockResolvedValue(mockWallet),
          update: jest.fn().mockResolvedValue(mockUpdatedWallet),
        },
        walletTransaction: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      await service.creditWalletWithTx(
        mockTx as any,
        userId,
        amount,
        'CREDIT',
        'booking-123',
        { test: 'metadata' },
      );

      // Verify wallet was updated
      expect(mockTx.wallet.update).toHaveBeenCalledWith({
        where: { id: walletId },
        data: { balance: { increment: amount } },
      });

      // Verify transaction record was created
      expect(mockTx.walletTransaction.create).toHaveBeenCalledWith({
        data: {
          walletId,
          bookingId: 'booking-123',
          type: 'CREDIT',
          amount,
          balanceAfter: mockUpdatedWallet.balance,
          metadata: { test: 'metadata' },
        },
      });
    });
  });

  describe('debitWalletWithTx', () => {
    it('should create transaction record for all debit operations', async () => {
      const userId = 'user-123';
      const amount = new Decimal(500);
      const walletId = 'wallet-123';
      const mockWallet = {
        id: walletId,
        userId,
        balance: new Decimal(1000),
        pending: new Decimal(0),
      };
      const mockUpdatedWallet = {
        ...mockWallet,
        balance: new Decimal(500),
      };

      const mockTx = {
        wallet: {
          findUnique: jest.fn().mockResolvedValue(mockWallet),
          findUniqueOrThrow: jest.fn().mockResolvedValue(mockWallet),
          update: jest.fn().mockResolvedValue(mockUpdatedWallet),
        },
        walletTransaction: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      await service.debitWalletWithTx(
        mockTx as any,
        userId,
        amount,
        'DEBIT',
        'booking-123',
        { test: 'metadata' },
      );

      // Verify wallet was updated
      expect(mockTx.wallet.update).toHaveBeenCalledWith({
        where: { id: walletId },
        data: { balance: { decrement: amount } },
      });

      // Verify transaction record was created with negative amount
      expect(mockTx.walletTransaction.create).toHaveBeenCalledWith({
        data: {
          walletId,
          bookingId: 'booking-123',
          type: 'DEBIT',
          amount: amount.neg(), // Should be negative
          balanceAfter: mockUpdatedWallet.balance,
          metadata: { test: 'metadata' },
        },
      });
    });

    it('should throw BadRequestException when balance is insufficient', async () => {
      const userId = 'user-123';
      const amount = new Decimal(1000);
      const walletId = 'wallet-123';
      const mockWallet = {
        id: walletId,
        userId,
        balance: new Decimal(500), // Less than amount
        pending: new Decimal(0),
      };

      const mockTx = {
        wallet: {
          findUnique: jest.fn().mockResolvedValue(mockWallet),
          findUniqueOrThrow: jest.fn().mockResolvedValue(mockWallet),
        },
      };

      await expect(
        service.debitWalletWithTx(mockTx as any, userId, amount, 'DEBIT'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('creditMechanic', () => {
    it('should wrap creditWalletWithTx in a transaction', async () => {
      const mechanicId = 'mechanic-123';
      const amount = new Decimal(1000);
      const mockWallet = {
        id: 'wallet-123',
        userId: mechanicId,
        balance: new Decimal(0),
      };
      const mockUpdatedWallet = {
        ...mockWallet,
        balance: new Decimal(1000),
      };

      const mockTx = {
        wallet: {
          findUnique: jest.fn().mockResolvedValue(mockWallet),
          update: jest.fn().mockResolvedValue(mockUpdatedWallet),
        },
        walletTransaction: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      await service.creditMechanic(mechanicId, amount);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockTx.walletTransaction.create).toHaveBeenCalled();
    });
  });

  describe('debitWallet', () => {
    it('should wrap debitWalletWithTx in a transaction', async () => {
      const userId = 'user-123';
      const amount = new Decimal(500);
      const mockWallet = {
        id: 'wallet-123',
        userId,
        balance: new Decimal(1000),
      };
      const mockUpdatedWallet = {
        ...mockWallet,
        balance: new Decimal(500),
      };

      const mockTx = {
        wallet: {
          findUnique: jest.fn().mockResolvedValue(mockWallet),
          findUniqueOrThrow: jest.fn().mockResolvedValue(mockWallet),
          update: jest.fn().mockResolvedValue(mockUpdatedWallet),
        },
        walletTransaction: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      await service.debitWallet(userId, amount);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockTx.walletTransaction.create).toHaveBeenCalled();
    });
  });
});

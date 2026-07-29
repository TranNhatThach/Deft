import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('TransactionsService (Unit Tests)', () => {
  let service: TransactionsService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      budgetPeriod: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      category: {
        findUnique: jest.fn(),
      },
      transaction: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
      },
      budget: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      alertLog: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      notification: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException if no active budget period covers transaction_date', async () => {
      prismaMock.budgetPeriod.findFirst.mockResolvedValue(null);

      await expect(
        service.create('user-1', {
          category_id: 'cat-1',
          amount: 100000,
          type: 'expense',
          transaction_date: '2026-07-29',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if category does not exist or belong to user', async () => {
      prismaMock.budgetPeriod.findFirst.mockResolvedValue({
        id: 'period-1',
        user_id: 'user-1',
        status: 'open',
      });
      prismaMock.category.findUnique.mockResolvedValue(null);

      await expect(
        service.create('user-1', {
          category_id: 'cat-999',
          amount: 100000,
          type: 'expense',
          transaction_date: '2026-07-29',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create transaction and calculate threshold alerts if expense >= 80%', async () => {
      const mockPeriod = { id: 'period-1', user_id: 'user-1', total_limit: 10000000, status: 'open' };
      const mockCat = { id: 'cat-1', user_id: 'user-1', name: 'Ăn uống', created_at: new Date(), updated_at: new Date() };
      const mockCreatedTx = {
        id: 'tx-1',
        user_id: 'user-1',
        category_id: 'cat-1',
        budget_period_id: 'period-1',
        amount: 8500000,
        type: 'expense',
        note: 'Ăn tối',
        transaction_date: new Date('2026-07-29'),
        created_at: new Date(),
        updated_at: new Date(),
        category: mockCat,
      };

      prismaMock.budgetPeriod.findFirst.mockResolvedValue(mockPeriod);
      prismaMock.budgetPeriod.findUnique.mockResolvedValue(mockPeriod);
      prismaMock.category.findUnique.mockResolvedValue(mockCat);
      prismaMock.transaction.create.mockResolvedValue(mockCreatedTx);
      prismaMock.transaction.aggregate.mockResolvedValue({ _sum: { amount: 8500000 } });
      prismaMock.budget.findUnique.mockResolvedValue({
        id: 'budget-1',
        limit_amount: 10000000,
        spent_amount: 0,
        category: mockCat,
      });
      prismaMock.alertLog.findUnique.mockResolvedValue(null);
      prismaMock.alertLog.findFirst.mockResolvedValue(null);

      const result = await service.create('user-1', {
        category_id: 'cat-1',
        amount: 8500000,
        type: 'expense',
        transaction_date: '2026-07-29',
      });

      expect(result.id).toBe('tx-1');
      expect(prismaMock.transaction.create).toHaveBeenCalled();
      expect(prismaMock.notification.create).toHaveBeenCalled();
    });
  });
});

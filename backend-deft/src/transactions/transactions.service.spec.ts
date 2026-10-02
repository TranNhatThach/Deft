import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('TransactionsService (Unit Tests)', () => {
  let service: TransactionsService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ currency: 'VND' }),
      },
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
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
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

  describe('create and threshold alerts', () => {
    it('should throw BadRequestException if no active budget period covers transaction_date for expense', async () => {
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

    it('should calculate burn rate and forecast days to depletion when hitting 70% threshold', async () => {
      const mockPeriod = {
        id: 'period-1',
        user_id: 'user-1',
        total_limit: 10000000,
        status: 'open',
        start_date: new Date('2026-07-01'),
        end_date: new Date('2026-07-31'),
      };
      const mockCat = {
        id: 'cat-1',
        user_id: 'user-1',
        name: 'Ăn uống',
        created_at: new Date(),
        updated_at: new Date(),
      };
      const mockCreatedTx = {
        id: 'tx-70',
        user_id: 'user-1',
        category_id: 'cat-1',
        budget_period_id: 'period-1',
        amount: 7000000,
        type: 'expense',
        note: 'Tiệc tùng',
        transaction_date: new Date('2026-07-10'),
        created_at: new Date(),
        updated_at: new Date(),
        category: mockCat,
      };

      prismaMock.budgetPeriod.findFirst.mockResolvedValue(mockPeriod);
      prismaMock.budgetPeriod.findUnique.mockResolvedValue(mockPeriod);
      prismaMock.category.findUnique.mockResolvedValue(mockCat);
      prismaMock.transaction.create.mockResolvedValue(mockCreatedTx);
      // Aggregate returns 7,000,000 (70% of 10,000,000)
      prismaMock.transaction.aggregate.mockResolvedValue({ _sum: { amount: 7000000 } });
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
        amount: 7000000,
        type: 'expense',
        transaction_date: '2026-07-10',
      });

      expect(result.id).toBe('tx-70');
      expect(result.formatted_amount).toBe('-7.000.000 ₫');
      expect(prismaMock.transaction.create).toHaveBeenCalled();
      expect(prismaMock.notification.create).toHaveBeenCalled();

      // Check notification call for 70% threshold
      const notifCalls = prismaMock.notification.create.mock.calls;
      const seventyCall = notifCalls.find((call: any) => call[0].data.metadata?.threshold === 70);
      expect(seventyCall).toBeDefined();

      const notifData = seventyCall[0].data;
      expect(notifData.title).toContain('70%');
      // Days passed from July 1 to July 10 is 10 days
      expect(notifData.metadata.days_passed).toBe(10);
      // Burn rate = 7,000,000 / 10 = 700,000/day
      expect(notifData.metadata.burn_rate_per_day).toBe(700000);
      // Remaining = 3,000,000 -> Forecast days left = 3,000,000 / 700,000 ≈ 4 days
      expect(notifData.metadata.forecast_days_left).toBe(4);
      expect(notifData.message).toContain('Tốc độ chi tiêu');
      expect(notifData.message).toContain('Dự báo');
      expect(notifData.message).toContain('cạn');
    });

    it('should create notification for 50% threshold without duplicate if logged', async () => {
      const mockPeriod = {
        id: 'period-1',
        user_id: 'user-1',
        total_limit: 10000000,
        status: 'open',
        start_date: new Date('2026-07-01'),
        end_date: new Date('2026-07-31'),
      };
      const mockCat = {
        id: 'cat-1',
        user_id: 'user-1',
        name: 'Chi tiêu',
        created_at: new Date(),
        updated_at: new Date(),
      };
      const mockCreatedTx = {
        id: 'tx-50',
        user_id: 'user-1',
        category_id: 'cat-1',
        budget_period_id: 'period-1',
        amount: 5000000,
        type: 'expense',
        transaction_date: new Date('2026-07-05'),
        created_at: new Date(),
        updated_at: new Date(),
        category: mockCat,
      };

      prismaMock.budgetPeriod.findFirst.mockResolvedValue(mockPeriod);
      prismaMock.budgetPeriod.findUnique.mockResolvedValue(mockPeriod);
      prismaMock.category.findUnique.mockResolvedValue(mockCat);
      prismaMock.transaction.create.mockResolvedValue(mockCreatedTx);
      prismaMock.transaction.aggregate.mockResolvedValue({ _sum: { amount: 5000000 } });
      prismaMock.budget.findUnique.mockResolvedValue({
        id: 'budget-1',
        limit_amount: 10000000,
        spent_amount: 0,
        category: mockCat,
      });

      // 50% threshold alert is already logged in alertLog
      prismaMock.alertLog.findFirst.mockImplementation(({ where }: any) => {
        if (where.threshold === 50) return Promise.resolve({ id: 'alert-50' });
        return Promise.resolve(null);
      });
      prismaMock.alertLog.findUnique.mockImplementation(({ where }: any) => {
        if (where.budget_period_id_category_id_threshold?.threshold === 50) {
          return Promise.resolve({ id: 'alert-50-cat' });
        }
        return Promise.resolve(null);
      });

      await service.create('user-1', {
        category_id: 'cat-1',
        amount: 5000000,
        type: 'expense',
        transaction_date: '2026-07-05',
      });

      // Notification should NOT be called for 50% because it was already logged
      const notifCalls = prismaMock.notification.create.mock.calls;
      const fiftyCall = notifCalls.find((call: any) => call[0].data.metadata?.threshold === 50);
      expect(fiftyCall).toBeUndefined();
    });
  });

  describe('CRUD operations', () => {
    it('should findOne transaction with formatted amount', async () => {
      const mockTx = {
        id: 'tx-100',
        user_id: 'user-1',
        amount: 2500000,
        type: 'income',
        transaction_date: new Date('2026-07-15'),
        created_at: new Date(),
        updated_at: new Date(),
        category: { id: 'cat-inc', name: 'Lương' },
      };

      prismaMock.transaction.findUnique.mockResolvedValue(mockTx);

      const res = await service.findOne('user-1', 'tx-100');
      expect(res.id).toBe('tx-100');
      expect(res.amount).toBe(2500000);
      expect(res.formatted_amount).toBe('+2.500.000 ₫');
    });

    it('should remove transaction and recalculate spent if it was expense', async () => {
      const mockTx = {
        id: 'tx-del',
        user_id: 'user-1',
        budget_period_id: 'period-1',
        category_id: 'cat-1',
        type: 'expense',
        amount: 500000,
        transaction_date: new Date('2026-07-10'),
      };
      prismaMock.transaction.findUnique.mockResolvedValue(mockTx);
      prismaMock.transaction.delete.mockResolvedValue(mockTx);
      prismaMock.budgetPeriod.findUnique.mockResolvedValue({
        id: 'period-1',
        start_date: new Date('2026-07-01'),
        end_date: new Date('2026-07-31'),
        total_limit: 10000000,
      });
      prismaMock.transaction.aggregate.mockResolvedValue({ _sum: { amount: 1000000 } });
      prismaMock.budget.findUnique.mockResolvedValue(null);

      await service.remove('user-1', 'tx-del');
      expect(prismaMock.transaction.delete).toHaveBeenCalledWith({ where: { id: 'tx-del' } });
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { BudgetsService } from './budgets.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('BudgetsService', () => {
  let service: BudgetsService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ currency: 'VND' }),
      },
      budgetPeriod: {
        findUnique: jest.fn(),
      },
      category: {
        findUnique: jest.fn(),
      },
      transaction: {
        aggregate: jest.fn(),
      },
      budget: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<BudgetsService>(BudgetsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return budget with currency formatting', async () => {
      const mockBudget = {
        id: 'b-1',
        budget_period_id: 'bp-1',
        category_id: 'c-1',
        limit_amount: 5000000,
        spent_amount: 2500000,
        budget_period: { user_id: 'user-1' },
        category: { id: 'c-1', name: 'Ăn uống', created_at: new Date(), updated_at: new Date() },
      };
      prismaMock.budget.findUnique.mockResolvedValue(mockBudget);

      const res = await service.findOne('user-1', 'b-1');
      expect(res.id).toBe('b-1');
      expect(res.limit_amount).toBe(5000000);
      expect(res.spent_amount).toBe(2500000);
      expect(res.percent_used).toBe(50);
      expect(res.formatted_limit).toBe('5.000.000 ₫');
      expect(res.formatted_spent).toBe('2.500.000 ₫');
      expect(res.formatted_remaining).toBe('2.500.000 ₫');
    });

    it('should throw ForbiddenException if user does not own period', async () => {
      prismaMock.budget.findUnique.mockResolvedValue({
        id: 'b-1',
        budget_period: { user_id: 'other-user' },
      });

      await expect(service.findOne('user-1', 'b-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete budget if user owns it', async () => {
      prismaMock.budget.findUnique.mockResolvedValue({
        id: 'b-1',
        budget_period: { user_id: 'user-1' },
      });
      prismaMock.budget.delete.mockResolvedValue({ id: 'b-1' });

      await service.remove('user-1', 'b-1');
      expect(prismaMock.budget.delete).toHaveBeenCalledWith({ where: { id: 'b-1' } });
    });
  });
});

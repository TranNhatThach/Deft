import { Test, TestingModule } from '@nestjs/testing';
import { BudgetPeriodsService } from './budget-periods.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('BudgetPeriodsService', () => {
  let service: BudgetPeriodsService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ currency: 'VND' }),
      },
      budgetPeriod: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      budget: {
        findMany: jest.fn(),
      },
      transaction: {
        aggregate: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetPeriodsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<BudgetPeriodsService>(BudgetPeriodsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return budget period with formatted total limit', async () => {
      const mockPeriod = {
        id: 'bp-1',
        user_id: 'user-1',
        start_date: new Date('2026-07-01'),
        end_date: new Date('2026-07-31'),
        total_limit: 15000000,
        status: 'open',
        created_at: new Date(),
      };
      prismaMock.budgetPeriod.findUnique.mockResolvedValue(mockPeriod);

      const res = await service.findOne('user-1', 'bp-1');
      expect(res.id).toBe('bp-1');
      expect(res.total_limit).toBe(15000000);
      expect(res.formatted_total_limit).toBe('15.000.000 ₫');
    });
  });

  describe('update', () => {
    it('should update total_limit and return formatted value', async () => {
      const mockPeriod = {
        id: 'bp-1',
        user_id: 'user-1',
        start_date: new Date('2026-07-01'),
        end_date: new Date('2026-07-31'),
        total_limit: 15000000,
        status: 'open',
        created_at: new Date(),
      };
      prismaMock.budgetPeriod.findUnique.mockResolvedValue(mockPeriod);
      prismaMock.budgetPeriod.update.mockResolvedValue({
        ...mockPeriod,
        total_limit: 20000000,
      });

      const res = await service.update('user-1', 'bp-1', { total_limit: 20000000 });
      expect(res.total_limit).toBe(20000000);
      expect(res.formatted_total_limit).toBe('20.000.000 ₫');
    });
  });

  describe('remove', () => {
    it('should delete period if owned by user', async () => {
      prismaMock.budgetPeriod.findUnique.mockResolvedValue({
        id: 'bp-1',
        user_id: 'user-1',
      });
      prismaMock.budgetPeriod.delete.mockResolvedValue({ id: 'bp-1' });

      await service.remove('user-1', 'bp-1');
      expect(prismaMock.budgetPeriod.delete).toHaveBeenCalledWith({ where: { id: 'bp-1' } });
    });
  });
});

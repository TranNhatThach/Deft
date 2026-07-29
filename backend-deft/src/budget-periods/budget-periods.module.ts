import { Module } from '@nestjs/common';
import { BudgetPeriodsService } from './budget-periods.service';
import { BudgetPeriodsController } from './budget-periods.controller';
import { BudgetsModule } from '../budgets/budgets.module';

@Module({
  imports: [BudgetsModule],
  controllers: [BudgetPeriodsController],
  providers: [BudgetPeriodsService],
  exports: [BudgetPeriodsService],
})
export class BudgetPeriodsModule { }

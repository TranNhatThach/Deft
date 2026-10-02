import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { IncomesController } from './incomes.controller';

@Module({
  controllers: [TransactionsController, IncomesController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}

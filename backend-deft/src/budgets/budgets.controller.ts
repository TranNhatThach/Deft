import { Controller, Patch, Param, Body } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('budgets')
export class BudgetsController {
  constructor(private budgetsService: BudgetsService) {}

  @Patch(':id')
  async updateBudget(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.budgetsService.updateBudget(userId, id, dto);
  }
}

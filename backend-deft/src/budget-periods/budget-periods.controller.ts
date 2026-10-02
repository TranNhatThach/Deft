import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BudgetPeriodsService } from './budget-periods.service';
import { BudgetsService } from '../budgets/budgets.service';
import { CreateBudgetPeriodDto } from './dto/create-budget-period.dto';
import { UpdateBudgetPeriodDto } from './dto/update-budget-period.dto';
import { UpsertBudgetDto } from '../budgets/dto/upsert-budget.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('budget-periods')
export class BudgetPeriodsController {
  constructor(
    private budgetPeriodsService: BudgetPeriodsService,
    private budgetsService: BudgetsService,
  ) {}

  @Get()
  async findAll(@CurrentUser('userId') userId: string) {
    return this.budgetPeriodsService.findAll(userId);
  }

  @Get('current')
  async getCurrent(@CurrentUser('userId') userId: string) {
    return this.budgetPeriodsService.getCurrent(userId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.budgetPeriodsService.findOne(userId, id);
  }

  @Post()
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateBudgetPeriodDto,
  ) {
    return this.budgetPeriodsService.create(userId, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBudgetPeriodDto,
  ) {
    return this.budgetPeriodsService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    await this.budgetPeriodsService.remove(userId, id);
  }

  @Patch(':id/close')
  async closePeriod(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.budgetPeriodsService.closePeriod(userId, id);
  }

  @Get(':id/budgets')
  async getBudgets(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.budgetPeriodsService.getBudgets(userId, id);
  }

  @Post(':id/budgets')
  async upsertBudget(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpsertBudgetDto,
  ) {
    return this.budgetsService.upsertBudget(userId, id, dto);
  }

  @Get(':id/summary')
  async getSummary(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.budgetPeriodsService.getSummary(userId, id);
  }
}

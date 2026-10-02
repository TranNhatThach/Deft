import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('incomes')
export class IncomesController {
  constructor(private transactionsService: TransactionsService) {}

  @Get()
  async findAll(
    @CurrentUser('userId') userId: string,
    @Query() query: QueryTransactionsDto,
  ) {
    return this.transactionsService.findAll(userId, {
      ...query,
      type: 'income',
    });
  }

  @Get(':id')
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    const tx = await this.transactionsService.findOne(userId, id);
    if (tx.type !== 'income') {
      throw new BadRequestException('Bản ghi này không phải là khoản thu nhập');
    }
    return tx;
  }

  @Post()
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateIncomeDto,
  ) {
    return this.transactionsService.create(userId, {
      ...dto,
      type: 'income',
    });
  }

  @Patch(':id')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateIncomeDto,
  ) {
    const existing = await this.transactionsService.findOne(userId, id);
    if (existing.type !== 'income') {
      throw new BadRequestException('Bản ghi này không phải là khoản thu nhập');
    }
    return this.transactionsService.update(userId, id, {
      ...dto,
      type: 'income',
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    const existing = await this.transactionsService.findOne(userId, id);
    if (existing.type !== 'income') {
      throw new BadRequestException('Bản ghi này không phải là khoản thu nhập');
    }
    await this.transactionsService.remove(userId, id);
  }
}

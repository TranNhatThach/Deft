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
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('transactions')
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Get()
  async findAll(
    @CurrentUser('userId') userId: string,
    @Query() query: QueryTransactionsDto,
  ) {
    return this.transactionsService.findAll(userId, query);
  }

  @Post()
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(userId, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    await this.transactionsService.remove(userId, id);
  }
}

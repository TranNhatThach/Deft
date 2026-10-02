import { IsOptional, IsUUID, IsISO8601, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTransactionsDto {
  @IsOptional()
  @IsUUID('4')
  category_id?: string;

  @IsOptional()
  @IsEnum(['expense', 'income'], { message: 'type phải là expense hoặc income' })
  type?: 'expense' | 'income';

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

import { IsOptional, IsUUID, IsISO8601, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTransactionsDto {
  @IsOptional()
  @IsUUID('4')
  category_id?: string;

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

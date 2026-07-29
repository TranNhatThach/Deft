import {
  IsOptional,
  IsUUID,
  IsNumber,
  IsEnum,
  IsString,
  IsISO8601,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class UpdateTransactionDto {
  @IsOptional()
  @IsUUID('4')
  category_id?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(1000000000000)
  amount?: number;

  @IsOptional()
  @IsEnum(['expense', 'income'])
  type?: 'expense' | 'income';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsISO8601()
  transaction_date?: string;
}

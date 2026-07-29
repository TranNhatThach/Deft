import {
  IsUUID,
  IsNumber,
  IsEnum,
  IsOptional,
  IsString,
  IsISO8601,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateTransactionDto {
  @IsUUID('4', { message: 'category_id phải là UUID v4 hợp lệ' })
  category_id: string;

  @IsNumber({}, { message: 'amount phải là số hợp lệ' })
  @Min(0.01, { message: 'Số tiền giao dịch phải lớn hơn 0' })
  @Max(1000000000000, { message: 'Số tiền vượt quá giới hạn' })
  amount: number;

  @IsEnum(['expense', 'income'], { message: 'type phải là expense hoặc income' })
  type: 'expense' | 'income';

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Ghi chú không quá 500 ký tự' })
  note?: string;

  @IsISO8601({}, { message: 'transaction_date phải đúng định dạng YYYY-MM-DD hoặc ISO8601' })
  transaction_date: string;
}

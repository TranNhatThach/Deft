import { IsUUID, IsNumber, Min, IsOptional, IsString, MaxLength, IsISO8601 } from 'class-validator';

export class UpdateIncomeDto {
  @IsOptional()
  @IsUUID('4', { message: 'category_id phải là UUID v4' })
  category_id?: string;

  @IsOptional()
  @IsNumber({}, { message: 'amount phải là số' })
  @Min(0, { message: 'amount phải lớn hơn hoặc bằng 0' })
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'note tối đa 500 ký tự' })
  note?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'transaction_date phải đúng định dạng ngày tháng' })
  transaction_date?: string;
}

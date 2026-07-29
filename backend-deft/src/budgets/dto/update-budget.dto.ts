import { IsNumber, Min, Max } from 'class-validator';

export class UpdateBudgetDto {
  @IsNumber({}, { message: 'limit_amount phải là số hợp lệ' })
  @Min(0, { message: 'limit_amount không được là số âm' })
  @Max(1000000000000, { message: 'limit_amount vượt quá giới hạn cho phép' })
  limit_amount: number;
}

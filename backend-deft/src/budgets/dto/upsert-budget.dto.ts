import { IsUUID, IsNumber, Min, Max } from 'class-validator';

export class UpsertBudgetDto {
  @IsUUID('4', { message: 'category_id phải là UUID v4 hợp lệ' })
  category_id: string;

  @IsNumber({}, { message: 'limit_amount phải là số hợp lệ' })
  @Min(0, { message: 'limit_amount không được là số âm' })
  @Max(1000000000000, { message: 'limit_amount vượt quá giới hạn cho phép' })
  limit_amount: number;
}

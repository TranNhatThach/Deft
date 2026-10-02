import { IsUUID, IsNumber, Min } from 'class-validator';

export class CreateBudgetDto {
  @IsUUID('4', { message: 'budget_period_id phải là UUID v4' })
  budget_period_id: string;

  @IsUUID('4', { message: 'category_id phải là UUID v4' })
  category_id: string;

  @IsNumber({}, { message: 'limit_amount phải là số' })
  @Min(0, { message: 'limit_amount không được âm' })
  limit_amount: number;
}

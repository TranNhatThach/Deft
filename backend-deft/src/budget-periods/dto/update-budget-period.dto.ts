import { IsOptional, IsNumber, Min, IsISO8601 } from 'class-validator';

export class UpdateBudgetPeriodDto {
  @IsOptional()
  @IsNumber({}, { message: 'total_limit phải là số' })
  @Min(0, { message: 'total_limit không được âm' })
  total_limit?: number;

  @IsOptional()
  @IsISO8601({}, { message: 'start_date phải có định dạng YYYY-MM-DD' })
  start_date?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'end_date phải có định dạng YYYY-MM-DD' })
  end_date?: string;
}

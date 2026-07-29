import { IsString, IsNumber, IsISO8601, Min, Max } from 'class-validator';

export class CreateBudgetPeriodDto {
  @IsISO8601({}, { message: 'start_date phải đúng định dạng YYYY-MM-DD hoặc ISO8601' })
  start_date: string;

  @IsISO8601({}, { message: 'end_date phải đúng định dạng YYYY-MM-DD hoặc ISO8601' })
  end_date: string;

  @IsNumber({}, { message: 'total_limit phải là một số hợp lệ' })
  @Min(0, { message: 'total_limit không được là số âm' })
  @Max(1000000000000, { message: 'total_limit vượt quá giới hạn cho phép' })
  total_limit: number;
}

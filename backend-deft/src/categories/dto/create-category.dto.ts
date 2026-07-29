import { IsString, IsEnum, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1, { message: 'Tên danh mục không được để trống' })
  @MaxLength(100, { message: 'Tên danh mục không quá 100 ký tự' })
  name: string;

  @IsEnum(['expense', 'income'], { message: 'Loại danh mục phải là expense hoặc income' })
  type: 'expense' | 'income';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;
}

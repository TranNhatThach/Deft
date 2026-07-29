import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  display_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;
}

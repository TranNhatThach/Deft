import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải chứa ít nhất 6 ký tự' })
  @MaxLength(100, { message: 'Mật khẩu không quá 100 ký tự' })
  password: string;

  @IsString()
  @MinLength(2, { message: 'Tên hiển thị ít nhất 2 ký tự' })
  @MaxLength(100, { message: 'Tên hiển thị không quá 100 ký tự' })
  display_name: string;
}

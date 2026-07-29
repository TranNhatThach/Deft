import { Controller, Get, Patch, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser('userId') userId: string) {
    return this.usersService.getMe(userId);
  }

  @Patch('me')
  async updateMe(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateMe(userId, dto);
  }
}

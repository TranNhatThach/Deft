import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async findAll(
    @CurrentUser('userId') userId: string,
    @Query() query: QueryNotificationsDto,
  ) {
    return this.notificationsService.findAll(userId, query);
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser('userId') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  async markAsRead(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(userId, id);
  }
}

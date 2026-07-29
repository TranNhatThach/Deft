import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, query: QueryNotificationsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { user_id: userId };
    if (query.is_read !== undefined) {
      where.is_read = query.is_read;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { user_id: userId, is_read: false },
      }),
    ]);

    const formatted = notifications.map((n) => ({
      ...n,
      created_at: n.created_at.toISOString(),
    }));

    return {
      data: formatted,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Thông báo không tồn tại');
    }
    if (notification.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật thông báo này');
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { is_read: true },
    });

    return {
      ...updated,
      created_at: updated.created_at.toISOString(),
    };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });
    return { success: true };
  }
}

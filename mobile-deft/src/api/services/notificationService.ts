import { API_PATHS, Notification, PaginatedResponse } from '../../../../shared/types';
import { apiClient, USE_MOCK } from '../apiClient';
import { MockServer } from '../mockServer';
import { mapNotification, NotificationListItem } from '../mappers';

export async function listNotifications(): Promise<{
  items: NotificationListItem[];
  unreadCount: number;
}> {
  if (USE_MOCK) {
    const items = MockServer.getNotifications() as NotificationListItem[];
    return {
      items,
      unreadCount: items.filter((n) => !n.isRead).length,
    };
  }

  const res = await apiClient.get<PaginatedResponse<Notification> & { unreadCount: number }>(
    API_PATHS.NOTIFICATIONS.BASE,
  );
  const items = res.data.data.map(mapNotification);
  return { items, unreadCount: res.data.unreadCount ?? 0 };
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.patch(API_PATHS.NOTIFICATIONS.READ(id));
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch(API_PATHS.NOTIFICATIONS.READ_ALL);
}

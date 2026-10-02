import { API_PATHS, UpdateUserDto, User } from '../../../../shared/types';
import { apiClient } from '../apiClient';

export async function getMe(): Promise<User> {
  const res = await apiClient.get<User>(API_PATHS.USERS.ME);
  return res.data;
}

export async function updateMe(dto: UpdateUserDto): Promise<User> {
  const res = await apiClient.patch<User>(API_PATHS.USERS.ME, dto);
  return res.data;
}

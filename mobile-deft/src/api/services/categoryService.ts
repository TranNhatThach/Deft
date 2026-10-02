import {
  API_PATHS,
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../../../../shared/types';
import { apiClient, USE_MOCK } from '../apiClient';
import { MockServer } from '../mockServer';

export async function listCategories(): Promise<Category[]> {
  if (USE_MOCK) {
    return MockServer.getCategories().map((c) => ({
      id: c.id,
      user_id: 'u-101',
      name: c.name,
      icon: c.icon,
      type: c.type as 'expense' | 'income',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }
  const res = await apiClient.get<Category[]>(API_PATHS.CATEGORIES.BASE);
  return res.data;
}

export async function createCategory(dto: CreateCategoryDto): Promise<Category> {
  const res = await apiClient.post<Category>(API_PATHS.CATEGORIES.BASE, dto);
  return res.data;
}

export async function updateCategory(id: string, dto: UpdateCategoryDto): Promise<Category> {
  const res = await apiClient.patch<Category>(API_PATHS.CATEGORIES.BY_ID(id), dto);
  return res.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(API_PATHS.CATEGORIES.BY_ID(id));
}

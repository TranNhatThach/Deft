import {
  API_PATHS,
  CreateTransactionDto,
  PaginatedResponse,
  QueryTransactionsDto,
  Transaction,
  UpdateTransactionDto,
} from '../../../../shared/types';
import { apiClient, USE_MOCK } from '../apiClient';
import { MockServer } from '../mockServer';
import { mapTransaction, TransactionListItem } from '../mappers';

export async function listTransactions(
  query: QueryTransactionsDto = {},
): Promise<TransactionListItem[]> {
  if (USE_MOCK) {
    let txs = (MockServer.getTransactions() as unknown) as TransactionListItem[];
    if (query.type) {
      txs = txs.filter((t) => t.type === query.type);
    }
    return txs;
  }

  const res = await apiClient.get<PaginatedResponse<Transaction> | Transaction[]>(
    API_PATHS.TRANSACTIONS.BASE,
    { params: query },
  );

  const payload = res.data;
  const rows = Array.isArray(payload) ? payload : payload.data;
  return rows.map(mapTransaction);
}

export async function listIncomes(
  query: QueryTransactionsDto = {},
): Promise<TransactionListItem[]> {
  return listTransactions({ ...query, type: 'income' });
}

export async function getTransaction(id: string): Promise<Transaction> {
  const res = await apiClient.get<Transaction>(API_PATHS.TRANSACTIONS.BY_ID(id));
  return res.data;
}

export async function createTransaction(dto: CreateTransactionDto): Promise<Transaction> {
  const res = await apiClient.post<Transaction>(API_PATHS.TRANSACTIONS.BASE, dto);
  return res.data;
}

export async function updateTransaction(
  id: string,
  dto: UpdateTransactionDto,
): Promise<Transaction> {
  const res = await apiClient.patch<Transaction>(API_PATHS.TRANSACTIONS.BY_ID(id), dto);
  return res.data;
}

export async function deleteTransaction(id: string): Promise<void> {
  await apiClient.delete(API_PATHS.TRANSACTIONS.BY_ID(id));
}

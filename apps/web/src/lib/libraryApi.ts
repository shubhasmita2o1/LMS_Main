import { api } from './api';
import type {
  LibraryItemPublic,
  LibraryLoanPublic,
  LibraryReservationPublic,
  LibraryFinePublic,
  LibraryItemType,
} from '@university-lms/shared';

type ApiOk<T> = { success: boolean; data: T };

export async function listLibraryItems(params?: {
  q?: string;
  type?: LibraryItemType;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { data } = await api.get<
    ApiOk<{ items: LibraryItemPublic[]; total: number; page: number; limit: number }>
  >('/library/items', { params });
  return data.data;
}

export async function getLibraryItem(id: string) {
  const { data } = await api.get<ApiOk<LibraryItemPublic>>(`/library/items/${id}`);
  return data.data;
}

export async function createLibraryItem(body: Partial<LibraryItemPublic> & { title: string }) {
  const { data } = await api.post<ApiOk<LibraryItemPublic>>('/library/items', body);
  return data.data;
}

export async function updateLibraryItem(id: string, body: Partial<LibraryItemPublic>) {
  const { data } = await api.patch<ApiOk<LibraryItemPublic>>(`/library/items/${id}`, body);
  return data.data;
}

export async function deleteLibraryItem(id: string) {
  const { data } = await api.delete<ApiOk<{ id: string }>>(`/library/items/${id}`);
  return data.data;
}

export async function listLoans(params?: { studentId?: string; status?: string }) {
  const { data } = await api.get<
    ApiOk<{ items: LibraryLoanPublic[]; total: number }>
  >('/library/loans', { params });
  return data.data;
}

export async function createLoan(body: {
  itemId: string;
  studentId: string;
  copyBarcode?: string;
  loanDays?: number;
}) {
  const { data } = await api.post<ApiOk<LibraryLoanPublic>>('/library/loans', body);
  return data.data;
}

export async function returnLoan(id: string, markLost?: boolean) {
  const { data } = await api.post<ApiOk<LibraryLoanPublic>>(`/library/loans/${id}/return`, {
    markLost,
  });
  return data.data;
}

export async function listReservations(params?: { status?: string }) {
  const { data } = await api.get<
    ApiOk<{ items: LibraryReservationPublic[]; total: number }>
  >('/library/reservations', { params });
  return data.data;
}

export async function createReservation(itemId: string, studentId?: string) {
  const { data } = await api.post<ApiOk<LibraryReservationPublic>>('/library/reservations', {
    itemId,
    studentId,
  });
  return data.data;
}

export async function cancelReservation(id: string) {
  const { data } = await api.post<ApiOk<LibraryReservationPublic>>(
    `/library/reservations/${id}/cancel`
  );
  return data.data;
}

export async function listFines(params?: { status?: string }) {
  const { data } = await api.get<ApiOk<{ items: LibraryFinePublic[]; total: number }>>(
    '/library/fines',
    { params }
  );
  return data.data;
}

export async function waiveFine(id: string, reason?: string) {
  const { data } = await api.post<ApiOk<LibraryFinePublic>>(`/library/fines/${id}/waive`, {
    reason,
  });
  return data.data;
}

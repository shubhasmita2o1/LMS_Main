import { api } from './api';
import type {
  SupportTicketPublic,
  SupportMessagePublic,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '@university-lms/shared';

type ApiOk<T> = { success: boolean; data: T };

export async function listTickets(params?: {
  status?: TicketStatus;
  category?: TicketCategory;
  priority?: TicketPriority;
  page?: number;
}) {
  const { data } = await api.get<
    ApiOk<{ items: SupportTicketPublic[]; total: number }>
  >('/support/tickets', { params });
  return data.data;
}

export async function getTicket(id: string) {
  const { data } = await api.get<ApiOk<SupportTicketPublic>>(`/support/tickets/${id}`);
  return data.data;
}

export async function createTicket(body: {
  category: TicketCategory;
  subject: string;
  description: string;
  priority?: TicketPriority;
}) {
  const { data } = await api.post<ApiOk<SupportTicketPublic>>('/support/tickets', body);
  return data.data;
}

export async function updateTicket(
  id: string,
  body: {
    status?: TicketStatus;
    priority?: TicketPriority;
    assigneeId?: string | null;
  }
) {
  const { data } = await api.patch<ApiOk<SupportTicketPublic>>(`/support/tickets/${id}`, body);
  return data.data;
}

export async function escalateTicket(id: string, note?: string) {
  const { data } = await api.post<ApiOk<SupportTicketPublic>>(
    `/support/tickets/${id}/escalate`,
    { note }
  );
  return data.data;
}

export async function listMessages(ticketId: string) {
  const { data } = await api.get<
    ApiOk<{ items: SupportMessagePublic[]; ticket: SupportTicketPublic }>
  >(`/support/tickets/${ticketId}/messages`);
  return data.data;
}

export async function addMessage(
  ticketId: string,
  body: string,
  isInternalNote?: boolean
) {
  const { data } = await api.post<ApiOk<SupportMessagePublic>>(
    `/support/tickets/${ticketId}/messages`,
    { body, isInternalNote }
  );
  return data.data;
}

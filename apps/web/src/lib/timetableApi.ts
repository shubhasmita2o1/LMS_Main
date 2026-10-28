import { api } from './api';
import type {
  RoomPublic,
  TimetableEntryPublic,
  CalendarEventPublic,
  TimetableConflict,
  DayOfWeek,
  RoomType,
} from '@university-lms/shared';

type ApiOk<T> = { success: boolean; data: T };

export async function listRooms(params?: { page?: number; limit?: number }) {
  const { data } = await api.get<ApiOk<{ items: RoomPublic[]; total: number }>>(
    '/timetable/rooms',
    { params }
  );
  return data.data;
}

export async function createRoom(body: {
  name: string;
  code: string;
  capacity?: number;
  roomType?: RoomType;
  building?: string | null;
}) {
  const { data } = await api.post<ApiOk<RoomPublic>>('/timetable/rooms', body);
  return data.data;
}

export async function listEntries(params?: Record<string, string | number | undefined>) {
  const { data } = await api.get<ApiOk<{ items: TimetableEntryPublic[]; total: number }>>(
    '/timetable/entries',
    { params }
  );
  return data.data;
}

export async function createEntry(body: {
  courseId: string;
  facultyId: string;
  roomId?: string | null;
  sectionId?: string | null;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  notes?: string | null;
  force?: boolean;
}) {
  const { data } = await api.post<
    ApiOk<{ entry: TimetableEntryPublic; conflicts: TimetableConflict[] }>
  >('/timetable/entries', body);
  return data.data;
}

export async function cancelEntry(id: string) {
  const { data } = await api.post<ApiOk<TimetableEntryPublic>>(`/timetable/entries/${id}/cancel`);
  return data.data;
}

export async function substituteEntry(
  id: string,
  body: {
    date: string;
    newFacultyId?: string | null;
    newRoomId?: string | null;
    reason?: string | null;
  }
) {
  const { data } = await api.post(`/timetable/entries/${id}/substitute`, body);
  return data.data;
}

export async function checkConflicts(body: {
  courseId: string;
  facultyId: string;
  roomId?: string | null;
  sectionId?: string | null;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}) {
  const { data } = await api.post<ApiOk<{ conflicts: TimetableConflict[] }>>(
    '/timetable/conflicts/check',
    body
  );
  return data.data.conflicts;
}

export async function myCalendar(params?: { dayOfWeek?: number }) {
  const { data } = await api.get<ApiOk<CalendarEventPublic[]>>('/timetable/calendar/me', {
    params,
  });
  return data.data;
}

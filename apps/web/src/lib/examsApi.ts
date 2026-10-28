import { api } from './api';
import type {
  ApiResponse,
  ExamPublic,
  ExamCenterPublic,
  ExamAllocationPublic,
  ExamPaperPublic,
  ExamAttemptPublic,
  ExamResultPublic,
  ExamInvigilatorPublic,
} from '@university-lms/shared';

export async function listExams(params?: Record<string, string | number | undefined>) {
  const { data } = await api.get<ApiResponse<{ items: ExamPublic[]; total: number } | { items: ExamPublic[] }>>(
    '/exams',
    { params }
  );
  return data.data!;
}

export async function getExam(id: string) {
  const { data } = await api.get<ApiResponse<ExamPublic>>(`/exams/${id}`);
  return data.data!;
}

export async function createExam(body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<ExamPublic>>('/exams', body);
  return data.data!;
}

export async function updateExam(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch<ApiResponse<ExamPublic>>(`/exams/${id}`, body);
  return data.data!;
}

export async function publishExam(id: string) {
  const { data } = await api.post<ApiResponse<ExamPublic>>(`/exams/${id}/publish`);
  return data.data!;
}

export async function closeExam(id: string) {
  const { data } = await api.post<ApiResponse<ExamPublic>>(`/exams/${id}/close`);
  return data.data!;
}

export async function attachQuestions(
  id: string,
  questions: Array<{ questionBankId: string; marks?: number; order?: number }>
) {
  const { data } = await api.post<ApiResponse<ExamPublic>>(`/exams/${id}/questions`, { questions });
  return data.data!;
}

export async function allocateStudents(id: string, body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<ExamAllocationPublic[]>>(`/exams/${id}/allocations`, body);
  return data.data!;
}

export async function listAllocations(id: string) {
  const { data } = await api.get<ApiResponse<ExamAllocationPublic[]>>(`/exams/${id}/allocations`);
  return data.data!;
}

export async function listAttempts(id: string) {
  const { data } = await api.get<ApiResponse<ExamAttemptPublic[]>>(`/exams/${id}/attempts`);
  return data.data!;
}

export async function listCenters() {
  const { data } = await api.get<ApiResponse<ExamCenterPublic[]>>('/exams/centers');
  return data.data!;
}

export async function createCenter(body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<ExamCenterPublic>>('/exams/centers', body);
  return data.data!;
}

export async function startAttempt(examId: string) {
  const { data } = await api.post<ApiResponse<ExamPaperPublic>>(`/exams/${examId}/attempts/start`);
  return data.data!;
}

export async function getPaper(examId: string) {
  const { data } = await api.get<ApiResponse<ExamPaperPublic>>(`/exams/${examId}/paper`);
  return data.data!;
}

export async function saveAnswers(
  examId: string,
  attemptId: string,
  answers: Array<{ questionId: string; response?: string | string[] | null; flagged?: boolean }>
) {
  const { data } = await api.patch<ApiResponse<ExamAttemptPublic>>(
    `/exams/${examId}/attempts/${attemptId}/answers`,
    { answers }
  );
  return data.data!;
}

export async function flagQuestion(
  examId: string,
  attemptId: string,
  questionId: string,
  flagged: boolean
) {
  const { data } = await api.post<ApiResponse<ExamAttemptPublic>>(
    `/exams/${examId}/attempts/${attemptId}/flag`,
    { questionId, flagged }
  );
  return data.data!;
}

export async function submitAttempt(examId: string, attemptId: string) {
  const { data } = await api.post<ApiResponse<ExamAttemptPublic>>(
    `/exams/${examId}/attempts/${attemptId}/submit`
  );
  return data.data!;
}

export async function logSuspicion(
  examId: string,
  attemptId: string,
  body: { type: string; detail?: string }
) {
  const { data } = await api.post(`/exams/${examId}/attempts/${attemptId}/events`, body);
  return data.data;
}

export async function getResult(examId: string, attemptId: string) {
  const { data } = await api.get<ApiResponse<ExamResultPublic>>(
    `/exams/${examId}/attempts/${attemptId}/result`
  );
  return data.data!;
}

export async function listInvigilators(examId: string) {
  const { data } = await api.get<ApiResponse<ExamInvigilatorPublic[]>>(`/exams/${examId}/invigilators`);
  return data.data!;
}

export async function addInvigilator(examId: string, body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<ExamInvigilatorPublic>>(`/exams/${examId}/invigilators`, body);
  return data.data!;
}

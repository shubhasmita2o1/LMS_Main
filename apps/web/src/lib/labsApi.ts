import { api } from './api';
import type {
  PracticalPublic,
  LabPublic,
  ExperimentPublic,
  LabSubmissionPublic,
  ExecutionJobPublic,
  LabEvaluationPublic,
} from '@university-lms/shared';

type ListResult<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export const labsApi = {
  listPracticals: (params?: Record<string, string | number | undefined>) =>
    api.get<{ success: boolean; data: ListResult<PracticalPublic> }>('/labs/practicals', {
      params,
    }),

  createPractical: (body: Record<string, unknown>) =>
    api.post<{ success: boolean; data: PracticalPublic }>('/labs/practicals', body),

  getPractical: (id: string) =>
    api.get<{ success: boolean; data: PracticalPublic }>(`/labs/practicals/${id}`),

  updatePractical: (id: string, body: Record<string, unknown>) =>
    api.patch<{ success: boolean; data: PracticalPublic }>(`/labs/practicals/${id}`, body),

  publishPractical: (id: string) =>
    api.post<{ success: boolean; data: PracticalPublic }>(`/labs/practicals/${id}/publish`),

  deletePractical: (id: string) => api.delete(`/labs/practicals/${id}`),

  listLabs: (practicalId: string) =>
    api.get<{ success: boolean; data: LabPublic[] }>(`/labs/practicals/${practicalId}/labs`),

  createLab: (body: Record<string, unknown>) =>
    api.post<{ success: boolean; data: LabPublic }>('/labs/labs', body),

  updateLab: (id: string, body: Record<string, unknown>) =>
    api.patch<{ success: boolean; data: LabPublic }>(`/labs/labs/${id}`, body),

  listExperiments: (labId: string) =>
    api.get<{ success: boolean; data: ExperimentPublic[] }>(`/labs/labs/${labId}/experiments`),

  createExperiment: (body: Record<string, unknown>) =>
    api.post<{ success: boolean; data: ExperimentPublic }>('/labs/experiments', body),

  getExperiment: (id: string) =>
    api.get<{ success: boolean; data: ExperimentPublic }>(`/labs/experiments/${id}`),

  updateExperiment: (id: string, body: Record<string, unknown>) =>
    api.patch<{ success: boolean; data: ExperimentPublic }>(`/labs/experiments/${id}`, body),

  replaceTestCases: (id: string, testCases: unknown[]) =>
    api.put<{ success: boolean; data: ExperimentPublic }>(`/labs/experiments/${id}/test-cases`, {
      testCases,
    }),

  submit: (experimentId: string, body: Record<string, unknown>) =>
    api.post<{ success: boolean; data: LabSubmissionPublic }>(
      `/labs/experiments/${experimentId}/submissions`,
      body
    ),

  mySubmissions: (experimentId: string) =>
    api.get<{ success: boolean; data: LabSubmissionPublic[] }>(
      `/labs/experiments/${experimentId}/my-submissions`
    ),

  listSubmissions: (experimentId: string, params?: Record<string, string | number | undefined>) =>
    api.get<{ success: boolean; data: ListResult<LabSubmissionPublic> }>(
      `/labs/experiments/${experimentId}/submissions`,
      { params }
    ),

  getSubmission: (id: string) =>
    api.get<{ success: boolean; data: LabSubmissionPublic }>(`/labs/submissions/${id}`),

  evaluate: (id: string, body: Record<string, unknown>) =>
    api.post<{
      success: boolean;
      data: { submission: LabSubmissionPublic; evaluation: LabEvaluationPublic };
    }>(`/labs/submissions/${id}/evaluate`, body),

  requeue: (id: string) =>
    api.post<{ success: boolean; data: LabSubmissionPublic }>(`/labs/submissions/${id}/requeue`),

  getJob: (jobId: string) =>
    api.get<{ success: boolean; data: ExecutionJobPublic }>(`/labs/executions/${jobId}`),
};

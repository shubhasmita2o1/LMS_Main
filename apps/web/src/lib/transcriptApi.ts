import { api } from './api';
import type {
  TranscriptPublic,
  CertificatePublic,
  VerificationPublicResult,
  CertificateType,
} from '@university-lms/shared';

type ApiOk<T> = { success: boolean; data: T };

export async function listTranscripts(params?: { studentId?: string; status?: string }) {
  const { data } = await api.get<ApiOk<{ items: TranscriptPublic[]; total: number }>>(
    '/transcripts',
    { params }
  );
  return data.data;
}

export async function generateTranscript(studentId: string) {
  const { data } = await api.post<ApiOk<TranscriptPublic>>('/transcripts/generate', { studentId });
  return data.data;
}

export async function issueTranscript(id: string) {
  const { data } = await api.post<ApiOk<TranscriptPublic>>(`/transcripts/${id}/issue`);
  return data.data;
}

export async function revokeTranscript(id: string) {
  const { data } = await api.post<ApiOk<TranscriptPublic>>(`/transcripts/${id}/revoke`);
  return data.data;
}

export async function getTranscript(id: string) {
  const { data } = await api.get<ApiOk<TranscriptPublic>>(`/transcripts/${id}`);
  return data.data;
}

export async function listCertificates(params?: { studentId?: string; status?: string }) {
  const { data } = await api.get<ApiOk<{ items: CertificatePublic[]; total: number }>>(
    '/certificates',
    { params }
  );
  return data.data;
}

export async function createCertificate(body: {
  studentId: string;
  type: CertificateType;
  title: string;
  body?: string | null;
  programName?: string | null;
  yearLabel?: string | null;
}) {
  const { data } = await api.post<ApiOk<CertificatePublic>>('/certificates', body);
  return data.data;
}

export async function issueCertificate(id: string) {
  const { data } = await api.post<ApiOk<CertificatePublic>>(`/certificates/${id}/issue`);
  return data.data;
}

export async function revokeCertificate(id: string) {
  const { data } = await api.post<ApiOk<CertificatePublic>>(`/certificates/${id}/revoke`);
  return data.data;
}

/** Public — may use bare fetch if unauthenticated */
export async function publicVerify(code: string) {
  const base = import.meta.env.VITE_API_URL || '/api/v1';
  const res = await fetch(`${base}/public/verify/${encodeURIComponent(code)}`);
  const json = (await res.json()) as ApiOk<VerificationPublicResult>;
  if (!json.success) throw new Error('Verification failed');
  return json.data;
}

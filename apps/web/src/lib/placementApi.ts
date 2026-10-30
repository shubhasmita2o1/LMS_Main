import { api } from './api';
import type {
  CompanyPublic,
  PlacementDrivePublic,
  PlacementApplicationPublic,
  InterviewPublic,
  OfferPublic,
  JobType,
  DriveStatus,
  ApplicationStatus,
} from '@university-lms/shared';

type ApiOk<T> = { success: boolean; data: T };

export async function listCompanies(params?: { status?: string; search?: string }) {
  const { data } = await api.get<ApiOk<{ items: CompanyPublic[]; total: number }>>(
    '/placement/companies',
    { params }
  );
  return data.data;
}

export async function createCompany(body: {
  name: string;
  industry?: string;
  website?: string;
  description?: string;
}) {
  const { data } = await api.post<ApiOk<CompanyPublic>>('/placement/companies', body);
  return data.data;
}

export async function updateCompany(id: string, body: Partial<CompanyPublic>) {
  const { data } = await api.patch<ApiOk<CompanyPublic>>(`/placement/companies/${id}`, body);
  return data.data;
}

export async function listDrives(params?: {
  status?: DriveStatus;
  jobType?: JobType;
  companyId?: string;
}) {
  const { data } = await api.get<
    ApiOk<{ items: PlacementDrivePublic[]; total: number }>
  >('/placement/drives', { params });
  return data.data;
}

export async function getDrive(id: string) {
  const { data } = await api.get<ApiOk<PlacementDrivePublic>>(`/placement/drives/${id}`);
  return data.data;
}

export async function createDrive(body: {
  companyId: string;
  title: string;
  jobType: JobType;
  description?: string;
  packageMin?: number;
  packageMax?: number;
  location?: string;
  eligibility?: {
    minCgpa?: number;
    programs?: string[];
    maxBacklogs?: number;
    batchYears?: number[];
  };
  applicationOpenAt?: string;
  applicationCloseAt?: string;
}) {
  const { data } = await api.post<ApiOk<PlacementDrivePublic>>('/placement/drives', body);
  return data.data;
}

export async function openDrive(id: string) {
  const { data } = await api.post<ApiOk<PlacementDrivePublic>>(`/placement/drives/${id}/open`);
  return data.data;
}

export async function closeDrive(id: string) {
  const { data } = await api.post<ApiOk<PlacementDrivePublic>>(`/placement/drives/${id}/close`);
  return data.data;
}

export async function applyToDrive(body: {
  driveId: string;
  resumeFileKey?: string;
  coverNote?: string;
}) {
  const { data } = await api.post<ApiOk<PlacementApplicationPublic>>(
    '/placement/applications',
    body
  );
  return data.data;
}

export async function listApplications(params?: {
  driveId?: string;
  status?: ApplicationStatus;
}) {
  const { data } = await api.get<
    ApiOk<{ items: PlacementApplicationPublic[]; total: number }>
  >('/placement/applications', { params });
  return data.data;
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  note?: string
) {
  const { data } = await api.patch<ApiOk<PlacementApplicationPublic>>(
    `/placement/applications/${id}/status`,
    { status, note }
  );
  return data.data;
}

export async function withdrawApplication(id: string) {
  const { data } = await api.post<ApiOk<PlacementApplicationPublic>>(
    `/placement/applications/${id}/withdraw`
  );
  return data.data;
}

export async function createInterview(body: {
  applicationId: string;
  scheduledAt: string;
  mode?: string;
  locationOrLink?: string;
}) {
  const { data } = await api.post<ApiOk<InterviewPublic>>('/placement/interviews', body);
  return data.data;
}

export async function createOffer(body: {
  applicationId: string;
  roleTitle: string;
  packageAmount?: number;
  currency?: string;
}) {
  const { data } = await api.post<ApiOk<OfferPublic>>('/placement/offers', body);
  return data.data;
}

export async function listOffers() {
  const { data } = await api.get<ApiOk<{ items: OfferPublic[] }>>('/placement/offers');
  return data.data;
}

export async function respondOffer(id: string, accept: boolean) {
  const { data } = await api.post<ApiOk<OfferPublic>>(`/placement/offers/${id}/respond`, {
    accept,
  });
  return data.data;
}

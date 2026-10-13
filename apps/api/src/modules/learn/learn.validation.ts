import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const progressStatusEnum = z.enum(['not_started', 'in_progress', 'completed']);
const liveClassStatusEnum = z.enum(['scheduled', 'live', 'completed', 'cancelled']);
const meetingProviderEnum = z.enum(['zoom', 'meet', 'teams', 'custom']);
const contentTypeEnum = z.enum([
  'pdf',
  'ppt',
  'pptx',
  'docx',
  'image',
  'zip',
  'video',
  'link',
  'text',
  'other',
]);
const videoProviderEnum = z.enum(['url', 'youtube', 'vimeo']);

export const progressUpdateSchema = z.object({
  progressPercent: z.number().min(0).max(100).optional(),
  lastPositionSeconds: z.number().min(0).optional(),
  status: progressStatusEnum.optional(),
  timeSpentSecondsDelta: z.number().min(0).max(36000).optional(),
  markComplete: z.boolean().optional(),
});

export const noteCreateSchema = z.object({
  body: z.string().min(1).max(20000),
});

export const noteUpdateSchema = z.object({
  body: z.string().min(1).max(20000),
});

export const bookmarkCreateSchema = z.object({
  label: z.string().max(200).optional(),
});

export const liveClassCreateSchema = z.object({
  courseId: objectId,
  offeringId: objectId.optional().nullable(),
  sectionId: objectId.optional().nullable(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  scheduledStart: z.string().datetime().or(z.coerce.date()),
  scheduledEnd: z.string().datetime().or(z.coerce.date()),
  meetingProvider: meetingProviderEnum.optional(),
  meetingUrl: z.string().max(2000).optional().nullable(),
  meetingId: z.string().max(200).optional().nullable(),
  passcode: z.string().max(100).optional().nullable(),
  hostFacultyId: objectId.optional().nullable(),
});

export const liveClassUpdateSchema = liveClassCreateSchema.partial().omit({ courseId: true }).extend({
  status: liveClassStatusEnum.optional(),
  recordingUrl: z.string().max(2000).optional().nullable(),
});

export const completeLiveClassSchema = z.object({
  recordingUrl: z.string().max(2000).optional().nullable(),
});

export const attachContentSchema = z.object({
  contentType: contentTypeEnum.optional(),
  fileKey: z.string().max(500).optional().nullable(),
  contentUrl: z.string().max(2000).optional().nullable(),
  fileName: z.string().max(255).optional().nullable(),
  mimeType: z.string().max(120).optional().nullable(),
  fileSize: z.number().min(0).optional().nullable(),
  textBody: z.string().max(100000).optional().nullable(),
  videoProvider: videoProviderEnum.optional().nullable(),
  videoUrl: z.string().max(2000).optional().nullable(),
  durationSeconds: z.number().min(0).optional().nullable(),
  captionsUrl: z.string().max(2000).optional().nullable(),
  transcript: z.string().max(500000).optional().nullable(),
  allowDownload: z.boolean().optional(),
});

export const listLiveClassesQuerySchema = z.object({
  courseId: objectId.optional(),
  status: liveClassStatusEnum.optional(),
});

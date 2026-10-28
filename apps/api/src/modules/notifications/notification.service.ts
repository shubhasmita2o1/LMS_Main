import mongoose from 'mongoose';
import { AppError } from '../../middleware/errorHandler';
import { sendEmail } from '../../services/email.service';
import {
  Notification,
  NotificationDeliveryLog,
  NotificationPreference,
  NotificationTemplate,
  type INotification,
} from './notification.model';
import { getPushAdapter, getSmsAdapter } from './adapters';
import type {
  NotificationChannel,
  NotificationType,
  NotificationPriority,
  NotificationPreferenceMap,
  NotificationPublic,
  NotificationPreferencePublic,
  NotificationTemplatePublic,
  NotificationDeliveryLogPublic,
  NotificationPayload,
} from '@university-lms/shared';

function tid(tenantId: string) {
  return new mongoose.Types.ObjectId(tenantId);
}

function idStr(v: unknown): string | null {
  if (!v) return null;
  return String(v);
}

function baseFilter(tenantId: string, extra: Record<string, unknown> = {}) {
  return { tenantId: tid(tenantId), isDeleted: false, ...extra };
}

/** Defaults: in_app on; email on for high-value; push/sms off */
const DEFAULT_PREFERENCES: NotificationPreferenceMap = {
  announcement: { in_app: true, email: true, push: false, sms: false },
  assignment_due: { in_app: true, email: true, push: false, sms: false },
  quiz_available: { in_app: true, email: false, push: false, sms: false },
  exam_reminder: { in_app: true, email: true, push: false, sms: false },
  grade_published: { in_app: true, email: true, push: false, sms: false },
  attendance_alert: { in_app: true, email: true, push: false, sms: false },
  discussion_reply: { in_app: true, email: false, push: false, sms: false },
  system: { in_app: true, email: true, push: false, sms: false },
  custom: { in_app: true, email: false, push: false, sms: false },
};

function mapNotification(d: INotification | any): NotificationPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    userId: String(d.userId),
    type: d.type,
    channel: d.channel,
    title: d.title,
    body: d.body,
    data: d.data ?? null,
    status: d.status,
    readAt: d.readAt ?? null,
    priority: d.priority ?? 'normal',
    scheduledFor: d.scheduledFor ?? null,
    sentAt: d.sentAt ?? null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function mapTemplate(d: any): NotificationTemplatePublic {
  return {
    id: String(d._id),
    tenantId: d.tenantId ? String(d.tenantId) : null,
    key: d.key,
    name: d.name,
    channel: d.channel,
    subjectTemplate: d.subjectTemplate ?? null,
    bodyTemplate: d.bodyTemplate,
    isActive: !!d.isActive,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function mapPreference(d: any): NotificationPreferencePublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    userId: String(d.userId),
    preferences: { ...DEFAULT_PREFERENCES, ...(d.preferences || {}) },
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function mapDeliveryLog(d: any): NotificationDeliveryLogPublic {
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    notificationId: String(d.notificationId),
    userId: String(d.userId),
    channel: d.channel,
    status: d.status,
    providerResponse: d.providerResponse ?? null,
    error: d.error ?? null,
    attempt: d.attempt ?? 1,
    createdAt: d.createdAt,
  };
}

/** Simple {{var}} placeholder replacement */
export function renderTemplate(
  template: string,
  vars: Record<string, string | number | undefined | null>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const v = vars[key];
    return v === undefined || v === null ? '' : String(v);
  });
}

export async function isChannelEnabled(
  tenantId: string,
  userId: string,
  type: NotificationType,
  channel: NotificationChannel
): Promise<boolean> {
  const pref = await NotificationPreference.findOne(
    baseFilter(tenantId, { userId: tid(userId) })
  ).lean();
  const map = { ...DEFAULT_PREFERENCES, ...(pref?.preferences || {}) };
  const typeMap = map[type] || DEFAULT_PREFERENCES[type] || {};
  if (typeof typeMap[channel] === 'boolean') return typeMap[channel]!;
  // fallback defaults
  if (channel === 'in_app') return true;
  if (channel === 'email') {
    return ['announcement', 'assignment_due', 'exam_reminder', 'grade_published', 'attendance_alert', 'system'].includes(
      type
    );
  }
  return false;
}

export interface NotifyInput {
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: NotificationPayload | null;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  dedupeKey?: string | null;
  /** Optional email address override when sending email */
  emailTo?: string | null;
  createdBy?: string | null;
}

/**
 * Create in-app notification and optionally fan-out to email/push/sms per preferences.
 */
export async function notifyUser(input: NotifyInput): Promise<NotificationPublic | null> {
  const {
    tenantId,
    userId,
    type,
    title,
    body,
    data,
    priority = 'normal',
    channels = ['in_app'],
    dedupeKey,
    emailTo,
    createdBy,
  } = input;

  const uniqueChannels = Array.from(new Set(channels));
  let inAppDoc: INotification | null = null;

  for (const channel of uniqueChannels) {
    const enabled = await isChannelEnabled(tenantId, userId, type, channel);
    if (!enabled && channel !== 'in_app') continue;
    // Always allow in_app unless explicitly disabled
    if (channel === 'in_app' && !enabled) continue;

    if (channel === 'in_app') {
      if (dedupeKey) {
        const existing = await Notification.findOne(
          baseFilter(tenantId, { userId: tid(userId), dedupeKey, channel: 'in_app' })
        );
        if (existing) {
          inAppDoc = existing;
          continue;
        }
      }
      const doc = await Notification.create({
        tenantId: tid(tenantId),
        userId: tid(userId),
        type,
        channel: 'in_app',
        title: title.slice(0, 300),
        body: body.slice(0, 5000),
        data: data ?? null,
        status: 'sent',
        priority,
        sentAt: new Date(),
        dedupeKey: dedupeKey ?? null,
        createdBy: createdBy ? tid(createdBy) : null,
      });
      inAppDoc = doc;
      await NotificationDeliveryLog.create({
        tenantId: tid(tenantId),
        notificationId: doc._id,
        userId: tid(userId),
        channel: 'in_app',
        status: 'sent',
        attempt: 1,
      });
      continue;
    }

    if (channel === 'email') {
      // Create a tracking notification row for email attempt
      const emailNotif = await Notification.create({
        tenantId: tid(tenantId),
        userId: tid(userId),
        type,
        channel: 'email',
        title: title.slice(0, 300),
        body: body.slice(0, 5000),
        data: data ?? null,
        status: 'queued',
        priority,
        dedupeKey: dedupeKey ? `${dedupeKey}:email` : null,
        createdBy: createdBy ? tid(createdBy) : null,
      });

      try {
        // Resolve recipient email from User model if not provided
        let to = emailTo;
        if (!to) {
          const User = mongoose.model('User');
          const user = await User.findOne({
            _id: tid(userId),
            tenantId: tid(tenantId),
            isDeleted: { $ne: true },
          })
            .select('email')
            .lean();
          to = (user as any)?.email ?? null;
        }
        if (!to) {
          emailNotif.status = 'failed';
          await emailNotif.save();
          await NotificationDeliveryLog.create({
            tenantId: tid(tenantId),
            notificationId: emailNotif._id,
            userId: tid(userId),
            channel: 'email',
            status: 'failed',
            error: 'No email address',
            attempt: 1,
          });
          continue;
        }

        const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#0f172a;">
<p style="font-size:16px;font-weight:600;">${escapeHtml(title)}</p>
<p>${escapeHtml(body).replace(/\n/g, '<br/>')}</p>
${data?.link ? `<p><a href="${escapeHtml(String(data.link))}">Open in LMS</a></p>` : ''}
<p style="font-size:12px;color:#94a3b8;">You received this because of your notification preferences.</p>
</body></html>`;

        const result = await sendEmail({
          to,
          subject: title.slice(0, 200),
          html,
          text: body,
        });
        emailNotif.status = 'sent';
        emailNotif.sentAt = new Date();
        await emailNotif.save();
        await NotificationDeliveryLog.create({
          tenantId: tid(tenantId),
          notificationId: emailNotif._id,
          userId: tid(userId),
          channel: 'email',
          status: 'sent',
          providerResponse: result.mode,
          attempt: 1,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Email send failed';
        emailNotif.status = 'failed';
        await emailNotif.save();
        await NotificationDeliveryLog.create({
          tenantId: tid(tenantId),
          notificationId: emailNotif._id,
          userId: tid(userId),
          channel: 'email',
          status: 'failed',
          error: msg.slice(0, 500),
          attempt: 1,
        });
        // Do not throw — in-app already delivered
      }
      continue;
    }

    if (channel === 'push') {
      try {
        const res = await getPushAdapter().send({
          userId,
          title,
          body,
          data: data ?? undefined,
        });
        await NotificationDeliveryLog.create({
          tenantId: tid(tenantId),
          notificationId: inAppDoc?._id ?? tid(userId),
          userId: tid(userId),
          channel: 'push',
          status: res.ok ? 'sent' : 'failed',
          providerResponse: res.providerResponse ?? null,
          attempt: 1,
        });
      } catch {
        /* noop adapter should not throw */
      }
      continue;
    }

    if (channel === 'sms') {
      // SMS needs phone — skip silently in MVP without profile phone
      try {
        await getSmsAdapter().send({ to: userId, body: `${title}: ${body}`.slice(0, 160) });
      } catch {
        /* ignore */
      }
    }
  }

  return inAppDoc ? mapNotification(inAppDoc) : null;
}

export async function notifyUsers(
  inputs: Omit<NotifyInput, 'userId'> & { userIds: string[] }
): Promise<number> {
  let count = 0;
  for (const userId of inputs.userIds) {
    const n = await notifyUser({ ...inputs, userId });
    if (n) count += 1;
  }
  return count;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── List / read APIs ────────────────────────────────────────────────────────

export async function listMyNotifications(
  tenantId: string,
  userId: string,
  opts: { page?: number; limit?: number; unreadOnly?: boolean } = {}
): Promise<{ items: NotificationPublic[]; total: number; page: number; limit: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
  const filter: Record<string, unknown> = baseFilter(tenantId, {
    userId: tid(userId),
    channel: 'in_app',
  });
  if (opts.unreadOnly) {
    filter.status = { $ne: 'read' };
    filter.readAt = null;
  }

  const [items, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
  ]);

  return {
    items: items.map(mapNotification),
    total,
    page,
    limit,
  };
}

export async function unreadCount(tenantId: string, userId: string): Promise<number> {
  return Notification.countDocuments(
    baseFilter(tenantId, {
      userId: tid(userId),
      channel: 'in_app',
      status: { $ne: 'read' },
      readAt: null,
    })
  );
}

export async function markRead(
  tenantId: string,
  userId: string,
  notificationId: string
): Promise<NotificationPublic> {
  const doc = await Notification.findOne(
    baseFilter(tenantId, { _id: tid(notificationId), userId: tid(userId), channel: 'in_app' })
  );
  if (!doc) throw new AppError(404, 'Notification not found', 'NOT_FOUND');
  if (doc.status !== 'read') {
    doc.status = 'read';
    doc.readAt = new Date();
    await doc.save();
  }
  return mapNotification(doc);
}

export async function markAllRead(tenantId: string, userId: string): Promise<number> {
  const result = await Notification.updateMany(
    baseFilter(tenantId, {
      userId: tid(userId),
      channel: 'in_app',
      status: { $ne: 'read' },
      readAt: null,
    }),
    { $set: { status: 'read', readAt: new Date() } }
  );
  return result.modifiedCount;
}

// ─── Preferences ─────────────────────────────────────────────────────────────

export async function getPreferences(
  tenantId: string,
  userId: string
): Promise<NotificationPreferencePublic> {
  let doc = await NotificationPreference.findOne(
    baseFilter(tenantId, { userId: tid(userId) })
  );
  if (!doc) {
    doc = await NotificationPreference.create({
      tenantId: tid(tenantId),
      userId: tid(userId),
      preferences: DEFAULT_PREFERENCES,
    });
  }
  return mapPreference(doc);
}

export async function updatePreferences(
  tenantId: string,
  userId: string,
  preferences: NotificationPreferenceMap
): Promise<NotificationPreferencePublic> {
  const allowedTypes: NotificationType[] = [
    'announcement',
    'assignment_due',
    'quiz_available',
    'exam_reminder',
    'grade_published',
    'attendance_alert',
    'discussion_reply',
    'system',
    'custom',
  ];
  const allowedChannels: NotificationChannel[] = ['in_app', 'email', 'push', 'sms'];
  const cleaned: NotificationPreferenceMap = {};
  for (const [type, channels] of Object.entries(preferences || {})) {
    if (!allowedTypes.includes(type as NotificationType)) continue;
    const ch: Partial<Record<NotificationChannel, boolean>> = {};
    for (const [c, enabled] of Object.entries(channels || {})) {
      if (allowedChannels.includes(c as NotificationChannel) && typeof enabled === 'boolean') {
        ch[c as NotificationChannel] = enabled;
      }
    }
    cleaned[type as NotificationType] = ch;
  }

  const doc = await NotificationPreference.findOneAndUpdate(
    baseFilter(tenantId, { userId: tid(userId) }),
    {
      $set: { preferences: cleaned },
      $setOnInsert: { tenantId: tid(tenantId), userId: tid(userId) },
    },
    { upsert: true, new: true }
  );
  return mapPreference(doc);
}

// ─── Templates (admin) ───────────────────────────────────────────────────────

export async function listTemplates(
  tenantId: string
): Promise<NotificationTemplatePublic[]> {
  const items = await NotificationTemplate.find({
    isDeleted: false,
    $or: [{ tenantId: tid(tenantId) }, { tenantId: null }],
  })
    .sort({ key: 1, channel: 1 })
    .lean();
  return items.map(mapTemplate);
}

export async function createTemplate(
  tenantId: string,
  input: {
    key: string;
    name: string;
    channel: NotificationChannel;
    subjectTemplate?: string | null;
    bodyTemplate: string;
    isActive?: boolean;
  },
  userId?: string
): Promise<NotificationTemplatePublic> {
  const doc = await NotificationTemplate.create({
    tenantId: tid(tenantId),
    key: input.key.trim().toLowerCase(),
    name: input.name.trim(),
    channel: input.channel,
    subjectTemplate: input.subjectTemplate ?? null,
    bodyTemplate: input.bodyTemplate,
    isActive: input.isActive !== false,
    createdBy: userId ? tid(userId) : null,
  });
  return mapTemplate(doc);
}

export async function updateTemplate(
  tenantId: string,
  id: string,
  input: Partial<{
    name: string;
    subjectTemplate: string | null;
    bodyTemplate: string;
    isActive: boolean;
  }>
): Promise<NotificationTemplatePublic> {
  const doc = await NotificationTemplate.findOne(
    baseFilter(tenantId, { _id: tid(id) })
  );
  if (!doc) throw new AppError(404, 'Template not found', 'NOT_FOUND');
  if (input.name !== undefined) doc.name = input.name.trim();
  if (input.subjectTemplate !== undefined) doc.subjectTemplate = input.subjectTemplate;
  if (input.bodyTemplate !== undefined) doc.bodyTemplate = input.bodyTemplate;
  if (input.isActive !== undefined) doc.isActive = input.isActive;
  await doc.save();
  return mapTemplate(doc);
}

export async function deleteTemplate(tenantId: string, id: string): Promise<void> {
  const doc = await NotificationTemplate.findOne(
    baseFilter(tenantId, { _id: tid(id) })
  );
  if (!doc) throw new AppError(404, 'Template not found', 'NOT_FOUND');
  doc.isDeleted = true;
  doc.deletedAt = new Date();
  await doc.save();
}

export async function listDeliveryLogs(
  tenantId: string,
  opts: { page?: number; limit?: number; channel?: string; status?: string } = {}
): Promise<{ items: NotificationDeliveryLogPublic[]; total: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
  const filter: Record<string, unknown> = { tenantId: tid(tenantId) };
  if (opts.channel) filter.channel = opts.channel;
  if (opts.status) filter.status = opts.status;

  const [items, total] = await Promise.all([
    NotificationDeliveryLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    NotificationDeliveryLog.countDocuments(filter),
  ]);
  return { items: items.map(mapDeliveryLog), total };
}

/** Seed default templates for a tenant (idempotent by key) */
export async function seedDefaultTemplates(tenantId: string): Promise<void> {
  const defaults = [
    {
      key: 'announcement',
      name: 'Announcement published',
      channel: 'in_app' as const,
      bodyTemplate: '{{title}}\n\n{{body}}',
    },
    {
      key: 'announcement',
      name: 'Announcement published (email)',
      channel: 'email' as const,
      subjectTemplate: '{{title}}',
      bodyTemplate: '{{body}}',
    },
    {
      key: 'discussion_reply',
      name: 'Discussion reply',
      channel: 'in_app' as const,
      bodyTemplate: '{{authorName}} replied on "{{threadTitle}}": {{snippet}}',
    },
    {
      key: 'grade_published',
      name: 'Grades published',
      channel: 'in_app' as const,
      bodyTemplate: 'Grades for {{courseName}} have been published.',
    },
  ];

  for (const t of defaults) {
    const exists = await NotificationTemplate.findOne({
      tenantId: tid(tenantId),
      key: t.key,
      channel: t.channel,
      isDeleted: false,
    });
    if (!exists) {
      await NotificationTemplate.create({
        tenantId: tid(tenantId),
        key: t.key,
        name: t.name,
        channel: t.channel,
        subjectTemplate: (t as any).subjectTemplate ?? null,
        bodyTemplate: t.bodyTemplate,
        isActive: true,
      });
    }
  }
}

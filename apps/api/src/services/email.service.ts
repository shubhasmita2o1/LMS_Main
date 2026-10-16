import { env } from '../config/env';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send transactional email via Resend when EMAIL_PROVIDER_API_KEY is set.
 * In development without a key, logs [DEV MAIL] with recipient/subject/link only (no secrets dump).
 * Never logs raw verification/reset tokens in production.
 */
export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; mode: 'resend' | 'dev-log' }> {
  const apiKey = env.EMAIL_PROVIDER_API_KEY;
  const from = env.EMAIL_FROM || 'University LMS <noreply@university-lms.local>';

  if (apiKey) {
    try {
      // Optional dependency: npm install resend --workspace=@university-lms/api
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mod: any = await import('resend' as string).catch(() => null);
      if (!mod?.Resend) {
        throw new Error('resend package not installed');
      }
      const resend = new mod.Resend(apiKey);
      const result = await resend.emails.send({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      });
      if (result.error) {
        console.error('[email] Resend error:', result.error.message);
        throw new Error(result.error.message);
      }
      return { ok: true, mode: 'resend' };
    } catch (err) {
      console.error('[email] Failed to send via Resend:', err instanceof Error ? err.message : err);
      throw err;
    }
  }

  // Dev fallback — never treat as production delivery
  if (env.NODE_ENV === 'production') {
    console.error('[email] EMAIL_PROVIDER_API_KEY missing in production; email not sent');
    throw new Error('Email provider not configured');
  }

  // Extract links for log without dumping full HTML
  const linkMatch = input.html.match(/https?:\/\/[^\s"'<>]+/);
  const linkHint = linkMatch ? linkMatch[0] : '(no link found)';
  console.log(
    `[DEV MAIL] to=${input.to} subject="${input.subject}" link=${linkHint}`
  );
  return { ok: true, mode: 'dev-log' };
}

export function verificationEmailHtml(params: {
  firstName: string;
  verifyUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #0f172a;">
  <p>Hi ${escapeHtml(params.firstName)},</p>
  <p>Thanks for registering with University LMS. Please verify your email address by clicking the button below.</p>
  <p style="margin: 24px 0;">
    <a href="${params.verifyUrl}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">
      Verify email
    </a>
  </p>
  <p style="font-size: 14px; color: #64748b;">This link expires in 30 minutes. If you did not create an account, you can ignore this message.</p>
  <p style="font-size: 12px; color: #94a3b8;">Or paste this URL into your browser:<br/>${escapeHtml(params.verifyUrl)}</p>
</body>
</html>`.trim();
}

export function passwordResetEmailHtml(params: {
  firstName: string;
  resetUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #0f172a;">
  <p>Hi ${escapeHtml(params.firstName)},</p>
  <p>We received a request to reset your University LMS password.</p>
  <p style="margin: 24px 0;">
    <a href="${params.resetUrl}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">
      Reset password
    </a>
  </p>
  <p style="font-size: 14px; color: #64748b;">This link expires in 1 hour. If you did not request a reset, you can ignore this message.</p>
  <p style="font-size: 12px; color: #94a3b8;">Or paste this URL into your browser:<br/>${escapeHtml(params.resetUrl)}</p>
</body>
</html>`.trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

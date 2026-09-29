const nodemailer = require('nodemailer');
const env = require('../config/env');

/**
 * HTML Escaping utility to prevent XSS / HTML injection in dynamic email fields
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Mask email address for sanitized operational logs (e.g., "m***r@gmail.com")
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string') return 'unknown';
  const parts = email.split('@');
  if (parts.length !== 2) return '***';
  const name = parts[0];
  const domain = parts[1];
  const maskedName =
    name.length <= 2 ? `${name[0]}***` : `${name[0]}***${name[name.length - 1]}`;
  return `${maskedName}@${domain}`;
}

let cachedTransporter = null;

/**
 * Reusable Email Service for PMCKB
 * Handles SMTP transporter lifecycle, branded email templates, and secure dispatch
 */
const emailService = {
  /**
   * Check whether email credentials are fully configured
   * @returns {boolean}
   */
  isConfigured() {
    return Boolean(
      env.EMAIL_USER &&
      env.EMAIL_PASSWORD &&
      env.EMAIL_USER.trim() !== '' &&
      env.EMAIL_PASSWORD.trim() !== ''
    );
  },

  /**
   * Get the active email provider name
   * @returns {string}
   */
  getProviderName() {
    return (env.EMAIL_PROVIDER || 'gmail').toLowerCase();
  },

  /**
   * Create or return cached Nodemailer transporter
   */
  getTransporter() {
    if (cachedTransporter) {
      return cachedTransporter;
    }

    if (!this.isConfigured()) {
      return null;
    }

    const provider = this.getProviderName();
    // Google App Passwords are 16 letters usually formatted with spaces (e.g., 'xxxx yyyy zzzz wwww').
    // Strip all internal whitespace so authentication succeeds with SMTP.
    const cleanPassword = (env.EMAIL_PASSWORD || '').replace(/\s+/g, '').trim();

    if (provider === 'gmail') {
      cachedTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: env.EMAIL_USER.trim(),
          pass: cleanPassword,
        },
      });
    } else {
      cachedTransporter = nodemailer.createTransport({
        host: env.EMAIL_HOST,
        port: env.EMAIL_PORT,
        secure: env.EMAIL_SECURE,
        auth: {
          user: env.EMAIL_USER.trim(),
          pass: cleanPassword,
        },
      });
    }

    return cachedTransporter;
  },

  /**
   * Safe delivery logger - never logs credentials or raw secret tokens
   */
  logDelivery({ to, invitationId, status, error = null }) {
    const timestamp = new Date().toISOString();
    const masked = maskEmail(to);
    const safeId = invitationId ? `[InvID: ${invitationId}]` : '[InvID: N/A]';

    if (status === 'SUCCESS') {
      console.log(`📨 [EMAIL DELIVERY] [${timestamp}] ${safeId} Target: ${masked} -> SENT`);
    } else {
      console.warn(
        `⚠️ [EMAIL DELIVERY] [${timestamp}] ${safeId} Target: ${masked} -> FAILED: ${error || 'Unknown error'}`
      );
    }
  },

  /**
   * Verify transporter connection on startup without crashing the server
   */
  async verifyConfiguration() {
    if (!this.isConfigured()) {
      console.warn(
        '⚠️ [EmailService] EMAIL_USER / EMAIL_PASSWORD are not configured in environment. Team invitation emails will be marked unconfigured.'
      );
      return { configured: false, verified: false };
    }

    try {
      const transporter = this.getTransporter();
      if (transporter && typeof transporter.verify === 'function') {
        await transporter.verify();
        console.log(
          `✅ [EmailService] Connected to ${this.getProviderName().toUpperCase()} SMTP server as ${maskEmail(env.EMAIL_USER)}`
        );
        return { configured: true, verified: true };
      }
      return { configured: true, verified: false };
    } catch (err) {
      console.warn(
        `⚠️ [EmailService] SMTP verification failed for ${maskEmail(env.EMAIL_USER)}: ${err.message}`
      );
      return { configured: true, verified: false, error: err.message };
    }
  },

  /**
   * Generic send email method
   * @param {object} params
   * @param {string} params.to
   * @param {string} params.subject
   * @param {string} params.html
   * @param {string} [params.text]
   * @param {string|number} [params.invitationId]
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendEmail({ to, subject, html, text, invitationId }) {
    if (!this.isConfigured()) {
      const errorMsg = 'Email service is not configured. Please configure EMAIL_USER and EMAIL_PASSWORD.';
      this.logDelivery({ to, invitationId, status: 'FAILED', error: errorMsg });
      return { success: false, error: errorMsg };
    }

    const transporter = this.getTransporter();
    if (!transporter) {
      const errorMsg = 'Transporter initialization failed.';
      this.logDelivery({ to, invitationId, status: 'FAILED', error: errorMsg });
      return { success: false, error: errorMsg };
    }

    try {
      const fromAddress = env.EMAIL_FROM_ADDRESS || env.EMAIL_USER;
      const fromName = env.EMAIL_FROM_NAME || 'PMCKB';
      const mailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to: to.trim().toLowerCase(),
        subject,
        html,
        text: text || '',
      };

      const info = await transporter.sendMail(mailOptions);
      this.logDelivery({ to, invitationId, status: 'SUCCESS' });
      return { success: true, messageId: info.messageId };
    } catch (err) {
      const safeError = err.message || 'SMTP delivery failed';
      this.logDelivery({ to, invitationId, status: 'FAILED', error: safeError });
      return { success: false, error: safeError };
    }
  },

  /**
   * Send branded Team Invitation Email
   * Responsive HTML with light background, white card, PMCKB purple accent, and readable layout.
   */
  async sendTeamInvitationEmail({ to, inviterName, teamName, inviteUrl, expiresAt, invitationId }) {
    const safeInviter = escapeHtml(inviterName || 'A team leader');
    const safeTeam = escapeHtml(teamName || 'PMCKB Workspace');
    const safeUrl = inviteUrl; // Validated internal/configured URL
    const formattedExpires = expiresAt
      ? new Date(expiresAt).toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short',
        })
      : '7 days';

    const subject = `You've been invited to join ${safeTeam} on PMCKB`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f8fafc;
      padding: 40px 16px;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 20px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      overflow: hidden;
    }
    .header {
      padding: 32px 32px 16px 32px;
      text-align: center;
    }
    .brand-badge {
      display: inline-block;
      padding: 6px 14px;
      background-color: #eef2ff;
      border: 1px solid #e0e7ff;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 700;
      color: #4f46e5;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 16px 32px 32px 32px;
    }
    h1 {
      margin: 16px 0 8px 0;
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.3;
    }
    p {
      margin: 0 0 16px 0;
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
    }
    .team-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px;
      margin: 20px 0;
    }
    .team-name {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 6px;
    }
    .team-role {
      font-size: 12px;
      font-weight: 600;
      color: #4f46e5;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .cta-wrap {
      text-align: center;
      margin: 28px 0 24px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #4f46e5;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      padding: 14px 32px;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(79, 70, 229, 0.25);
    }
    .expiry {
      font-size: 12px;
      color: #64748b;
      text-align: center;
      margin-bottom: 24px;
    }
    .divider {
      border-top: 1px solid #f1f5f9;
      margin: 24px 0 20px 0;
    }
    .footer {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="brand-badge">PMCKB WORKSPACE</div>
        <h1>You're Invited!</h1>
      </div>
      <div class="content">
        <p>Hello,</p>
        <p><strong>${safeInviter}</strong> has invited you to join their workspace on PMCKB:</p>
        
        <div class="team-card">
          <div class="team-name">${safeTeam}</div>
          <div class="team-role">Role: Member</div>
        </div>

        <p>PMCKB is a workspace for managing projects, tasks, meetings, calendar events and team knowledge.</p>

        <div class="cta-wrap">
          <a href="${safeUrl}" class="cta-button" target="_blank" rel="noopener noreferrer">Accept Invitation</a>
        </div>

        <div class="expiry">
          Invitation expires: <strong>${formattedExpires}</strong>
        </div>

        <div class="divider"></div>

        <p class="footer">
          If the button above does not work, copy and paste this link into your browser:<br>
          <a href="${safeUrl}" style="color: #4f46e5; word-break: break-all;">${safeUrl}</a>
        </p>

        <p class="footer" style="margin-top: 16px;">
          If you were not expecting this invitation, you can safely ignore this email.<br><br>
          Regards,<br>
          <strong>PMCKB Team</strong>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
Hello,

${inviterName || 'A team leader'} has invited you to join:

${teamName}

Role:
Member

PMCKB is a workspace for managing projects, tasks, meetings, calendar events and team knowledge.

Accept Invitation:
${safeUrl}

Invitation expires:
${formattedExpires}

If you were not expecting this invitation, you can safely ignore this email.

Regards,
PMCKB Team
    `.trim();

    return this.sendEmail({
      to,
      subject,
      html,
      text,
      invitationId,
    });
  },
};

module.exports = emailService;

import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: config.email.smtp.host,
    port: config.email.smtp.port,
    secure: config.email.smtp.secure,
    auth:
      config.email.smtp.user && config.email.smtp.pass
        ? { user: config.email.smtp.user, pass: config.email.smtp.pass }
        : undefined,
  });

  return transporter;
}

async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  try {
    const t = getTransporter();
    await t.sendMail({
      from: `"${config.email.fromName}" <${config.email.from}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    logger.info('Email sent', { to: options.to, subject: options.subject });
  } catch (err) {
    // Email failures are logged but never thrown — a failed notification must
    // not roll back the primary operation that triggered it.
    logger.error('Failed to send email', { to: options.to, error: err });
  }
}

// ── Shared header/footer markup ──────────────────────────────────────────────

function emailHeader(title: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
    <tr>
      <td style="background:#0d3b35;padding:28px 32px;">
        <p style="margin:0;color:#b8d8d5;font-size:11px;letter-spacing:2px;text-transform:uppercase;">NATGAS Uganda Limited</p>
        <h1 style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:700;">${title}</h1>
      </td>
    </tr>
    <tr><td style="padding:32px;">`;
}

function emailFooter(): string {
  return `
    </td></tr>
    <tr>
      <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
        <p style="margin:0;color:#9ca3af;font-size:11px;line-height:1.6;">
          NATGAS Uganda Limited &bull; Kawuku, Entebbe Road, Uganda<br>
          +256 740 938 040 &bull; info@natgasuganda.com
        </p>
      </td>
    </tr>
    </table>
    </td></tr>
    </table>
    </body>
    </html>`;
}

function actionButton(label: string, url: string): string {
  return `
    <div style="text-align:center;margin:28px 0;">
      <a href="${url}"
         style="display:inline-block;background:#0d3b35;color:#ffffff;padding:13px 32px;text-decoration:none;border-radius:6px;font-weight:700;font-size:14px;">
        ${label}
      </a>
    </div>`;
}

// ── Templates ────────────────────────────────────────────────────────────────

/**
 * Password reset email sent when a user requests a reset link.
 */
export async function sendPasswordReset(
  email: string,
  resetUrl: string,
  name: string,
): Promise<void> {
  const html =
    emailHeader('Reset your password') +
    `<p style="color:#374151;font-size:15px;">Hi ${name},</p>
     <p style="color:#6b7280;font-size:14px;line-height:1.7;">We received a request to reset the password for your NATGAS Uganda account. Click the button below to create a new password.</p>` +
    actionButton('Reset password', resetUrl) +
    `<p style="color:#9ca3af;font-size:13px;">This link expires in <strong>${config.auth.passwordResetExpiryHours} hours</strong>. If you did not request a reset, you can safely ignore this message.</p>
     <p style="color:#d1d5db;font-size:12px;word-break:break-all;">If the button does not work, paste this URL into your browser:<br>${resetUrl}</p>` +
    emailFooter();

  await sendMail({
    to: email,
    subject: 'Reset your NATGAS Uganda password',
    html,
    text: `Hi ${name},\n\nReset your password by visiting:\n${resetUrl}\n\nThis link expires in ${config.auth.passwordResetExpiryHours} hours.`,
  });
}

/**
 * Notification sent to the admin when a contact form submission arrives.
 */
export async function sendContactNotification(
  adminEmail: string,
  contactData: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  },
): Promise<void> {
  const rows = [
    ['Name', contactData.name],
    ['Email', `<a href="mailto:${contactData.email}" style="color:#0d3b35;">${contactData.email}</a>`],
    ...(contactData.phone ? [['Phone', contactData.phone]] : []),
    ['Subject', contactData.subject],
  ]
    .map(
      ([label, value], i) =>
        `<tr style="${i % 2 === 1 ? 'background:#f9fafb;' : ''}">
          <td style="padding:8px 12px;font-weight:600;color:#374151;white-space:nowrap;">${label}</td>
          <td style="padding:8px 12px;color:#4b5563;">${value}</td>
        </tr>`,
    )
    .join('');

  const html =
    emailHeader('New contact message') +
    `<p style="color:#6b7280;font-size:14px;margin-bottom:16px;">A new message was submitted via the website contact form.</p>
     <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;border-collapse:collapse;margin-bottom:20px;">
       ${rows}
     </table>
     <div style="background:#f9fafb;border-left:4px solid #0d3b35;padding:16px;border-radius:0 4px 4px 0;">
       <p style="margin:0 0 8px;font-weight:600;color:#374151;">Message</p>
       <p style="margin:0;color:#4b5563;font-size:14px;white-space:pre-wrap;">${contactData.message}</p>
     </div>` +
    emailFooter();

  await sendMail({
    to: adminEmail,
    subject: `New contact: ${contactData.subject} — from ${contactData.name}`,
    html,
    text: `New contact from ${contactData.name} (${contactData.email})\nSubject: ${contactData.subject}\n\n${contactData.message}`,
  });
}

/**
 * Confirmation sent to an applicant after submitting a job application.
 */
export async function sendJobApplicationConfirmation(
  applicantEmail: string,
  jobTitle: string,
  applicantName: string,
): Promise<void> {
  const html =
    emailHeader('Application received') +
    `<p style="color:#374151;font-size:15px;">Dear ${applicantName},</p>
     <p style="color:#6b7280;font-size:14px;line-height:1.7;">Thank you for applying for the <strong>${jobTitle}</strong> position at NATGAS Uganda Limited.</p>
     <p style="color:#6b7280;font-size:14px;line-height:1.7;">We have received your application and our HR team will review it. We will be in touch if your profile matches our requirements.</p>
     <p style="color:#6b7280;font-size:14px;margin-top:24px;">Best regards,<br><strong>NATGAS Uganda HR Team</strong></p>` +
    emailFooter();

  await sendMail({
    to: applicantEmail,
    subject: `Application received — ${jobTitle} | NATGAS Uganda`,
    html,
    text: `Dear ${applicantName},\n\nThank you for applying for ${jobTitle} at NATGAS Uganda.\nWe will be in touch if your profile matches our requirements.\n\nNATGAS Uganda HR Team`,
  });
}

/**
 * Welcome email for admin-created staff accounts. Includes a temporary
 * password when one was auto-generated (mustChangePassword will be true).
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  temporaryPassword?: string,
): Promise<void> {
  // Customer accounts sign in via /account; staff use /admin/login
  const isStaff = Boolean(temporaryPassword);
  const loginUrl = isStaff
    ? `${config.client.url}/admin/login`
    : `${config.client.url}/account`;

  const passwordSection = temporaryPassword
    ? `<div style="margin:20px 0;padding:16px;background:#f0faf8;border:1px solid #a7d4cf;border-radius:6px;">
         <p style="margin:0 0 6px;font-weight:600;color:#0d3b35;">Temporary password</p>
         <code style="background:#fff;border:1px solid #d1d5db;padding:6px 12px;border-radius:4px;font-size:15px;display:inline-block;">${temporaryPassword}</code>
         <p style="margin:10px 0 0;font-size:12px;color:#6b7280;">You will be asked to change this on first sign-in.</p>
       </div>`
    : '';

  const html =
    emailHeader('Welcome to NATGAS Uganda') +
    `<p style="color:#374151;font-size:15px;">Hi ${name},</p>
     <p style="color:#6b7280;font-size:14px;line-height:1.7;">Your account has been created on the NATGAS Uganda platform.</p>
     ${passwordSection}` +
    actionButton('Sign in to your account', loginUrl) +
    `<p style="color:#9ca3af;font-size:13px;">If you did not expect this email, please contact our team immediately.</p>` +
    emailFooter();

  await sendMail({
    to: email,
    subject: 'Welcome to NATGAS Uganda',
    html,
    text: `Hi ${name},\n\nYour account has been created.\n${temporaryPassword ? `Temporary password: ${temporaryPassword}\n` : ''}Sign in at: ${loginUrl}`,
  });
}

/**
 * HR/admin alert sent to NOTIFY_EMAIL when a new job application arrives.
 * Gives HR immediate visibility so they can act without checking the dashboard.
 */
export async function sendJobApplicationAdminNotification(
  jobTitle: string,
  applicantName: string,
  applicantEmail: string,
  applicantPhone: string | undefined,
  coverLetterSnippet: string | undefined,
  cvUrl: string | undefined,
  adminUrl: string,
): Promise<void> {
  const rows = [
    ['Applicant', applicantName],
    ['Email', `<a href="mailto:${applicantEmail}" style="color:#0d3b35;">${applicantEmail}</a>`],
    ...(applicantPhone ? [['Phone', `<a href="tel:${applicantPhone}" style="color:#0d3b35;">${applicantPhone}</a>`]] : []),
    ['Position', `<strong>${jobTitle}</strong>`],
    ['Applied at', new Date().toLocaleString('en-UG', { dateStyle: 'full', timeStyle: 'short' })],
  ]
    .map(
      ([label, value], i) =>
        `<tr style="${i % 2 === 1 ? 'background:#f9fafb;' : ''}">
          <td style="padding:9px 14px;font-weight:600;color:#374151;white-space:nowrap;width:120px;">${label}</td>
          <td style="padding:9px 14px;color:#4b5563;">${value}</td>
        </tr>`,
    )
    .join('');

  const coverSection = coverLetterSnippet
    ? `<div style="margin-top:18px;background:#f9fafb;border-left:4px solid #0d3b35;padding:14px 16px;border-radius:0 4px 4px 0;">
         <p style="margin:0 0 6px;font-weight:600;color:#374151;font-size:13px;">Cover letter excerpt</p>
         <p style="margin:0;color:#4b5563;font-size:13px;line-height:1.65;">${coverLetterSnippet.slice(0, 400)}${coverLetterSnippet.length > 400 ? '…' : ''}</p>
       </div>`
    : '';

  const cvSection = cvUrl
    ? `<div style="margin-top:14px;">
         <a href="${cvUrl}" style="display:inline-block;background:#f3f4f6;color:#374151;padding:9px 18px;text-decoration:none;border-radius:6px;font-weight:600;font-size:13px;border:1px solid #e5e7eb;">
           📄 Download CV / Resume
         </a>
       </div>`
    : '';

  const html =
    emailHeader(`New job application — ${jobTitle}`) +
    `<p style="color:#6b7280;font-size:14px;margin-bottom:16px;">
       A new application has been submitted via the NATGAS Uganda careers page.
       Review and respond via the admin dashboard.
     </p>
     <table width="100%" cellpadding="0" cellspacing="0"
       style="border:1px solid #e5e7eb;border-radius:6px;border-collapse:collapse;margin-bottom:4px;">
       ${rows}
     </table>
     ${coverSection}
     ${cvSection}` +
    actionButton('Review application in dashboard', adminUrl) +
    emailFooter();

  await sendMail({
    to: config.email.notifyEmail,
    subject: `New application: ${jobTitle} — ${applicantName}`,
    html,
    text: `New job application received\n\nPosition: ${jobTitle}\nApplicant: ${applicantName} (${applicantEmail})\n${applicantPhone ? `Phone: ${applicantPhone}\n` : ''}${coverLetterSnippet ? `\nCover letter:\n${coverLetterSnippet.slice(0, 400)}\n` : ''}\nReview at: ${adminUrl}`,
  });
}

/**
 * Notification sent to NOTIFY_EMAIL when a new customer order is submitted.
 */
export async function sendNewOrderNotification(
  orderNumber: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  items: Array<{ productName: string; quantity: number }>,
  deliveryAddress: string,
  district: string,
  deliveryMethod: string,
  adminUrl: string,
): Promise<void> {
  const itemsHtml = items
    .map(
      (item, i) =>
        `<tr style="${i % 2 === 1 ? 'background:#f9fafb;' : ''}">
          <td style="padding:8px 14px;color:#4b5563;">${item.quantity} ×</td>
          <td style="padding:8px 14px;color:#374151;font-weight:600;">${item.productName}</td>
        </tr>`,
    )
    .join('');

  const html =
    emailHeader(`New order — ${orderNumber}`) +
    `<p style="color:#6b7280;font-size:14px;margin-bottom:16px;">
       A new LPG order request has been placed and is awaiting confirmation.
     </p>
     <table width="100%" cellpadding="0" cellspacing="0"
       style="border:1px solid #e5e7eb;border-radius:6px;border-collapse:collapse;margin-bottom:16px;">
       <tr><td style="padding:9px 14px;font-weight:600;color:#374151;width:120px;">Customer</td><td style="padding:9px 14px;color:#4b5563;">${customerName}</td></tr>
       <tr style="background:#f9fafb;"><td style="padding:9px 14px;font-weight:600;color:#374151;">Email</td><td style="padding:9px 14px;color:#4b5563;"><a href="mailto:${customerEmail}" style="color:#0d3b35;">${customerEmail}</a></td></tr>
       <tr><td style="padding:9px 14px;font-weight:600;color:#374151;">Phone</td><td style="padding:9px 14px;color:#4b5563;"><a href="tel:${customerPhone}" style="color:#0d3b35;">${customerPhone}</a></td></tr>
       <tr style="background:#f9fafb;"><td style="padding:9px 14px;font-weight:600;color:#374151;">Delivery</td><td style="padding:9px 14px;color:#4b5563;">${deliveryMethod === 'PICKUP' ? 'Outlet collection' : 'Home / business delivery'}<br><span style="color:#6b7280;">${deliveryAddress}, ${district}</span></td></tr>
     </table>
     <p style="font-weight:600;color:#374151;margin-bottom:8px;">Items ordered</p>
     <table width="100%" cellpadding="0" cellspacing="0"
       style="border:1px solid #e5e7eb;border-radius:6px;border-collapse:collapse;margin-bottom:4px;">
       ${itemsHtml}
     </table>` +
    actionButton('Manage order in dashboard', adminUrl) +
    emailFooter();

  await sendMail({
    to: config.email.notifyEmail,
    subject: `New order ${orderNumber} — ${customerName}`,
    html,
    text: `New order: ${orderNumber}\nCustomer: ${customerName} (${customerEmail} / ${customerPhone})\nDelivery: ${deliveryMethod} — ${deliveryAddress}, ${district}\nItems:\n${items.map(i => `  ${i.quantity} × ${i.productName}`).join('\n')}\n\nManage at: ${adminUrl}`,
  });
}

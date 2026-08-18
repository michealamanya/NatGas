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
        ? {
            user: config.email.smtp.user,
            pass: config.email.smtp.pass,
          }
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
    logger.error('Failed to send email', { to: options.to, error: err });
    // Don't throw — email failures should not crash the request
  }
}

// ==================== EMAIL TEMPLATES ====================

/**
 * Send a password reset email.
 */
export async function sendPasswordReset(
  email: string,
  resetUrl: string,
  name: string,
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #f97316; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">NATGAS Uganda</h1>
      </div>
      <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
        <h2>Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p>This link expires in <strong>${config.auth.passwordResetExpiryHours} hours</strong>.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          If the button doesn't work, copy and paste this URL: <br>
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
      </div>
    </body>
    </html>
  `;

  await sendMail({
    to: email,
    subject: 'Reset Your NATGAS Uganda Password',
    html,
    text: `Hello ${name},\n\nReset your password by visiting: ${resetUrl}\n\nThis link expires in ${config.auth.passwordResetExpiryHours} hours.`,
  });
}

/**
 * Send contact form notification to admin.
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
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #f97316; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">New Contact Message</h1>
      </div>
      <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #374151;">Name:</td>
            <td style="padding: 8px;">${contactData.name}</td>
          </tr>
          <tr style="background: #f9fafb;">
            <td style="padding: 8px; font-weight: bold; color: #374151;">Email:</td>
            <td style="padding: 8px;"><a href="mailto:${contactData.email}">${contactData.email}</a></td>
          </tr>
          ${contactData.phone ? `
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #374151;">Phone:</td>
            <td style="padding: 8px;">${contactData.phone}</td>
          </tr>` : ''}
          <tr style="background: #f9fafb;">
            <td style="padding: 8px; font-weight: bold; color: #374151;">Subject:</td>
            <td style="padding: 8px;">${contactData.subject}</td>
          </tr>
        </table>
        <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 6px; border-left: 4px solid #f97316;">
          <strong>Message:</strong>
          <p style="margin-top: 8px; white-space: pre-wrap;">${contactData.message}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendMail({
    to: adminEmail,
    subject: `New Contact: ${contactData.subject} - from ${contactData.name}`,
    html,
    text: `New contact from ${contactData.name} (${contactData.email}):\nSubject: ${contactData.subject}\n\n${contactData.message}`,
  });
}

/**
 * Send job application confirmation to the applicant.
 */
export async function sendJobApplicationConfirmation(
  applicantEmail: string,
  jobTitle: string,
  applicantName: string,
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #f97316; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">NATGAS Uganda</h1>
      </div>
      <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
        <h2>Application Received</h2>
        <p>Dear ${applicantName},</p>
        <p>Thank you for applying for the <strong>${jobTitle}</strong> position at NATGAS Uganda Limited.</p>
        <p>We have successfully received your application and our HR team will review it shortly.</p>
        <p>We will contact you if your profile matches our requirements.</p>
        <p>Best regards,<br><strong>NATGAS Uganda HR Team</strong></p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">NATGAS Uganda Limited | Kampala, Uganda</p>
      </div>
    </body>
    </html>
  `;

  await sendMail({
    to: applicantEmail,
    subject: `Application Received – ${jobTitle} | NATGAS Uganda`,
    html,
    text: `Dear ${applicantName},\n\nThank you for applying for ${jobTitle} at NATGAS Uganda.\nWe will be in touch soon.\n\nNATGAS Uganda HR Team`,
  });
}

/**
 * Send a welcome email (with optional temporary password for admin-created accounts).
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  temporaryPassword?: string,
): Promise<void> {
  const loginUrl = `${config.client.url}/login`;

  const passwordSection = temporaryPassword
    ? `<div style="margin: 20px 0; padding: 16px; background: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
         <p><strong>Temporary Password:</strong> <code style="background: #fff; padding: 4px 8px; border-radius: 4px;">${temporaryPassword}</code></p>
         <p style="margin-bottom: 0; font-size: 13px;">Please change your password after first login.</p>
       </div>`
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #f97316; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">Welcome to NATGAS Uganda</h1>
      </div>
      <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
        <h2>Hello, ${name}!</h2>
        <p>Your account has been created on the NATGAS Uganda management portal.</p>
        ${passwordSection}
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}"
             style="background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Login to Portal
          </a>
        </div>
        <p>Best regards,<br><strong>NATGAS Uganda Team</strong></p>
      </div>
    </body>
    </html>
  `;

  await sendMail({
    to: email,
    subject: 'Welcome to NATGAS Uganda Portal',
    html,
    text: `Hello ${name},\n\nYour account has been created.\n${temporaryPassword ? `Temporary password: ${temporaryPassword}\n` : ''}Login at: ${loginUrl}`,
  });
}

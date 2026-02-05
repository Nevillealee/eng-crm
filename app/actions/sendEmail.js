'use server';

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: process.env.GMAIL_USERNAME,
    pass: process.env.GMAIL_PASSWORD,
  },
});

function buildVerificationEmail({ name, verificationUrl, to }) {
  const subject = 'Verify your ENG CRM email';
  const greeting = name ? `Hi ${name},` : 'Hi there,';
  const text = `${greeting}\n\nPlease verify your email address by clicking the link below:\n${verificationUrl}\n\nIf you did not create an account, you can ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <p>${greeting}</p>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>If you did not create an account, you can ignore this email.</p>
    </div>
  `;

  return { to, subject, text, html };
}

export async function sendEmail(input) {
  const payload = input?.get
    ? {
      type: 'contact',
      name: input.get('name'),
      email: input.get('email'),
      message: input.get('message'),
    }
    : input;

  try {
    if (payload?.type === 'verify-email') {
      const { to, subject, text, html } = buildVerificationEmail(payload);
      await transporter.sendMail({
        from: process.env.GMAIL_USERNAME,
        to,
        subject,
        text,
        html,
      });
      return { success: true, message: 'Verification email sent.' };
    }

    const name = payload?.name;
    const email = payload?.email;
    const message = payload?.message;

    await transporter.sendMail({
      from: process.env.GMAIL_USERNAME,
      to: process.env.SUPPORT_EMAIL || 'recipient@example.com',
      subject: `New message from ${name}`,
      text: message,
      replyTo: email,
    });
    return { success: true, message: 'Email sent successfully!' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Failed to send email.' };
  }
}
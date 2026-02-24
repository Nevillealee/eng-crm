'use server';

/**
 * Sends an email using the SMTP2GO REST API.
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject
 * @param {string} params.text - Plain text body
 * @param {string} params.html - HTML body
 */
async function sendSmtp2GoEmail({ to, subject, text, html }) {
  const apiKey = process.env.SMTP2GO_API_KEY;
  const sender = process.env.EMAIL_SENDER || 'info@devcombine.com';

  if (!apiKey) {
    throw new Error('SMTP2GO_API_KEY is not configured.');
  }

  const payload = {
    to: [to],
    sender: sender,
    subject: subject,
    text_body: text,
    html_body: html,
  };

  const response = await fetch('https://api.smtp2go.com/v3/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Smtp2go-Api-Key': apiKey,
      'accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Email error: ${response.status} - ${JSON.stringify(errorData)}`);
  }
  console.log("Email sent successfully to:", to);
  console.log("response status:", response.status);
  return response.json();
}

export async function sendVerificationEmail({ name, verificationUrl, to }) {
  const subject = 'Verify your Devcombine Engineering Portal email';
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

  await sendSmtp2GoEmail({
    to,
    subject,
    text,
    html,
  });

  return { success: true, message: 'Verification email sent.' };
}

export async function sendForgotPasswordEmail({ name, resetUrl, to }) {
  const subject = 'Reset your Devcombine Engineering Portal password';
  const greeting = name ? `Hi ${name},` : 'Hi there,';
  const text = `${greeting}\n\nSomeone has requested a link to change your password. You can do this through the link below:\n${resetUrl}\n\nIf you didn't request this, please ignore this email.\nYour password won't change until you access the link above and create a new one.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <p>${greeting}</p>
      <p>Someone has requested a link to change your password. You can do this through the link below:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Your password won't change until you access the link above and create a new one.</p>
    </div>
  `;

  await sendSmtp2GoEmail({
    to,
    subject,
    text,
    html,
  });

  return { success: true, message: 'Password reset email sent.' };
}

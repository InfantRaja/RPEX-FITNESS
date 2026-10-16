import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetUrl: string
): Promise<void> => {
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'placeholder@gmail.com') {
    console.log(`[Email Service] Password reset URL for ${email}: ${resetUrl}`);
    throw new Error('Email service not configured. Please set EMAIL_USER and EMAIL_PASS in .env');
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || `REPX Tracker <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset Your REPX Tracker Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #0B0D0F;">
          <div style="max-width: 600px; margin: 40px auto; background-color: #15191D; border-radius: 16px; overflow: hidden; border: 1px solid #20252A;">
            <div style="background: linear-gradient(135deg, #B8FF3B, #7BC70F); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #0B0D0F; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">REPX Tracker</h1>
              <p style="margin: 8px 0 0; color: #0B0D0F; opacity: 0.8; font-size: 14px;">Track Every Rep. Build Your Best.</p>
            </div>
            <div style="padding: 40px;">
              <h2 style="color: #F5F7FA; margin-top: 0;">Hi ${name}! 👋</h2>
              <p style="color: #9AA4AF; line-height: 1.6;">We received a request to reset your password. Click the button below to create a new password. This link expires in 10 minutes.</p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" style="background: linear-gradient(135deg, #B8FF3B, #7BC70F); color: #0B0D0F; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block;">
                  Reset My Password
                </a>
              </div>
              <p style="color: #9AA4AF; font-size: 13px; line-height: 1.6;">If you didn't request this, you can safely ignore this email. Your password will remain unchanged.</p>
              <hr style="border: none; border-top: 1px solid #20252A; margin: 24px 0;">
              <p style="color: #9AA4AF; font-size: 12px;">Or copy this link: <a href="${resetUrl}" style="color: #B8FF3B;">${resetUrl}</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

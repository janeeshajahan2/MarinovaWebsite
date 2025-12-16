import nodemailer, { Transporter } from 'nodemailer';
import { EmailServiceResponse } from '../types';

// Create email transporter
const createTransporter = (): Transporter => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send verification email
export const sendVerificationEmail = async (
  to: string,
  fullName: string,
  verificationToken: string
): Promise<EmailServiceResponse> => {
  try {
    const transporter = createTransporter();

    // Get the base URL from environment or use default
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationLink = `${baseUrl}/verify/${verificationToken}`;

    const mailOptions = {
      from: {
        name: 'Marinova',
        address: process.env.EMAIL_USER
      },
      to,
      subject: 'Verify Your Email - Marinova Ocean Intelligence',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #0ea5e9; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌊 Welcome to Marinova!</h1>
            </div>
            <div class="content">
              <p>Hi ${fullName},</p>
              <p>Thank you for signing up! We're excited to have you join our ocean intelligence platform.</p>
              <p>To get started and unlock your <strong>3 free credits</strong>, please verify your email address by clicking the button below:</p>
              <p style="text-align: center;">
                <a href="${verificationLink}" class="button">Verify Email Address</a>
              </p>
              <p style="font-size: 14px; color: #64748b;">Or copy and paste this link in your browser:</p>
              <p style="font-size: 12px; word-break: break-all; background: white; padding: 10px; border-radius: 5px;">
                ${verificationLink}
              </p>
              <p><strong>What you get after verification:</strong></p>
              <ul>
                <li>✅ 3 free uses of Forecast and Insights features</li>
                <li>✅ Access to real-time ocean data</li>
                <li>✅ AI-powered weather analysis</li>
              </ul>
              <p>If you didn't create this account, you can safely ignore this email.</p>
              <div class="footer">
                <p>© 2025 Marinova - Ocean Intelligence Platform</p>
                <p>This is an automated email, please do not reply.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hi ${fullName},
        
        Thank you for signing up for Marinova!
        
        Please verify your email address by clicking this link:
        ${verificationLink}
        
        After verification, you'll get 3 free credits to use our Forecast and Insights features.
        
        If you didn't create this account, you can safely ignore this email.
        
        © 2025 Marinova - Ocean Intelligence Platform
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Email sending failed:', error);
    return { success: false, error: errorMessage };
  }
};

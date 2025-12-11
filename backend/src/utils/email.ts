import nodemailer from 'nodemailer';

// Configure this in your .env file
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({
      from: '"Vet Nexus Pro" <noreply@vetnexuspro.com>',
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};
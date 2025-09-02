import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET() {
  const requiredBrevoVars = [
    'BREVO_SMTP_HOST',
    'BREVO_SMTP_PORT', 
    'BREVO_SMTP_USER',
    'BREVO_SMTP_PASS'
  ] as const;

  const requiredWhatsAppVars = [
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_TEMPLATE_NAME'
  ] as const;

  const missingBrevoVars = requiredBrevoVars.filter(v => !process.env[v]);
  const missingWhatsAppVars = requiredWhatsAppVars.filter(v => !process.env[v]);

  const config = {
    email: {
      configured: missingBrevoVars.length === 0,
      missing_vars: missingBrevoVars,
      has_email_sender: !!process.env.EMAIL_SENDER,
      smtp_connection: null as boolean | null
    },
    whatsapp: {
      configured: missingWhatsAppVars.length === 0,
      missing_vars: missingWhatsAppVars
    },
    general: {
      app_url: process.env.NEXT_PUBLIC_APP_URL || 'not_set',
      environment: process.env.NODE_ENV || 'development'
    }
  };

  // Test SMTP connection if configured
  if (config.email.configured) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.BREVO_SMTP_HOST,
        port: parseInt(process.env.BREVO_SMTP_PORT as string, 10),
        secure: parseInt(process.env.BREVO_SMTP_PORT as string, 10) === 465,
        auth: {
          user: process.env.BREVO_SMTP_USER,
          pass: process.env.BREVO_SMTP_PASS,
        },
      });
      
      await transporter.verify();
      config.email.smtp_connection = true;
    } catch (error) {
      config.email.smtp_connection = false;
    }
  }

  return NextResponse.json(config);
}

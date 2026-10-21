/**
 * **************************************************************************
 * MÓDULO: mailer
 * DESCRIPCIÓN: Envía correos (recordatorios de cita) si hay un servidor SMTP
 *              configurado. Sin SMTP_HOST no envía nada y Activa sigue
 *              funcionando: el aviso queda dentro de la app del paciente.
 *
 * Opciones gratis y sin tarjeta: Brevo (300 correos al día) o una cuenta de
 * Gmail con "contraseña de aplicación". Ver DESPLIEGUE.md.
 * **************************************************************************
 */

import nodemailer, { Transporter } from "nodemailer";

let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  transporter = SMTP_HOST
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: Number(SMTP_PORT) === 465,
        auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
      })
    : null;
  return transporter;
}

export function mailEnabled(): boolean {
  return getTransporter() !== null;
}

/** Devuelve true si se envió. Nunca lanza: un correo fallido no debe tumbar nada. */
export async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  const t = getTransporter();
  if (!t || !to) return false;
  try {
    await t.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, text });
    return true;
  } catch (error: any) {
    console.error("No se pudo enviar el correo:", error?.message || error);
    return false;
  }
}

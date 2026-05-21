import nodemailer from 'nodemailer';

export interface EmailPayload {
  to: string;
  unit: string;
  kelompok: string;
  files: Array<{ name: string; url: string; size: number; source: string }>;
  submissionId: string;
  createdAt: string;
}

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASSWORD;
const smtpFrom = process.env.SMTP_FROM || 'noreply@onedriveform.local';

const isConfigured = !!(smtpHost && smtpUser && smtpPass);

/**
 * Mengirim email notifikasi tanda terima kepada pengisi form.
 * Jika konfigurasi SMTP kosong, akan dilakukan simulasi ke console.
 */
export async function sendNotificationEmail(payload: EmailPayload): Promise<{ success: boolean; simulated: boolean; info?: string }> {
  const formattedDate = new Date(payload.createdAt).toLocaleString('id-ID', {
    dateStyle: 'long',
    timeStyle: 'medium',
  });

  const filesHtml = payload.files
    .map(
      (file) => `
    <li style="margin-bottom: 8px; font-size: 14px; color: #4b5563;">
      <strong>${file.name}</strong> (${(file.size / (1024 * 1024)).toFixed(2)} MB)
      <br />
      <a href="${file.url.startsWith('/') ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${file.url}` : file.url}" 
         target="_blank" 
         style="color: #7c3aed; text-decoration: none; font-weight: 600;">
         Buka File &rarr;
      </a>
    </li>`
    )
    .join('');

  const emailHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%); padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Tanda Terima Pengisian Form</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.85; font-size: 14px;">Dokumen Anda telah terkirim</p>
      </div>
      
      <!-- Body -->
      <div style="padding: 30px; background-color: #ffffff;">
        <p style="font-size: 16px; color: #1f2937; margin-bottom: 24px;">Salam,</p>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
          Terima kasih telah mengisi formulir. Kami informasikan bahwa data pengisian Anda telah berhasil direkam dan file lampiran telah disimpan.
        </p>
        
        <!-- Summary Box -->
        <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 15px; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Rincian Pengisian</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #6b7280; width: 35%;">ID Transaksi</td>
              <td style="padding: 6px 0; color: #111827; font-weight: 600;">#${payload.submissionId}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Waktu Pengisian</td>
              <td style="padding: 6px 0; color: #111827; font-weight: 600;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Email Pengisi</td>
              <td style="padding: 6px 0; color: #111827; font-weight: 600;">${payload.to}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Unit Kerja</td>
              <td style="padding: 6px 0; color: #111827; font-weight: 600;">${payload.unit}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Kelompok Kerja</td>
              <td style="padding: 6px 0; color: #111827; font-weight: 600;">${payload.kelompok}</td>
            </tr>
          </table>
        </div>
        
        <!-- Uploaded Files -->
        <div style="margin-bottom: 24px;">
          <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 15px; color: #111827;">Lampiran Dokumen (${payload.files.length}):</h3>
          <ul style="margin: 0; padding-left: 20px;">
            ${filesHtml}
          </ul>
        </div>
        
        <p style="font-size: 13px; color: #9ca3af; margin-top: 32px; border-top: 1px solid #f3f4f6; padding-top: 16px; text-align: center;">
          Ini adalah email konfirmasi otomatis, mohon tidak membalas email ini.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
        &copy; 2026 Bidang Anggaran. All Rights Reserved.
      </div>
    </div>
  `;

  if (!isConfigured) {
    console.log('🤖 [Email Simulation] Mengirim email notifikasi ke:', payload.to);
    console.log('Subjek: Status Pengisian Form');
    console.log(`Penerima: ${payload.to}, Unit: ${payload.unit}, Kelompok: ${payload.kelompok}`);
    console.log(`Jumlah File: ${payload.files.length}`);
    
    return {
      success: true,
      simulated: true,
      info: 'Simulated email output in console logs.'
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    console.log(`✉️ Mengirim email tanda terima asli ke ${payload.to}...`);
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Administrasi Verifikasi UGM'}" <${smtpFrom}>`,
      to: payload.to,
      subject: `Status Pengisian Form`,
      html: emailHtml,
    });

    console.log('✅ Email berhasil dikirim:', info.messageId);
    return {
      success: true,
      simulated: false,
      info: info.messageId,
    };
  } catch (error: any) {
    console.error('❌ Gagal mengirim email via SMTP:', error.message);
    // Masih kembalikan sukses: false namun biarkan sistem berjalan
    return {
      success: false,
      simulated: false,
      info: error.message,
    };
  }
}

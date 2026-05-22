import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2, R2UploadResult } from '@/lib/r2';
import { saveSubmission } from '@/lib/db';
import { sendNotificationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    const email = formData.get('email') as string;
    const unit = formData.get('unit') as string;
    const pic = formData.get('pic') as string; // Menggunakan 'pic' sebagai ganti 'kelompok'
    const tahun = formData.get('tahun') as string;
    const periode = formData.get('periode') as string;
    const files = formData.getAll('files') as File[];

    // Validasi input wajib
    if (!email || !unit || !pic) {
      return NextResponse.json(
        { success: false, error: 'Email, Unit, dan PIC wajib diisi!' },
        { status: 400 }
      );
    }

    if (!files || files.length === 0 || (files.length === 1 && files[0].size === 0)) {
      return NextResponse.json(
        { success: false, error: 'Minimal harus mengunggah 1 file!' },
        { status: 400 }
      );
    }

    console.log(`📥 Menerima pengisian dari: ${email}. Unit: ${unit}, PIC: ${pic}. Jumlah file: ${files.length}`);

    const uploadedFiles: R2UploadResult[] = [];
    const uploadErrors: string[] = [];

    // 1. Upload semua file ke Cloudflare R2
    for (const file of files) {
      if (file.size === 0) continue;
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const uploadResult = await uploadToR2(
          buffer,
          file.name,
          file.type,
          file.size
        );
        
        uploadedFiles.push(uploadResult);
      } catch (err: any) {
        console.error(`Gagal mengunggah file ${file.name} ke R2:`, err.message);
        uploadErrors.push(`${file.name}: ${err.message}`);
      }
    }

    // Jika semua file gagal diupload, batalkan transaksi
    if (uploadedFiles.length === 0 && files.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Gagal mengunggah semua file lampiran.', 
          details: uploadErrors 
        },
        { status: 500 }
      );
    }

    // 2. Simpan data submission ke database (Supabase atau JSON lokal)
    const dbResult = await saveSubmission({
      email,
      unit,
      pic, // Kolom pic di database
      tahun: parseInt(tahun || '2026', 10),
      periode: parseInt(periode || '2', 10),
      files: uploadedFiles,
    });

    // 3. Kirim email notifikasi (SMTP asli atau simulasi console)
    const emailResult = await sendNotificationEmail({
      to: email,
      unit,
      kelompok: pic, // Di email tetap dipetakan ke label PIC/kelompok
      files: uploadedFiles,
      submissionId: dbResult.data.id,
      createdAt: dbResult.data.createdAt,
    });

    // Ringkasan status integrasi (apakah simulasi atau asli)
    const r2Simulated = uploadedFiles.some(f => f.source !== 'cloudflare_r2');

    return NextResponse.json({
      success: true,
      message: 'Formulir berhasil dikirim!',
      data: dbResult.data,
      statusInfo: {
        database: dbResult.simulated ? 'Simulasi (Disimpan ke file JSON lokal)' : 'Aktif (Disimpan ke Supabase)',
        storage: r2Simulated ? 'Simulasi (Disimpan di folder public/uploads)' : 'Aktif (Telah diunggah ke Cloudflare R2)',
        email: emailResult.simulated 
          ? 'Simulasi (Detail email dicetak di console server)' 
          : (emailResult.success ? 'Aktif (Email tanda terima berhasil dikirim)' : `Error SMTP: ${emailResult.info}`),
      }
    });

  } catch (error: any) {
    console.error('❌ Gagal memproses submit form:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem: ' + error.message },
      { status: 500 }
    );
  }
}

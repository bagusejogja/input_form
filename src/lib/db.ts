import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Tipe Data untuk Form Submission
export interface Submission {
  id: string;
  email: string;
  unit: string;
  pic: string; // PIC yang berasosiasi dengan unit
  files: Array<{ name: string; size: number; url: string; source: string }>;
  createdAt: string;
}

// Master Data Unit & PIC (Fallback jika Supabase tidak digunakan/kosong)
export const MASTER_UNITS = [
  {
    id: 'unit-1',
    nama: 'Majelis Wali Amanat',
    pic: 'Bagus Sri Widodo'
  },
  {
    id: 'unit-2',
    nama: 'Dewan Guru Besar',
    pic: 'Bambang Indarto'
  },
  {
    id: 'unit-3',
    nama: 'Direktorat Keuangan',
    pic: 'Budi Santoso'
  },
  {
    id: 'unit-4',
    nama: 'Fakultas Teknik',
    pic: 'Rudi Hermawan'
  },
  {
    id: 'unit-5',
    nama: 'Direktorat Sumber Daya Manusia',
    pic: 'Siti Aminah'
  }
];

// Inisialisasi Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const useSupabase = !!(supabaseUrl && supabaseAnonKey);

export const supabase = useSupabase ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Mengambil Daftar Unit & PIC (dari tabel gov_units)
export async function getUnits() {
  if (useSupabase && supabase) {
    try {
      console.log('🔍 Mengambil data dari tabel gov_units Supabase...');
      // Mengambil kolom nama_unit, pic dari tabel gov_units yang aktif
      const { data, error } = await supabase
        .from('gov_units')
        .select('id, nama_unit, pic')
        .eq('is_active', true);
      
      if (!error && data && data.length > 0) {
        console.log(`✅ Berhasil mengambil ${data.length} unit dari Supabase.`);
        // Ubah ke format UnitOption yang dibutuhkan frontend
        return data.map((row: any) => ({
          id: `gov-unit-${row.id}`,
          nama: row.nama_unit, // Menggunakan nama_unit dari DB
          pic: row.pic // Menggunakan pic dari DB
        }));
      }
      console.log('⚠️ Supabase gov_units kosong/error, menggunakan data Master Unit statis:', error?.message);
    } catch (e) {
      console.error('Failed to fetch from Supabase:', e);
    }
  }
  return MASTER_UNITS;
}

// Menyimpan Hasil Submit Form
export async function saveSubmission(submission: Omit<Submission, 'id' | 'createdAt'>): Promise<{ success: boolean; data: Submission; simulated: boolean }> {
  const newSubmission: Submission = {
    id: `sub_${Math.random().toString(36).substring(2, 11)}`,
    ...submission,
    createdAt: new Date().toISOString()
  };

  let savedToSupabase = false;

  if (useSupabase && supabase) {
    try {
      const { error } = await supabase
        .from('form_submissions')
        .insert({
          id: newSubmission.id,
          email: newSubmission.email,
          unit: newSubmission.unit,
          pic: newSubmission.pic, // Kolom pic di database
          files: newSubmission.files,
          created_at: newSubmission.createdAt
        });
      
      if (!error) {
        savedToSupabase = true;
      } else {
        console.error('❌ Supabase insert error:', error.message);
      }
    } catch (e) {
      console.error('Failed to save to Supabase:', e);
    }
  }

  // Simpan juga ke file JSON lokal sebagai fallback
  try {
    const dataDir = path.join(process.cwd(), 'src', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const filePath = path.join(dataDir, 'submissions.json');
    let currentSubmissions: Submission[] = [];
    
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf-8');
      try {
        currentSubmissions = JSON.parse(fileData);
      } catch (err) {
        currentSubmissions = [];
      }
    }
    
    currentSubmissions.push(newSubmission);
    fs.writeFileSync(filePath, JSON.stringify(currentSubmissions, null, 2), 'utf-8');
  } catch (err) {
    console.error('❌ Gagal menyimpan ke JSON lokal:', err);
  }

  return {
    success: true,
    data: newSubmission,
    simulated: !savedToSupabase
  };
}

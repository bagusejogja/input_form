import fs from 'fs';
import path from 'path';

export interface OneDriveUploadResult {
  name: string;
  size: number;
  url: string;
  source: 'onedrive' | 'onedrive_simulated';
}

const clientId = process.env.MICROSOFT_CLIENT_ID;
const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
const tenantId = process.env.MICROSOFT_TENANT_ID;
const driveId = process.env.ONEDRIVE_DRIVE_ID; // Support optional target Drive ID (e.g. Teams/SharePoint)
const folderId = process.env.ONEDRIVE_FOLDER_ID; // Opsional: ID folder spesifik di OneDrive

const isConfigured = !!(clientId && clientSecret && tenantId);
const tokenPath = path.join(process.cwd(), 'src', 'data', 'token.json');

/**
 * Mendapatkan Access Token dari Microsoft Graph API menggunakan Refresh Token yang disimpan.
 * Ini menghindari perlunya persetujuan admin global tenant karena bertindak atas nama pengguna (Delegated).
 */
async function getAccessTokenFromRefreshToken(): Promise<string> {
  if (!fs.existsSync(tokenPath)) {
    throw new Error('Refresh token belum ditemukan. Silakan hubungkan akun OneDrive Anda terlebih dahulu lewat /api/auth/login');
  }

  const { refresh_token } = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));

  const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token,
      grant_type: 'refresh_token',
      scope: 'offline_access Files.ReadWrite',
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gagal memperbarui token MS Graph: ${errText}`);
  }

  const data = await response.json();
  
  // Jika refresh token baru diterbitkan (rotasi token), simpan yang baru
  if (data.refresh_token && data.refresh_token !== refresh_token) {
    fs.writeFileSync(tokenPath, JSON.stringify({ refresh_token: data.refresh_token }, null, 2), 'utf-8');
  }

  return data.access_token;
}

/**
 * Mengunggah file ke OneDrive. Jika token belum dikonfigurasi, otomatis masuk ke mode simulasi.
 */
export async function uploadToOneDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  fileSize: number
): Promise<OneDriveUploadResult> {
  const hasToken = fs.existsSync(tokenPath);

  // Jika kredensial belum diisi atau akun belum ditautkan via web, jalankan mode simulasi
  if (!isConfigured || !hasToken) {
    console.log(`🤖 [OneDrive Simulation] Mengunggah file "${fileName}" (${fileSize} bytes)`);
    
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Berikan nama unik untuk menghindari konflik berkas
      const uniqueFileName = `${Date.now()}_${fileName}`;
      const filePath = path.join(uploadDir, uniqueFileName);
      fs.writeFileSync(filePath, fileBuffer);

      return {
        name: fileName,
        size: fileSize,
        url: `/uploads/${uniqueFileName}`,
        source: 'onedrive_simulated',
      };
    } catch (err) {
      console.error('Failed to simulate file upload to local folder:', err);
      throw new Error('Simulation upload failed.');
    }
  }

  // Jika kredensial terkonfigurasi, lakukan upload asli ke MS Graph API via Delegated Access Token
  try {
    const accessToken = await getAccessTokenFromRefreshToken();

    // Karena menggunakan Delegated token (mewakili user), kita bisa memakai endpoint '/me' secara penuh.
    let uploadUrl = '';
    const cleanFileName = encodeURIComponent(fileName);

    if (driveId && folderId) {
      // Unggah ke drive dan folder spesifik (misal: SharePoint Teams)
      uploadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${folderId}:/${cleanFileName}:/content`;
    } else if (folderId) {
      // Unggah ke subfolder spesifik di OneDrive personal
      uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}:/${cleanFileName}:/content`;
    } else {
      // Unggah ke root OneDrive pengguna
      uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/root/children/${cleanFileName}/content`;
    }

    console.log(`📤 Mengunggah "${fileName}" ke OneDrive via Graph API (Delegated Flow)...`);
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': mimeType,
      },
      body: new Blob([new Uint8Array(fileBuffer)]),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OneDrive API upload failed: ${errText}`);
    }

    const data = await response.json();
    return {
      name: fileName,
      size: fileSize,
      url: data.webUrl, // Link resmi dokumen di OneDrive Anda
      source: 'onedrive',
    };
  } catch (error: any) {
    console.error(`❌ Gagal mengunggah file "${fileName}" ke OneDrive:`, error.message);
    throw error;
  }
}

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const clientId = process.env.MICROSOFT_CLIENT_ID;
const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
const tenantId = process.env.MICROSOFT_TENANT_ID;
const tokenPath = path.join(process.cwd(), 'src', 'data', 'token.json');

async function getAccessToken(): Promise<string> {
  if (!fs.existsSync(tokenPath)) {
    throw new Error('Refresh token belum ditemukan. Harap login terlebih dahulu.');
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
    throw new Error('Gagal memperbarui token akses. Silakan login kembali di /api/auth/login');
  }

  const data = await response.json();
  return data.access_token;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const driveId = searchParams.get('driveId');

  try {
    const accessToken = await getAccessToken();

    // 1. JIKA USER INGIN MELIHAT FOLDER DI DALAM DRIVE TERTENTU
    if (driveId) {
      const foldersResponse = await fetch(`https://graph.microsoft.com/v1.0/drives/${driveId}/root/children`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!foldersResponse.ok) {
        const errText = await foldersResponse.text();
        throw new Error(`Gagal mengambil data folder: ${errText}`);
      }

      const foldersData = await foldersResponse.json();
      const items = foldersData.value || [];
      const folders = items.filter((item: any) => !!item.folder || !!item.remoteItem);

      // Cari folder terdalam jika ada path
      const folderRows = folders.map((folder: any) => {
        const isShortcut = !!folder.remoteItem;
        const badgeLabel = isShortcut ? 'PINTASAN (SHORTCUT)' : 'FOLDER';
        const badgeClass = isShortcut ? 'badge-teams' : 'badge-onedrive';

        return `
          <div class="drive-card">
            <div class="drive-header">
              <span class="badge ${badgeClass}">${badgeLabel}</span>
              <span class="drive-owner">Dibuat: ${new Date(folder.createdDateTime).toLocaleDateString('id-ID')}</span>
            </div>
            <div class="drive-name">${folder.name}</div>
            <div class="drive-id-box">
              <code>ONEDRIVE_FOLDER_ID=${folder.id}</code>
              <button class="copy-btn" onclick="navigator.clipboard.writeText('${folder.id}'); alert('Folder ID disalin!');">Salin ID</button>
            </div>
            <a href="/api/auth/drives?driveId=${driveId}&parentFolderId=${folder.id}" class="explore-btn">Lihat Sub-Folder &rarr;</a>
          </div>
        `;
      }).join('');

      return new NextResponse(`
        <html>
          <head>
            <title>Daftar Folder</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: radial-gradient(circle at 50% 50%, #120e2e 0%, #070514 100%);
                color: #f9fafb;
                padding: 40px 20px;
                margin: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                min-height: 100vh;
              }
              .container {
                width: 100%;
                max-width: 750px;
              }
              h2 {
                color: #a78bfa;
                font-size: 1.8rem;
                margin-bottom: 8px;
                text-align: center;
              }
              .subtitle {
                color: #9ca3af;
                text-align: center;
                margin-bottom: 40px;
                font-size: 0.95rem;
              }
              .drives-list {
                display: flex;
                flex-direction: column;
                gap: 20px;
              }
              .drive-card {
                border: 1px solid rgba(255, 255, 255, 0.08);
                padding: 24px;
                border-radius: 16px;
                background: rgba(15, 11, 38, 0.55);
                backdrop-filter: blur(20px);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                display: flex;
                flex-direction: column;
                gap: 12px;
              }
              .drive-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              .badge {
                padding: 4px 10px;
                border-radius: 9999px;
                font-size: 0.75rem;
                font-weight: 700;
                letter-spacing: 0.05em;
              }
              .badge-teams {
                background: rgba(167, 139, 250, 0.15);
                border: 1px solid rgba(167, 139, 250, 0.3);
                color: #c084fc;
              }
              .badge-onedrive {
                background: rgba(59, 130, 246, 0.15);
                border: 1px solid rgba(59, 130, 246, 0.3);
                color: #60a5fa;
              }
              .drive-owner {
                font-size: 0.85rem;
                color: #94a3b8;
              }
              .drive-name {
                font-size: 1.2rem;
                font-weight: 700;
                color: #fff;
              }
              .drive-id-box {
                background: rgba(0, 0, 0, 0.4);
                padding: 12px;
                border-radius: 10px;
                border: 1px solid rgba(255, 255, 255, 0.06);
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 0.85rem;
              }
              code {
                font-family: 'Courier New', Courier, monospace;
                color: #34d399;
                word-break: break-all;
                margin-right: 10px;
              }
              .copy-btn {
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.12);
                color: #fff;
                padding: 6px 12px;
                font-size: 0.8rem;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
              }
              .copy-btn:hover {
                background: rgba(255, 255, 255, 0.18);
              }
              .explore-btn {
                color: #a78bfa;
                text-decoration: none;
                font-weight: 600;
                font-size: 0.9rem;
                align-self: flex-end;
                transition: transform 0.2s;
              }
              .explore-btn:hover {
                transform: translateX(4px);
                text-decoration: underline;
              }
              .back-btn {
                display: inline-block;
                margin-bottom: 20px;
                color: #9ca3af;
                text-decoration: none;
                font-size: 0.9rem;
              }
              .back-btn:hover {
                color: #fff;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <a href="/api/auth/drives" class="back-btn">&larr; Kembali ke Daftar Drive</a>
              <h2>Daftar Folder di dalam Drive Terpilih</h2>
              <div class="subtitle">Salin <code>ONEDRIVE_FOLDER_ID</code> dari folder Teams target Anda untuk dimasukkan ke file <code>.env.local</code>.</div>
              <div class="drives-list">
                ${folderRows.length > 0 ? folderRows : '<div class="drive-card" style="text-align:center;">Tidak ada folder di dalam drive ini (kosong atau hanya berisi file langsung).</div>'}
              </div>
            </div>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    // 2. JIKA SUB-FOLDER DIJELAJAHI
    const parentFolderId = searchParams.get('parentFolderId');
    if (parentFolderId) {
      const subfoldersResponse = await fetch(`https://graph.microsoft.com/v1.0/drives/${searchParams.get('driveId')}/items/${parentFolderId}/children`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!subfoldersResponse.ok) {
        const errText = await subfoldersResponse.text();
        throw new Error(`Gagal mengambil data subfolder: ${errText}`);
      }

      const subfoldersData = await subfoldersResponse.json();
      const items = subfoldersData.value || [];
      const folders = items.filter((item: any) => !!item.folder || !!item.remoteItem);

      const folderRows = folders.map((folder: any) => {
        const isShortcut = !!folder.remoteItem;
        const badgeLabel = isShortcut ? 'PINTASAN (SHORTCUT)' : 'FOLDER';
        const badgeClass = isShortcut ? 'badge-teams' : 'badge-onedrive';

        return `
          <div class="drive-card">
            <div class="drive-header">
              <span class="badge ${badgeClass}">${badgeLabel}</span>
              <span class="drive-owner">Dibuat: ${new Date(folder.createdDateTime).toLocaleDateString('id-ID')}</span>
            </div>
            <div class="drive-name">${folder.name}</div>
            <div class="drive-id-box">
              <code>ONEDRIVE_FOLDER_ID=${folder.id}</code>
              <button class="copy-btn" onclick="navigator.clipboard.writeText('${folder.id}'); alert('Folder ID disalin!');">Salin ID</button>
            </div>
            <a href="/api/auth/drives?driveId=${searchParams.get('driveId')}&parentFolderId=${folder.id}" class="explore-btn">Lihat Sub-Folder &rarr;</a>
          </div>
        `;
      }).join('');

      return new NextResponse(`
        <html>
          <head>
            <title>Daftar Sub-Folder</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: radial-gradient(circle at 50% 50%, #120e2e 0%, #070514 100%);
                color: #f9fafb;
                padding: 40px 20px;
                margin: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                min-height: 100vh;
              }
              .container {
                width: 100%;
                max-width: 750px;
              }
              h2 {
                color: #a78bfa;
                font-size: 1.8rem;
                margin-bottom: 8px;
                text-align: center;
              }
              .subtitle {
                color: #9ca3af;
                text-align: center;
                margin-bottom: 40px;
                font-size: 0.95rem;
              }
              .drives-list {
                display: flex;
                flex-direction: column;
                gap: 20px;
              }
              .drive-card {
                border: 1px solid rgba(255, 255, 255, 0.08);
                padding: 24px;
                border-radius: 16px;
                background: rgba(15, 11, 38, 0.55);
                backdrop-filter: blur(20px);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                display: flex;
                flex-direction: column;
                gap: 12px;
              }
              .drive-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              .badge {
                padding: 4px 10px;
                border-radius: 9999px;
                font-size: 0.75rem;
                font-weight: 700;
                letter-spacing: 0.05em;
              }
              .badge-teams {
                background: rgba(167, 139, 250, 0.15);
                border: 1px solid rgba(167, 139, 250, 0.3);
                color: #c084fc;
              }
              .badge-onedrive {
                background: rgba(59, 130, 246, 0.15);
                border: 1px solid rgba(59, 130, 246, 0.3);
                color: #60a5fa;
              }
              .drive-owner {
                font-size: 0.85rem;
                color: #94a3b8;
              }
              .drive-name {
                font-size: 1.2rem;
                font-weight: 700;
                color: #fff;
              }
              .drive-id-box {
                background: rgba(0, 0, 0, 0.4);
                padding: 12px;
                border-radius: 10px;
                border: 1px solid rgba(255, 255, 255, 0.06);
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 0.85rem;
              }
              code {
                font-family: 'Courier New', Courier, monospace;
                color: #34d399;
                word-break: break-all;
                margin-right: 10px;
              }
              .copy-btn {
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.12);
                color: #fff;
                padding: 6px 12px;
                font-size: 0.8rem;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
              }
              .copy-btn:hover {
                background: rgba(255, 255, 255, 0.18);
              }
              .back-btn {
                display: inline-block;
                margin-bottom: 20px;
                color: #9ca3af;
                text-decoration: none;
                font-size: 0.9rem;
              }
              .back-btn:hover {
                color: #fff;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <a href="/api/auth/drives?driveId=${searchParams.get('driveId')}" class="back-btn">&larr; Kembali ke Folder Utama</a>
              <h2>Daftar Sub-Folder di dalam Folder Terpilih</h2>
              <div class="subtitle">Salin <code>ONEDRIVE_FOLDER_ID</code> dari sub-folder target Anda untuk dimasukkan ke file <code>.env.local</code>.</div>
              <div class="drives-list">
                ${folderRows.length > 0 ? folderRows : '<div class="drive-card" style="text-align:center;">Tidak ada sub-folder di dalam folder ini (hanya berisi file langsung).</div>'}
              </div>
            </div>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    // 3. UTAMA: Dapatkan daftar Drive (termasuk OneDrive pribadi, Joined Teams, dan Site Spesifik ANGGARAN261)
    const drivesList: any[] = [];

    // Opsi A: Ambil dari /me/drives
    try {
      const drivesResponse = await fetch('https://graph.microsoft.com/v1.0/me/drives', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (drivesResponse.ok) {
        const drivesData = await drivesResponse.json();
        if (drivesData.value) {
          drivesList.push(...drivesData.value);
        }
      }
    } catch (e) {
      console.error('Gagal mengambil /me/drives:', e);
    }

    // Opsi B: Ambil langsung dari site ANGGARAN261 (Glow Bypass)
    try {
      // 1. Cari Site ID untuk ANGGARAN261
      const siteRes = await fetch('https://graph.microsoft.com/v1.0/sites/ugm365.sharepoint.com:/sites/ANGGARAN261', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (siteRes.ok) {
        const siteData = await siteRes.json();
        const siteId = siteData.id;
        
        // 2. Ambil Drives milik Site tersebut
        const siteDrivesRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/drives`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (siteDrivesRes.ok) {
          const siteDrivesData = await siteDrivesRes.json();
          if (siteDrivesData.value) {
            // Gabungkan dan hindari duplikat ID
            siteDrivesData.value.forEach((d: any) => {
              if (!drivesList.some(existing => existing.id === d.id)) {
                drivesList.push(d);
              }
            });
          }
        }
      }
    } catch (e) {
      console.error('Gagal mengambil drive khusus site ANGGARAN261:', e);
    }

    // Buat tampilan daftar drive HTML
    const driveRows = drivesList.map((drive: any) => {
      const isOneDrive = drive.driveType === 'personal';
      const typeLabel = isOneDrive ? 'OneDrive Pribadi' : 'Teams / SharePoint';
      const typeClass = isOneDrive ? 'badge-onedrive' : 'badge-teams';

      return `
        <div class="drive-card">
          <div class="drive-header">
            <span class="badge ${typeClass}">${typeLabel}</span>
            <span class="drive-owner">${drive.owner?.user?.displayName || drive.name}</span>
          </div>
          <div class="drive-name">${drive.description || drive.name || 'Shared Folder'}</div>
          <div class="drive-id-box">
            <code>ONEDRIVE_DRIVE_ID=${drive.id}</code>
            <button class="copy-btn" onclick="navigator.clipboard.writeText('${drive.id}'); alert('Drive ID disalin!');">Salin ID</button>
          </div>
          <a href="/api/auth/drives?driveId=${drive.id}" class="explore-btn">Lihat Folder di Sini &rarr;</a>
        </div>
      `;
    }).join('');

    return new NextResponse(`
      <html>
        <head>
          <title>Daftar Penyimpanan OneDrive & Teams</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: radial-gradient(circle at 50% 50%, #120e2e 0%, #070514 100%);
              color: #f9fafb;
              padding: 40px 20px;
              margin: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
              min-height: 100vh;
            }
            .container {
              width: 100%;
              max-width: 750px;
            }
            h2 {
              color: #a78bfa;
              font-size: 1.8rem;
              margin-bottom: 8px;
              text-align: center;
            }
            .subtitle {
              color: #9ca3af;
              text-align: center;
              margin-bottom: 40px;
              font-size: 0.95rem;
            }
            .drives-list {
              display: flex;
              flex-direction: column;
              gap: 20px;
            }
            .drive-card {
              border: 1px solid rgba(255, 255, 255, 0.08);
              padding: 24px;
              border-radius: 16px;
              background: rgba(15, 11, 38, 0.55);
              backdrop-filter: blur(20px);
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
              display: flex;
              flex-direction: column;
              gap: 12px;
            }
            .drive-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .badge {
              padding: 4px 10px;
              border-radius: 9999px;
              font-size: 0.75rem;
              font-weight: 700;
              letter-spacing: 0.05em;
            }
            .badge-onedrive {
              background: rgba(59, 130, 246, 0.15);
              border: 1px solid rgba(59, 130, 246, 0.3);
              color: #60a5fa;
            }
            .badge-teams {
              background: rgba(167, 139, 250, 0.15);
              border: 1px solid rgba(167, 139, 250, 0.3);
              color: #c084fc;
            }
            .drive-owner {
              font-size: 0.85rem;
              color: #94a3b8;
            }
            .drive-name {
              font-size: 1.2rem;
              font-weight: 700;
              color: #fff;
            }
            .drive-id-box {
              background: rgba(0, 0, 0, 0.4);
              padding: 12px;
              border-radius: 10px;
              border: 1px solid rgba(255, 255, 255, 0.06);
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 0.85rem;
            }
            code {
              font-family: 'Courier New', Courier, monospace;
              color: #34d399;
              word-break: break-all;
              margin-right: 10px;
            }
            .copy-btn {
              background: rgba(255, 255, 255, 0.08);
              border: 1px solid rgba(255, 255, 255, 0.12);
              color: #fff;
              padding: 6px 12px;
              font-size: 0.8rem;
              border-radius: 6px;
              cursor: pointer;
              transition: all 0.2s;
            }
            .copy-btn:hover {
              background: rgba(255, 255, 255, 0.18);
            }
            .explore-btn {
              color: #a78bfa;
              text-decoration: none;
              font-weight: 600;
              font-size: 0.9rem;
              align-self: flex-end;
              transition: transform 0.2s;
            }
            .explore-btn:hover {
              transform: translateX(4px);
              text-decoration: underline;
            }
            .back-btn {
              display: inline-block;
              margin-bottom: 20px;
              color: #9ca3af;
              text-decoration: none;
              font-size: 0.9rem;
            }
            .back-btn:hover {
              color: #fff;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <a href="/" class="back-btn">&larr; Kembali ke Beranda Form</a>
            <h2>Daftar Penyimpanan OneDrive & Teams Anda</h2>
            <div class="subtitle">Salin <code>ONEDRIVE_DRIVE_ID</code> dari target Teams (termasuk Tim ANGGARAN261) untuk dimasukkan ke file <code>.env.local</code>.</div>
            <div class="drives-list">
              ${driveRows.length > 0 ? driveRows : '<div class="drive-card" style="text-align:center;">Tidak ada folder bersama atau Teams yang terdeteksi. Silakan coba login ulang via /api/auth/login</div>'}
            </div>
          </div>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

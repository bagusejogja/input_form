import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    return NextResponse.json({ error, description: errorDescription }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: 'Authorization code tidak ditemukan' }, { status: 400 });
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const tenantId = process.env.MICROSOFT_TENANT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback`;

  try {
    const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope: 'offline_access Files.ReadWrite',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gagal menukarkan Authorization Code: ${errText}`);
    }

    const data = await response.json();
    const { refresh_token } = data;

    if (!refresh_token) {
      throw new Error('Refresh token tidak didapatkan. Pastikan scope offline_access disetujui.');
    }

    // Simpan refresh token ke file lokal src/data/token.json
    const dataDir = path.join(process.cwd(), 'src', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const tokenPath = path.join(dataDir, 'token.json');
    fs.writeFileSync(tokenPath, JSON.stringify({ refresh_token }, null, 2), 'utf-8');

    return new NextResponse(`
      <html>
        <head>
          <title>Autentikasi Berhasil</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: radial-gradient(circle at 50% 50%, #120e2e 0%, #070514 100%);
              color: #f9fafb;
            }
            .container {
              text-align: center;
              border: 1px solid rgba(255, 255, 255, 0.08);
              padding: 48px;
              border-radius: 20px;
              background: rgba(15, 11, 38, 0.55);
              backdrop-filter: blur(20px);
              box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
              max-width: 450px;
            }
            h2 {
              color: #10b981;
              margin-top: 0;
              font-size: 1.8rem;
            }
            p {
              color: #9ca3af;
              font-size: 0.95rem;
              line-height: 1.6;
            }
            .btn {
              display: inline-block;
              margin-top: 24px;
              padding: 12px 28px;
              background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%);
              color: white;
              text-decoration: none;
              font-weight: 600;
              border-radius: 10px;
              box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
              transition: all 0.2s ease;
            }
            .btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(124, 58, 237, 0.45);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Koneksi OneDrive Berhasil!</h2>
            <p>Aplikasi telah berhasil mendapatkan token akses UGM 365 Anda. Token refresh telah disimpan secara aman untuk proses upload otomatis di latar belakang.</p>
            <p>Anda sekarang bisa menutup halaman ini dan kembali mengirimkan form.</p>
            <a href="/" class="btn">Kembali ke Beranda Form</a>
          </div>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

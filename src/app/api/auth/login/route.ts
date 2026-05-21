import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const tenantId = process.env.MICROSOFT_TENANT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback`;
  
  if (!clientId || !tenantId) {
    return NextResponse.json(
      { error: 'Kredensial Microsoft belum dikonfigurasi di file .env.local' },
      { status: 400 }
    );
  }

  // Menggunakan scope offline_access (untuk dapat refresh token) dan Files.ReadWrite (untuk upload file)
  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` + new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: 'offline_access Files.ReadWrite',
    state: 'onedrive_form_state',
  }).toString();

  return NextResponse.redirect(authUrl);
}

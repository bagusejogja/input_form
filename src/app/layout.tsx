import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Formulir Pengajuan Dokumen - OneDrive Integration',
  description: 'Unggah dokumen pendukung Anda secara otomatis ke folder OneDrive yang aman dengan notifikasi tanda terima langsung ke email Anda.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <div className="bg-center-glow" />
        {children}
      </body>
    </html>
  );
}

import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '課程預約系統',
  description: 'MVP course booking system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>
        <header className="border-b bg-white">
          <div className="container flex items-center justify-between py-4">
            <Link href="/courses" className="text-xl font-semibold">
              課程預約系統
            </Link>
            <Link href="/admin" className="text-sm text-blue-700 hover:underline">
              管理員後台
            </Link>
          </div>
        </header>
        <main className="container py-8">{children}</main>
      </body>
    </html>
  );
}

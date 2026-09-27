import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import AuthSidebar from '@/app/components/AuthSidebar';
import ClientProvider from './ClientProvider';
import ThemeProvider from '@/app/components/ThemeProvider';
import ToastProvider from '@/app/components/ToastProvider';



export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://arooba-hgz.vercel.app'),
  title: { default: 'عُروبة', template: '%s | عُروبة' },
  description: "منصة لتعريب القصص العالمية بأسلوب احترافي وممتع",
  icons: {
    icon: "/favicon.ico",       // أيقونة الموقع الأساسية
    shortcut: "/favicon.ico",   // اختصار (اختياري)
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">

      <body >
      <ThemeProvider>
        <ClientProvider>
          <Navbar />
          <AuthSidebar />
          {children}
          <Footer />
          <ToastProvider />
        </ClientProvider>
      </ThemeProvider>
      </body>
    </html>
  );
}
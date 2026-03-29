import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import AuthSidebar from '@/app/components/AuthSidebar';
import ClientProvider from './ClientProvider';



export const metadata: Metadata = {
  title: "عُروبة",
  description: "منصة لتعريب القصص العالمية بأسلوب احترافي وممتع",
  icons: {
    icon: "/favicon.ico",       // أيقونة الموقع الأساسية
    shortcut: "/favicon.ico",   // اختصار (اختياري)
    apple: "/apple-touch-icon.png", // أيقونة لأجهزة Apple (إذا كانت موجودة)
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body >
        <ClientProvider>
          <Navbar />
          <AuthSidebar />
          {children}
          <Footer />
        </ClientProvider>
      </body>
    </html>
  );
}
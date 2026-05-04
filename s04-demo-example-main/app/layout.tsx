import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "PawCare Daycare",
  description: "Professional pet daycare services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-amber-50">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="text-center text-sm text-gray-500 py-4 border-t border-orange-100 bg-white">
            © {new Date().getFullYear()} PawCare Daycare — All rights reserved
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}

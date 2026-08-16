import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Lontara+ | Executive Dashboard",
    template: "%s | Lontara+",
  },
  description: "Dashboard Lontara+ Pemerintah Kota Makassar",
  icons: {
    icon: "/img/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}

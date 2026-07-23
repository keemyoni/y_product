import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shopee AI Listing Studio",
  description: "AI-assisted Shopee mass listing preparation"
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

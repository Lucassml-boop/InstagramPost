import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Instagram AI Publisher Demo",
  description:
    "Meta App Review demo for connecting Instagram Professional accounts, generating AI posts, previewing them, and publishing through the Instagram Graph API."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

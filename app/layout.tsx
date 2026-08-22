import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "A QUIET EXCHANGE?",
  description:
    "Share something life has taught you and receive a heartfelt letter from a stranger tomorrow.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

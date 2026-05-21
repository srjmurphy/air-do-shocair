import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Air Do Shocair",
  description:
    "A poetic Highland Bitcoin dashboard with daily generated vistas.",
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

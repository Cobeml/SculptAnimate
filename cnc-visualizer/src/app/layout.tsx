import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CNC Path Visualizer",
  description: "A web-based CNC toolpath visualization tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

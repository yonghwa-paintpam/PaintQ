import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PaintQ - 그림 맞추기 게임",
  description: "Quick, Draw! 스타일의 그림 맞추기 게임",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}


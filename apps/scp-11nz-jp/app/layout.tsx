import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "SCP-11NZ-JP",
  description: "SCP-11NZ-JP 謎解きゲーム",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          padding: 0,
          overflow: "hidden",
          background: "#000",
          color: "#fff",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* 縦アスペクト比固定コンテナ（高さフィット、横は自動） */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "stretch",
            background: "#000",
          }}
        >
          <div
            style={{
              position: "relative",
              // 高さに合わせ、必要なら横幅で制約してアスペクト比維持
              height: "min(100dvh, calc(100vw * 844 / 390))",
              width: "min(100vw, calc(100dvh * 390 / 844))",
              overflow: "hidden",
              background: "#0d0d1a",
            }}
          >
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}

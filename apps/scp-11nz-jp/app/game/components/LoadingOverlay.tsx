"use client";

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = "接続中..." }: LoadingOverlayProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(2px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        zIndex: 45,
      }}
    >
      {/* スピナー */}
      <div
        style={{
          width: "60px",
          height: "60px",
          border: "3px solid rgba(120, 120, 200, 0.2)",
          borderTopColor: "#7777ee",
          borderRadius: "50%",
          animation: "scpspin 0.9s linear infinite",
        }}
      />
      <p
        style={{
          color: "#aaaaff",
          fontSize: "0.9rem",
          fontFamily: "monospace",
          letterSpacing: "0.1em",
          margin: 0,
          textAlign: "center",
          animation: "scpblink 1.4s ease-in-out infinite",
        }}
      >
        {message}
      </p>
      <style>{`
        @keyframes scpspin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes scpblink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

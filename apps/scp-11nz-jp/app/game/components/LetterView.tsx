"use client";

interface LetterViewProps {
  /** 日付文字列 例: "20███年11月20日" */
  date: string;
  /** 宛名 例: "D-231787" */
  recipient: string;
  /** 差出人組織 */
  fromOrg: string;
  /** 差出人 */
  fromPerson: string;
  /** 本文 */
  body: string;
  /** タイトル(任命書 等) */
  title?: string;
}

/**
 * 任命書スタイル。游明朝・縦書きライク・フェードイン演出。
 * HTMLの構造を再現:
 * - 日付（右）
 * - 宛名（左下線つき）
 * - 差出人（右）
 * - 任命書（中央大）
 * - 本文（両端揃え）
 * - 以上（右）
 */
export function LetterView({
  date,
  recipient,
  fromOrg,
  fromPerson,
  body,
  title = "任 命 書",
}: LetterViewProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(180deg, #f4ede0 0%, #ebe1c8 100%)",
          color: "#1a1408",
          padding: "2.5rem 1.5rem 2rem",
          maxWidth: "100%",
          width: "340px",
          maxHeight: "90%",
          overflowY: "auto",
          boxShadow:
            "0 0 0 1px rgba(0,0,0,0.15), 0 12px 32px rgba(60, 40, 20, 0.5), inset 0 0 60px rgba(120, 90, 50, 0.06)",
          fontFamily:
            "'Yu Mincho', 'YuMincho', 'Hiragino Mincho ProN', '游明朝', 'ＭＳ 明朝', serif",
          fontSize: "0.9rem",
          lineHeight: 1.9,
          letterSpacing: "0.05em",
          opacity: 0,
          transform: "translateY(20px) scale(0.96)",
          animation: "letter-fade-in 1.6s ease-out 0.3s forwards",
        }}
      >
        {/* 日付（右） */}
        <p style={{ margin: 0, textAlign: "right", fontSize: "0.85rem" }}>
          {date}
        </p>

        {/* 宛名（左、下線付き、大きめ） */}
        <p
          style={{
            margin: "0.4rem 0 0",
            textAlign: "left",
            textDecoration: "underline",
            fontSize: "1.15rem",
            fontWeight: 500,
          }}
        >
          　{recipient} 殿
        </p>

        {/* 差出人（右） */}
        <p
          style={{
            margin: "1rem 0 0",
            textAlign: "right",
            fontSize: "0.85rem",
          }}
        >
          {fromOrg}
        </p>
        <p
          style={{
            margin: 0,
            textAlign: "right",
            fontSize: "0.85rem",
          }}
        >
          {fromPerson}
        </p>

        {/* タイトル（中央、大、太字） */}
        <p
          style={{
            margin: "2.4rem 0 2rem",
            textAlign: "center",
            fontSize: "1.7rem",
            fontWeight: 700,
            letterSpacing: "0.4em",
            paddingLeft: "0.4em",
          }}
        >
          {title}
        </p>

        {/* 本文（左右マージン） */}
        <p
          style={{
            margin: "0 0.5rem",
            textAlign: "justify",
            lineHeight: 2.1,
            fontSize: "0.92rem",
            whiteSpace: "pre-wrap",
          }}
        >
          {body}
        </p>

        {/* 以上（右） */}
        <p
          style={{
            margin: "1.6rem 0.5rem 0",
            textAlign: "right",
            fontSize: "0.92rem",
          }}
        >
          以上
        </p>
      </div>

      <style>{`
        @keyframes letter-fade-in {
          0% { opacity: 0; transform: translateY(20px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

import type { CSSProperties } from "react";
import { useActiveRun } from "../../hooks";
import "@fontsource-variable/inter/wght.css";
import "@fontsource/m-plus-1p/900.css";
import "../styles/index.scss";

interface GameInfoProps {
  style?: CSSProperties;
  fontSize?: number;
}

const baseStyle: CSSProperties = {
  fontFamily: '"Inter Variable", "M PLUS 1p"',
  color: "white",
  textAlign: "center",
  lineHeight: 1.2,
};

export const GameInfo = ({ style, fontSize = 36 }: GameInfoProps) => {
  const activeRun = useActiveRun();
  if (!activeRun?.game) return null;

  const subFontSize = fontSize * 0.8;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        ...style,
      }}
    >
      <div

        style={{
          ...baseStyle,
          fontSize,
          fontWeight: 800,
        }}
      >
        {activeRun.game}
      </div>
      {(activeRun.category || activeRun.system || activeRun.releaseYear) && (
        <div
  
          style={{
            ...baseStyle,
            fontSize: subFontSize,
            fontWeight: 700,
            marginTop: 4,
          }}
        >
          {[activeRun.category, [activeRun.system, activeRun.releaseYear].filter(Boolean).join(" - ")].filter(Boolean).join(" / ")}
        </div>
      )}
    </div>
  );
};

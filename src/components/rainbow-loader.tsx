export function RainbowLoader({ size = 16 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="iris-rainbow-loader inline-block align-middle"
      style={{
        width: size,
        height: size,
        background:
          "conic-gradient(from 0deg, #ff3b6b, #ff9f43, #ffd93d, #4ade80, #38bdf8, #a78bfa, #ff3b6b)",
        WebkitMaskImage: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 0)",
        maskImage: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 0)",
        borderRadius: "9999px",
      }}
    />
  );
}

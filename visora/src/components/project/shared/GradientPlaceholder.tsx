interface GradientPlaceholderProps {
  palette: string[];
  className?: string;
}

export function GradientPlaceholder({ palette, className }: GradientPlaceholderProps) {
  const safe = (palette ?? []).filter(
    (c) => typeof c === "string" && /^#[0-9a-f]{3,8}$/i.test(c),
  );
  const a = safe[0] ?? "#0D0E10";
  const b = safe[2] ?? "#818283";
  const c = safe[3] ?? "#C5C6C8";
  return (
    <div
      className={className ?? "absolute inset-0"}
      style={{
        background: `radial-gradient(120% 120% at 0% 0%, ${a} 0%, transparent 60%), radial-gradient(120% 120% at 100% 0%, ${b}33 0%, transparent 55%), radial-gradient(120% 120% at 100% 100%, ${c}33 0%, transparent 55%), #0D0E10`,
      }}
      aria-hidden
    />
  );
}

type ProgressBarProps = {
  /** Значение 0..100. Больше 100 обрежется визуально. */
  value: number;
  /** Показывать ли подпись "42%" справа. */
  showLabel?: boolean;
  /** Цвет заливки. По умолчанию — акцент (золотой). */
  tone?: "accent" | "success" | "danger";
  /** Высота полосы. По умолчанию h-2. */
  size?: "sm" | "md";
  className?: string;
};

const toneClass: Record<NonNullable<ProgressBarProps["tone"]>, string> = {
  accent: "bg-barber-accent",
  success: "bg-barber-success",
  danger: "bg-barber-danger",
};

/**
 * Горизонтальная полоса прогресса / загрузки.
 *
 * Пример:
 *   <ProgressBar value={67} showLabel />
 *   <ProgressBar value={30} tone="success" size="sm" />
 */
export default function ProgressBar({
  value,
  showLabel = false,
  tone = "accent",
  size = "md",
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const height = size === "sm" ? "h-1.5" : "h-2";

  return (
    <div className={["flex items-center gap-3", className ?? ""].join(" ")}>
      <div
        className={[
          "flex-1 overflow-hidden rounded-full bg-barber-bg",
          height,
        ].join(" ")}
      >
        <div
          className={["h-full transition-all", toneClass[tone]].join(" ")}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <span className="text-sm tabular-nums text-barber-muted">
          {clamped}%
        </span>
      )}
    </div>
  );
}
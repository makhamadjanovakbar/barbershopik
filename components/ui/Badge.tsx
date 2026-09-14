import type { ReactNode } from "react";

type Tone = "neutral" | "success" | "danger" | "accent";

type BadgeProps = {
  children: ReactNode;
  tone?: Tone;
  /** Круглая форма — для статусов. По умолчанию "pill". */
  shape?: "pill" | "square";
  className?: string;
};

const tones: Record<Tone, string> = {
  neutral: "bg-barber-bg text-barber-muted border border-barber-border",
  success: "bg-barber-success/15 text-barber-success",
  danger: "bg-barber-danger/15 text-barber-danger",
  accent: "bg-barber-accentMuted text-barber-accent",
};

/**
 * Маленький цветной лейбл: статус, метка, счётчик.
 *
 * Примеры:
 *   <Badge tone="success">активен</Badge>
 *   <Badge tone="danger">отменена</Badge>
 *   <Badge tone="accent">Telegram</Badge>
 *   <Badge tone="neutral" shape="square">NEW</Badge>
 */
export default function Badge({
  children,
  tone = "neutral",
  shape = "pill",
  className,
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center px-3 py-1 text-xs font-medium whitespace-nowrap",
        shape === "pill" ? "rounded-full" : "rounded-md",
        tones[tone],
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "accent" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
};

type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> & {
    href?: undefined;
  };

type LinkProps = CommonProps & {
  href: string;
  target?: string;
  rel?: string;
};

const base =
  "inline-flex items-center justify-center rounded-md font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-barber-accent/60";

const variants: Record<Variant, string> = {
  accent:
    "bg-barber-accent text-barber-bg hover:bg-barber-accentHover",
  outline:
    "border border-barber-border text-barber-text hover:border-barber-accent hover:text-barber-accent",
  ghost:
    "text-barber-muted hover:text-barber-text hover:bg-barber-surfaceHover",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-3 text-base",
  lg: "px-6 py-4 text-lg",
};

function classes(
  variant: Variant,
  size: Size,
  fullWidth: boolean,
  className?: string,
) {
  return [
    base,
    variants[variant],
    sizes[size],
    fullWidth ? "w-full" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Кнопка. Если передан `href` — рендерится как <Link>, иначе как <button>.
 *
 * Примеры:
 *   <Button>Записаться</Button>
 *   <Button variant="outline" href="/#services">Услуги</Button>
 *   <Button variant="ghost" size="sm" onClick={...}>Отмена</Button>
 */
export default function Button(props: ButtonProps | LinkProps) {
  if ("href" in props && props.href !== undefined) {
    const { href, variant = "accent", size = "md", fullWidth = false, className, children, target, rel } = props;
    return (
      <Link
        href={href}
        target={target}
        rel={rel}
        className={classes(variant, size, fullWidth, className)}
      >
        {children}
      </Link>
    );
  }

  const {
    variant = "accent",
    size = "md",
    fullWidth = false,
    className,
    children,
    ...rest
  } = props as ButtonProps;

  return (
    <button className={classes(variant, size, fullWidth, className)} {...rest}>
      {children}
    </button>
  );
}
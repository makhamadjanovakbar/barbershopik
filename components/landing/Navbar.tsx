import Link from "next/link";
import { Button } from "@/components/ui";

const NAV_ITEMS = [
  { href: "/#services", label: "Услуги" },
  { href: "/#barbers", label: "Барберы" },
  { href: "/#contacts", label: "Контакты" },
] as const;

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-barber-border bg-barber-bg/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight"
          aria-label="Барбершопик — на главную"
        >
          <span className="text-barber-accent">Барбер</span>
          <span className="text-barber-text">шопик</span>
        </Link>

        <ul className="hidden items-center gap-8 text-sm text-barber-muted md:flex">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="transition-colors hover:text-barber-accent"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <Button href="/book" size="sm">
          Записаться
        </Button>
      </nav>
    </header>
  );
}
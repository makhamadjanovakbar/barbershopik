"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Загруженность", exact: true },
  { href: "/admin/bookings", label: "Записи", exact: false },
  { href: "/admin/barbers", label: "Барберы", exact: false },
  { href: "/admin/services", label: "Услуги", exact: false },
  { href: "/admin/schedule", label: "Расписание", exact: false },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-barber-border bg-barber-surface/40">
      <div className="border-b border-barber-border px-6 py-5">
        <Link href="/admin" className="text-lg font-bold">
          <span className="text-barber-accent">Барбер</span>
          <span className="text-barber-text">шопик</span>
        </Link>
        <p className="mt-1 text-xs uppercase tracking-widest text-barber-muted">
          Админка
        </p>
      </div>

      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "block rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-barber-accentMuted text-barber-accent"
                      : "text-barber-muted hover:bg-barber-surfaceHover hover:text-barber-text",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-barber-border p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-md px-3 py-2 text-left text-sm text-barber-muted transition-colors hover:bg-barber-surfaceHover hover:text-barber-text"
        >
          Выйти
        </button>
      </div>
    </aside>
  );
}
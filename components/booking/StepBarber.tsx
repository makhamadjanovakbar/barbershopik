"use client";

import Image from "next/image";
import type { Barber } from "@/types";

type StepBarberProps = {
  barbers: Barber[];
  /** null — ничего не выбрано, "any" — любой свободный, number — конкретный барбер. */
  selectedId: number | "any" | null;
  onSelect: (id: number | "any") => void;
  loading?: boolean;
};

export default function StepBarber({
  barbers,
  selectedId,
  onSelect,
  loading,
}: StepBarberProps) {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">2. Выберите барбера</h2>

      {loading ? (
        <p className="text-barber-muted">Загружаем барберов…</p>
      ) : barbers.length === 0 ? (
        <p className="text-barber-muted">Нет доступных барберов.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {/* Опция «любой свободный» */}
          <button
            type="button"
            onClick={() => onSelect("any")}
            aria-pressed={selectedId === "any"}
            className={[
              "flex flex-col items-center justify-center rounded-card border p-5 transition-colors",
              selectedId === "any"
                ? "border-barber-accent bg-barber-surface"
                : "border-barber-border bg-barber-surface hover:border-barber-accent/60",
            ].join(" ")}
          >
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-barber-border bg-barber-bg text-2xl text-barber-accent">
              ✦
            </div>
            <span className="text-base font-semibold">Любой свободный</span>
            <span className="mt-1 text-xs text-barber-muted">
              Подберём автоматически
            </span>
          </button>

          {/* Конкретные барберы */}
          {barbers.map((barber) => {
            const selected = selectedId === barber.id;
            return (
              <button
                key={barber.id}
                type="button"
                onClick={() => onSelect(barber.id)}
                aria-pressed={selected}
                className={[
                  "flex flex-col items-center rounded-card border p-5 transition-colors",
                  selected
                    ? "border-barber-accent bg-barber-surface"
                    : "border-barber-border bg-barber-surface hover:border-barber-accent/60",
                ].join(" ")}
              >
                <div className="relative mb-3 h-16 w-16 overflow-hidden rounded-full border border-barber-border bg-barber-bg">
                  {barber.avatarUrl ? (
                    <Image
                      src={barber.avatarUrl}
                      alt={barber.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl font-bold text-barber-accent">
                      {barber.name.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="text-base font-semibold">{barber.name}</span>
                <span className="mt-1 text-xs text-barber-muted">Барбер</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
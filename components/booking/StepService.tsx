"use client";

import { CURRENCY } from "@/lib/constants";
import type { Service } from "@/types";

type StepServiceProps = {
  services: Service[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  loading?: boolean;
};

export default function StepService({
  services,
  selectedId,
  onSelect,
  loading,
}: StepServiceProps) {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">1. Выберите услугу</h2>

      {loading ? (
        <p className="text-barber-muted">Загружаем услуги…</p>
      ) : services.length === 0 ? (
        <p className="text-barber-muted">Нет доступных услуг.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {services.map((service) => {
            const selected = selectedId === service.id;
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => onSelect(service.id)}
                aria-pressed={selected}
                className={[
                  "flex flex-col items-start rounded-card border p-5 text-left transition-colors",
                  selected
                    ? "border-barber-accent bg-barber-surface"
                    : "border-barber-border bg-barber-surface hover:border-barber-accent/60",
                ].join(" ")}
              >
                <span className="text-lg font-semibold">{service.name}</span>
                <span className="mt-3 flex w-full items-center justify-between text-sm text-barber-muted">
                  <span>{service.durationMin} мин</span>
                  <span className="text-lg font-bold text-barber-accent">
                    {service.price.toLocaleString("ru-RU")} {CURRENCY}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
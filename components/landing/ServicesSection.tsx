"use client";

import { useEffect, useState } from "react";
import { CURRENCY } from "@/lib/constants";
import type { Service } from "@/types";

const FALLBACK_SERVICES: Service[] = [
  { id: 1, name: "Мужская стрижка", durationMin: 45, price: 60_000, active: true },
  { id: 2, name: "Стрижка бороды", durationMin: 30, price: 40_000, active: true },
  { id: 3, name: "Стрижка + борода", durationMin: 75, price: 90_000, active: true },
  { id: 4, name: "Бритьё опасной бритвой", durationMin: 40, price: 50_000, active: true },
];

export default function ServicesSection() {
  const [services, setServices] = useState<Service[]>(FALLBACK_SERVICES);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/services")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Service[]) => {
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setServices(data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="services" className="border-b border-barber-border py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12">
          <h2 className="text-4xl font-bold md:text-5xl">Услуги</h2>
          <p className="mt-3 text-barber-muted">
            Цены фиксированные. Оплата в барбершопе.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <article
              key={service.id}
              className="flex flex-col justify-between rounded-card border border-barber-border bg-barber-surface p-6 transition-colors hover:border-barber-accent/60"
            >
              <h3 className="text-xl font-semibold">{service.name}</h3>
              <div className="mt-6 flex items-end justify-between">
                <span className="text-sm text-barber-muted">
                  {service.durationMin} мин
                </span>
                <span className="text-2xl font-bold text-barber-accent">
                  {service.price.toLocaleString("ru-RU")} {CURRENCY}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
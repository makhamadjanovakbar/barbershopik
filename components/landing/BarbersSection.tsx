"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Barber } from "@/types";

/** Показываем, пока API ещё не поднялся (на этапе сборки фронта). */
const FALLBACK_BARBERS: Barber[] = [
  { id: 1, name: "Игорь", avatarUrl: null, active: true },
  { id: 2, name: "Максим", avatarUrl: null, active: true },
  { id: 3, name: "Артём", avatarUrl: null, active: true },
];

export default function BarbersSection() {
  const [barbers, setBarbers] = useState<Barber[]>(FALLBACK_BARBERS);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/barbers")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Barber[]) => {
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setBarbers(data);
        }
      })
      .catch(() => {
        /* оставляем fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="barbers" className="border-b border-barber-border py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12">
          <h2 className="text-4xl font-bold md:text-5xl">Барберы</h2>
          <p className="mt-3 text-barber-muted">
            Каждый — с характером и стажем. Выбирай своего.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {barbers.map((barber) => (
            <article
              key={barber.id}
              className="flex flex-col items-center rounded-card border border-barber-border bg-barber-surface p-6 text-center transition-colors hover:border-barber-accent/60"
            >
              <div className="relative mb-4 h-32 w-32 overflow-hidden rounded-full border border-barber-border bg-barber-bg">
                {barber.avatarUrl ? (
                  <Image
                    src={barber.avatarUrl}
                    alt={barber.name}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-barber-accent">
                    {barber.name.charAt(0)}
                  </div>
                )}
              </div>
              <h3 className="text-xl font-semibold">{barber.name}</h3>
              <p className="mt-1 text-sm text-barber-muted">Барбер</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
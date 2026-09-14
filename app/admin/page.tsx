"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, ProgressBar } from "@/components/ui";
import PageHeader from "@/components/admin/PageHeader";
import { todayISO, humanTime } from "@/lib/utils/date";
import type { WorkloadResponse } from "@/types";

export default function AdminWorkloadPage() {
  const router = useRouter();
  const [date, setDate] = useState<string>(() => todayISO());
  const [data, setData] = useState<WorkloadResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (d: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/workload?date=${d}`);
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        if (!res.ok) throw new Error("Не удалось загрузить данные");
        const json: WorkloadResponse = await res.json();
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка");
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    void load(date);
  }, [date, load]);

  const summary = useMemo(() => {
    if (!data) return { total: 0, booked: 0, occupancy: 0 };
    const total = data.barbers.reduce((s, b) => s + b.totalMinutes, 0);
    const booked = data.barbers.reduce((s, b) => s + b.bookedMinutes, 0);
    const occupancy = total > 0 ? Math.round((booked / total) * 100) : 0;
    return { total, booked, occupancy };
  }, [data]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Загруженность"
        description="Сводка по записям на выбранный день"
        actions={
          <div>
            <label htmlFor="workload-date" className="mb-2 block text-sm font-medium text-barber-muted">
              Дата
            </label>
            <input
              id="workload-date"
              type="date"
              className="w-full rounded-md border border-barber-border bg-barber-bg px-4 py-3 text-barber-text focus:border-barber-accent focus:outline-none"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        }
      />

      {loading && (
        <p className="text-barber-muted">Загружаем…</p>
      )}
      {error && <p className="text-sm text-barber-danger">{error}</p>}

      {!loading && data && (
        <>
          {/* Сводные карточки */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <p className="text-xs uppercase tracking-widest text-barber-muted">
                Всего часов
              </p>
              <p className="mt-2 text-3xl font-bold">
                {(summary.total / 60).toFixed(1)} ч
              </p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-widest text-barber-muted">
                Занято
              </p>
              <p className="mt-2 text-3xl font-bold">
                {(summary.booked / 60).toFixed(1)} ч
              </p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-widest text-barber-muted">
                Общая загрузка
              </p>
              <p className="mt-2 text-3xl font-bold text-barber-accent">
                {summary.occupancy}%
              </p>
            </Card>
          </div>

          {/* Карточки барберов */}
          <div className="space-y-4">
            {data.barbers.length === 0 && (
              <p className="text-barber-muted">Нет активных барберов.</p>
            )}

            {data.barbers.map((b) => (
              <Card key={b.barberId}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl font-semibold">{b.barberName}</h2>
                  <span className="text-sm text-barber-muted">
                    {b.occupancy}% · {(b.bookedMinutes / 60).toFixed(1)} ч /{" "}
                    {(b.totalMinutes / 60).toFixed(1)} ч
                  </span>
                </div>

                <ProgressBar value={b.occupancy} className="mt-3" />

                {b.bookings.length > 0 ? (
                  <ul className="mt-4 divide-y divide-barber-border">
                    {b.bookings.map((bk) => (
                      <li
                        key={bk.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                      >
                        <span className="whitespace-nowrap text-barber-muted">
                          {humanTime(bk.startsAt)}–{humanTime(bk.endsAt)}
                        </span>
                        <span className="flex-1 px-4">{bk.serviceName}</span>
                        <span className="text-barber-muted">{bk.clientName}</span>
                        {bk.status === "cancelled" && (
                          <span className="rounded-full bg-barber-danger/15 px-2 py-0.5 text-xs text-barber-danger">
                            отменена
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-barber-muted">Записей нет</p>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
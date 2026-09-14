"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Select } from "@/components/ui";
import PageHeader from "@/components/admin/PageHeader";
import { WEEKDAYS_RU } from "@/lib/constants";
import type { Barber, WorkSchedule } from "@/types";

type DayForm = {
  weekday: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
};

const DEFAULT_START = "10:00";
const DEFAULT_END = "20:00";

function buildEmptyDays(): DayForm[] {
  return WEEKDAYS_RU.map((d) => ({
    weekday: d.value,
    enabled: false,
    startTime: DEFAULT_START,
    endTime: DEFAULT_END,
  }));
}

export default function AdminSchedulePage() {
  const router = useRouter();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [barberId, setBarberId] = useState<number | null>(null);
  const [schedule, setSchedule] = useState<WorkSchedule[]>([]);
  const [days, setDays] = useState<DayForm[]>(() => buildEmptyDays());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /* ─────────────── Загрузка барберов ─────────────── */

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/barbers")
      .then((r) => {
        if (r.status === 401) {
          router.push("/admin/login");
          return [];
        }
        return r.ok ? r.json() : [];
      })
      .then((data: Barber[]) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setBarbers(list);
        if (list.length > 0) setBarberId(list[0].id);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [router]);

  /* ─────────────── Загрузка расписания ─────────────── */

  const loadSchedule = useCallback(
    async (id: number) => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const res = await fetch(`/api/admin/schedule?barberId=${id}`);
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        if (!res.ok) throw new Error("Не удалось загрузить расписание");
        const data: WorkSchedule[] = await res.json();
        setSchedule(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка");
        setSchedule([]);
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    if (barberId !== null) void loadSchedule(barberId);
  }, [barberId, loadSchedule]);

  /* ─────────────── Синхронизация формы с данными ─────────────── */

  useEffect(() => {
    setDays(
      WEEKDAYS_RU.map((w) => {
        const found = schedule.find((s) => s.weekday === w.value);
        return {
          weekday: w.value,
          enabled: Boolean(found),
          startTime: found?.startTime ?? DEFAULT_START,
          endTime: found?.endTime ?? DEFAULT_END,
        };
      }),
    );
  }, [schedule]);

  const scheduleByWeekday = useMemo(() => {
    const map = new Map<number, WorkSchedule>();
    schedule.forEach((s) => map.set(s.weekday, s));
    return map;
  }, [schedule]);

  const updateDay = (weekday: number, patch: Partial<DayForm>) => {
    setDays((prev) =>
      prev.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d)),
    );
    setSuccess(null);
  };

  /* ─────────────── Сохранение ─────────────── */

  const handleSave = async () => {
    if (barberId === null) return;

    // Валидация: начало должно быть раньше конца
    for (const d of days) {
      if (d.enabled && d.startTime >= d.endTime) {
        const label = WEEKDAYS_RU.find((w) => w.value === d.weekday)?.label ?? "";
        setError(`${label}: время начала должно быть меньше времени конца`);
        return;
      }
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      for (const d of days) {
        const existing = scheduleByWeekday.get(d.weekday);

        if (d.enabled && !existing) {
          // Создать
          const res = await fetch("/api/admin/schedule", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              barberId,
              weekday: d.weekday,
              startTime: d.startTime,
              endTime: d.endTime,
            }),
          });
          if (res.status === 401) {
            router.push("/admin/login");
            return;
          }
          if (!res.ok) throw new Error("Ошибка создания расписания");
        } else if (d.enabled && existing) {
          // Обновить, если что-то изменилось
          if (existing.startTime !== d.startTime || existing.endTime !== d.endTime) {
            const res = await fetch(`/api/admin/schedule/${existing.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                startTime: d.startTime,
                endTime: d.endTime,
              }),
            });
            if (res.status === 401) {
              router.push("/admin/login");
              return;
            }
            if (!res.ok) throw new Error("Ошибка обновления расписания");
          }
        } else if (!d.enabled && existing) {
          // Удалить
          const res = await fetch(`/api/admin/schedule/${existing.id}`, {
            method: "DELETE",
          });
          if (res.status === 401) {
            router.push("/admin/login");
            return;
          }
          if (!res.ok) throw new Error("Ошибка удаления дня");
        }
      }

      setSuccess("Расписание сохранено");
      await loadSchedule(barberId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  /* ─────────────── Рендер ─────────────── */

  return (
    <div className="space-y-8">
      <PageHeader
        title="Расписание"
        description="Рабочие дни и часы по каждому барберу"
      />

      <div className="rounded-card border border-barber-border bg-barber-surface p-6">
        <Select
          label="Барбер"
          value={barberId ?? ""}
          onChange={(e) => setBarberId(Number(e.target.value))}
          disabled={barbers.length === 0}
        >
          {barbers.length === 0 && <option value="">Нет барберов</option>}
          {barbers.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
              {!b.active ? " (скрыт)" : ""}
            </option>
          ))}
        </Select>
      </div>

      {error && <p className="text-sm text-barber-danger">{error}</p>}
      {success && <p className="text-sm text-barber-success">{success}</p>}

      {barberId === null ? (
        <p className="text-barber-muted">
          Сначала добавьте хотя бы одного барбера.
        </p>
      ) : loading ? (
        <p className="text-barber-muted">Загружаем…</p>
      ) : (
        <>
          <div className="overflow-hidden rounded-card border border-barber-border bg-barber-surface">
            <table className="w-full text-sm">
              <thead className="border-b border-barber-border text-left text-barber-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">День</th>
                  <th className="px-5 py-3 font-medium">Рабочий</th>
                  <th className="px-5 py-3 font-medium">Начало</th>
                  <th className="px-5 py-3 font-medium">Конец</th>
                </tr>
              </thead>
              <tbody>
                {WEEKDAYS_RU.map((w) => {
                  const d = days.find((x) => x.weekday === w.value);
                  if (!d) return null;
                  return (
                    <tr
                      key={w.value}
                      className="border-b border-barber-border last:border-0"
                    >
                      <td className="px-5 py-3">{w.label}</td>
                      <td className="px-5 py-3">
                        <input
                          type="checkbox"
                          checked={d.enabled}
                          onChange={(e) =>
                            updateDay(w.value, { enabled: e.target.checked })
                          }
                          aria-label={`${w.label} — рабочий день`}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <input
                          type="time"
                          value={d.startTime}
                          disabled={!d.enabled}
                          onChange={(e) =>
                            updateDay(w.value, { startTime: e.target.value })
                          }
                          className="w-full rounded-md border border-barber-border bg-barber-bg px-3 py-1.5 text-barber-text focus:border-barber-accent focus:outline-none disabled:opacity-40"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <input
                          type="time"
                          value={d.endTime}
                          disabled={!d.enabled}
                          onChange={(e) =>
                            updateDay(w.value, { endTime: e.target.value })
                          }
                          className="w-full rounded-md border border-barber-border bg-barber-bg px-3 py-1.5 text-barber-text focus:border-barber-accent focus:outline-none disabled:opacity-40"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Сохраняем…" : "Сохранить расписание"}
          </Button>
        </>
      )}
    </div>
  );
}
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Badge, Select, type Column } from "@/components/ui";
import PageHeader from "@/components/admin/PageHeader";
import DataTable from "@/components/admin/DataTable";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { humanDateTime } from "@/lib/utils/date";
import type { Barber, BookingWithDetails, BookingStatus } from "@/types";

export default function AdminBookingsPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterDate, setFilterDate] = useState<string>("");
  const [filterBarber, setFilterBarber] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bRes, baRes] = await Promise.all([
        fetch("/api/admin/bookings"),
        fetch("/api/admin/barbers"),
      ]);

      if (bRes.status === 401 || baRes.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (!bRes.ok) throw new Error("Не удалось загрузить записи");

      const bData: BookingWithDetails[] = await bRes.json();
      const baData: Barber[] = baRes.ok ? await baRes.json() : [];

      setBookings(Array.isArray(bData) ? bData : []);
      setBarbers(Array.isArray(baData) ? baData : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  /* ─────────────── Фильтрация ─────────────── */

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (filterDate) {
        const day = b.startsAt.slice(0, 10);
        if (day !== filterDate) return false;
      }
      if (filterBarber && String(b.barberId) !== filterBarber) return false;
      if (filterStatus && b.status !== filterStatus) return false;
      return true;
    });
  }, [bookings, filterDate, filterBarber, filterStatus]);

  /* ─────────────── Действия ─────────────── */

  const updateStatus = async (id: number, status: BookingStatus) => {
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Не удалось обновить");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    }
  };

  const remove = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Не удалось удалить");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    }
  };

  /* ─────────────── Колонки ─────────────── */

  const columns: Column<BookingWithDetails>[] = useMemo(
    () => [
      {
        key: "when",
        header: "Когда",
        render: (b) => (
          <span className="whitespace-nowrap">
            {humanDateTime(b.startsAt)}
          </span>
        ),
      },
      {
        key: "barber",
        header: "Барбер",
        hideOnMobile: true,
        render: (b) => b.barberName,
      },
      {
        key: "service",
        header: "Услуга",
        render: (b) => b.serviceName,
      },
      {
        key: "client",
        header: "Клиент",
        render: (b) => (
          <div>
            <div>{b.clientName}</div>
            <div className="text-xs text-barber-muted">{b.clientPhone}</div>
          </div>
        ),
      },
      {
        key: "source",
        header: "Источник",
        hideOnMobile: true,
        render: (b) => (
          <span className="text-barber-muted">
            {b.source === "telegram" ? "Telegram" : "Сайт"}
          </span>
        ),
      },
      {
        key: "status",
        header: "Статус",
        render: (b) => (
          <Badge tone={b.status === "confirmed" ? "success" : "danger"}>
            {b.status === "confirmed" ? "активна" : "отменена"}
          </Badge>
        ),
      },
      {
        key: "actions",
        header: "",
        align: "right",
        render: (b) => (
          <div className="flex items-center justify-end gap-3 whitespace-nowrap">
            {b.status === "confirmed" ? (
              <ConfirmButton
                confirmText="Отменить?"
                onConfirm={() => updateStatus(b.id, "cancelled")}
                className="text-barber-danger hover:text-barber-danger/80"
              >
                Отменить
              </ConfirmButton>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateStatus(b.id, "confirmed")}
              >
                Восстановить
              </Button>
            )}
            <ConfirmButton
              confirmText="Удалить навсегда?"
              onConfirm={() => remove(b.id)}
              className="text-barber-muted hover:text-barber-danger"
            >
              Удалить
            </ConfirmButton>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /* ─────────────── Рендер ─────────────── */

  const filtersActive = Boolean(filterDate || filterBarber || filterStatus);
  const resetFilters = () => {
    setFilterDate("");
    setFilterBarber("");
    setFilterStatus("");
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Записи"
        description="Все записи с сайта и из Telegram-бота"
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()}>
            Обновить
          </Button>
        }
      />

      {error && <p className="text-sm text-barber-danger">{error}</p>}

      {/* Фильтры */}
      <div className="rounded-card border border-barber-border bg-barber-surface p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="filter-date"
              className="mb-2 block text-sm font-medium text-barber-muted"
            >
              Дата
            </label>
            <input
              id="filter-date"
              type="date"
              className="w-full rounded-md border border-barber-border bg-barber-bg px-4 py-3 text-barber-text focus:border-barber-accent focus:outline-none"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>

          <Select
            label="Барбер"
            value={filterBarber}
            onChange={(e) => setFilterBarber(e.target.value)}
          >
            <option value="">Все</option>
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>

          <Select
            label="Статус"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Все</option>
            <option value="confirmed">Подтверждена</option>
            <option value="cancelled">Отменена</option>
          </Select>
        </div>

        {filtersActive && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-barber-muted">
              Найдено: {filtered.length}
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="text-barber-accent transition-colors hover:text-barber-accentHover"
            >
              Сбросить фильтры
            </button>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(b) => b.id}
        loading={loading}
        error={null}
        empty={
          filtersActive ? "Записей по фильтру нет" : "Записей пока нет"
        }
      />
    </div>
  );
}
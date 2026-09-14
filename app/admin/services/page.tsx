"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Badge, type Column } from "@/components/ui";
import PageHeader from "@/components/admin/PageHeader";
import DataTable from "@/components/admin/DataTable";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { CURRENCY } from "@/lib/constants";
import type { Service } from "@/types";

type FormState = {
  id: number | null;
  name: string;
  durationMin: number;
  price: number;
  active: boolean;
};

const EMPTY_FORM: FormState = {
  id: null,
  name: "",
  durationMin: 30,
  price: 0,
  active: true,
};

export default function AdminServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/services");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) throw new Error("Не удалось загрузить услуги");
      const data: Service[] = await res.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const startEdit = (s: Service) => {
    setForm({
      id: s.id,
      name: s.name,
      durationMin: s.durationMin,
      price: s.price,
      active: s.active,
    });
    setFormError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.durationMin <= 0) return;

    setSaving(true);
    setFormError(null);

    const payload = {
      name: form.name.trim(),
      durationMin: Number(form.durationMin),
      price: Number(form.price),
      active: form.active,
    };

    try {
      const url = form.id ? `/api/admin/services/${form.id}` : "/api/admin/services";
      const method = form.id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Не удалось сохранить");
      }

      resetForm();
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Не удалось удалить");
      }
      if (form.id === id) resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    }
  };

  const toggleActive = async (s: Service) => {
    try {
      const res = await fetch(`/api/admin/services/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !s.active }),
      });
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      await load();
    } catch {
      /* тихо игнорируем — load() перезапишет состояние */
    }
  };

  const columns: Column<Service>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Название",
        render: (s) => <span className="font-medium">{s.name}</span>,
      },
      {
        key: "duration",
        header: "Длительность",
        hideOnMobile: true,
        render: (s) => (
          <span className="text-barber-muted">{s.durationMin} мин</span>
        ),
      },
      {
        key: "price",
        header: "Цена",
        render: (s) => (
          <span className="text-barber-accent">
            {s.price.toLocaleString("ru-RU")} {CURRENCY}
          </span>
        ),
      },
      {
        key: "status",
        header: "Статус",
        render: (s) => (
          <button
            type="button"
            onClick={() => toggleActive(s)}
            aria-label="Переключить статус"
          >
            <Badge tone={s.active ? "success" : "neutral"}>
              {s.active ? "активна" : "скрыта"}
            </Badge>
          </button>
        ),
      },
      {
        key: "actions",
        header: "",
        align: "right",
        render: (s) => (
          <div className="flex items-center justify-end gap-3 whitespace-nowrap">
            <Button variant="ghost" size="sm" onClick={() => startEdit(s)}>
              Изменить
            </Button>
            <ConfirmButton
              confirmText="Удалить?"
              onConfirm={() => handleDelete(s.id)}
              className="text-barber-danger hover:text-barber-danger/80"
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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Услуги"
        description="Название, длительность и цена"
      />

      {error && <p className="text-sm text-barber-danger">{error}</p>}

      {/* Форма создания / редактирования */}
      <form
        onSubmit={handleSubmit}
        className="rounded-card border border-barber-border bg-barber-surface p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold">
          {form.id ? "Редактирование" : "Новая услуга"}
        </h2>

        <Input
          label="Название"
          name="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Мужская стрижка"
          required
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Input
            label="Длительность (мин)"
            name="durationMin"
            type="number"
            min={5}
            max={600}
            step={5}
            value={form.durationMin}
            onChange={(e) =>
              setForm({ ...form, durationMin: Number(e.target.value) })
            }
            required
          />
          <Input
            label={`Цена (${CURRENCY})`}
            name="price"
            type="number"
            min={0}
            step={5000}
            value={form.price}
            onChange={(e) =>
              setForm({ ...form, price: Number(e.target.value) })
            }
            required
          />
          <div className="flex items-end pb-3">
            <label className="flex items-center gap-2 text-sm text-barber-muted">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Активна
            </label>
          </div>
        </div>

        {formError && <p className="text-sm text-barber-danger">{formError}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Сохраняем…" : form.id ? "Сохранить" : "Добавить"}
          </Button>
          {form.id && (
            <Button type="button" variant="outline" onClick={resetForm}>
              Отмена
            </Button>
          )}
        </div>
      </form>

      <DataTable
        columns={columns}
        rows={services}
        rowKey={(s) => s.id}
        loading={loading}
        error={null}
        empty="Услуг пока нет"
      />
    </div>
  );
}
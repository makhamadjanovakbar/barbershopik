"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Badge, type Column } from "@/components/ui";
import PageHeader from "@/components/admin/PageHeader";
import DataTable from "@/components/admin/DataTable";
import ConfirmButton from "@/components/admin/ConfirmButton";
import type { Barber } from "@/types";

type FormState = {
  id: number | null;
  name: string;
  avatarUrl: string;
  active: boolean;
};

const EMPTY_FORM: FormState = { id: null, name: "", avatarUrl: "", active: true };

export default function AdminBarbersPage() {
  const router = useRouter();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/barbers");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) throw new Error("Не удалось загрузить барберов");
      const data: Barber[] = await res.json();
      setBarbers(Array.isArray(data) ? data : []);
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

  const startEdit = (b: Barber) => {
    setForm({
      id: b.id,
      name: b.name,
      avatarUrl: b.avatarUrl ?? "",
      active: b.active,
    });
    setFormError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    setFormError(null);

    const payload = {
      name: form.name.trim(),
      avatarUrl: form.avatarUrl.trim() || null,
      active: form.active,
    };

    try {
      const url = form.id ? `/api/admin/barbers/${form.id}` : "/api/admin/barbers";
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
      const res = await fetch(`/api/admin/barbers/${id}`, { method: "DELETE" });
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

  const toggleActive = async (b: Barber) => {
    try {
      const res = await fetch(`/api/admin/barbers/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !b.active }),
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

  const columns: Column<Barber>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Имя",
        render: (b) => <span className="font-medium">{b.name}</span>,
      },
      {
        key: "avatar",
        header: "Аватар",
        hideOnMobile: true,
        render: (b) =>
          b.avatarUrl ? (
            <span className="text-barber-muted">есть</span>
          ) : (
            <span className="text-barber-muted">—</span>
          ),
      },
      {
        key: "status",
        header: "Статус",
        render: (b) => (
          <button type="button" onClick={() => toggleActive(b)} aria-label="Переключить статус">
            <Badge tone={b.active ? "success" : "neutral"}>
              {b.active ? "активен" : "скрыт"}
            </Badge>
          </button>
        ),
      },
      {
        key: "actions",
        header: "",
        align: "right",
        render: (b) => (
          <div className="flex items-center justify-end gap-3 whitespace-nowrap">
            <Button variant="ghost" size="sm" onClick={() => startEdit(b)}>
              Изменить
            </Button>
            <ConfirmButton
              confirmText="Удалить?"
              onConfirm={() => handleDelete(b.id)}
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
        title="Барберы"
        description="Добавляй, редактируй и скрывай сотрудников"
      />

      {error && <p className="text-sm text-barber-danger">{error}</p>}

      {/* Форма создания / редактирования */}
      <form
        onSubmit={handleSubmit}
        className="rounded-card border border-barber-border bg-barber-surface p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold">
          {form.id ? "Редактирование" : "Новый барбер"}
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Имя"
            name="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Игорь"
            required
          />
          <Input
            label="URL аватара (опционально)"
            name="avatarUrl"
            value={form.avatarUrl}
            onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
            placeholder="https://…"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-barber-muted">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          Активен
        </label>

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
        rows={barbers}
        rowKey={(b) => b.id}
        loading={loading}
        error={null}
        empty="Барберов пока нет"
      />
    </div>
  );
}
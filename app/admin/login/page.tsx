"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import type { ApiError } from "@/types";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const body: ApiError = await res.json().catch(() => ({ error: "Неверный пароль" }));
        throw new Error(body.error ?? "Неверный пароль");
      }

      router.push("/admin");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-card border border-barber-border bg-barber-surface p-6 space-y-5"
      >
        <div>
          <h1 className="text-2xl font-bold">
            <span className="text-barber-accent">Барбер</span>
            <span className="text-barber-text">шопик</span>
          </h1>
          <p className="mt-1 text-sm text-barber-muted">Вход в админку</p>
        </div>

        <Input
          label="Пароль"
          name="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          required
          disabled={loading}
          error={error}
        />

        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Проверяем…" : "Войти"}
        </Button>
      </form>
    </main>
  );
}
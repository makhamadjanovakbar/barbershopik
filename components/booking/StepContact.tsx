"use client";

import { useState, type ReactNode } from "react";
import { Button, Input } from "@/components/ui";
import { NAME_MIN_LENGTH, PHONE_MIN_DIGITS } from "@/lib/constants";

type StepContactProps = {
  onSubmit: (data: { clientName: string; clientPhone: string }) => void;
  submitting?: boolean;
  error?: string | null;
  /** Сводка о выбранной услуге/барбере/времени. */
  summary?: ReactNode;
};

export default function StepContact({
  onSubmit,
  submitting,
  error,
  summary,
}: StepContactProps) {
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const name = clientName.trim();
    const phone = clientPhone.trim();

    if (name.length < NAME_MIN_LENGTH) {
      setLocalError(`Укажите имя (минимум ${NAME_MIN_LENGTH} символа).`);
      return;
    }
    if (phone.replace(/\D/g, "").length < PHONE_MIN_DIGITS) {
      setLocalError("Укажите корректный номер телефона.");
      return;
    }

    onSubmit({ clientName: name, clientPhone: phone });
  };

  const displayError = localError ?? error ?? null;

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">4. Ваши контакты</h2>

      {summary && (
        <div className="mb-6 rounded-card border border-barber-border bg-barber-surface p-6">
          {summary}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-card border border-barber-border bg-barber-surface p-6 space-y-5"
      >
        <Input
          label="Имя"
          name="clientName"
          type="text"
          placeholder="Как к вам обращаться"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          autoComplete="name"
          required
          disabled={submitting}
        />

        <Input
          label="Телефон"
          name="clientPhone"
          type="tel"
          placeholder="+7 (999) 123-45-67"
          value={clientPhone}
          onChange={(e) => setClientPhone(e.target.value)}
          autoComplete="tel"
          required
          disabled={submitting}
        />

        {displayError && (
          <p className="text-sm text-barber-danger">{displayError}</p>
        )}

        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? "Записываем…" : "Подтвердить запись"}
        </Button>
      </form>
    </div>
  );
}
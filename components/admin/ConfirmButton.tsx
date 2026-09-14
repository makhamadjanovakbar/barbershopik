"use client";

import { useState } from "react";
import type { ReactNode } from "react";

type ConfirmButtonProps = {
  /** Текст кнопки в обычном состоянии. */
  children: ReactNode;
  /** Текст вопроса при подтверждении. */
  confirmText?: string;
  /** Что вызвать при подтверждении. Может быть async. */
  onConfirm: () => void | Promise<void>;
  /** Текст на кнопке «Отмена» в режиме подтверждения. */
  cancelText?: string;
  /** Дополнительные классы (цвет, размер). */
  className?: string;
  disabled?: boolean;
};

/**
 * Кнопка с подтверждением «в два клика».
 *
 * Сначала показывает `children`. При клике превращается в пару
 * кнопок «Да / Нет». Никаких нативных confirm() — не блокирует UI,
 * стилизуется как всё остальное.
 *
 * Пример:
 *   <ConfirmButton
 *     confirmText="Удалить барбера?"
 *     onConfirm={() => handleDelete(b.id)}
 *   >
 *     Удалить
 *   </ConfirmButton>
 */
export default function ConfirmButton({
  children,
  confirmText = "Точно?",
  onConfirm,
  cancelText = "Нет",
  className,
  disabled,
}: ConfirmButtonProps) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      setAsking(false);
    }
  };

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        disabled={disabled}
        className={[
          "rounded-md px-2 py-1 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm">
      <span className="text-barber-muted">{confirmText}</span>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={busy}
        className="rounded-md px-2 py-1 text-barber-danger transition-colors hover:text-barber-danger/80 disabled:opacity-40"
      >
        {busy ? "…" : "Да"}
      </button>
      <button
        type="button"
        onClick={() => setAsking(false)}
        disabled={busy}
        className="rounded-md px-2 py-1 text-barber-muted transition-colors hover:text-barber-text disabled:opacity-40"
      >
        {cancelText}
      </button>
    </span>
  );
}
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const fieldClass =
  "w-full rounded-md border border-barber-border bg-barber-bg px-4 py-3 text-barber-text placeholder:text-barber-muted focus:border-barber-accent focus:outline-none disabled:opacity-50";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string | null;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string | null;
};

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string | null;
};

/**
 * Текстовое поле с опциональным label сверху и текстом ошибки снизу.
 *
 * Примеры:
 *   <Input label="Имя" value={name} onChange={...} />
 *   <Input label="Телефон" type="tel" required />
 *   <Input label="Пароль" type="password" error="Неверный пароль" />
 */
export function Input({ label, error, id, className, ...rest }: InputProps) {
  const inputId = id ?? rest.name;
  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-barber-muted">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[fieldClass, error ? "border-barber-danger" : "", className ?? ""]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      />
      {error && <p className="mt-1 text-sm text-barber-danger">{error}</p>}
    </div>
  );
}

/** Выпадающий список в той же стилистике. */
export function Select({ label, error, id, className, children, ...rest }: SelectProps) {
  const selectId = id ?? rest.name;
  return (
    <div>
      {label && (
        <label htmlFor={selectId} className="mb-2 block text-sm font-medium text-barber-muted">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={[fieldClass, error ? "border-barber-danger" : "", className ?? ""]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-sm text-barber-danger">{error}</p>}
    </div>
  );
}

/** Многострочное поле. */
export function Textarea({ label, error, id, className, ...rest }: TextareaProps) {
  const textareaId = id ?? rest.name;
  return (
    <div>
      {label && (
        <label htmlFor={textareaId} className="mb-2 block text-sm font-medium text-barber-muted">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={[fieldClass, "min-h-[100px]", error ? "border-barber-danger" : "", className ?? ""]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      />
      {error && <p className="mt-1 text-sm text-barber-danger">{error}</p>}
    </div>
  );
}

export default Input;
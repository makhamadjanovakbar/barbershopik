import { Button } from "@/components/ui";
import { humanDateTime } from "@/lib/utils/date";
import type { BookingDTO } from "@/types";

type BookingSuccessProps = {
  booking: BookingDTO;
  /** Название услуги (из уже загруженного каталога). */
  serviceName?: string;
  /** Название барбера (или "Любой свободный"). */
  barberName?: string;
};

export default function BookingSuccess({
  booking,
  serviceName,
  barberName,
}: BookingSuccessProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-card border border-barber-border bg-barber-surface p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-barber-accent text-3xl text-barber-accent">
          ✓
        </div>

        <h1 className="text-3xl font-bold">Вы записаны!</h1>
        <p className="mt-3 text-barber-muted">
          Мы ждём вас {humanDateTime(booking.startsAt)}.
        </p>

        <dl className="mt-8 space-y-2 rounded-md border border-barber-border bg-barber-bg p-5 text-left text-sm">
          {serviceName && (
            <div className="flex justify-between gap-4">
              <dt className="text-barber-muted">Услуга</dt>
              <dd className="text-right">{serviceName}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-barber-muted">Барбер</dt>
            <dd className="text-right">{barberName ?? "Любой свободный"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-barber-muted">Имя</dt>
            <dd className="text-right">{booking.clientName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-barber-muted">Телефон</dt>
            <dd className="text-right">{booking.clientPhone}</dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/" variant="outline">
            На главную
          </Button>
          <Button href="/book">Записаться ещё</Button>
        </div>
      </div>
    </div>
  );
}
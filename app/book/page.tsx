"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import StepService from "@/components/booking/StepService";
import StepBarber from "@/components/booking/StepBarber";
import StepTime from "@/components/booking/StepTime";
import StepContact from "@/components/booking/StepContact";
import BookingSuccess from "@/components/booking/BookingSuccess";
import { CURRENCY } from "@/lib/constants";
import { humanDate } from "@/lib/utils/date";
import type {
  AvailabilityResponse,
  Barber,
  BookingDTO,
  Service,
  Slot,
} from "@/types";

type Step = 1 | 2 | 3 | 4;

const STEPS: Step[] = [1, 2, 3, 4];

export default function BookPage() {
  const [step, setStep] = useState<Step>(1);

  // Каталог
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Выбор пользователя
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [barberId, setBarberId] = useState<number | "any" | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);

  // Слоты
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Отправка
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<BookingDTO | null>(null);

  /* ─────────────────── Загрузка каталога ─────────────────── */

  useEffect(() => {
    let cancelled = false;
    setLoadingCatalog(true);

    Promise.all([
      fetch("/api/services").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/barbers").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([s, b]: [Service[], Barber[]]) => {
        if (cancelled) return;
        setServices(Array.isArray(s) ? s : []);
        setBarbers(Array.isArray(b) ? b : []);
      })
      .catch(() => {
        /* тихо игнорируем — секции покажут свои пустые состояния */
      })
      .finally(() => {
        if (!cancelled) setLoadingCatalog(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* ─────────────────── Производные значения ─────────────────── */

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId],
  );

  const selectedBarber = useMemo(() => {
    if (barberId === "any" || barberId === null) return null;
    return barbers.find((b) => b.id === barberId) ?? null;
  }, [barbers, barberId]);

  /* ─────────────────── Загрузка слотов ─────────────────── */

  const loadSlots = useCallback(async () => {
    if (!serviceId || !date) return;

    setLoadingSlots(true);
    setSlots([]);
    setSlot(null);

    const params = new URLSearchParams({
      serviceId: String(serviceId),
      date,
    });
    if (barberId !== "any" && barberId !== null) {
      params.set("barberId", String(barberId));
    }

    try {
      const res = await fetch(`/api/availability?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data: AvailabilityResponse = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [serviceId, barberId, date]);

  useEffect(() => {
    if (step === 3) void loadSlots();
  }, [step, loadSlots]);

  /* ─────────────────── Навигация по шагам ─────────────────── */

  const canProceed = {
    1: serviceId !== null,
    2: barberId !== null,
    3: date !== null && slot !== null,
    4: true,
  } as const;

  /* ─────────────────── Отправка ─────────────────── */

  const handleSubmit = async (data: {
    clientName: string;
    clientPhone: string;
  }) => {
    if (!serviceId || !slot || barberId === null) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          barberId: barberId === "any" ? undefined : barberId,
          clientName: data.clientName,
          clientPhone: data.clientPhone,
          startsAt: slot.startsAt,
          source: "web",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Не удалось создать запись");
      }

      const booking: BookingDTO = await res.json();
      setCreated(booking);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Ошибка записи");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─────────────────── Экран успеха ─────────────────── */

  if (created) {
    return (
      <main className="px-6 py-16">
        <BookingSuccess
          booking={created}
          serviceName={selectedService?.name}
          barberName={selectedBarber?.name}
        />
      </main>
    );
  }

  /* ─────────────────── Основной мастер ─────────────────── */

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm text-barber-muted transition-colors hover:text-barber-accent"
        >
          ← На главную
        </Link>
        <span className="text-sm text-barber-muted">Шаг {step} из 4</span>
      </div>

      {/* Прогресс-бар */}
      <div className="mb-10 flex gap-2">
        {STEPS.map((n) => (
          <div
            key={n}
            className={[
              "h-1 flex-1 rounded-full transition-colors",
              n <= step ? "bg-barber-accent" : "bg-barber-border",
            ].join(" ")}
          />
        ))}
      </div>

      {step === 1 && (
        <StepService
          services={services}
          selectedId={serviceId}
          onSelect={setServiceId}
          loading={loadingCatalog}
        />
      )}

      {step === 2 && (
        <StepBarber
          barbers={barbers}
          selectedId={barberId}
          onSelect={setBarberId}
          loading={loadingCatalog}
        />
      )}

      {step === 3 && (
        <StepTime
          selectedDate={date}
          onSelectDate={setDate}
          slots={slots}
          selectedSlot={slot}
          onSelectSlot={setSlot}
          loadingSlots={loadingSlots}
        />
      )}

      {step === 4 && (
        <StepContact
          onSubmit={handleSubmit}
          submitting={submitting}
          error={submitError}
          summary={
            selectedService && slot ? (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-barber-muted">Услуга</span>
                  <span className="text-right">{selectedService.name}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-barber-muted">Барбер</span>
                  <span className="text-right">
                    {selectedBarber ? selectedBarber.name : "Любой свободный"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-barber-muted">Дата и время</span>
                  <span className="text-right">
                    {date ? humanDate(date) : ""} · {slot.time}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-barber-muted">Стоимость</span>
                  <span className="text-right text-barber-accent">
                    {selectedService.price.toLocaleString("ru-RU")} {CURRENCY}
                  </span>
                </div>
              </div>
            ) : null
          }
        />
      )}

      {/* Кнопки навигации (только для шагов 1–3) */}
      {step < 4 && (
        <div className="mt-10 flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
            disabled={step === 1}
          >
            Назад
          </Button>
          <Button
            onClick={() => setStep((s) => (s < 4 ? ((s + 1) as Step) : s))}
            disabled={!canProceed[step]}
          >
            Далее
          </Button>
        </div>
      )}
    </main>
  );
}
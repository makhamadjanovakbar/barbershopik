"use client";

import Calendar from "./Calendar";
import { humanDate } from "@/lib/utils/date";
import type { Slot } from "@/types";

type StepTimeProps = {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  slots: Slot[];
  selectedSlot: Slot | null;
  onSelectSlot: (slot: Slot) => void;
  loadingSlots?: boolean;
  availableDates?: Set<string>;
};

export default function StepTime({
  selectedDate,
  onSelectDate,
  slots,
  selectedSlot,
  onSelectSlot,
  loadingSlots,
  availableDates,
}: StepTimeProps) {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">3. Выберите день и время</h2>

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        {/* Календарь */}
        <div className="rounded-card border border-barber-border bg-barber-surface p-6">
          <Calendar
            selectedDate={selectedDate}
            onSelect={onSelectDate}
            availableDates={availableDates}
          />
        </div>

        {/* Слоты */}
        <div>
          {!selectedDate ? (
            <p className="text-barber-muted">
              Сначала выберите дату в календаре.
            </p>
          ) : loadingSlots ? (
            <p className="text-barber-muted">Загружаем свободное время…</p>
          ) : slots.length === 0 ? (
            <p className="text-barber-muted">
              На этот день нет свободного времени. Попробуйте другую дату.
            </p>
          ) : (
            <>
              <p className="mb-3 text-sm text-barber-muted">
                Свободное время на {humanDate(selectedDate)}
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {slots.map((slot) => {
                  const selected = selectedSlot?.startsAt === slot.startsAt;
                  return (
                    <button
                      key={slot.startsAt}
                      type="button"
                      onClick={() => onSelectSlot(slot)}
                      aria-pressed={selected}
                      className={[
                        "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                        selected
                          ? "border-barber-accent bg-barber-accent text-barber-bg"
                          : "border-barber-border text-barber-text hover:border-barber-accent hover:text-barber-accent",
                      ].join(" ")}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
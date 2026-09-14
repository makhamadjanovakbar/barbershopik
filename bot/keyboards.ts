import { InlineKeyboard } from "grammy";
import { prisma } from "@/lib/prisma";
import {
  BOT_DAYS_AHEAD,
  BOT_SLOTS_PER_ROW,
  CURRENCY,
} from "@/lib/constants";
import { addDaysISO, humanDate, todayISO } from "@/lib/utils";
import type { Slot } from "@/types";

/**
 * Фабрики inline-клавиатур.
 *
 * Все callback_data следуют единому формату:
 *   service:<id>          — выбрана услуга
 *   barber:<id>|any       — выбран барбер
 *   date:<YYYY-MM-DD>     — выбрана дата
 *   slot:<index>          — выбран слот по индексу в ctx.session.slots
 *   back:dates            — вернуться к выбору даты
 *   cancel_booking:<id>   — отменить запись
 */

/* ─────────────────── Услуги ─────────────────── */

export async function servicesKeyboard(): Promise<InlineKeyboard> {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { id: "asc" },
  });

  const kb = new InlineKeyboard();
  for (const s of services) {
    kb.text(
      `${s.name} · ${s.durationMin} мин · ${s.price.toLocaleString("ru-RU")} ${CURRENCY}`,
      `service:${s.id}`,
    ).row();
  }
  return kb;
}

/* ─────────────────── Барберы ─────────────────── */

export async function barbersKeyboard(): Promise<InlineKeyboard> {
  const barbers = await prisma.barber.findMany({
    where: { active: true },
    orderBy: { id: "asc" },
  });

  const kb = new InlineKeyboard();
  kb.text("✦ Любой свободный", "barber:any").row();
  for (const b of barbers) {
    kb.text(b.name, `barber:${b.id}`).row();
  }
  return kb;
}

/* ─────────────────── Даты ─────────────────── */

export function datesKeyboard(): InlineKeyboard {
  const kb = new InlineKeyboard();
  const today = todayISO();

  for (let i = 0; i < BOT_DAYS_AHEAD; i += 2) {
    const d1 = addDaysISO(today, i);
    const d2 = addDaysISO(today, i + 1);

    kb.text(humanDate(d1), `date:${d1}`);
    kb.text(humanDate(d2), `date:${d2}`).row();
  }

  return kb;
}

/* ─────────────────── Слоты ─────────────────── */

export function slotsKeyboard(slots: Slot[]): InlineKeyboard {
  const kb = new InlineKeyboard();

  for (let i = 0; i < slots.length; i++) {
    kb.text(slots[i].time, `slot:${i}`);
    if ((i + 1) % BOT_SLOTS_PER_ROW === 0) kb.row();
  }

  kb.row().text("← Другая дата", "back:dates");

  return kb;
}

/* ─────────────────── Слоты недоступны ─────────────────── */

export function backToDatesKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text("← Выбрать другую дату", "back:dates");
}

/* ─────────────────── Мои записи ─────────────────── */

export type BookingForKeyboard = {
  id: number;
  startsAt: string;
};

export function myBookingsKeyboard(bookings: BookingForKeyboard[]): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const b of bookings) {
    const label = new Date(b.startsAt).toLocaleString("ru-RU", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
    kb.text(`❌ Отменить ${label}`, `cancel_booking:${b.id}`).row();
  }
  return kb;
}
import { InlineKeyboard } from "grammy";
import { prisma } from "@/lib/prisma";
import { CURRENCY, MIN_LEAD_MINUTES_BOT } from "@/lib/constants";
import { humanDate, humanDateTime } from "@/lib/utils";
import {
  computeSlotsForAnyBarber,
  computeSlotsForBarber,
  createBooking,
} from "@/lib/booking";
import {
  barbersKeyboard,
  backToDatesKeyboard,
  datesKeyboard,
  servicesKeyboard,
  slotsKeyboard,
} from "../keyboards";
import type { BotContext } from "../context";

/**
 * Основной сценарий записи в боте.
 *
 * Шаги:
 *   1. callbackQuery service:<id>   → выбор барбера
 *   2. callbackQuery barber:<id|any> → выбор даты
 *   3. callbackQuery date:<ISO>     → загрузка слотов
 *   4. callbackQuery slot:<index>   → ввод имени
 *   5. message (текст)              → имя, потом телефон
 *   6. createBooking                → успех
 *   7. callbackQuery cancel_booking:<id> → отмена записи
 *   8. callbackQuery back:dates     → возврат к выбору даты
 */

/* ─────────────────── Шаг 1: услуга ─────────────────── */

export async function handleServiceChosen(ctx: BotContext): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data) return;

  const id = Number(data.split(":")[1]);
  const service = await prisma.service.findUnique({ where: { id } });

  if (!service || !service.active) {
    await ctx.answerCallbackQuery({ text: "Услуга недоступна" });
    return;
  }

  ctx.session.serviceId = service.id;
  ctx.session.serviceName = service.name;
  ctx.session.step = "choosing_barber";

  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `Услуга: *${service.name}* — ${service.price.toLocaleString("ru-RU")} ${CURRENCY}\n\nВыберите барбера:`,
    { parse_mode: "Markdown", reply_markup: await barbersKeyboard() },
  );
}

/* ─────────────────── Шаг 2: барбер ─────────────────── */

export async function handleBarberChosen(ctx: BotContext): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data) return;

  const raw = data.split(":")[1];

  if (raw === "any") {
    ctx.session.barberId = "any";
    ctx.session.barberName = "Любой свободный";
  } else {
    const id = Number(raw);
    const barber = await prisma.barber.findUnique({ where: { id } });
    if (!barber || !barber.active) {
      await ctx.answerCallbackQuery({ text: "Барбер недоступен" });
      return;
    }
    ctx.session.barberId = barber.id;
    ctx.session.barberName = barber.name;
  }

  ctx.session.step = "choosing_date";

  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `Барбер: *${ctx.session.barberName}*\n\nВыберите дату:`,
    { parse_mode: "Markdown", reply_markup: datesKeyboard() },
  );
}

/* ─────────────────── Шаг 3: дата → слоты ─────────────────── */

export async function handleDateChosen(ctx: BotContext): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data) return;

  const date = data.split(":")[1]; // "YYYY-MM-DD"
  const { serviceId, barberId } = ctx.session;

  if (!serviceId || barberId === undefined) {
    await ctx.answerCallbackQuery({ text: "Начните заново: /start" });
    return;
  }

  await ctx.answerCallbackQuery();

  let slots: Awaited<ReturnType<typeof computeSlotsForBarber>> = [];
  try {
    if (barberId === "any") {
      const any = await computeSlotsForAnyBarber({
        serviceId,
        dateISO: date,
        minLeadMinutes: MIN_LEAD_MINUTES_BOT,
      });
      slots = any.map((x) => x.slot);
    } else {
      slots = await computeSlotsForBarber({
        barberId,
        serviceId,
        dateISO: date,
        minLeadMinutes: MIN_LEAD_MINUTES_BOT,
      });
    }
  } catch (e) {
    console.error("Ошибка расчёта слотов в боте:", e);
  }

  ctx.session.date = date;
  ctx.session.slots = slots;
  ctx.session.step = "choosing_time";

  if (slots.length === 0) {
    await ctx.editMessageText(
      `На ${humanDate(date)} нет свободного времени. Попробуйте другую дату.`,
      { reply_markup: backToDatesKeyboard() },
    );
    return;
  }

  await ctx.editMessageText(
    `Дата: *${humanDate(date)}*\n\nВыберите время:`,
    { parse_mode: "Markdown", reply_markup: slotsKeyboard(slots) },
  );
}

/* ─────────────────── Возврат к датам ─────────────────── */

export async function handleBackToDates(ctx: BotContext): Promise<void> {
  ctx.session.step = "choosing_date";
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("Выберите дату:", {
    reply_markup: datesKeyboard(),
  });
}

/* ─────────────────── Шаг 4: слот ─────────────────── */

export async function handleSlotChosen(ctx: BotContext): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data) return;

  const index = Number(data.split(":")[1]);
  const slot = ctx.session.slots?.[index];

  if (!slot) {
    await ctx.answerCallbackQuery({
      text: "Слот устарел, выберите заново",
    });
    return;
  }

  ctx.session.slotStartsAt = slot.startsAt;
  ctx.session.step = "entering_name";

  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `Время: *${slot.time}*\n\nКак вас зовут?`,
    { parse_mode: "Markdown" },
  );
}

/* ─────────────────── Шаги 5–6: имя и телефон ─────────────────── */

export async function handleTextInput(ctx: BotContext): Promise<boolean> {
  const step = ctx.session.step;
  const text = ctx.message?.text?.trim();
  if (!text) return false;

  if (step === "entering_name") {
    if (text.length < 2) {
      await ctx.reply("Имя слишком короткое. Попробуйте снова:");
      return true;
    }
    ctx.session.clientName = text;
    ctx.session.step = "entering_phone";
    await ctx.reply("Теперь телефон (например, +998 90 123-45-67):");
    return true;
  }

  if (step === "entering_phone") {
    if (text.replace(/\D/g, "").length < 9) {
      await ctx.reply("Некорректный номер. Попробуйте снова:");
      return true;
    }

    const {
      serviceId,
      serviceName,
      barberId,
      barberName,
      slotStartsAt,
      clientName,
    } = ctx.session;

    if (!serviceId || !slotStartsAt || !clientName || barberId === undefined) {
      ctx.session = { step: "idle" };
      await ctx.reply("Что-то пошло не так. Начните заново: /start");
      return true;
    }

    const result = await createBooking({
      barberId: barberId === "any" ? null : barberId,
      serviceId,
      clientName,
      clientPhone: text,
      startsAt: slotStartsAt,
      source: "telegram",
      telegramId: String(ctx.from?.id ?? ""),
    });

    // Сброс сессии в любом случае
    ctx.session = { step: "idle" };

    if (!result.ok) {
      if (
        result.code === "SLOT_TAKEN" ||
        result.code === "SLOT_UNAVAILABLE"
      ) {
        await ctx.reply(
          "⚠️ Это время только что заняли. Выберите другое: /start",
        );
      } else {
        await ctx.reply(`⚠️ Не удалось записать: ${result.error}`);
      }
      return true;
    }

    const booking = result.booking;
    const service = await prisma.service.findUnique({
      where: { id: booking.serviceId },
      select: { name: true, price: true },
    });
    const barber = await prisma.barber.findUnique({
      where: { id: booking.barberId },
      select: { name: true },
    });

    const serviceLabel = service?.name ?? serviceName ?? "";
    const priceLabel = service?.price
      ? `${service.price.toLocaleString("ru-RU")} ${CURRENCY}`
      : "";
    const barberLabel = barber?.name ?? barberName ?? "";

    await ctx.reply(
      [
        "✅ Вы записаны!",
        "",
        `📅 ${humanDateTime(booking.startsAt)}`,
        `💈 ${serviceLabel} — ${barberLabel}`,
        priceLabel ? `💰 ${priceLabel}` : null,
        `👤 ${booking.clientName}, ${booking.clientPhone}`,
        "",
        "Посмотреть все записи: /my",
        "Отменить: /cancel",
      ]
        .filter(Boolean)
        .join("\n"),
    );
    return true;
  }

  return false;
}

/* ─────────────────── Отмена записи из /my ─────────────────── */

export async function handleCancelBooking(ctx: BotContext): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data) return;

  const id = Number(data.split(":")[1]);
  const tgId = String(ctx.from?.id ?? "");

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking || booking.telegramId !== tgId) {
    await ctx.answerCallbackQuery({ text: "Не найдено" });
    return;
  }

  await prisma.booking.update({
    where: { id },
    data: { status: "cancelled" },
  });

  await ctx.answerCallbackQuery({ text: "Отменено" });
  await ctx.editMessageText("❌ Запись отменена.");
}
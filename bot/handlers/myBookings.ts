import { prisma } from "@/lib/prisma";
import { CURRENCY } from "@/lib/constants";
import { humanDateTime } from "@/lib/utils";
import { listBookingsByTelegramId } from "@/lib/booking";
import { myBookingsKeyboard } from "../keyboards";
import type { BotContext } from "../context";

/**
 * Обработчик команды /my.
 *
 * Показывает список активных (confirmed) записей клиента,
 * полученных по его telegramId. Под каждой — inline-кнопка отмены.
 */
export async function handleMyBookings(ctx: BotContext): Promise<void> {
  const tgId = String(ctx.from?.id ?? "");
  if (!tgId) {
    await ctx.reply("Не удалось определить ваш Telegram ID.");
    return;
  }

  const bookings = await listBookingsByTelegramId(tgId);

  if (bookings.length === 0) {
    await ctx.reply(
      "У вас пока нет активных записей.\n\nЗаписаться: /start",
    );
    return;
  }

  // Достаём названия услуг и барберов одним запросом на каждую таблицу
  const serviceIds = [...new Set(bookings.map((b) => b.serviceId))];
  const barberIds = [...new Set(bookings.map((b) => b.barberId))];

  const [services, barbers] = await Promise.all([
    prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true, price: true },
    }),
    prisma.barber.findMany({
      where: { id: { in: barberIds } },
      select: { id: true, name: true },
    }),
  ]);

  const serviceMap = new Map(services.map((s) => [s.id, s]));
  const barberMap = new Map(barbers.map((b) => [b.id, b]));

  const lines: string[] = ["📋 Ваши активные записи:", ""];

  for (const b of bookings) {
    const service = serviceMap.get(b.serviceId);
    const barber = barberMap.get(b.barberId);

    lines.push(`• ${humanDateTime(b.startsAt)}`);
    lines.push(
      `  ${service?.name ?? "—"} — ${barber?.name ?? "—"}`,
    );
    if (service?.price) {
      lines.push(
        `  💰 ${service.price.toLocaleString("ru-RU")} ${CURRENCY}`,
      );
    }
    lines.push("");
  }

  lines.push("Отменить запись — нажмите на кнопку ниже.");

  await ctx.reply(lines.join("\n"), {
    reply_markup: myBookingsKeyboard(
      bookings.map((b) => ({ id: b.id, startsAt: b.startsAt })),
    ),
  });
}
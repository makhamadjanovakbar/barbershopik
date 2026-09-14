import { Bot, session } from "grammy";
import { initialSession, type BotContext } from "./context";
import {
  handleCancel,
  handleHelp,
  handleStart,
} from "./handlers/start";
import {
  handleBackToDates,
  handleBarberChosen,
  handleCancelBooking,
  handleDateChosen,
  handleServiceChosen,
  handleSlotChosen,
  handleTextInput,
} from "./handlers/booking";
import { handleMyBookings } from "./handlers/myBookings";
import { handleFallback } from "./handlers/fallback";

/**
 * Точка входа Telegram-бота «Барбершопик».
 *
 * Запуск: npm run bot
 * Требует TELEGRAM_BOT_TOKEN в .env.
 *
 * Использует ту же БД и ту же booking-логику, что и сайт
 * (lib/booking, lib/prisma). Никакого дублирования правил.
 */

/* ─────────────────── Токен ─────────────────── */

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("❌ TELEGRAM_BOT_TOKEN не задан в .env");
  process.exit(1);
}

/* ─────────────────── Бот ─────────────────── */

const bot = new Bot<BotContext>(token);

// Сессия хранится в памяти процесса
bot.use(session({ initial: initialSession }));

/* ─────────────────── Команды ─────────────────── */

bot.command("start", handleStart);
bot.command("help", handleHelp);
bot.command("cancel", handleCancel);
bot.command("my", handleMyBookings);

/* ─────────────────── Callback-кнопки ─────────────────── */

bot.callbackQuery(/^service:(\d+)$/, handleServiceChosen);
bot.callbackQuery(/^barber:(any|\d+)$/, handleBarberChosen);
bot.callbackQuery(/^date:(\d{4}-\d{2}-\d{2})$/, handleDateChosen);
bot.callbackQuery(/^slot:(\d+)$/, handleSlotChosen);
bot.callbackQuery("back:dates", handleBackToDates);
bot.callbackQuery(/^cancel_booking:(\d+)$/, handleCancelBooking);

/* ─────────────────── Текстовые сообщения ─────────────────── */

/**
 * Единый обработчик текста:
 *   1. Пробуем сценарный ввод (имя, телефон).
 *   2. Если не наш сценарий — fallback.
 */
bot.on("message:text", async (ctx) => {
  const handled = await handleTextInput(ctx);
  if (!handled) await handleFallback(ctx);
});

/* ─────────────────── Не-текстовые сообщения ─────────────────── */

bot.on("message", async (ctx) => {
  await ctx.reply(
    "Я понимаю только текстовые сообщения и кнопки. Попробуйте /start или /help.",
  );
});

/* ─────────────────── Ошибки ─────────────────── */

bot.catch((err) => {
  console.error("Bot error:", err);
});

/* ─────────────────── Запуск ─────────────────── */

console.log("🤖 Бот «Барбершопик» запущен. Жду сообщения…");
bot.start({
  onStart: (me) => {
    console.log(`   @${me.username} — https://t.me/${me.username}`);
  },
});
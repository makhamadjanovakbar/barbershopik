import { servicesKeyboard } from "../keyboards";
import { initialSession, type BotContext } from "../context";

/**
 * Обработчики команд /start, /help, /cancel.
 *
 * /start  — начать новую запись (сбрасывает сессию)
 * /help   — список команд
 * /cancel — сбросить текущий диалог
 */

export async function handleStart(ctx: BotContext): Promise<void> {
  ctx.session = initialSession();
  ctx.session.step = "choosing_service";

  await ctx.reply(
    "✂️ Добро пожаловать в барбершоп «Барбершопик»!\n\nВыберите услугу:",
    { reply_markup: await servicesKeyboard() },
  );
}

export async function handleHelp(ctx: BotContext): Promise<void> {
  await ctx.reply(
    [
      "Доступные команды:",
      "/start — записаться",
      "/my — мои записи",
      "/cancel — отменить текущий диалог",
      "/help — эта справка",
    ].join("\n"),
  );
}

export async function handleCancel(ctx: BotContext): Promise<void> {
  ctx.session = initialSession();
  await ctx.reply("Диалог сброшен. Начать заново: /start");
}
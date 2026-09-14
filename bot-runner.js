// Простой HTTP-сервер для Render + запуск Telegram-бота
const http = require("http");
const { spawn } = require("child_process");

const PORT = process.env.PORT || 3000;

// Запускаем бота как дочерний процесс
console.log("🚀 Запускаем Telegram-бота...");
const bot = spawn("npx", ["tsx", "bot/index.ts"], {
  stdio: "inherit",
  shell: true,
});

bot.on("error", (err) => {
  console.error("❌ Ошибка запуска бота:", err);
});

bot.on("exit", (code) => {
  console.log(`Бот завершился с кодом ${code}`);
  process.exit(code);
});

// HTTP-сервер, чтобы Render видел открытый порт
const server = http.createServer((req, res) => {
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("OK: Бот «Барбершопик» работает");
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Health-check сервер слушает порт ${PORT}`);
});
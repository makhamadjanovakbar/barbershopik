import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Начальные данные для демо «Барбершопик».
 *  - 3 барбера (Игорь, Максим, Артём)
 *  - 4 услуги (цены в сумах)
 *  - Расписание: Пн–Сб, 10:00–20:00, у каждого барбера
 *
 * Скрипт идемпотентный: сначала чистит таблицы, потом заливает заново.
 */
async function main() {
  console.log("🌱 Seeding database…");

  await prisma.booking.deleteMany();
  await prisma.scheduleException.deleteMany();
  await prisma.workSchedule.deleteMany();
  await prisma.service.deleteMany();
  await prisma.barber.deleteMany();

  /* ─────────────── Барберы ─────────────── */

  const igor = await prisma.barber.create({
    data: { name: "Игорь", avatarUrl: null, active: true },
  });
  const maxim = await prisma.barber.create({
    data: { name: "Максим", avatarUrl: null, active: true },
  });
  const artem = await prisma.barber.create({
    data: { name: "Артём", avatarUrl: null, active: true },
  });

  console.log(`✅ Барберы: ${igor.name}, ${maxim.name}, ${artem.name}`);

  /* ─────────────── Услуги (цены в сумах) ─────────────── */

  const services = await Promise.all([
    prisma.service.create({
      data: { name: "Мужская стрижка", durationMin: 45, price: 60_000, active: true },
    }),
    prisma.service.create({
      data: { name: "Стрижка бороды", durationMin: 30, price: 40_000, active: true },
    }),
    prisma.service.create({
      data: { name: "Стрижка + борода", durationMin: 75, price: 90_000, active: true },
    }),
    prisma.service.create({
      data: { name: "Бритьё опасной бритвой", durationMin: 40, price: 50_000, active: true },
    }),
  ]);

  console.log(`✅ Услуги: ${services.map((s) => s.name).join(", ")}`);

  /* ─────────────── Расписание ─────────────── */

  const WEEKDAYS = [1, 2, 3, 4, 5, 6];
  const START = "10:00";
  const END = "20:00";

  const scheduleRows = [igor, maxim, artem].flatMap((barber) =>
    WEEKDAYS.map((weekday) => ({
      barberId: barber.id,
      weekday,
      startTime: START,
      endTime: END,
    })),
  );

  await prisma.workSchedule.createMany({ data: scheduleRows });

  console.log(
    `✅ Расписание: ${scheduleRows.length} интервалов (Пн–Сб, ${START}–${END})`,
  );

  console.log("🌱 Seeding complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
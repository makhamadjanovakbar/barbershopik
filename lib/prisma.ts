import { PrismaClient } from "@prisma/client";

/**
 * Singleton PrismaClient.
 *
 * В dev-режиме Next.js перезагружает модули при каждом изменении файла.
 * Без этого трюка каждый hot-reload создавал бы новое подключение к SQLite,
 * быстро исчерпывая лимит открытых файлов.
 *
 * Решение — хранить клиент в globalThis, который не перезагружается.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
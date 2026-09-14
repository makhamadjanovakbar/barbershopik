import { Card } from "@/components/ui";

export default function ContactsSection() {
  const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME;

  return (
    <section id="contacts" className="border-b border-barber-border py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12">
          <h2 className="text-4xl font-bold md:text-5xl">Контакты</h2>
          <p className="mt-3 text-barber-muted">
            Приходи без записи или бронируй время заранее.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <h3 className="text-xs uppercase tracking-widest text-barber-muted">
              Адрес
            </h3>
            <p className="mt-3 text-lg">г. Ташкент, ул. Амира Темура, 12</p>
            <p className="mt-1 text-sm text-barber-muted">
              м. Амир Темур, 3 мин пешком
            </p>
          </Card>

          <Card>
            <h3 className="text-xs uppercase tracking-widest text-barber-muted">
              Телефон
            </h3>
            <a
              href="tel:+998901234567"
              className="mt-3 block text-lg text-barber-accent transition-colors hover:text-barber-accentHover"
            >
              +998 90 123-45-67
            </a>
            <p className="mt-1 text-sm text-barber-muted">
              Ежедневно с 10:00 до 20:00
            </p>
          </Card>

          <Card>
            <h3 className="text-xs uppercase tracking-widest text-barber-muted">
              Telegram
            </h3>
            <p className="mt-3 text-lg">Запись через бота</p>
            {botUsername ? (
              <a
                href={`https://t.me/${botUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-barber-accent transition-colors hover:text-barber-accentHover"
              >
                @{botUsername}
              </a>
            ) : (
              <p className="mt-1 text-sm text-barber-muted">
                Бот скоро появится
              </p>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
import { Button } from "@/components/ui";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-barber-border">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, #d4af37 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-8 px-6 py-24 md:py-32">
        <span className="rounded-full border border-barber-border px-4 py-1 text-xs uppercase tracking-widest text-barber-muted">
          Мужской барбершоп
        </span>

        <h1 className="max-w-3xl text-5xl font-bold leading-tight md:text-7xl">
          <span className="text-barber-accent">Барбер</span>
          <span className="text-barber-text">шопик</span>
          <span className="block text-barber-text">
            стрижка, борода, характер.
          </span>
        </h1>

        <p className="max-w-xl text-lg text-barber-muted">
          Барбершоп для мужчин без лишнего пафоса. Запишись онлайн — на сайте
          или прямо в Telegram. Выбери барбера, услугу и удобное время.
        </p>

        <div className="flex flex-wrap gap-4">
          <Button href="/book">Записаться онлайн</Button>
          <Button href="/#services" variant="outline">
            Смотреть услуги
          </Button>
        </div>
      </div>
    </section>
  );
}
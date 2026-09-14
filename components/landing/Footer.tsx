export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-barber-muted md:flex-row">
        <p>
          © {year}{" "}
          <span className="text-barber-accent">Барбершопик</span>. Все права
          защищены.
        </p>
        <p>Мужской барбершоп · Ташкент</p>
      </div>
    </footer>
  );
}
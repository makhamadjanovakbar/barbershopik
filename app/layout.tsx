import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Барбершопик — мужской барбершоп",
    template: "%s · Барбершопик",
  },
  description:
    "Барбершопик — мужской барбершоп. Стрижка, борода, уход. Онлайн-запись через сайт и Telegram.",
  applicationName: "Барбершопик",
};

export const viewport: Viewport = {
  themeColor: "#0a1418",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen text-barber-text antialiased">
        {children}
      </body>
    </html>
  );
}
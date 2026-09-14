import type { Metadata } from "next";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import ServicesSection from "@/components/landing/ServicesSection";
import BarbersSection from "@/components/landing/BarbersSection";
import ContactsSection from "@/components/landing/ContactsSection";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: { absolute: "Барбершопик — мужской барбершоп" },
  description:
    "Мужской барбершоп «Барбершопик». Стрижка, борода, бритьё. Онлайн-запись через сайт и Telegram.",
};

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ServicesSection />
        <BarbersSection />
        <ContactsSection />
      </main>
      <Footer />
    </>
  );
}
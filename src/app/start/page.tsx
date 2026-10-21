import type { Metadata } from "next";
import SimpleHeader from "@/components/SimpleHeader";
import Footer from "@/components/Footer";
import OffersPage from "@/components/offers/OffersPage";

export const metadata: Metadata = {
  title: "Pricing & packages",
  description: "Instagram Health Check, Full Business Diagnostic, Strategy Sessions, Coaching and monthly social media management for Irish businesses.",
  alternates: { canonical: "https://irishbusinessboosters.com/start" },
};

export default function StartHerePage() {
  return (
    <>
      <div className="grain-overlay" />
      <SimpleHeader cta={{ href: "/start/healthcheck", label: "Health Check · €29" }} />
      <OffersPage />
      <Footer />
    </>
  );
}

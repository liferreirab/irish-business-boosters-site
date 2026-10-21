import type { Metadata } from "next";
import SimpleHeader from "@/components/SimpleHeader";
import Footer from "@/components/Footer";
import WorkWithUs from "@/components/offers/WorkWithUs";

export const metadata: Metadata = {
  title: "Work with us",
  description: "Instagram Health Check, Full Business Diagnostic, Strategy Sessions, Coaching and monthly social media management for Irish businesses.",
  alternates: { canonical: "https://irishbusinessboosters.com/work-with-us" },
};

export default function WorkWithUsPage() {
  return (
    <>
      <div className="grain-overlay" />
      <SimpleHeader cta={{ href: "/start/healthcheck", label: "Health Check · €29" }} />
      <WorkWithUs />
      <Footer />
    </>
  );
}

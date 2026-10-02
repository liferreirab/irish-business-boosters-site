import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { TrendingUp } from "lucide-react";
import CheckForm from "@/components/CheckForm";

export const metadata: Metadata = {
  title: "Your free online check",
  description: "A quick, free check of how your business looks online.",
  robots: { index: false, follow: false },
};

export default function CheckPage() {
  return (
    <>
      <div className="grain-overlay" />
      <header className="mx-auto flex w-full max-w-3xl items-center px-6 py-6">
        <Link href="/" className="flex items-center gap-2">
          <TrendingUp className="text-coral" size={22} strokeWidth={2.5} />
          <span className="font-display text-lg leading-none">
            <span className="brand-accent">Irish</span>{" "}
            <span className="font-bold text-ink">Business Boosters</span>
          </span>
        </Link>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-20">
        <Suspense fallback={<div className="min-h-[60vh]" />}>
          <CheckForm />
        </Suspense>
      </main>
    </>
  );
}

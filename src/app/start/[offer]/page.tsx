import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Clock, ShieldCheck } from "lucide-react";
import SimpleHeader from "@/components/SimpleHeader";
import OfferForm from "@/components/OfferForm";
import { OFFERS, getOffer } from "@/lib/offers";

export const dynamicParams = false;

export function generateStaticParams() {
  return OFFERS.map((o) => ({ offer: o.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ offer: string }> }): Promise<Metadata> {
  const offer = getOffer((await params).offer);
  return {
    title: offer?.name,
    description: offer?.tagline,
    robots: { index: false, follow: false },
  };
}

export default async function StartPage({ params }: { params: Promise<{ offer: string }> }) {
  const offer = getOffer((await params).offer);
  if (!offer) notFound();

  return (
    <>
      <div className="grain-overlay" />
      <SimpleHeader back={{ href: "/start", label: "All options" }} />
      <main className="relative flex-1 overflow-x-clip">
        <div className="blob animate-float-slow -left-32 top-0 h-[24rem] w-[24rem] bg-coral/10" />
        <div className="blob animate-float-slower right-[-8rem] top-1/2 h-[22rem] w-[22rem] bg-teal/15" />

        <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-6 pb-24 pt-12 lg:grid-cols-[1.25fr_1fr] lg:gap-14 lg:px-8 lg:pt-16">
          <div className="lg:order-1">
            <p className="overline mb-4">{offer.name}</p>
            <h1 className="font-display text-4xl font-bold leading-[1.1] text-ink sm:text-5xl">{offer.tagline}</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-body">{offer.body}</p>
            <p className="mt-6 inline-flex items-center gap-3 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-ink shadow-sm lg:hidden">
              <span className="font-display text-lg text-coral">{offer.price}</span>
              <span className="h-4 w-px bg-ink/15" />
              <a href="#summary" className="font-medium text-body underline-offset-4 hover:underline">What&apos;s included</a>
            </p>
            <OfferForm offer={offer} />
          </div>

          <aside id="summary" className="scroll-mt-24 lg:order-2">
            <div className="relative overflow-hidden rounded-[2rem] bg-ink p-7 text-cream shadow-[0_32px_80px_-24px_rgba(44,44,42,0.55)] sm:p-8 lg:sticky lg:top-24">
              <div className="blob -right-16 -top-16 h-56 w-56 bg-coral/30" />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cream/50">Your order</p>
                <div className="mt-3 flex items-baseline justify-between gap-4">
                  <h2 className="font-display text-2xl font-bold">{offer.name}</h2>
                  <p className="font-display text-4xl font-bold text-coral-soft">{offer.price}</p>
                </div>
                <p className="mt-2 text-sm text-cream/60">{offer.audience}</p>

                <ul className="mt-6 space-y-3 border-t border-cream/15 pt-6">
                  {offer.includes.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-cream/85">
                      <Check className="mt-0.5 shrink-0 text-teal" size={16} />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 space-y-3 border-t border-cream/15 pt-6 text-sm text-cream/70">
                  <p className="flex items-start gap-3">
                    <Clock className="mt-0.5 shrink-0 text-coral-soft" size={16} />
                    {offer.delivery}
                  </p>
                  <p className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 shrink-0 text-coral-soft" size={16} />
                    Secure card payment. No contracts, no hard sell.
                  </p>
                </div>

                {offer.note && (
                  <p className="mt-6 rounded-2xl bg-cream/10 p-4 text-sm text-cream/85 ring-1 ring-cream/15">{offer.note}</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

"use client";

import { Compass, Target } from "lucide-react";
import Reveal from "./ui/Reveal";

export default function About() {
  return (
    <section id="about" className="relative overflow-hidden py-28 lg:py-36">
      <div className="absolute -left-40 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full bg-teal/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <Reveal>
              <p className="overline mb-4">About Us</p>
              <h2 className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl lg:text-5xl">
                A local team that{" "}
                <span className="brand-accent">gets</span> your business.
              </h2>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-body">
                Irish Business Boosters is a full-service digital marketing
                agency built for small and medium-sized businesses across
                Ireland. We&apos;re based in Waterford, and we understand the
                local market — the challenges, the seasons, and what it
                actually takes to grow here.
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-body">
                No five different suppliers. No confusing reports. Just one
                team that handles your social media, ads, website, and
                content — and tells you straight what&apos;s working.
              </p>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="mt-10 flex flex-wrap gap-x-10 gap-y-6 border-t border-ink/10 pt-8">
                {[
                  { value: "4", label: "Services under one roof" },
                  { value: "1", label: "Point of contact, always" },
                  { value: "100%", label: "Based in Waterford, Ireland" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="font-display text-3xl font-bold text-coral">
                      {stat.value}
                    </p>
                    <p className="mt-1 max-w-[12rem] text-sm text-mid-grey">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-5">
            <Reveal delay={0.15} y={36}>
              <div className="flex flex-col gap-6">
                <div className="rounded-3xl border border-ink/10 bg-cream-deep/60 p-8 shadow-[0_20px_60px_-30px_rgba(44,44,42,0.25)]">
                  <div className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-coral/15 text-coral">
                    <Target size={20} />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-ink">
                    Our Mission
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-body">
                    To empower small and medium-sized businesses in Ireland
                    to grow online through accessible, strategic, and
                    results-driven digital marketing.
                  </p>
                </div>

                <div className="rounded-3xl border border-ink/10 bg-ink p-8 text-cream shadow-[0_20px_60px_-30px_rgba(44,44,42,0.45)]">
                  <div className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-teal/20 text-teal">
                    <Compass size={20} />
                  </div>
                  <h3 className="font-display text-xl font-semibold">
                    Where We&apos;re Headed
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-cream/75">
                    To become the go-to digital marketing partner for Irish
                    SMEs who want a professional online presence — without
                    the cost and complexity of a large agency.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

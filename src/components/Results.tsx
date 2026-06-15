"use client";

import { motion } from "framer-motion";
import { Megaphone, Target, MonitorSmartphone } from "lucide-react";
import Reveal from "./ui/Reveal";

const PLACEHOLDERS = [
  {
    icon: Megaphone,
    tag: "Social Media",
    business: "Local gym, Waterford",
  },
  {
    icon: Target,
    tag: "Paid Advertising",
    business: "Hair salon, Co. Kilkenny",
  },
  {
    icon: MonitorSmartphone,
    tag: "Website Creation",
    business: "Family restaurant, Wexford",
  },
];

export default function Results() {
  return (
    <section className="relative py-28 lg:py-36">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <Reveal>
          <p className="overline mb-4 text-center">Results</p>
          <h2 className="mx-auto max-w-3xl text-center font-display text-3xl font-bold leading-tight text-ink sm:text-4xl lg:text-5xl">
            Real businesses.{" "}
            <span className="brand-accent">Real growth.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-relaxed text-body">
            We&apos;re onboarding our first Waterford clients right now —
            case studies and numbers will land here soon. Transparency means
            we won&apos;t make up results before we&apos;ve earned them.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {PLACEHOLDERS.map(({ icon: Icon, tag, business }, i) => (
            <Reveal key={business} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex h-full flex-col items-start rounded-3xl border-2 border-dashed border-ink/15 bg-cream-deep/30 p-7"
              >
                <div className="grid h-12 w-12 place-items-center rounded-full bg-ink/5 text-ink/40">
                  <Icon size={20} />
                </div>
                <p className="overline mt-5">{tag}</p>
                <p className="mt-2 font-display text-lg font-semibold text-ink/70">
                  {business}
                </p>
                <p className="mt-3 text-sm text-mid-grey">
                  Case study coming soon
                </p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

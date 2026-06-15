"use client";

import { motion } from "framer-motion";
import { Eye, Heart, Wrench, TrendingUp, Check, X } from "lucide-react";
import Reveal from "./ui/Reveal";

const VALUES = [
  {
    icon: Eye,
    title: "Transparency",
    body: "No empty promises. You'll always know what we're doing, why, and what it's achieving.",
    tone: "cream",
  },
  {
    icon: Heart,
    title: "Proximity",
    body: "No marketing-speak. Just straight talk about what's working and what's next.",
    tone: "ink",
  },
  {
    icon: Wrench,
    title: "Practicality",
    body: "No fluff, no delays, no endless revisions for the sake of it. We solve problems and deliver.",
    tone: "cream",
  },
  {
    icon: TrendingUp,
    title: "Real Growth",
    body: "Likes don't pay bills. We focus on more customers, more revenue, more visibility.",
    tone: "coral",
  },
] as const;

const VOICE_PAIRS = [
  {
    bad: "We leverage omnichannel synergies to maximise brand equity.",
    good: "We make sure your business is visible everywhere your customers are looking.",
  },
  {
    bad: "Our data-driven solutions optimise your conversion funnel.",
    good: "We run ads that bring real customers through your door.",
  },
  {
    bad: "We provide end-to-end content creation ecosystems.",
    good: "We come to your business and film the content — you just keep doing what you do.",
  },
];

const toneStyles: Record<string, string> = {
  cream: "bg-cream-deep/60 text-ink border-ink/10",
  ink: "bg-ink text-cream border-ink",
  coral: "bg-coral text-cream border-coral",
};

const iconToneStyles: Record<string, string> = {
  cream: "bg-coral/15 text-coral",
  ink: "bg-teal/20 text-teal",
  coral: "bg-cream/20 text-cream",
};

export default function WhyUs() {
  return (
    <section id="why-us" className="relative py-28 lg:py-36">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <Reveal>
          <p className="overline mb-4 text-center">Why IBB</p>
          <h2 className="mx-auto max-w-3xl text-center font-display text-3xl font-bold leading-tight text-ink sm:text-4xl lg:text-5xl">
            One team. One point of contact.{" "}
            <span className="brand-accent">One clear strategy.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-relaxed text-body">
            Running a business is hard enough without juggling a social media
            person, an ads person, and a web developer who don&apos;t talk to
            each other. We bring it all together — toward the same goal:
            real growth for your business.
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ icon: Icon, title, body, tone }, i) => (
            <Reveal key={title} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`flex h-full flex-col rounded-3xl border p-7 ${toneStyles[tone]}`}
              >
                <div
                  className={`mb-5 grid h-12 w-12 place-items-center rounded-full ${iconToneStyles[tone]}`}
                >
                  <Icon size={22} />
                </div>
                <h3 className="font-display text-xl font-semibold">
                  {title}
                </h3>
                <p
                  className={`mt-3 text-sm leading-relaxed ${
                    tone === "cream" ? "text-body" : "opacity-80"
                  }`}
                >
                  {body}
                </p>
              </motion.div>
            </Reveal>
          ))}
        </div>

        {/* Voice / "how we talk" comparison */}
        <Reveal delay={0.1}>
          <div className="mt-24 overflow-hidden rounded-3xl border border-ink/10 bg-cream-deep/50">
            <div className="grid grid-cols-1 divide-y divide-ink/10 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              <div className="bg-ink/[0.03] p-8 lg:p-10">
                <p className="overline mb-6 !text-mid-grey">
                  Instead of this
                </p>
                <ul className="space-y-6">
                  {VOICE_PAIRS.map((pair) => (
                    <li
                      key={pair.bad}
                      className="flex gap-3 font-display text-base italic leading-relaxed text-mid-grey"
                    >
                      <X
                        size={18}
                        className="mt-1 shrink-0 text-coral/60"
                      />
                      {pair.bad}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-8 lg:p-10">
                <p className="overline mb-6">We say this</p>
                <ul className="space-y-6">
                  {VOICE_PAIRS.map((pair) => (
                    <li
                      key={pair.good}
                      className="flex gap-3 text-base font-medium leading-relaxed text-ink"
                    >
                      <Check
                        size={18}
                        className="mt-1 shrink-0 text-teal-deep"
                      />
                      {pair.good}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

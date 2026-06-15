"use client";

import { motion } from "framer-motion";
import { Megaphone, Target, MonitorSmartphone, Camera } from "lucide-react";
import Reveal from "./ui/Reveal";

const SERVICES = [
  {
    icon: Megaphone,
    title: "Social Media Management",
    headline: "Your social media, finally consistent.",
    body: "We manage your Instagram and Facebook from start to finish — strategy, copywriting, scheduling, and community management.",
    items: [
      "Content strategy tailored to your business",
      "Copywriting in your brand's voice",
      "Scheduling and publishing",
      "Community management",
    ],
    accent: "coral",
  },
  {
    icon: Target,
    title: "Paid Advertising",
    headline: "Ads that bring customers through your door.",
    body: "Meta Ads and Google Ads campaigns — built, targeted, and optimised by people who actually know what they're doing.",
    items: [
      "Campaign setup and targeting",
      "Ad creative",
      "Ongoing optimisation",
      "Clear reporting on what's working",
    ],
    accent: "teal",
  },
  {
    icon: MonitorSmartphone,
    title: "Website Creation",
    headline: "A website that works as hard as you do.",
    body: "Fast, mobile-first websites tailored to your business, designed to turn visitors into enquiries and customers.",
    items: [
      "Custom design tailored to your brand",
      "Mobile-first, fast-loading pages",
      "Clear calls-to-action built to convert",
      "Easy for you to update going forward",
    ],
    accent: "coral",
  },
  {
    icon: Camera,
    title: "Content Production",
    headline: "Real content, filmed on-site.",
    body: "We come to your business and create the content — Reels, testimonials, behind-the-scenes, brand storytelling.",
    items: [
      "On-site photo and video shoots",
      "Reels and short-form video content",
      "Customer testimonials",
      "Brand storytelling content",
    ],
    accent: "teal",
  },
] as const;

const accentStyles: Record<string, { icon: string; ring: string; dot: string }> = {
  coral: {
    icon: "bg-coral/15 text-coral",
    ring: "hover:border-coral/40",
    dot: "bg-coral",
  },
  teal: {
    icon: "bg-teal/15 text-teal-deep",
    ring: "hover:border-teal/50",
    dot: "bg-teal-deep",
  },
};

export default function Services() {
  return (
    <section id="services" className="relative overflow-hidden py-28 lg:py-36">
      <div className="absolute right-[-10rem] top-1/4 h-[30rem] w-[30rem] rounded-full bg-coral/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        <Reveal>
          <p className="overline mb-4 text-center">What We Do</p>
          <h2 className="mx-auto max-w-3xl text-center font-display text-3xl font-bold leading-tight text-ink sm:text-4xl lg:text-5xl">
            Everything your business needs to be{" "}
            <span className="brand-accent">found, chosen, and remembered.</span>
          </h2>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {SERVICES.map(({ icon: Icon, title, headline, body, items, accent }, i) => (
            <Reveal key={title} delay={(i % 2) * 0.1}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`group h-full rounded-3xl border border-ink/10 bg-cream-deep/40 p-8 transition-colors duration-300 lg:p-9 ${accentStyles[accent].ring}`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`grid h-14 w-14 place-items-center rounded-2xl ${accentStyles[accent].icon}`}
                  >
                    <Icon size={26} />
                  </div>
                  <span className="font-display text-5xl font-bold text-ink/5 transition-colors duration-300 group-hover:text-ink/10">
                    0{i + 1}
                  </span>
                </div>

                <p className="overline mt-6 mb-2">{title}</p>
                <h3 className="font-display text-2xl font-bold leading-snug text-ink">
                  {headline}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-body">
                  {body}
                </p>

                <ul className="mt-6 space-y-2.5 border-t border-ink/10 pt-6">
                  {items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm text-body"
                    >
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${accentStyles[accent].dot}`}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

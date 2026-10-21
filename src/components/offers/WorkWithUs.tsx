"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, ChevronDown, ClipboardList, Mail, Search, Sparkles } from "lucide-react";
import AnimatedButton from "../ui/AnimatedButton";
import Reveal from "../ui/Reveal";
import ReportMockup from "./ReportMockup";
import { OFFERS } from "@/lib/offers";

// Cheapest first, so the page reads as a ladder.
const LADDER = ["healthcheck", "session", "diagnostic", "coaching"].map((slug) => OFFERS.find((o) => o.slug === slug)!);

const NICHES = ["Cafés", "Restaurants", "Hair salons", "Beauty clinics", "Gyms", "Trades", "Kitchens & furniture", "Garden services", "Health clinics", "Shops"];

const STEPS = [
  { icon: ClipboardList, title: "Tell us about your business", body: "Two minutes: your Instagram, what you do and what you want more of." },
  { icon: Search, title: "We look at it like a customer would", body: "Your bio, your posts, your Reels, how easy you are to contact. Every report is checked by our team before it goes out." },
  { icon: Mail, title: "Your report, in your inbox", body: "Within 2 working days of payment. Clear, visual, no jargon, and yours to keep." },
];

const FAQ = [
  { q: "Do I need to be in Waterford?", a: "Not at all. The Health Check arrives by email and every call happens on Google Meet, so we work with businesses anywhere in Ireland." },
  { q: "I'm barely on Instagram. Is it still worth it?", a: "Yes. The report shows you exactly where to start, so you don't waste months guessing. If Facebook is where your customers are, mention it in the form." },
  { q: "How do I pay?", a: "By card, Apple Pay or Google Pay through a secure Stripe checkout. You get a receipt by email straight away." },
  { q: "Is the money really taken off later?", a: "Yes. Book the Full Business Diagnostic within 30 days of your Health Check and we take the €29 off. Sign up for monthly management within 30 days of your Diagnostic and the full €297 comes off your first month." },
  { q: "Will I be pushed into signing up for more?", a: "No. Every option stands on its own. No contracts, no hard sell. If you want more help, you'll know where to find us." },
];

export default function WorkWithUs() {
  return (
    <main className="flex-1 overflow-x-clip">
      {/* Hero */}
      <section className="relative">
        <div className="blob animate-float-slow -left-32 top-10 h-[26rem] w-[26rem] bg-coral/15" />
        <div className="blob animate-float-slower right-[-6rem] top-1/3 h-[22rem] w-[22rem] bg-teal/20" />

        <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-16 px-6 pb-24 pt-14 lg:grid-cols-2 lg:px-8 lg:pb-32 lg:pt-20">
          <div>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="overline mb-5">
              Work with us
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-display text-4xl font-bold leading-[1.1] text-ink sm:text-5xl lg:text-6xl"
            >
              Find out what&apos;s <span className="brand-accent">costing you customers</span> online.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-6 max-w-lg text-lg leading-relaxed text-body"
            >
              Start with a €29 Health Check of your Instagram, go deeper with a full diagnostic, or get us in your corner. Clear answers, plain English, no long contracts.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <AnimatedButton href="/start/healthcheck">Get my Health Check · €29</AnimatedButton>
              <AnimatedButton href="#options" variant="secondary" icon={false}>
                See all options
              </AnimatedButton>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-12 flex items-center gap-3 text-sm text-mid-grey"
            >
              <span className="h-px w-10 bg-mid-grey/40" />
              Report in 2 working days · Based in Waterford, Ireland
            </motion.p>
          </div>
          <ReportMockup />
        </div>
      </section>

      {/* Niches marquee */}
      <div className="border-y border-ink/10 bg-cream-deep/40 py-5">
        <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="animate-marquee flex shrink-0 gap-10 pr-10">
            {[...NICHES, ...NICHES].map((n, i) => (
              <span key={i} className="flex items-center gap-10 whitespace-nowrap font-display text-lg italic text-ink/60">
                {n}
                <span className="h-1.5 w-1.5 rounded-full bg-coral/60" />
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* The ladder */}
      <section id="options" className="relative scroll-mt-20 py-28 lg:py-36">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <Reveal>
            <p className="overline mb-4 text-center">Ways we can help</p>
            <h2 className="mx-auto max-w-3xl text-center font-display text-3xl font-bold leading-tight text-ink sm:text-4xl lg:text-5xl">
              Pick the help that <span className="brand-accent">fits where you are.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-relaxed text-body">
              Every option stands on its own, and every step up gives you credit for the one before.
            </p>
          </Reveal>

          <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {LADDER.map((offer, i) => {
              const featured = i === 0;
              return (
                <Reveal key={offer.slug} delay={i * 0.08} className="h-full">
                  <motion.article
                    whileHover={{ y: -8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`relative flex h-full flex-col rounded-3xl border p-7 ${
                      featured ? "border-ink bg-ink text-cream shadow-[0_32px_80px_-24px_rgba(44,44,42,0.55)]" : "border-ink/10 bg-white/70"
                    }`}
                  >
                    {featured && (
                      <span className="absolute -top-3 left-7 rounded-full bg-coral px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-widest text-cream">
                        Best place to start
                      </span>
                    )}
                    <span className={`font-display text-sm font-semibold ${featured ? "text-cream/40" : "text-ink/30"}`}>0{i + 1}</span>
                    <h3 className={`mt-2 font-display text-xl font-bold ${featured ? "text-cream" : "text-ink"}`}>{offer.name}</h3>
                    <p className={`mt-1 text-sm ${featured ? "text-cream/60" : "text-mid-grey"}`}>{offer.audience}</p>
                    <p className={`mt-5 font-display text-5xl font-bold ${featured ? "text-cream" : "text-ink"}`}>
                      {offer.price}
                    </p>
                    <ul className={`mt-6 flex-1 space-y-2.5 border-t pt-6 ${featured ? "border-cream/15" : "border-ink/10"}`}>
                      {offer.includes.map((item) => (
                        <li key={item} className={`flex items-start gap-2.5 text-sm ${featured ? "text-cream/85" : "text-body"}`}>
                          <Check className={`mt-0.5 shrink-0 ${featured ? "text-teal" : "text-teal-deep"}`} size={16} />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/start/${offer.slug}`}
                      className={`group mt-8 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors ${
                        featured
                          ? "bg-coral text-cream hover:bg-coral-hover"
                          : "border-2 border-ink text-ink hover:bg-ink hover:text-cream"
                      }`}
                    >
                      {offer.cta}
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                  </motion.article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Credit path */}
      <section className="pb-28 lg:pb-36">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] bg-coral px-7 py-12 text-cream sm:px-12 lg:py-16">
              <div className="blob -right-20 -top-20 h-72 w-72 bg-cream/20" />
              <p className="overline mb-4 !text-cream/80">Nothing is wasted</p>
              <h2 className="max-w-2xl font-display text-3xl font-bold leading-tight sm:text-4xl">
                Every euro counts towards the next step.
              </h2>
              <div className="mt-10 grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
                {[
                  { k: "€29", t: "Health Check" },
                  { k: "€297", t: "Full Diagnostic", s: "€29 off" },
                  { k: "Monthly", t: "Management", s: "€297 off your first month" },
                ].map((x, i) => (
                  <div key={x.t} className="contents">
                    {i > 0 && <ArrowRight className="mx-auto rotate-90 text-cream/60 md:rotate-0" />}
                    <div className="rounded-2xl bg-cream/10 p-5 ring-1 ring-cream/20 backdrop-blur-sm">
                      <p className="font-display text-3xl font-bold">{x.k}</p>
                      <p className="mt-1 font-medium">{x.t}</p>
                      {x.s && <p className="mt-2 inline-block rounded-full bg-ink/20 px-3 py-1 text-xs font-semibold">{x.s}</p>}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-sm text-cream/75">Credit applies when you book the next step within 30 days.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section className="relative bg-cream-deep/40 py-28 lg:py-36">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <Reveal>
            <p className="overline mb-4 text-center">The €29 Health Check</p>
            <h2 className="mx-auto max-w-3xl text-center font-display text-3xl font-bold leading-tight text-ink sm:text-4xl lg:text-5xl">
              Three steps. <span className="brand-accent">Zero jargon.</span>
            </h2>
          </Reveal>
          <div className="relative mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="absolute left-[16%] right-[16%] top-10 hidden h-px border-t-2 border-dashed border-coral/30 md:block" />
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 0.1}>
                <div className="relative flex h-full flex-col items-center rounded-3xl bg-cream p-8 text-center shadow-sm">
                  <div className="relative grid h-14 w-14 place-items-center rounded-full bg-coral text-cream shadow-[0_8px_24px_-8px_rgba(216,90,48,0.55)]">
                    <Icon size={22} />
                    <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-ink text-xs font-bold text-cream">{i + 1}</span>
                  </div>
                  <h3 className="mt-6 font-display text-xl font-semibold text-ink">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-body">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2}>
            <div className="mt-12 flex justify-center">
              <AnimatedButton href="/start/healthcheck">Get my Health Check · €29</AnimatedButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-28 lg:py-36">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 lg:grid-cols-[1fr_1.4fr] lg:px-8">
          <Reveal>
            <p className="overline mb-4">Questions</p>
            <h2 className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
              Good to <span className="brand-accent">know.</span>
            </h2>
            <p className="mt-5 text-body">
              Something else on your mind? Email{" "}
              <a href="mailto:hello@irishbusinessboosters.com" className="font-medium text-coral underline-offset-4 hover:underline">
                hello@irishbusinessboosters.com
              </a>
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="divide-y divide-ink/10 border-y border-ink/10">
              {FAQ.map((item) => (
                <FaqItem key={item.q} {...item} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Done for you */}
      <section className="px-6 pb-24 lg:px-8">
        <Reveal>
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-ink px-7 py-14 sm:px-12 lg:py-20">
            <div className="blob -left-24 bottom-[-8rem] h-80 w-80 bg-teal/25" />
            <div className="blob -right-16 -top-24 h-72 w-72 bg-coral/30" />
            <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.5fr_1fr]">
              <div>
                <p className="overline mb-4 !text-teal">
                  <Sparkles size={14} className="mr-2 inline" />
                  Done for you
                </p>
                <h2 className="font-display text-3xl font-bold leading-tight text-cream sm:text-4xl lg:text-5xl">
                  Rather hand it all over?
                </h2>
                <p className="mt-5 max-w-xl text-lg text-cream/70">
                  Monthly social media management: we plan, write, film and post for you, and look after your messages. You get on with running your business.
                </p>
              </div>
              <div className="lg:justify-self-end">
                <AnimatedButton href="/#contact">Get a free consultation</AnimatedButton>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between gap-6 py-6 text-left">
        <span className="font-display text-lg font-semibold text-ink">{q}</span>
        <ChevronDown className={`shrink-0 text-coral transition-transform duration-300 ${open ? "rotate-180" : ""}`} size={20} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-6 pr-10 leading-relaxed text-body">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

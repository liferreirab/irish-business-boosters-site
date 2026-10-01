"use client";

import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, MapPin, CheckCircle2 } from "lucide-react";
import InstagramIcon, { INSTAGRAM_URL, INSTAGRAM_HANDLE } from "./ui/InstagramIcon";
import Reveal from "./ui/Reveal";

// Supabase Edge Function that stores the lead in the CRM and emails us.
const LEAD_ENDPOINT = "https://tbgxeqauakiydzwmqyyf.supabase.co/functions/v1/site-lead";

const INTERESTS = [
  "Social Media",
  "Paid Ads",
  "Website",
  "Content",
  "Not Sure Yet",
];

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [interest, setInterest] = useState(INTERESTS[0]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setFailed(false);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch(LEAD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, interest }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSubmitted(true);
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="relative py-28 lg:py-36">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-ink px-6 py-14 sm:px-12 lg:px-16 lg:py-20">
            <div className="blob animate-float-slow h-72 w-72 bg-coral/30 -right-10 -top-10" />
            <div className="blob animate-float-slower h-64 w-64 bg-teal/20 -left-16 bottom-0" />

            <div className="relative grid grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-20">
              <div>
                <p className="overline mb-4 !text-teal">Let&apos;s Talk</p>
                <h2 className="font-display text-3xl font-bold leading-tight text-cream sm:text-4xl lg:text-5xl">
                  Let&apos;s grow your{" "}
                  <span className="font-display italic text-coral">
                    business
                  </span>{" "}
                  together.
                </h2>
                <p className="mt-6 max-w-md text-lg leading-relaxed text-cream/70">
                  Book a free, no-pressure call. We&apos;ll take an honest
                  look at what you&apos;re doing online and show you what
                  real growth could look like.
                </p>

                <div className="mt-10 flex flex-col gap-4 text-cream/80">
                  <a
                    href="mailto:hello@irishbusinessboosters.com"
                    className="flex items-center gap-3 transition-colors hover:text-teal"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-cream/10">
                      <Mail size={18} />
                    </span>
                    hello@irishbusinessboosters.com
                  </a>
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 transition-colors hover:text-teal"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-cream/10">
                      <InstagramIcon size={18} />
                    </span>
                    {INSTAGRAM_HANDLE}
                  </a>
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-cream/10">
                      <MapPin size={18} />
                    </span>
                    Waterford, Ireland
                  </div>
                </div>
              </div>

              <div className="relative">
                <AnimatePresence mode="wait">
                  {submitted ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex h-full min-h-[26rem] flex-col items-center justify-center rounded-3xl bg-cream/5 p-10 text-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 260,
                          damping: 18,
                          delay: 0.1,
                        }}
                        className="grid h-16 w-16 place-items-center rounded-full bg-teal/20 text-teal"
                      >
                        <CheckCircle2 size={32} />
                      </motion.div>
                      <h3 className="mt-6 font-display text-2xl font-semibold text-cream">
                        Message sent!
                      </h3>
                      <p className="mt-3 max-w-sm text-cream/70">
                        Thanks for reaching out — we&apos;ll get back to you
                        within one business day.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleSubmit}
                      className="grid grid-cols-1 gap-4 rounded-3xl bg-cream/[0.06] p-6 backdrop-blur-sm sm:grid-cols-2 sm:p-8"
                    >
                      {/* Honeypot: hidden from people, bots fill it in. */}
                      <input
                        type="text"
                        name="website"
                        tabIndex={-1}
                        autoComplete="off"
                        aria-hidden="true"
                        className="absolute -left-[9999px] h-0 w-0 opacity-0"
                      />
                      <Field label="Name" name="name" required className="sm:col-span-1" />
                      <Field
                        label="Business Name"
                        name="business"
                        className="sm:col-span-1"
                      />
                      <Field
                        label="Email"
                        name="email"
                        type="email"
                        required
                        className="sm:col-span-1"
                      />
                      <Field
                        label="Phone"
                        name="phone"
                        type="tel"
                        className="sm:col-span-1"
                      />

                      <div className="sm:col-span-2">
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-cream/50">
                          What are you interested in?
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {INTERESTS.map((opt) => (
                            <button
                              type="button"
                              key={opt}
                              onClick={() => setInterest(opt)}
                              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                                interest === opt
                                  ? "border-coral bg-coral text-cream"
                                  : "border-cream/20 text-cream/70 hover:border-cream/40"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-cream/50">
                          Message
                        </label>
                        <textarea
                          name="message"
                          rows={4}
                          className="w-full rounded-xl border border-cream/15 bg-cream/5 px-4 py-3 text-cream placeholder:text-cream/30 focus:border-teal focus:outline-none"
                          placeholder="Tell us a bit about your business..."
                        />
                      </div>

                      {failed && (
                        <p role="alert" className="sm:col-span-2 text-sm text-coral">
                          Sorry, something went wrong. Please try again or email us at{" "}
                          <a href="mailto:hello@irishbusinessboosters.com" className="underline">
                            hello@irishbusinessboosters.com
                          </a>
                          .
                        </p>
                      )}

                      <motion.button
                        type="submit"
                        disabled={sending}
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 20,
                        }}
                        className="sm:col-span-2 mt-2 inline-flex items-center justify-center rounded-full bg-coral px-7 py-3.5 font-sans text-sm font-semibold text-cream shadow-[0_8px_24px_-8px_rgba(216,90,48,0.55)] transition-colors hover:bg-coral-hover disabled:cursor-wait disabled:opacity-70"
                      >
                        {sending ? "Sending..." : "Send Message"}
                      </motion.button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  className = "",
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-cream/50">
        {label}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        className="w-full rounded-xl border border-cream/15 bg-cream/5 px-4 py-3 text-cream placeholder:text-cream/30 focus:border-teal focus:outline-none"
      />
    </div>
  );
}

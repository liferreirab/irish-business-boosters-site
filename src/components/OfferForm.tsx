"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2, Lock } from "lucide-react";
import { trackPixel } from "@/lib/metaPixel";
import { PAYMENT_LINKS, type Offer, type Question } from "@/lib/offers";

// Same Edge Function as the contact form: saves to the CRM and emails Eli.
const LEAD_ENDPOINT = "https://tbgxeqauakiydzwmqyyf.supabase.co/functions/v1/site-lead";

export default function OfferForm({ offer }: { offer: Offer }) {
  const [step, setStep] = useState<"form" | "sending" | "done">("form");
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const payLink = PAYMENT_LINKS[offer.slug];

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const get = (k: string) => String(form.get(k) ?? "").trim();
    setFirstName(get("name").split(" ")[0]);
    setEmail(get("email"));

    // site-lead stores one free-text message, so the answers go in there.
    const answers = offer.questions
      .filter((q) => q.name !== "business" && get(q.name))
      .map((q) => `${q.label}\n${get(q.name)}`);
    const message = [`[${offer.name.toUpperCase()} · ${offer.price}]`, ...answers].join("\n\n");

    setStep("sending");
    try {
      const res = await fetch(LEAD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: get("name"),
          email: get("email"),
          phone: get("phone"),
          business: get("business"),
          website: get("website"), // honeypot
          message,
          offer: offer.slug,
          answers: Object.fromEntries(offer.questions.map((q) => [q.name, get(q.name)])),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      trackPixel("Lead", { content_name: `offer_${offer.slug}`, value: Number(offer.price.replace(/\D/g, "")), currency: "EUR" });
      setStep("done");
    } catch {
      setStep("form");
      setError("Sorry, something went wrong. Please try again or email hello@irishbusinessboosters.com.");
    }
  };

  if (step === "done") {
    const next = payLink
      ? ["Pay securely below", offer.slug === "healthcheck" ? "We go through your profile" : "We email you to pick a time", offer.slug === "healthcheck" ? "Your report lands in your inbox" : "We get to work"]
      : [offer.slug === "healthcheck" ? "We email you a secure payment link" : "We email you within one working day", offer.slug === "healthcheck" ? "We go through your profile" : "We agree a time and payment", offer.slug === "healthcheck" ? "Your report lands in your inbox" : "We get to work"];
    return (
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mt-10 rounded-[2rem] bg-white p-7 shadow-[0_24px_60px_-24px_rgba(44,44,42,0.3)] sm:p-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.15 }}
          className="grid h-16 w-16 place-items-center rounded-full bg-teal/20 text-teal-deep"
        >
          <CheckCircle2 size={32} />
        </motion.div>
        <h2 className="mt-6 font-display text-3xl font-bold text-ink">
          Thanks{firstName ? `, ${firstName}` : ""}! <span className="brand-accent">You&apos;re in.</span>
        </h2>
        <p className="mt-3 text-lg text-body">{offer.delivery}</p>

        <ol className="mt-8 space-y-4">
          {next.map((t, i) => (
            <li key={t} className="flex items-center gap-4">
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${i === 0 ? "bg-coral text-cream" : "bg-cream-deep text-ink/60"}`}>{i + 1}</span>
              <span className={i === 0 ? "font-semibold text-ink" : "text-body"}>{t}</span>
            </li>
          ))}
        </ol>

        {payLink ? (
          <a
            href={email ? `${payLink}?prefilled_email=${encodeURIComponent(email)}` : payLink}
            onClick={() => trackPixel("InitiateCheckout", { content_name: `offer_${offer.slug}` })}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-coral px-7 py-4 font-semibold text-cream shadow-[0_8px_24px_-8px_rgba(216,90,48,0.55)] transition-colors hover:bg-coral-hover sm:w-auto"
          >
            <Lock size={16} /> Pay {offer.price} securely
          </a>
        ) : (
          <p className="mt-8 rounded-2xl bg-cream p-4 text-sm text-body">
            Keep an eye on your inbox (and your spam folder, just in case). Questions? Just reply to our email.
          </p>
        )}
      </motion.section>
    );
  }

  const business = offer.questions;
  return (
    <form onSubmit={handleSubmit} className="relative mt-10 rounded-[2rem] bg-white p-7 shadow-[0_24px_60px_-24px_rgba(44,44,42,0.3)] sm:p-10">
      {/* Honeypot: hidden from people, bots fill it in. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />

      <FormStep n={1} title="About your business">
        {business.map((q) => (
          <QuestionField key={q.name} q={q} />
        ))}
      </FormStep>

      <FormStep n={2} title="Where should we send it?">
        <QuestionField q={{ kind: "text", name: "name", label: "Your first name", required: true, autoComplete: "given-name" }} />
        <QuestionField q={{ kind: "text", name: "email", label: "Email", type: "email", required: true, autoComplete: "email" }} />
        <QuestionField q={{ kind: "text", name: "phone", label: "Phone (optional)", type: "tel", autoComplete: "tel" }} />
      </FormStep>

      {error && <p role="alert" className="mt-6 text-sm text-coral">{error}</p>}

      <motion.button
        type="submit"
        disabled={step === "sending"}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-coral px-7 py-4 font-semibold text-cream shadow-[0_8px_24px_-8px_rgba(216,90,48,0.55)] transition-colors hover:bg-coral-hover disabled:opacity-70"
      >
        {step === "sending" ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
        {step === "sending" ? "Sending…" : `${offer.cta} · ${offer.price}`}
      </motion.button>
      <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-mid-grey">
        <Lock size={12} /> Your details are only used for this. No spam, ever.
      </p>
    </form>
  );
}

function FormStep({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-labelledby={`step-${n}`} className={n > 1 ? "mt-10 border-t border-ink/10 pt-8" : ""}>
      <h2 id={`step-${n}`} className="mb-6 flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-sm font-bold text-cream">{n}</span>
        <span className="font-display text-xl font-semibold text-ink">{title}</span>
      </h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function QuestionField({ q }: { q: Question }) {
  const id = `offer-${q.name}`;
  const wide = q.kind !== "text" || q.name === "phone";
  const input = "w-full rounded-xl border border-ink/10 bg-cream/60 px-4 py-3.5 transition-colors focus:bg-white text-ink placeholder:text-mid-grey/70 focus:border-teal focus:outline-none";

  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-ink">
        {q.label}
      </label>
      {q.kind === "textarea" ? (
        <textarea id={id} name={q.name} required={q.required} placeholder={q.placeholder} rows={3} className={input} />
      ) : q.kind === "select" ? (
        <select id={id} name={q.name} className={input}>
          {q.options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          name={q.name}
          type={q.type ?? "text"}
          required={q.required}
          placeholder={q.placeholder}
          autoComplete={q.autoComplete}
          className={input}
        />
      )}
    </div>
  );
}
